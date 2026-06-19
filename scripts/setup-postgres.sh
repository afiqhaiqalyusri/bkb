#!/bin/bash
# =============================================================
#  BKB — PostgreSQL Setup (Idempotent)
#  Reads credentials from ~/bkb/.env
#  Safe to run multiple times — won't break an existing setup.
#  Usage: bash scripts/setup-postgres.sh
# =============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo "=== PostgreSQL Setup ==="

# ── Load credentials from .env ────────────────────────────────
ENV_FILE="$HOME/bkb/.env"
if [ ! -f "$ENV_FILE" ]; then
  error ".env file not found at $ENV_FILE — run the GitHub Actions deploy first."
fi

DB_USER=$(grep    '^DB_USER='     "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")
DB_PASSWORD=$(grep '^DB_PASSWORD=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")

DB_USER="${DB_USER:-bkb_user}"

if [ -z "$DB_PASSWORD" ]; then
  error "DB_PASSWORD is not set in $ENV_FILE"
fi

info "DB_USER: $DB_USER"

# ── 1. Install PostgreSQL ─────────────────────────────────────
if ! command -v psql &>/dev/null; then
  info "Installing PostgreSQL..."
  sudo apt-get update -q
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
else
  info "PostgreSQL already installed."
fi

# ── 2. Ensure service is running ──────────────────────────────
if ! sudo systemctl is-active --quiet postgresql; then
  info "Starting PostgreSQL service..."
  sudo systemctl enable postgresql
  sudo systemctl start postgresql
  sleep 3
fi
info "PostgreSQL service: $(sudo systemctl is-active postgresql)"

# ── 3. Create DB user (idempotent) ────────────────────────────
info "Creating DB user '$DB_USER' if not exists..."
sudo -u postgres psql -v ON_ERROR_STOP=1 << SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE USER "$DB_USER" WITH PASSWORD '$DB_PASSWORD';
    RAISE NOTICE 'User $DB_USER created.';
  ELSE
    ALTER USER "$DB_USER" WITH PASSWORD '$DB_PASSWORD';
    RAISE NOTICE 'User $DB_USER password updated.';
  END IF;
END
\$\$;
SQL

# ── 4. Create database (idempotent) ───────────────────────────
info "Creating database 'bkb' if not exists..."
if ! sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='bkb'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE DATABASE bkb OWNER \"$DB_USER\";"
  info "Database 'bkb' created."
else
  info "Database 'bkb' already exists."
fi
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE bkb TO \"$DB_USER\";"

# ── 5. Detect PostgreSQL config files ─────────────────────────
PG_VERSION=$(pg_lsclusters -h 2>/dev/null | awk '{print $1}' | grep -E '^[0-9]+$' | head -1)
if [ -z "$PG_VERSION" ]; then
  PG_VERSION=$(psql --version | awk '{print $3}' | cut -d. -f1)
fi
PG_CONF="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"
HBA_CONF="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"
info "PostgreSQL version: $PG_VERSION"

# ── 6. Allow Docker bridge connections ────────────────────────
if [ -f "$PG_CONF" ]; then
  if ! sudo grep -q "^listen_addresses = '\*'" "$PG_CONF" 2>/dev/null; then
    info "Setting listen_addresses = '*' (needed for host.docker.internal)..."
    sudo sed -i "s/^#*listen_addresses\s*=.*/listen_addresses = '*'/" "$PG_CONF"
  else
    info "listen_addresses already set to '*'"
  fi
fi

if [ -f "$HBA_CONF" ]; then
  # Allow all local connections (Docker uses host-gateway which comes from 172.16.0.0/12 range usually)
  if ! sudo grep -q "172.16.0.0/12" "$HBA_CONF"; then
    echo "host    all             all             172.16.0.0/12           scram-sha-256" | sudo tee -a "$HBA_CONF"
    info "Docker bridge rule (172.16.0.0/12) added to pg_hba.conf."
  else
    info "Docker bridge rule (172.16.0.0/12) already in pg_hba.conf."
  fi
fi

# ── 7. Reload PostgreSQL ──────────────────────────────────────
info "Reloading PostgreSQL..."
sudo systemctl reload postgresql
sleep 2

# ── 8. Final connectivity check ───────────────────────────────
if pg_isready -h 127.0.0.1 -p 5432; then
  info "PostgreSQL is ready!"
else
  error "PostgreSQL failed to start. Run: sudo systemctl status postgresql"
fi

echo "=== PostgreSQL Setup Complete ==="
