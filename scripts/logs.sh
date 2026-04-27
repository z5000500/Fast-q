#!/usr/bin/env bash
# Tail logs from all running services.
# Usage:
#   ./scripts/logs.sh           # tail all logs
#   ./scripts/logs.sh php       # tail only PHP log
#   ./scripts/logs.sh node      # tail only Node log
#   ./scripts/logs.sh frontend  # tail only frontend log
source "$(dirname "$0")/env.sh"

SERVICE="${1:-all}"

header "Service Logs"

if [ "$SERVICE" = "all" ]; then
  info "Tailing all logs (Ctrl+C to stop)..."
  echo ""
  tail -f "$PID_DIR/php.log" "$PID_DIR/node.log" "$PID_DIR/frontend.log" "$PID_DIR/pma.log" 2>/dev/null
elif [ -f "$PID_DIR/$SERVICE.log" ]; then
  info "Tailing $SERVICE log (Ctrl+C to stop)..."
  echo ""
  tail -f "$PID_DIR/$SERVICE.log"
else
  error "No log found for '$SERVICE'. Available: php, node, frontend, all"
  exit 1
fi
