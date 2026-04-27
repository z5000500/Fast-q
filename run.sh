#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  QuizCraft (fast_q) - Project Runner
# ═══════════════════════════════════════════════════════════════
#
#  Usage:
#    ./run.sh <command>
#
#  Commands:
#    install        Install all dependencies (Composer + npm)
#    db:setup       Create database and apply schema
#    db:reset       Drop and recreate database with seed data
#    db:query       Open MySQL shell or run a query
#    start          Start all servers (PHP + Node + Frontend)
#    start:php      Start PHP API server only
#    start:node     Start Node.js realtime only
#    start:frontend Start frontend dev server only
#    start:pma      Start phpMyAdmin only
#    stop           Stop all running servers
#    restart        Stop then start all servers
#    status         Show status of all services
#    logs           Tail logs from all services
#    logs:php       Tail PHP server log
#    logs:node      Tail Node.js server log
#    logs:frontend  Tail frontend server log
#
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPTS_DIR="$(cd "$(dirname "$0")/scripts" && pwd)"

case "${1:-help}" in
  install)
    bash "$SCRIPTS_DIR/install.sh"
    ;;
  db:setup)
    bash "$SCRIPTS_DIR/db-setup.sh" "${@:2}"
    ;;
  db:reset)
    bash "$SCRIPTS_DIR/db-reset.sh"
    ;;
  db:query)
    bash "$SCRIPTS_DIR/db-query.sh" "${@:2}"
    ;;
  start)
    bash "$SCRIPTS_DIR/start.sh"
    ;;
  start:php)
    bash "$SCRIPTS_DIR/start-php.sh"
    ;;
  start:node)
    bash "$SCRIPTS_DIR/start-node.sh"
    ;;
  start:frontend)
    bash "$SCRIPTS_DIR/start-frontend.sh"
    ;;
  start:pma)
    bash "$SCRIPTS_DIR/start-pma.sh"
    ;;
  stop)
    bash "$SCRIPTS_DIR/stop.sh"
    ;;
  restart)
    bash "$SCRIPTS_DIR/stop.sh"
    echo ""
    bash "$SCRIPTS_DIR/start.sh"
    ;;
  status)
    bash "$SCRIPTS_DIR/status.sh"
    ;;
  logs)
    bash "$SCRIPTS_DIR/logs.sh" all
    ;;
  logs:php)
    bash "$SCRIPTS_DIR/logs.sh" php
    ;;
  logs:node)
    bash "$SCRIPTS_DIR/logs.sh" node
    ;;
  logs:frontend)
    bash "$SCRIPTS_DIR/logs.sh" frontend
    ;;
  logs:pma)
    bash "$SCRIPTS_DIR/logs.sh" pma
    ;;
  help|--help|-h|"")
    echo ""
    echo "  QuizCraft (fast_q) - Project Runner"
    echo ""
    echo "  Usage: ./run.sh <command>"
    echo ""
    echo "  Setup:"
    echo "    install         Install all dependencies (Composer + npm)"
    echo "    db:setup        Create database and apply schema"
    echo "    db:reset        Drop and recreate database with seed data"
    echo "    db:query [sql]  Open MySQL shell or run a one-off query"
    echo ""
    echo "  Servers:"
    echo "    start           Start all servers (PHP + Node + Frontend + phpMyAdmin)"
    echo "    start:php       Start PHP API server only"
    echo "    start:node      Start Node.js realtime only"
    echo "    start:frontend  Start frontend dev server only"
    echo "    start:pma       Start phpMyAdmin only"
    echo "    stop            Stop all running servers"
    echo "    restart         Stop then start all servers"
    echo ""
    echo "  Monitoring:"
    echo "    status          Show status of all services"
    echo "    logs            Tail logs from all services"
    echo "    logs:php        Tail PHP server log"
    echo "    logs:node       Tail Node.js server log"
    echo "    logs:frontend   Tail frontend server log"
    echo "    logs:pma        Tail phpMyAdmin server log"
    echo ""
    ;;
  *)
    echo "Unknown command: $1"
    echo "Run './run.sh help' for available commands."
    exit 1
    ;;
esac
