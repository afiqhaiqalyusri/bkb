#!/bin/bash
# =============================================================
#  BKB — VPS Initial Server Setup
#  Run this ONCE after first SSH login to your VPS.
#  Usage: sudo bash scripts/server-setup.sh
#
#  What this does:
#    1. Updates system packages
#    2. Configures UFW firewall (SSH, HTTP, HTTPS only)
#    3. Installs Fail2Ban for brute-force protection
#    4. Hardens SSH (disable root login, disable password auth)
#    5. Installs Docker + Docker Compose plugin
# =============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
section() { echo -e "\n${YELLOW}========================================${NC}"; echo -e "${YELLOW} $1${NC}"; echo -e "${YELLOW}========================================${NC}"; }

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR]${NC} Please run as root or with sudo: sudo bash scripts/server-setup.sh"
  exit 1
fi

# ─── Step 1: Update system ────────────────────────────────────
section "Step 1: Updating system packages"
apt-get update -y && apt-get upgrade -y
info "System updated."

# ─── Step 2: UFW Firewall ─────────────────────────────────────
section "Step 2: Configuring UFW firewall"
apt-get install -y ufw

ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment 'SSH'
ufw allow 80/tcp   comment 'HTTP'
ufw allow 443/tcp  comment 'HTTPS'
# Port 5432 (PostgreSQL) and 8081 (backend) are NOT opened — accessed only locally
# Allow Docker bridge subnets to access PostgreSQL on the host
ufw allow from 172.16.0.0/12 to any port 5432 comment 'Docker to Host'

echo "y" | ufw enable
ufw status verbose
info "Firewall configured."

# ─── Step 3: Fail2Ban ─────────────────────────────────────────
section "Step 3: Installing Fail2Ban"
apt-get install -y fail2ban

cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

cat >> /etc/fail2ban/jail.local << 'EOF'

# BKB SSH hardening
[sshd]
enabled  = true
maxretry = 5
bantime  = 3600
findtime = 600
EOF

systemctl enable fail2ban
systemctl restart fail2ban
info "Fail2Ban installed."

# ─── Step 4: SSH Hardening ────────────────────────────────────
section "Step 4: Hardening SSH"

SSHD_CONFIG="/etc/ssh/sshd_config"
cp "$SSHD_CONFIG" "${SSHD_CONFIG}.bak"
info "SSH config backed up to ${SSHD_CONFIG}.bak"

sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/'          "$SSHD_CONFIG"
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' "$SSHD_CONFIG"
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/'    "$SSHD_CONFIG"
sed -i 's/^#\?MaxAuthTries.*/MaxAuthTries 3/'                  "$SSHD_CONFIG"

info "Verifying SSH config:"
grep -E "^(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication|MaxAuthTries)" "$SSHD_CONFIG"

systemctl restart ssh
info "SSH hardened."

# ─── Step 5: Install Docker ───────────────────────────────────
section "Step 5: Installing Docker"

if command -v docker &>/dev/null; then
  info "Docker is already installed: $(docker --version)"
else
  apt-get install -y ca-certificates curl gnupg lsb-release

  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  systemctl enable docker
  systemctl start docker
  info "Docker installed: $(docker --version)"
fi

# Add the current non-root user to docker group (so they can run docker without sudo)
# Detect the user who called sudo
REAL_USER="${SUDO_USER:-ubuntu}"
if id "$REAL_USER" &>/dev/null; then
  usermod -aG docker "$REAL_USER"
  info "User '$REAL_USER' added to docker group. Re-login for it to take effect."
fi

# ─── Done ─────────────────────────────────────────────────────
section "✅ Server setup complete!"
echo ""
echo -e "  ${GREEN}✔${NC} System updated"
echo -e "  ${GREEN}✔${NC} UFW firewall  — SSH, HTTP, HTTPS allowed"
echo -e "  ${GREEN}✔${NC} Fail2Ban      — active"
echo -e "  ${GREEN}✔${NC} SSH hardened  — root login & password auth disabled"
echo -e "  ${GREEN}✔${NC} Docker        — installed"
echo ""
warn "IMPORTANT: Make sure your SSH public key is in ~/.ssh/authorized_keys"
warn "           before closing this session, or you will be locked out!"
echo ""
info "Next step: Run SSL setup — sudo bash scripts/ssl-setup.sh"
