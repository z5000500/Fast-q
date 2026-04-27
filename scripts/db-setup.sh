#!/usr/bin/env bash
# Create the database, run schema.sql, optionally seed.
set -e
source "$(dirname "$0")/env.sh"

header "Database Setup"

MYSQL="$(mysql_cmd)"

info "Creating database '$DB_NAME' (if not exists)..."
$MYSQL -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
success "Database ready"

info "Running schema.sql..."
$MYSQL "$DB_NAME" < "$DB_DIR/schema.sql"
success "Schema applied"

# Ask about seed data unless --seed flag is passed
if [[ "$1" == "--seed" ]]; then
  info "Running seed.sql..."
  $MYSQL "$DB_NAME" < "$DB_DIR/seed.sql"
  success "Seed data inserted"
else
  echo ""
  read -rp "$(echo -e "${YELLOW}Load seed/demo data? [y/N]:${NC} ")" answer
  if [[ "$answer" =~ ^[Yy]$ ]]; then
    info "Running seed.sql..."
    $MYSQL "$DB_NAME" < "$DB_DIR/seed.sql"
    success "Seed data inserted"
  else
    info "Skipped seed data"
  fi
fi

echo ""
success "Database setup complete."
