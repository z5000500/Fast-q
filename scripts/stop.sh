#!/usr/bin/env bash
# Stop ALL running QuizCraft servers.
source "$(dirname "$0")/env.sh"

header "Stopping all QuizCraft services"

stopped=0

for service in php node frontend pma; do
  pidfile="$PID_DIR/$service.pid"
  if [ -f "$pidfile" ]; then
    pid=$(cat "$pidfile")
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null
      # Wait up to 3 seconds for graceful shutdown
      for i in 1 2 3; do
        kill -0 "$pid" 2>/dev/null || break
        sleep 1
      done
      # Force kill if still running
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null
      fi
      success "Stopped $service (PID $pid)"
      stopped=$((stopped + 1))
    else
      info "$service was not running (stale PID $pid)"
    fi
    rm -f "$pidfile"
  else
    info "No PID file for $service"
  fi
done

if [ $stopped -eq 0 ]; then
  info "No services were running."
else
  echo ""
  success "Stopped $stopped service(s)."
fi
