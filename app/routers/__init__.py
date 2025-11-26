"""
API routers
"""

from .auth import router as auth_router
from .logs import router as logs_router
from .analytics import router as analytics_router
from .search import router as search_router

__all__ = ["auth_router", "logs_router", "analytics_router", "search_router"]

