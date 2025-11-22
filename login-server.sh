#!/bin/bash

# SSH Login Script for Voice2Fire Hetzner Server

SERVER_IP="5.223.76.26"
SERVER_USER="root"

echo "🔐 Connecting to Voice2Fire server..."
echo "📡 Server: $SERVER_USER@$SERVER_IP"
echo ""

ssh $SERVER_USER@$SERVER_IP
