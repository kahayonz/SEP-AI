"""
SEP-AI Main Application Entry Point.
FastAPI application for Software Engineering Project AI Evaluation system.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes_auth import router as auth_router
from app.routes_ai import router as ai_router
from app.routes import router as main_router
from app.exceptions import SEPAIException
from app.config import app_config
from app.logger import get_logger

logger = get_logger(__name__)

# Initialize FastAPI application
app = FastAPI(
    title="SEP-AI API",
    description="Software Engineering Project AI Evaluation System",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=app_config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Exception handlers
@app.exception_handler(SEPAIException)
async def sepai_exception_handler(request: Request, exc: SEPAIException):
    """
    Handle custom SEP-AI exceptions.
    
    Args:
        request: The request that caused the exception
        exc: The exception that was raised
        
    Returns:
        JSON response with error details
    """
    logger.warning(f"SEP-AI exception: {exc.detail} (status: {exc.status_code})")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Handle unexpected exceptions.
    
    Args:
        request: The request that caused the exception
        exc: The exception that was raised
        
    Returns:
        JSON response with error message
    """
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred"}
    )


# Include routers
app.include_router(auth_router, tags=["Authentication"])
app.include_router(ai_router, prefix="/api", tags=["AI Evaluation"])
app.include_router(main_router, prefix="/api", tags=["Main"])


@app.on_event("startup")
async def startup_event():
    """Application startup event handler."""
    logger.info("SEP-AI application starting up...")
    logger.info(f"CORS origins: {app_config.CORS_ORIGINS}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event handler."""
    logger.info("SEP-AI application shutting down...")


@app.get("/")
async def root():
    """
    Root endpoint - API health check.
    
    Returns:
        Welcome message and API information
    """
    return {
        "message": "Welcome to SEP-AI API",
        "version": "1.0.0",
        "docs": "/api/docs"
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        Health status
    """
    return {"status": "healthy"}

