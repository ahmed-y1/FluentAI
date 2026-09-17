# Public demo deployment

The QR-code experience must use a hosted backend. A phone or tablet cannot reach
`localhost` on your laptop, and visitors should not install Python, FFmpeg,
Whisper, or Ollama.

## Recommended setup

1. Push this repository to GitHub.
2. In Render, choose **New -> Blueprint**, connect the repository, and apply
   `render.yaml`.
3. Set `FLUENTAI_CORS_ORIGINS` on the Render service to the exact GitHub Pages
   origin, for example `https://ahmed-y1.github.io` (do not include a path).
4. Wait for the backend health check at
   `https://fluent-ai-backend.onrender.com/health`.
5. Enable GitHub Pages using the existing workflow. It builds with the hosted
   backend URL, so QR visitors never contact your laptop.
6. Use the generated Pages URL to create the QR code.

The Render image installs FFmpeg and Python dependencies and downloads the small
Whisper `tiny` model during server build. This download happens once on the
server, not on visitor devices. Ollama is optional; if it is not configured,
deterministic analysis still works and coaching is explicitly marked
unavailable.

## Important hosting limitations

- Render's free tier may sleep. Use a paid always-on instance for a live
  presentation.
- The current SQLite database is local to the service and may be ephemeral
  across redeploys. Browser localStorage remains the frontend history source.
  Use managed Postgres before treating this as a production service.
- Camera, microphone, and browser speech recognition still require HTTPS and
  user permission. GitHub Pages and Render provide HTTPS.
- Set the public API URL through the workflow or `NEXT_PUBLIC_API_URL` when
  using a different backend hostname.

## Local development

Keep `apps/web/.env.local` pointed at `http://localhost:8000`, install
`backend/requirements.txt`, install FFmpeg, and run
`python -m uvicorn main:app --reload --port 8000` from `backend`.
