import os
# pyrefly: ignore [missing-import]
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv()

from app.api.endpoints import router as api_router

app = FastAPI(
    title="AI Multimodal Rural Healthcare Assistant",
    description="Advanced AI-powered healthcare guidance for rural communities.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix="/api")

# Mount static files for reports and uploads
os.makedirs("reports", exist_ok=True)
os.makedirs("uploads", exist_ok=True)
app.mount("/reports", StaticFiles(directory="reports"), name="reports")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Serve built React frontend (produced by `npm run build`)
FRONTEND_DIST = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../frontend/dist")
)

if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/", response_class=FileResponse)
    async def serve_root():
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

    # SPA fallback: any non-API route returns index.html so React Router works
    @app.get("/{full_path:path}", response_class=FileResponse)
    async def serve_spa(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    async def root():
        return {
            "message": "Welcome to the AI Multimodal Rural Healthcare Assistant API",
            "status": "online",
            "note": "Frontend not built yet. Run: cd frontend && npm run build",
            "disclaimer": "This application provides AI-generated preliminary health guidance."
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
