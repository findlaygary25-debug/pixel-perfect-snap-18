#!/bin/bash

# Update Information Script
# Shows where updates come from and where they go

set -e

APP_DIR="/var/www/lovable-app"

echo "=================================="
echo "  Voice2Fire Update Information"
echo "=================================="
echo ""

cd $APP_DIR || exit 1

echo "📍 UPDATE DESTINATION:"
echo "   Server Directory: $APP_DIR"
echo ""

echo "📡 UPDATE SOURCE:"
REPO_URL=$(git config --get remote.origin.url)
echo "   GitHub Repository: $REPO_URL"
echo ""

echo "🌿 CURRENT BRANCH:"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "   Branch: $CURRENT_BRANCH"
echo ""

echo "📝 LAST COMMIT:"
git log -1 --pretty=format:"   Commit: %h%n   Author: %an%n   Date: %ar%n   Message: %s"
echo ""
echo ""

echo "🔄 CHECKING FOR UPDATES..."
git fetch origin main
BEHIND=$(git rev-list HEAD..origin/main --count)
if [ "$BEHIND" -eq 0 ]; then
    echo "   ✅ Already up to date!"
else
    echo "   📊 $BEHIND new commits available to pull"
fi
echo ""
