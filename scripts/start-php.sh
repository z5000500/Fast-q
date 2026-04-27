#!/usr/bin/env bash
# Start the PHP built-in development server.
source "$(dirname "$0")/env.sh"

header "PHP API Server"

if [ -f "$PID_DIR/php.pid" ] && kill -0 "$(cat "$PID_DIR/php.pid")" 2>/dev/null; then
  warn "PHP server already running (PID $(cat "$PID_DIR/php.pid"))"
  exit 0
fi

if [ ! -d "$API_DIR/vendor" ]; then
  error "Composer dependencies not installed. Run: ./scripts/install.sh"
  exit 1
fi

info "Starting PHP server on http://127.0.0.1:$PHP_PORT ..."

cd "$API_DIR"
php -S "127.0.0.1:$PHP_PORT" -t public > "$PID_DIR/php.log" 2>&1 &
echo $! > "$PID_DIR/php.pid"

sleep 0.5
if kill -0 "$(cat "$PID_DIR/php.pid")" 2>/dev/null; then
  success "PHP server started (PID $(cat "$PID_DIR/php.pid")) → http://127.0.0.1:$PHP_PORT"
else
  error "PHP server failed to start. Check $PID_DIR/php.log"
  exit 1
fi
