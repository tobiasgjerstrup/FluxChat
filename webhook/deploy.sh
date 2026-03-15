#!/bin/bash
set -euo pipefail

# --- Configuration ---
REPO_DIR="${REPO_DIR:-/mnt/T9/FluxChat}"
DEPLOY_USER="${DEPLOY_USER:-$(whoami)}"

log() { echo "[deploy] $(date '+%Y-%m-%d %H:%M:%S') $*"; }

log "Starting deployment in $REPO_DIR"

cd "$REPO_DIR"

# Pull latest code
log "Pulling latest changes..."
git fetch --all
git reset --hard origin/main

# Install dependencies
log "Installing dependencies..."
npm install --workspaces

# Build shared library
log "Building shared..."
cd shared && npm run build 2>/dev/null || true
cd "$REPO_DIR"

# Restart backend service
if systemctl is-active --quiet fluxchat-backend; then
    log "Restarting fluxchat-backend..."
    systemctl restart fluxchat-backend
else
    log "WARNING: fluxchat-backend service is not running"
fi

# Restart frontend service (if applicable)
if systemctl is-active --quiet fluxchat-frontend; then
    log "Restarting fluxchat-frontend..."
    systemctl restart fluxchat-frontend
fi

log "Deployment complete"
