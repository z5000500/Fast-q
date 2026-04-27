#!/usr/bin/env bash
# Start the Vite frontend dev server.
source "$(dirname "$0")/env.sh"

header "Frontend Dev Server"

if [ -f "$PID_DIR/frontend.pid" ] && kill -0 "$(cat "$PID_DIR/frontend.pid")" 2>/dev/null; then
  warn "Frontend server already running (PID $(cat "$PID_DIR/frontend.pid"))"
  exit 0
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  error "Frontend dependencies not installed. Run: ./scripts/install.sh"
  exit 1
fi

info "Starting Vite dev server on http://localhost:$FRONTEND_PORT ..."

cd "$FRONTEND_DIR"
npx vite --host --port "$FRONTEND_PORT" > "$PID_DIR/frontend.log" 2>&1 &
echo $! > "$PID_DIR/frontend.pid"

sleep 2
if kill -0 "$(cat "$PID_DIR/frontend.pid")" 2>/dev/null; then
  success "Frontend started (PID $(cat "$PID_DIR/frontend.pid")) → http://localhost:$FRONTEND_PORT"
else
  error "Frontend failed to start. Check $PID_DIR/frontend.log"
  exit 1
fi
