#!/usr/bin/env bash
# Install all project dependencies: Composer (PHP), npm (Node realtime + Frontend)
set -e
source "$(dirname "$0")/env.sh"

header "Installing dependencies"

# ── PHP API ───────────────────────────────────────────────────
info "Installing PHP dependencies (Composer)..."
cd "$API_DIR"
if [ ! -f composer.lock ]; then
  composer install --no-interaction --prefer-dist
else
  composer install --no-interaction
fi
success "PHP dependencies installed"

# ── Node.js Realtime ──────────────────────────────────────────
info "Installing Node.js realtime dependencies..."
cd "$REALTIME_DIR"
npm install
success "Realtime dependencies installed"

# ── Frontend ──────────────────────────────────────────────────
info "Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm install
success "Frontend dependencies installed"

echo ""
success "All dependencies installed."
