# Free public demo deployment

## Fast demo checklist

Use four PowerShell windows. Replace the two generated tunnel URLs where shown.

**Window 1 - backend**

```powershell
cd C:\Users\Student\fluent-ai\backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

**Window 2 - backend tunnel**

```powershell
cd $HOME\Downloads
.\cloudflared-windows-amd64.exe tunnel --protocol http2 --url http://localhost:8000
```

Copy the `https://...trycloudflare.com` URL into `apps/web/.env.local`:

```text
NEXT_PUBLIC_API_URL=https://BACKEND-TUNNEL.trycloudflare.com
```

**Window 3 - frontend**

```powershell
cd C:\Users\Student\fluent-ai
npm --workspace web run dev
```

**Window 4 - frontend tunnel**

```powershell
cd $HOME\Downloads
.\cloudflared-windows-amd64.exe tunnel --protocol http2 --url http://localhost:3000
```

Copy the frontend URL, then restart Window 1 with CORS enabled:

```powershell
cd C:\Users\Student\fluent-ai\backend
$env:FLUENTAI_CORS_ORIGINS="https://FRONTEND-TUNNEL.trycloudflare.com,http://localhost:3000"
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Open the frontend tunnel URL on the phone and allow camera/microphone access.
Use that frontend URL for the QR code. Keep all four windows open. If code
changes, restart Window 3 and refresh the phone page.

Use GitHub Pages for the frontend. It is completely free, and visitors only scan
the QR code and use a browser. Your laptop does not need to stay on.

If your laptop can remain on, use two free Cloudflare Quick Tunnels. This gives
phones an HTTPS URL while the backend stays on your laptop.

1. Install `cloudflared` on the laptop from
   https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/.
2. Start the backend:

```powershell
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

3. In a second terminal, expose the backend:

```powershell
cloudflared tunnel --protocol http2 --url http://localhost:8000
```

Copy the generated `https://....trycloudflare.com` backend URL.

4. In `apps/web/.env.local`, set:

```text
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND.trycloudflare.com
```

5. Start the frontend:

```powershell
npm --workspace web run dev
```

6. In another terminal, expose the frontend:

```powershell
cloudflared tunnel --protocol http2 --url http://localhost:3000
```

Copy the generated frontend URL. Stop the original backend with `Ctrl+C`, then
restart it with the frontend origin:

```powershell
$env:FLUENTAI_CORS_ORIGINS="https://YOUR-FRONTEND.trycloudflare.com"
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

7. Scan the generated frontend `https://....trycloudflare.com` URL. Keep all
   terminals and the laptop running during the demo.

Quick Tunnel URLs change whenever they restart. Generate the QR code only after
both tunnels are running. Open the backend `/health` URL once before the demo
and test the full flow from a phone.
