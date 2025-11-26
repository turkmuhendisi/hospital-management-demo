"""
Main FastAPI application for Enterprise Audit Trail Dashboard
Production-ready backend with realistic data generation
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import socketio
from pathlib import Path

from .config import settings
from .database import init_db, get_db, SessionLocal
from .routers import auth_router, logs_router, analytics_router, search_router
from .utils.logging import setup_logging, get_logger
from .data_seeder import seed_initial_data, start_background_generator

# Setup logging
setup_logging()
logger = get_logger(__name__)


# Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=settings.CORS_ORIGINS
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle manager for startup and shutdown events
    """
    # Startup
    logger.info("Starting Enterprise Audit Trail Dashboard...")
    
    # Initialize database
    init_db()
    logger.info("Database initialized")
    
    # Seed initial data
    db = SessionLocal()
    try:
        seed_initial_data(db)
        logger.info("Initial data seeded")
    finally:
        db.close()
    
    # Start background data generator
    if settings.GENERATE_REALISTIC_DATA:
        start_background_generator()
        logger.info("Background data generator started")
    
    logger.info(f"Server started on {settings.HOST}:{settings.PORT}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production-ready audit trail dashboard with realistic data generation",
    lifespan=lifespan
)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(auth_router)
app.include_router(logs_router)
app.include_router(analytics_router)
app.include_router(search_router)


# Socket.IO integration
socket_app = socketio.ASGIApp(
    sio,
    other_asgi_app=app,
)


# Static files (serve frontend)
frontend_dir = Path(__file__).parent.parent
if (frontend_dir / "index.html").exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")
    
    @app.get("/")
    async def serve_frontend():
        """Serve frontend HTML"""
        return FileResponse(str(frontend_dir / "index.html"))


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    from datetime import datetime
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat()
    }


# Socket.IO events
@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    logger.info(f"Client connected: {sid}")
    await sio.emit('connection_established', {'sid': sid}, room=sid)


@sio.event
async def disconnect(sid):
    """Handle client disconnect"""
    logger.info(f"Client disconnected: {sid}")


@sio.event
async def subscribe_logs(sid, data):
    """Subscribe client to real-time log updates"""
    logger.info(f"Client {sid} subscribed to logs")
    await sio.enter_room(sid, 'logs')


# Broadcast new log event (called by background generator)
async def broadcast_new_log(log_data: dict):
    """Broadcast new log to all connected clients"""
    await sio.emit('new_log', log_data, room='logs')


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "backend.main:socket_app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )

