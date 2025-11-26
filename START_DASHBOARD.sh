#!/bin/bash
# Enterprise Audit Trail Dashboard Startup Script

echo "============================================================"
echo "🚀 Starting Enterprise Audit Trail Dashboard"
echo "============================================================"

# Go to project root
cd "$(dirname "$0")/../../.."

# Check if we're in the right directory
if [ ! -f "teleradyoloji/requirements.txt" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Check if dependencies are installed
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "📦 Installing dependencies..."
    pip3 install -r teleradyoloji/requirements.txt
fi

echo ""
echo "🌐 Dashboard will be available at: http://localhost:8082"
echo "📖 API Documentation at: http://localhost:8082/docs"
echo ""
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

# Start the server
cd teleradyoloji
python3 -m uvicorn web_dashboard.advanced.backend.main:socket_app \
    --host 0.0.0.0 \
    --port 8082 \
    --reload

