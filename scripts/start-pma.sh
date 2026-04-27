#!/usr/bin/env bash
# Start phpMyAdmin using PHP's built-in server.
source "$(dirname "$0")/env.sh"

PMA_PORT="${PMA_PORT:-8888}"
PMA_DIR="$(brew --prefix phpmyadmin 2>/dev/null)/share/phpmyadmin"

header "phpMyAdmin"

if [ ! -d "$PMA_DIR" ]; then
  error "phpMyAdmin not found. Install with: brew install phpmyadmin"
  exit 1
fi

if [ -f "$PID_DIR/pma.pid" ] && kill -0 "$(cat "$PID_DIR/pma.pid")" 2>/dev/null; then
  warn "phpMyAdmin already running (PID $(cat "$PID_DIR/pma.pid"))"
  exit 0
fi

info "Starting phpMyAdmin on http://127.0.0.1:$PMA_PORT ..."

php -S "127.0.0.1:$PMA_PORT" -t "$PMA_DIR" > "$PID_DIR/pma.log" 2>&1 &
echo $! > "$PID_DIR/pma.pid"

sleep 0.5
if kill -0 "$(cat "$PID_DIR/pma.pid")" 2>/dev/null; then
  success "phpMyAdmin started (PID $(cat "$PID_DIR/pma.pid")) → http://127.0.0.1:$PMA_PORT"
  info "Login: user=$DB_USER | host=$DB_HOST"
else
  error "phpMyAdmin failed to start. Check $PID_DIR/pma.log"
  exit 1
fi
