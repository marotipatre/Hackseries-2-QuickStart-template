"""
ChainGuardian Backend - AI-Powered DeFi Risk & Compliance Assistant

FastAPI application serving as the bridge between the frontend,
AI risk engine, and GuardianVault smart contract.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.config import settings
from app.models.database import init_db
from app.api.routes import analysis, vault, audit

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    logger.info("Starting ChainGuardian Backend...")
    logger.info(f"Environment: {settings.ALGORAND_NETWORK}")
    logger.info(f"AI Model: {settings.AI_MODEL}")
    
    # Initialize database
    try:
        await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down ChainGuardian Backend...")


# Create FastAPI application
app = FastAPI(
    title="ChainGuardian API",
    description="AI-Powered DeFi Risk & Compliance Assistant on Algorand",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Configure Jinja2 templates
templates = Jinja2Templates(directory="app/templates")


# Include routers
app.include_router(analysis.router, prefix=settings.API_PREFIX)
app.include_router(vault.router, prefix=settings.API_PREFIX)
app.include_router(audit.router, prefix=settings.API_PREFIX)


# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    """
    Health check endpoint to verify service status.
    """
    return {
        "status": "healthy",
        "version": "0.1.0",
        "service": "ChainGuardian Backend",
        "network": settings.ALGORAND_NETWORK,
    }


# Web page routes
@app.get("/", response_class=HTMLResponse, tags=["web"])
async def root(request: Request):
    """Root endpoint - Home page."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/dashboard", response_class=HTMLResponse, tags=["web"])
async def dashboard(request: Request):
    """Dashboard page."""
    return templates.TemplateResponse("dashboard.html", {"request": request})


@app.get("/vault", response_class=HTMLResponse, tags=["web"])
async def vault_page(request: Request):
    """Vault management page."""
    return templates.TemplateResponse("vault.html", {"request": request})


@app.get("/analysis", response_class=HTMLResponse, tags=["web"])
async def analysis_page(request: Request):
    """AI Analysis page."""
    return templates.TemplateResponse("analysis.html", {"request": request})


@app.get("/audit", response_class=HTMLResponse, tags=["web"])
async def audit_page(request: Request):
    """Audit log page."""
    return templates.TemplateResponse("audit.html", {"request": request})


# API root endpoint
@app.get("/api", tags=["root"])
async def api_root():
    """
    Root endpoint with API information.
    """
    return {
        "name": "ChainGuardian API",
        "description": "AI-Powered DeFi Risk & Compliance Assistant on Algorand",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unhandled errors.
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
    )
