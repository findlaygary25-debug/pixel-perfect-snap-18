#!/bin/bash

# Remote Update Script for Voice2Fire App
# Usage: ./remote-update.sh
# This script connects to your Hetzner server and updates the application

set -e

SERVER_IP="5.223.76.26"
SERVER_USER="root"
APP_DIR="/var/www/lovable-app"

echo "=================================="
echo "  Voice2Fire Remote Update"
echo "=================================="
echo ""
echo "📡 Connecting to: $SERVER_USER@$SERVER_IP"
echo ""

# Execute update commands on remote server
ssh -t $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

APP_DIR="/var/www/lovable-app"
LOG_FILE="/var/log/voice2fire-update.log"
BACKUP_DIR="/var/backups/lovable-app"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_message "🚀 Starting update process..."

cd $APP_DIR || exit 1

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup current build
if [ -d "$APP_DIR/dist" ]; then
    log_message "📦 Backing up current build..."
    cp -r "$APP_DIR/dist" "$BACKUP_DIR/dist_backup_$TIMESTAMP"
fi

# Stash ALL local changes (including update.sh permissions)
log_message "💾 Stashing all local changes..."
git stash --include-untracked || log_message "⚠️  No changes to stash"

# Pull latest changes
log_message "📥 Pulling latest changes from GitHub..."
git pull origin main || exit 1

# Install dependencies
log_message "📦 Installing dependencies..."
npm ci || exit 1

# Build application
log_message "🔨 Building application..."
npm run build || exit 1

# Verify build
if [ ! -d "$APP_DIR/dist" ] || [ ! -f "$APP_DIR/dist/index.html" ]; then
    log_message "❌ Build verification failed"
    exit 1
fi

# Reload nginx
log_message "🔄 Reloading nginx..."
systemctl reload nginx && log_message "✅ Nginx reloaded" || log_message "⚠️  Nginx reload failed"

# Clean old backups (keep last 5)
log_message "🧹 Cleaning old backups..."
cd "$BACKUP_DIR"
ls -t | tail -n +6 | xargs -r rm -rf
cd "$APP_DIR"

# Remove this backup since update was successful
rm -rf "$BACKUP_DIR/dist_backup_$TIMESTAMP"

log_message "✨ Update complete!"
log_message "🌐 Visit: http://voice2fire.com"

ENDSSH

echo ""
echo "✅ Remote update completed successfully!"
echo "🌐 Your app is now running the latest version at http://voice2fire.com"
