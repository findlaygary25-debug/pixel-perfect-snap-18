#!/bin/bash

# Quick Update Script for Lovable App
# Run this after pushing changes to GitHub

set -e

APP_DIR="/var/www/lovable-app"

echo "🔄 Updating application..."

cd $APP_DIR

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild
npm run build

# Restart nginx (optional, just to be sure)
sudo systemctl reload nginx

echo "✅ Update complete! Your app is now running the latest version."
