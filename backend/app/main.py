"""
NeuroLearn Backend — FastAPI Main Entry Point
The world's first AI-powered skill development platform
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router

app = FastAPI(
    title="NeuroLearn API",
    description="AI-powered adaptive learning platform backend",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "NeuroLearn API v1.0", "status": "operational"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "neurolearn-backend"}
