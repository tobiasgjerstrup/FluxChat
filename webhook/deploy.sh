#!/bin/bash
set -euo pipefail

# --- Configuration ---
REPO_DIR="${REPO_DIR:-/mnt/T9/FluxChat}"
DEPLOY_USER="${DEPLOY_USER:-$(whoami)}"
PM2_BACKEND_PROCESS="${PM2_BACKEND_PROCESS:-fluxchat-backend}"
PM2_BACKEND_CWD="${PM2_BACKEND_CWD:-$REPO_DIR/backend}"
PM2_BACKEND_START_CMD="${PM2_BACKEND_START_CMD:-npm run start}"
FRONTEND_BUILD_CWD="${FRONTEND_BUILD_CWD:-$REPO_DIR/frontend}"
FRONTEND_BUILD_CMD="${FRONTEND_BUILD_CMD:-npm run build}"
PM2_STARTED_NEW_BACKEND=0

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

# Build frontend
log "Building frontend..."
cd "$FRONTEND_BUILD_CWD"
$FRONTEND_BUILD_CMD
cd "$REPO_DIR"

# Restart backend process (PM2)
if command -v pm2 >/dev/null 2>&1; then
    if pm2 describe "$PM2_BACKEND_PROCESS" >/dev/null 2>&1; then
        log "Restarting PM2 process $PM2_BACKEND_PROCESS..."
        pm2 restart "$PM2_BACKEND_PROCESS" --update-env
    else
        log "PM2 process $PM2_BACKEND_PROCESS not found, starting it..."
        pm2 start bash --name "$PM2_BACKEND_PROCESS" -- -lc "cd '$PM2_BACKEND_CWD' && $PM2_BACKEND_START_CMD"
        PM2_STARTED_NEW_BACKEND=1
    fi

    if [ "$PM2_STARTED_NEW_BACKEND" -eq 1 ]; then
        log "Saving PM2 process list..."
        pm2 save
    fi
else
    log "WARNING: pm2 is not installed or not in PATH"
fi

# Restart frontend service (if applicable)
if systemctl is-active --quiet fluxchat-frontend; then
    log "Restarting fluxchat-frontend..."
    systemctl restart fluxchat-frontend
fi

log "Deployment complete"
