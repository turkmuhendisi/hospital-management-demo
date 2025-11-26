#!/usr/bin/env python3
"""
Startup script for Enterprise Audit Trail Dashboard
"""

import uvicorn
import sys
from pathlib import Path
import os

# Add project root to path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

# Change to project root to ensure proper module resolution
os.chdir(project_root)

# Now we can import
from teleradyoloji.web_dashboard.advanced.backend.config import settings


def main():
    """Start the server"""
    print("=" * 60)
    print("🚀 Enterprise Audit Trail Dashboard")
    print("=" * 60)
    print(f"📊 Version: {settings.APP_VERSION}")
    print(f"🌐 URL: http://{settings.HOST}:{settings.PORT}")
    print(f"📖 API Docs: http://{settings.HOST}:{settings.PORT}/docs")
    print(f"🔧 Debug Mode: {settings.DEBUG}")
    print(f"🎲 Data Generation: {settings.GENERATE_REALISTIC_DATA}")
    print("=" * 60)
    print("\n⏹️  Press Ctrl+C to stop the server\n")
    
    uvicorn.run(
        "teleradyoloji.web_dashboard.advanced.backend.main:socket_app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )


if __name__ == "__main__":
    main()

