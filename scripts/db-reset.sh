#!/usr/bin/env bash
# Drop and recreate the database from scratch.
set -e
source "$(dirname "$0")/env.sh"

header "Database Reset"

MYSQL="$(mysql_cmd)"

warn "This will DROP the entire '$DB_NAME' database!"
read -rp "$(echo -e "${RED}Are you sure? [y/N]:${NC} ")" answer
if [[ ! "$answer" =~ ^[Yy]$ ]]; then
  info "Aborted."
  exit 0
fi

info "Dropping database '$DB_NAME'..."
$MYSQL -e "DROP DATABASE IF EXISTS \`$DB_NAME\`;"
success "Database dropped"

# Re-run setup with seed
"$SCRIPTS_DIR/db-setup.sh" --seed
