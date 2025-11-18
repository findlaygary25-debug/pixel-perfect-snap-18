#!/bin/bash

# Hetzner Deployment Script for Lovable App
# Run this script on your Hetzner server after initial SSH login

set -e  # Exit on error

echo "🚀 Starting Hetzner deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/findlaygary25-debug/pixel-perfect-snap-18.git"  # Your GitHub repo URL
APP_DIR="/var/www/lovable-app"
DOMAIN="5.223.76.26"  # Singapore server IP

echo -e "${BLUE}📦 Step 1: Installing dependencies...${NC}"

# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js 20.x
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install nginx
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt install -y nginx
fi

# Install git if not present
if ! command -v git &> /dev/null; then
    sudo apt install -y git
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

echo -e "${BLUE}📂 Step 2: Setting up application directory...${NC}"

# Create app directory
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Clone repository
if [ ! -d "$APP_DIR/.git" ]; then
    echo "Cloning repository..."
    git clone $REPO_URL $APP_DIR
else
    echo "Repository already exists, pulling latest changes..."
    cd $APP_DIR
    git pull origin main
fi

cd $APP_DIR

echo -e "${GREEN}✅ Application directory ready${NC}"

echo -e "${BLUE}📝 Step 3: Setting up environment variables...${NC}"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    cat > .env << EOF
VITE_SUPABASE_URL=https://konbogydmhjhrlaskbgv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbmJvZ3lkbWhqaHJsYXNrYmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMDA3NzgsImV4cCI6MjA3ODY3Njc3OH0.AnWQHvxwz4pd0Q9qrTK1wM9PfmmVwzEgUs4CV7QHKYQ
VITE_SUPABASE_PROJECT_ID=konbogydmhjhrlaskbgv
EOF
    echo -e "${GREEN}✅ Environment file created${NC}"
else
    echo -e "${GREEN}✅ Environment file already exists${NC}"
fi

echo -e "${BLUE}🔨 Step 4: Building application...${NC}"

# Install dependencies
npm install

# Build the application
npm run build

echo -e "${GREEN}✅ Application built successfully${NC}"

echo -e "${BLUE}🌐 Step 5: Configuring Nginx...${NC}"

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/lovable-app > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root $APP_DIR/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/lovable-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

echo -e "${GREEN}✅ Nginx configured${NC}"

echo -e "${BLUE}🔒 Step 6: SSL Setup (Optional)...${NC}"
echo "To enable HTTPS, run:"
echo "  sudo apt install certbot python3-certbot-nginx -y"
echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Your app should be accessible at: http://$DOMAIN"
echo ""
echo "Next steps:"
echo "1. Point your domain DNS to this server's IP address"
echo "2. Run the SSL setup commands above"
echo "3. Use ./update.sh to deploy future updates"
