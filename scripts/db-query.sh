#!/usr/bin/env bash
# Open an interactive MySQL shell connected to the project database,
# or run a one-off SQL command passed as an argument.
#
# Usage:
#   ./scripts/db-query.sh                     # interactive shell
#   ./scripts/db-query.sh "SELECT * FROM users"  # one-off query
#   echo "SHOW TABLES" | ./scripts/db-query.sh   # piped query
source "$(dirname "$0")/env.sh"

MYSQL="$(mysql_cmd)"

if [ -n "$1" ]; then
  header "Running query"
  $MYSQL "$DB_NAME" -e "$1"
elif [ ! -t 0 ]; then
  $MYSQL "$DB_NAME"
else
  header "MySQL Interactive Shell"
  info "Connected to: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
  echo ""
  $MYSQL "$DB_NAME"
fi
