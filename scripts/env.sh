#!/usr/bin/env bash
# Shared env loader -- sourced by every other script.
# Reads .env from project root and exports variables.

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPTS_DIR/.." && pwd)"

export PROJECT_ROOT
export API_DIR="$PROJECT_ROOT/api"
export REALTIME_DIR="$PROJECT_ROOT/realtime"
export FRONTEND_DIR="$PROJECT_ROOT/frontend"
export DB_DIR="$PROJECT_ROOT/database"
export PID_DIR="$PROJECT_ROOT/scripts/.pids"

mkdir -p "$PID_DIR"

# Load .env
if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

# Defaults
export DB_HOST="${DB_HOST:-127.0.0.1}"
export DB_PORT="${DB_PORT:-3306}"
export DB_NAME="${DB_NAME:-fast_q}"
export DB_USER="${DB_USER:-root}"
export DB_PASS="${DB_PASS:-}"
export PHP_PORT="${PHP_PORT:-8000}"
export REALTIME_PORT="${REALTIME_PORT:-3001}"
export FRONTEND_PORT="${FRONTEND_PORT:-8080}"
export PMA_PORT="${PMA_PORT:-8888}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERR]${NC}   $*"; }
header()  { echo -e "\n${BOLD}── $* ──${NC}"; }

# Build the mysql CLI command with credentials
mysql_cmd() {
  local cmd="mysql -h $DB_HOST -P $DB_PORT -u $DB_USER"
  [ -n "$DB_PASS" ] && cmd="$cmd -p$DB_PASS"
  echo "$cmd"
}
