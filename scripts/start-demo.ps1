$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $root "backend"
$envFile = Join-Path $root "apps\web\.env.local"
$cloudflared = Get-ChildItem (Join-Path $HOME "Downloads") -Filter "cloudflared*.exe" -File | Select-Object -First 1

if (-not $cloudflared) {
    throw "cloudflared was not found in $HOME\Downloads. Download cloudflared-windows-amd64.exe first."
}

function Start-TerminalProcess([string]$title, [string]$command, [string]$workingDirectory) {
    $encodedTitle = $title.Replace("'", "''")
    $fullCommand = "`$host.UI.RawUI.WindowTitle = '$encodedTitle'; Set-Location '$workingDirectory'; $command"
    return Start-Process powershell.exe -ArgumentList @("-NoExit", "-Command", $fullCommand) -PassThru
}

function Wait-ForHttp([string]$url, [int]$timeoutSeconds = 45) {
    $deadline = (Get-Date).AddSeconds($timeoutSeconds)
    do {
        try {
            Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3 | Out-Null
            return
        } catch {
            Start-Sleep -Milliseconds 500
        }
    } while ((Get-Date) -lt $deadline)
    throw "Timed out waiting for $url"
}

function Stop-PortOwner([int]$port) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($connection in $connections) {
        $owner = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
        if ($owner -and $owner.ProcessName -match "^(python|python3|node|npm)$") {
            Write-Host "Stopping existing $($owner.ProcessName) process on port $port..." -ForegroundColor Yellow
            Stop-Process -Id $owner.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

function Stop-ProcessTree([System.Diagnostics.Process]$process) {
    if ($process -and -not $process.HasExited) {
        & taskkill.exe /PID $process.Id /T /F *> $null
    }
}

function Start-QuickTunnel([string]$target, [string]$label) {
    $log = Join-Path $env:TEMP ("fluent-ai-$label-" + [guid]::NewGuid().ToString() + ".log")
    $errorLog = "$log.err"
    $process = Start-Process -FilePath $cloudflared.FullName `
        -ArgumentList @("tunnel", "--protocol", "http2", "--url", $target) `
        -RedirectStandardOutput $log -RedirectStandardError $errorLog -PassThru -WindowStyle Hidden
    $deadline = (Get-Date).AddSeconds(60)
    do {
        $output = @()
        foreach ($path in @($log, $errorLog)) {
            if (Test-Path $path) {
                $content = Get-Content $path -Raw -ErrorAction SilentlyContinue
                if ($null -ne $content) { $output += [string]$content }
            }
        }
        if ($output.Count -gt 0) {
            $match = [regex]::Match(($output -join "`n"), "https://[a-z0-9-]+\.trycloudflare\.com")
            if ($match.Success) {
                Write-Host "$label tunnel: $($match.Value)" -ForegroundColor Green
                return @{ Process = $process; Url = $match.Value }
            }
        }
        Start-Sleep -Milliseconds 500
    } while ((Get-Date) -lt $deadline)
    $details = if (Test-Path $errorLog) { Get-Content $errorLog -Raw } else { "No tunnel log was produced." }
    throw "Could not start $label tunnel. $details"
}

Write-Host "Starting FluentAI demo..." -ForegroundColor Cyan
Stop-PortOwner 8000
Stop-PortOwner 3000
$env:FLUENTAI_CORS_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"
$backendProcess = Start-TerminalProcess "FluentAI Backend" "python -m uvicorn main:app --host 0.0.0.0 --port 8000" $backendDir
Wait-ForHttp "http://localhost:8000/health"
$backendTunnel = Start-QuickTunnel "http://localhost:8000" "backend"

Set-Content -Path $envFile -Value @("NEXT_PUBLIC_API_URL=$($backendTunnel.Url)", "API_URL=http://localhost:8000") -Encoding utf8
Write-Host "Updated $envFile" -ForegroundColor Yellow

$frontendProcess = Start-TerminalProcess "FluentAI Frontend" "npm --workspace web run dev" $root
Wait-ForHttp "http://localhost:3000"
$frontendTunnel = Start-QuickTunnel "http://localhost:3000" "frontend"

Write-Host "Restarting backend with frontend CORS..." -ForegroundColor Yellow
Stop-ProcessTree $backendProcess
Start-Sleep -Milliseconds 500
$env:FLUENTAI_CORS_ORIGINS = "$($frontendTunnel.Url),http://localhost:3000"
$backendProcess = Start-TerminalProcess "FluentAI Backend" "`$env:FLUENTAI_CORS_ORIGINS='$($frontendTunnel.Url),http://localhost:3000'; python -m uvicorn main:app --host 0.0.0.0 --port 8000" $backendDir
Wait-ForHttp "$($backendTunnel.Url)/health"

Write-Host "";
Write-Host "FluentAI demo is ready." -ForegroundColor Cyan
Write-Host "Frontend / QR URL: $($frontendTunnel.Url)" -ForegroundColor Green
Write-Host "Backend health:    $($backendTunnel.Url)/health" -ForegroundColor Green
Write-Host "Keep this PowerShell window and the three launched windows open." -ForegroundColor Yellow
Write-Host "Press Ctrl+C here only when you want to stop the launcher." -ForegroundColor Yellow

try {
    while ($true) { Start-Sleep -Seconds 5 }
} finally {
    Write-Host "Stopping FluentAI demo processes..." -ForegroundColor Yellow
    foreach ($process in @($backendProcess, $frontendProcess, $backendTunnel.Process, $frontendTunnel.Process)) {
        Stop-ProcessTree $process
    }
}
