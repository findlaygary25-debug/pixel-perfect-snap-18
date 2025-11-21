#!/bin/bash

# Enhanced Update Script for Voice2Fire App
# Run this after pushing changes to GitHub

set -e

APP_DIR="/var/www/lovable-app"
LOG_FILE="/var/log/voice2fire-update.log"
BACKUP_DIR="/var/backups/lovable-app"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to handle errors
handle_error() {
    log_message "❌ ERROR: $1"
    log_message "Rolling back to previous version..."
    if [ -d "$BACKUP_DIR/dist_backup_$TIMESTAMP" ]; then
        rm -rf "$APP_DIR/dist"
        mv "$BACKUP_DIR/dist_backup_$TIMESTAMP" "$APP_DIR/dist"
        log_message "✅ Rollback complete"
    fi
    exit 1
}

log_message "🚀 Starting update process..."

# Check if running as correct user
if [ ! -w "$APP_DIR" ]; then
    handle_error "No write permission to $APP_DIR. Run as correct user or with sudo."
fi

# Check if directory exists
if [ ! -d "$APP_DIR" ]; then
    handle_error "Application directory not found: $APP_DIR"
fi

cd $APP_DIR || handle_error "Failed to change to application directory"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup current build
if [ -d "$APP_DIR/dist" ]; then
    log_message "📦 Backing up current build..."
    cp -r "$APP_DIR/dist" "$BACKUP_DIR/dist_backup_$TIMESTAMP"
fi

# Stash any local changes
log_message "💾 Stashing local changes..."
git stash || log_message "⚠️  No changes to stash"

# Fetch and show what will be updated
log_message "🔍 Checking for updates..."
git fetch origin main
BEHIND=$(git rev-list HEAD..origin/main --count)
if [ "$BEHIND" -eq 0 ]; then
    log_message "✅ Already up to date!"
    exit 0
fi
log_message "📊 Found $BEHIND new commits to pull"

# Pull latest changes
log_message "📥 Pulling latest changes from GitHub..."
git pull origin main || handle_error "Failed to pull from GitHub"

# Install dependencies
log_message "📦 Installing dependencies..."
npm ci || handle_error "Failed to install dependencies"

# Build application
log_message "🔨 Building application..."
npm run build || handle_error "Failed to build application"

# Verify build
if [ ! -d "$APP_DIR/dist" ] || [ ! -f "$APP_DIR/dist/index.html" ]; then
    handle_error "Build verification failed - dist folder missing or incomplete"
fi

# Test nginx configuration
if command -v nginx &> /dev/null; then
    log_message "🔍 Testing nginx configuration..."
    sudo nginx -t || handle_error "Nginx configuration test failed"
fi

# Reload nginx
log_message "🔄 Reloading nginx..."
if command -v nginx &> /dev/null; then
    sudo systemctl reload nginx && log_message "✅ Nginx reloaded" || log_message "⚠️  Nginx reload failed"
fi

# Restart application (if using PM2 or systemd)
if command -v pm2 &> /dev/null && pm2 list | grep -q "online"; then
    log_message "🔄 Restarting application with PM2..."
    pm2 restart all && log_message "✅ Application restarted with PM2" || handle_error "PM2 restart failed"
elif systemctl list-units --full -all | grep -q lovable-app.service; then
    log_message "🔄 Restarting application with systemd..."
    sudo systemctl restart lovable-app && log_message "✅ Application restarted with systemd" || handle_error "Systemd restart failed"
else
    log_message "ℹ️  No Node.js service manager detected (app served via nginx only)"
fi

# Clean old backups (keep last 5)
log_message "🧹 Cleaning old backups..."
cd "$BACKUP_DIR"
ls -t | tail -n +6 | xargs -r rm -rf
cd "$APP_DIR"

# Remove backup for this update (since it was successful)
rm -rf "$BACKUP_DIR/dist_backup_$TIMESTAMP"

log_message ""
log_message "✨ Update complete! Your app is now running the latest version."
log_message "🌐 Visit: http://voice2fire.com"
log_message "📋 Full logs available at: $LOG_FILE"
log_message ""
