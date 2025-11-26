#!/bin/bash
# Quick deployment script for VPS

set -e

echo "🚀 Starting deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/teleradyoloji-sim/teleradyoloji"
SERVICE_NAME="audit-dashboard"

echo -e "${YELLOW}1. Updating code...${NC}"
cd $APP_DIR
git pull origin main

echo -e "${YELLOW}2. Installing dependencies...${NC}"
pip3 install -r requirements.txt --upgrade

echo -e "${YELLOW}3. Running database migrations (if any)...${NC}"
# Add your migration commands here if using Alembic
# alembic upgrade head

echo -e "${YELLOW}4. Restarting service...${NC}"
sudo systemctl restart $SERVICE_NAME

echo -e "${YELLOW}5. Checking service status...${NC}"
sleep 2
sudo systemctl status $SERVICE_NAME --no-pager

echo -e "${YELLOW}6. Health check...${NC}"
sleep 3
if curl -f http://localhost:8082/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Deployment successful! Service is healthy.${NC}"
else
    echo -e "${RED}❌ Health check failed! Check logs:${NC}"
    echo "sudo journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "View logs: sudo journalctl -u $SERVICE_NAME -f"
echo "Stop service: sudo systemctl stop $SERVICE_NAME"
echo "Start service: sudo systemctl start $SERVICE_NAME"

