# Free public demo deployment

## Permanent QR link

Use this stable URL for the final QR code:

```text
https://ahmed-y1.github.io/FluentAI/
```

This is the stable frontend URL. Connect the backend through the free Tailscale
Funnel setup below. The QR code never changes; only the laptop must remain on
for backend features.

To publish updates, push to the `master` branch, then check **GitHub -> Actions
-> Deploy web app to GitHub Pages**. In repository **Settings -> Pages**, set
the source to **GitHub Actions**. The first deployment may take a few minutes.

Do not use Cloudflare Quick Tunnel URLs for the printed QR code because they
change every time.

## Stable free backend with Tailscale Funnel

Tailscale Funnel gives your laptop a stable HTTPS hostname. Phones do not need
Tailscale; only the laptop does.

1. Install Tailscale for Windows from https://tailscale.com/download/windows.
2. Sign in and keep Tailscale running on the laptop.
3. Start the backend:

```powershell
cd C:\Users\Student\fluent-ai\backend
$env:FLUENTAI_CORS_ORIGINS="https://ahmed-y1.github.io"
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

4. In another PowerShell window, expose port 8000:

```powershell
tailscale funnel 8000
```

Approve HTTPS/Funnel if Tailscale asks. It will display a stable URL similar to
`https://your-laptop.your-tailnet.ts.net`.

5. Test the backend at `/health`, then in GitHub open **Settings -> Secrets and
   variables -> Actions -> Variables** and set:

```text
Name: NEXT_PUBLIC_API_URL
Value: https://your-laptop.your-tailnet.ts.net
```

6. Push to `master` or manually run the Pages workflow. The QR URL remains
   `https://ahmed-y1.github.io/FluentAI/`, while backend requests use the stable
   Tailscale hostname.

Keep the laptop, FastAPI window, Tailscale, and Funnel process running during
the demo. Do not print a Quick Tunnel URL.

## Fast demo checklist

The fastest option is now one command from the repository root:

```powershell
cd C:\Users\Student\fluent-ai
npm run demo
```

The launcher finds `cloudflared` in Downloads, starts FastAPI and Next.js,
creates both HTTP/2 tunnels, updates `apps/web/.env.local`, configures CORS, and
prints the frontend URL to use for the QR code. Keep the launched windows open.
Stop everything with `Ctrl+C` in the launcher window.

If the launcher reports that cloudflared is missing, put
`cloudflared-windows-amd64.exe` in `C:\Users\Student\Downloads`.
