from fastapi import APIRouter
from app.api import auth, learning, assessment, career, doubt, credentials, progress

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(learning.router, prefix="/learning", tags=["Learning"])
api_router.include_router(assessment.router, prefix="/assessment", tags=["Assessment"])
api_router.include_router(career.router, prefix="/career", tags=["Career"])
api_router.include_router(doubt.router, prefix="/doubt", tags=["Doubt Solver"])
api_router.include_router(credentials.router, prefix="/credentials", tags=["Credentials"])
api_router.include_router(progress.router, prefix="/progress", tags=["Progress"])
