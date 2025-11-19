#!/bin/bash

# Quick Update Script for Lovable App
# Run this after pushing changes to GitHub

set -e

APP_DIR="/var/www/lovable-app"

echo "🚀 Starting update process..."

cd $APP_DIR

echo "📥 Pulling latest changes from GitHub..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "🔄 Restarting services..."

# Reload nginx
if command -v nginx &> /dev/null; then
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
fi

# Check if PM2 is being used
if command -v pm2 &> /dev/null && pm2 list | grep -q "online"; then
    pm2 restart all
    echo "✅ Application restarted with PM2"
# Check if systemd service exists
elif systemctl list-units --full -all | grep -q lovable-app.service; then
    sudo systemctl restart lovable-app
    echo "✅ Application restarted with systemd"
else
    echo "⚠️  No Node.js service manager detected. If using a process manager, restart manually."
fi

echo ""
echo "✨ Update complete! Your app is now running the latest version."
echo "🌐 Visit: http://voice2fire.com"
