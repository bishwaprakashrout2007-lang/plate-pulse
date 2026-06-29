from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import uvicorn
from .config import settings
from .database import verify_db_connection
from .routes import auth, ngos, donations, admin, public

# Create FastAPI instance
app = FastAPI(
    title="PlatePulse API",
    description="Backend API for PlatePulse Food Waste Reduction Platform",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1):(5173|5174|5175|5176|3000|3001)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder to serve uploads locally (for offline dev/cloudinary fallback)
static_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
os.makedirs(os.path.join(static_path, "uploads"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_path), name="static")

# Register routes
app.include_router(auth.router)
app.include_router(ngos.router)
app.include_router(donations.router)
app.include_router(admin.router)
app.include_router(public.router)

@app.on_event("startup")
async def startup_db_client():
    # Verify DB connection on startup
    await verify_db_connection()

@app.get("/")
async def root():
    return {
        "message": "PlatePulse API is running successfully.",
        "status": "online",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
