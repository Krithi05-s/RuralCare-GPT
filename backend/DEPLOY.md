Render deployment steps for the backend (ruralcare-backend)

1) Push repo to GitHub
- Ensure the repo is on GitHub and your `main` branch is up-to-date.

2) Recommended repo layout
- Backend root: `backend/` (contains `app/`, `requirements.txt`, `Procfile`, `runtime.txt`).
- Frontend root: `frontend/` (Vite app).

3) Prepare environment locally (optional)

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m app.main        # run locally
```

4) Create Render services
- Sign in to Render and click `New` → `Web Service`.
- Connect your GitHub repository and select branch (e.g. `main`).
- Set `Root Directory` to `backend`.
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:$PORT --timeout 120`
- Environment: `Python 3` (runtime hint in `backend/runtime.txt`).

5) Environment variables & secrets (set in Render Dashboard)
- `OLLAMA_BASE_URL` — URL to your Ollama model host (cannot be localhost when deployed).
- `OLLAMA_MODEL` — model name (e.g. `llama3`).
- `DATABASE_URL` — e.g. `sqlite:///./healthcare.db` (for small usage) or an external DB.
- `VITE_API_URL` — `https://<your-backend>.onrender.com/api` (used by frontend build-time config).

Notes: do NOT store sensitive values directly in `render.yaml` for production; use Render's Secrets UI.

6) Optional: Deploy frontend on Render (Static Site)
- Create `New` → `Static Site` on Render.
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Set `VITE_API_BASE_URL` to `https://<your-backend>.onrender.com/api` in the site environment variables.

7) Verify
- After deploy, visit `https://<your-backend>.onrender.com/api` and `https://<your-frontend>.onrender.com`.
- Test endpoints used by the UI, for example: `/api/languages`.

8) Common issues & troubleshooting
- Large ML dependencies can make builds slow or hit resource limits. If build fails due to memory/time, consider:
  - Using a Render private service with a larger plan.
  - Building a Docker image with preinstalled dependencies and deploying via Render's Docker option.
  - Moving heavy model hosting (Ollama) off-platform to a dedicated server or model host.

9) Post-deploy: update frontend
- Update `frontend` environment variable used at build time:
  - `VITE_API_BASE_URL=https://<your-backend>.onrender.com/api`
- Rebuild and redeploy the frontend site.

That's it — follow the above steps and let Render build and host your backend. If you want, I can also:
- Produce a Dockerfile for backend builds (recommended for heavy ML dependencies).
- Generate a minimal `render.yaml` with secrets omitted for safety.
