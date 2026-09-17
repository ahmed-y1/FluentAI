# Free public demo deployment

## Permanent QR link

Use this stable URL for the final QR code:

```text
https://ahmed-y1.github.io/FluentAI/
```

This is the completely free static demo. It does not require Cloudflare,
PowerShell, your laptop, or a running FastAPI server. The GitHub Pages workflow
builds the frontend with no backend URL, so unavailable server capabilities are
shown honestly while browser camera, vision, live speech recognition, and local
session storage can still work.

To publish updates, push to the `master` branch, then check **GitHub -> Actions
-> Deploy web app to GitHub Pages**. In repository **Settings -> Pages**, set
the source to **GitHub Actions**. The first deployment may take a few minutes.

Use the Cloudflare instructions below only for a laptop-hosted backend demo; do
not use its changing URL for the permanent QR code.

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
