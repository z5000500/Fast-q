#!/usr/bin/env bash
# Start ALL servers: PHP API, Node.js Realtime, Frontend.
set -e
source "$(dirname "$0")/env.sh"

header "Starting all QuizCraft services"
echo ""

"$SCRIPTS_DIR/start-php.sh"
"$SCRIPTS_DIR/start-node.sh"
"$SCRIPTS_DIR/start-frontend.sh"
"$SCRIPTS_DIR/start-pma.sh"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  All services are running                            ║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║${NC}  Frontend     → ${GREEN}http://localhost:$FRONTEND_PORT${NC}              ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  PHP API      → ${GREEN}http://127.0.0.1:$PHP_PORT${NC}              ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  Realtime     → ${GREEN}http://127.0.0.1:$REALTIME_PORT${NC}              ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  phpMyAdmin   → ${GREEN}http://127.0.0.1:$PMA_PORT${NC}              ${BOLD}║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║${NC}  Stop all     → ${CYAN}./run.sh stop${NC}                       ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  View logs    → ${CYAN}./run.sh logs${NC}                       ${BOLD}║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
