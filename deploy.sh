#!/bin/bash

# Deployment configuration
EC2_HOST="ec2-51-21-220-205.eu-north-1.compute.amazonaws.com"
KEY_PATH="path-to-your-key.pem"  # Replace with your key path
REMOTE_APP_PATH="/home/ubuntu/app"
SERVER_PROJECT_PATH="Server"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Starting deployment process...${NC}"

# Navigate to Server directory and publish
echo -e "${YELLOW}📦 Publishing application...${NC}"
cd $SERVER_PROJECT_PATH
dotnet publish -c Release
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to publish application${NC}"
    exit 1
fi

# Copy files to EC2
echo -e "${YELLOW}📤 Copying files to EC2...${NC}"
scp -i $KEY_PATH -r bin/Release/net7.0/publish/* ubuntu@${EC2_HOST}:${REMOTE_APP_PATH}/
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to copy files to EC2${NC}"
    exit 1
fi

# Restart the service
echo -e "${YELLOW}🔄 Restarting service...${NC}"
ssh -i $KEY_PATH ubuntu@${EC2_HOST} 'sudo systemctl restart webapp && sudo systemctl status webapp'

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${CYAN}📋 Checking logs... (Ctrl+C to exit)${NC}"
ssh -i $KEY_PATH ubuntu@${EC2_HOST} 'sudo journalctl -u webapp -f' 