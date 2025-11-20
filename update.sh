#!/bin/bash

# Enhanced Update Script for Voice2Fire App
# Run this after pushing changes to GitHub

set -e

APP_DIR="/var/www/lovable-app"
LOG_FILE="/var/log/voice2fire-update.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Function to log messages
log_message() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

# Function to handle errors
handle_error() {
    log_message "❌ ERROR: $1"
    exit 1
}

log_message "🚀 Starting update process..."

# Check if directory exists
if [ ! -d "$APP_DIR" ]; then
    handle_error "Application directory not found: $APP_DIR"
fi

cd $APP_DIR || handle_error "Failed to change to application directory"

# Stash any local changes
log_message "💾 Stashing local changes..."
git stash || handle_error "Failed to stash changes"

# Pull latest changes
log_message "📥 Pulling latest changes from GitHub..."
git pull origin main || handle_error "Failed to pull from GitHub"

# Install dependencies
log_message "📦 Installing dependencies..."
npm install || handle_error "Failed to install dependencies"

# Build application
log_message "🔨 Building application..."
npm run build || handle_error "Failed to build application"

# Reload nginx
log_message "🔄 Restarting services..."
if command -v nginx &> /dev/null; then
    sudo systemctl reload nginx && log_message "✅ Nginx reloaded" || log_message "⚠️  Nginx reload failed"
fi

# Restart application
if command -v pm2 &> /dev/null && pm2 list | grep -q "online"; then
    pm2 restart all && log_message "✅ Application restarted with PM2" || handle_error "PM2 restart failed"
elif systemctl list-units --full -all | grep -q lovable-app.service; then
    sudo systemctl restart lovable-app && log_message "✅ Application restarted with systemd" || handle_error "Systemd restart failed"
else
    log_message "⚠️  No Node.js service manager detected. Manual restart may be required."
fi

log_message ""
log_message "✨ Update complete! Your app is now running the latest version."
log_message "🌐 Visit: http://voice2fire.com"
log_message "📋 Full logs available at: $LOG_FILE"
