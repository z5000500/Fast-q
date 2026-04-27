#!/usr/bin/env bash
# Start the Node.js realtime service (Express + Socket.io).
source "$(dirname "$0")/env.sh"

header "Node.js Realtime Service"

if [ -f "$PID_DIR/node.pid" ] && kill -0 "$(cat "$PID_DIR/node.pid")" 2>/dev/null; then
  warn "Node.js server already running (PID $(cat "$PID_DIR/node.pid"))"
  exit 0
fi

if [ ! -d "$REALTIME_DIR/node_modules" ]; then
  error "Node dependencies not installed. Run: ./scripts/install.sh"
  exit 1
fi

info "Starting realtime service on http://127.0.0.1:$REALTIME_PORT ..."

cd "$REALTIME_DIR"
node server.js > "$PID_DIR/node.log" 2>&1 &
echo $! > "$PID_DIR/node.pid"

sleep 1
if kill -0 "$(cat "$PID_DIR/node.pid")" 2>/dev/null; then
  success "Realtime service started (PID $(cat "$PID_DIR/node.pid")) → http://127.0.0.1:$REALTIME_PORT"
else
  error "Node.js server failed to start. Check $PID_DIR/node.log"
  exit 1
fi
