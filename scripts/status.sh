#!/usr/bin/env bash
# Show status of all QuizCraft services.
source "$(dirname "$0")/env.sh"

header "QuizCraft Service Status"
echo ""

printf "  %-14s %-8s %-8s %s\n" "SERVICE" "STATUS" "PID" "URL"
printf "  %-14s %-8s %-8s %s\n" "──────────" "──────" "─────" "────────────────────────"

for service in php node frontend pma; do
  pidfile="$PID_DIR/$service.pid"
  case $service in
    php)      url="http://127.0.0.1:$PHP_PORT" ;;
    node)     url="http://127.0.0.1:$REALTIME_PORT" ;;
    frontend) url="http://localhost:$FRONTEND_PORT" ;;
    pma)      url="http://127.0.0.1:$PMA_PORT" ;;
  esac

  if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    pid=$(cat "$pidfile")
    printf "  %-14s ${GREEN}%-8s${NC} %-8s %s\n" "$service" "running" "$pid" "$url"
  else
    printf "  %-14s ${RED}%-8s${NC} %-8s %s\n" "$service" "stopped" "-" "$url"
  fi
done

echo ""

# Check MySQL
MYSQL="$(mysql_cmd)"
if $MYSQL -e "SELECT 1" &>/dev/null; then
  printf "  %-14s ${GREEN}%-8s${NC} %-8s %s\n" "mysql" "running" "-" "$DB_HOST:$DB_PORT"
  # Check if database exists
  if $MYSQL -e "USE $DB_NAME" &>/dev/null; then
    tables=$($MYSQL "$DB_NAME" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME';" 2>/dev/null)
    printf "  %-14s ${GREEN}%-8s${NC} %-8s %s\n" "database" "ready" "-" "$DB_NAME ($tables tables)"
  else
    printf "  %-14s ${YELLOW}%-8s${NC} %-8s %s\n" "database" "missing" "-" "Run: ./scripts/db-setup.sh"
  fi
else
  printf "  %-14s ${RED}%-8s${NC} %-8s %s\n" "mysql" "stopped" "-" "$DB_HOST:$DB_PORT"
fi

echo ""
