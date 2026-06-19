#!/bin/bash
# =============================================================
#  BKB — SSL Certificate + Nginx Setup
#  Run this AFTER server-setup.sh.
#  Usage: sudo bash scripts/ssl-setup.sh <your-domain>
#  Example: sudo bash scripts/ssl-setup.sh fyp.afiqhaiqal.my
#
#  What this does:
#    1. Installs Nginx
#    2. Adds rate-limit zones to nginx.conf
#    3. Deploys a temporary HTTP config for certbot verification
#    4. Installs Certbot and obtains SSL certificate
#    5. Deploys the full HTTPS Nginx config
#    6. Tests auto-renewal
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
  echo -e "${RED}[ERROR]${NC} Please run with sudo: sudo bash scripts/ssl-setup.sh <domain>"
  exit 1
fi

DOMAIN="${1:-fyp.afiqhaiqal.my}"
info "Setting up SSL for domain: $DOMAIN"

# ─── Step 1: Install Nginx ────────────────────────────────────
section "Step 1: Installing Nginx"
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
info "Nginx installed."

# ─── Step 2: Rate limit zones ─────────────────────────────────
section "Step 2: Adding rate limit zones to nginx.conf"
NGINX_CONF="/etc/nginx/nginx.conf"

if ! grep -q "login_limit" "$NGINX_CONF"; then
  sed -i '/http {/a\\n\t# BKB Rate Limiting Zones\n\tlimit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;\n\tlimit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;' "$NGINX_CONF"
  info "Rate limit zones added."
else
  info "Rate limit zones already present — skipping."
fi

# ─── Step 3: Temporary HTTP config for certbot ────────────────
section "Step 3: Deploying temporary HTTP config"
mkdir -p /var/www/certbot

cat > /etc/nginx/sites-available/bkb << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'BKB is starting up...';
        add_header Content-Type text/plain;
    }
}
EOF

ln -sf /etc/nginx/sites-available/bkb /etc/nginx/sites-enabled/bkb
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
info "Temporary config deployed."

# ─── Step 4: Install Certbot ──────────────────────────────────
section "Step 4: Installing Certbot"
apt-get install -y certbot python3-certbot-nginx
info "Certbot installed."

# ─── Step 5: Obtain SSL certificate ──────────────────────────
section "Step 5: Obtaining SSL certificate for $DOMAIN"
certbot --nginx \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --register-unsafely-without-email \
  --redirect
info "SSL certificate obtained."

# ─── Step 6: Deploy full HTTPS Nginx config ──────────────────
section "Step 6: Deploying full HTTPS Nginx config"

cat > /etc/nginx/sites-available/bkb << NGINXEOF
# ── HTTP → HTTPS Redirect ────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# ── HTTPS Main Server ────────────────────────────────────────
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;

    # SSL — managed by Certbot
    ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # TLS hardening
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options           "DENY" always;
    add_header X-Content-Type-Options    "nosniff" always;
    add_header X-XSS-Protection          "1; mode=block" always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy        "camera=(), microphone=(), geolocation=(), payment=()" always;
    add_header Content-Security-Policy   "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://$DOMAIN; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;

    server_tokens off;
    client_max_body_size 10M;

    # Frontend (React SPA — Docker container on port 5173)
    location / {
        proxy_pass         http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_intercept_errors on;
        error_page 404 = /index.html;
    }

    # Backend API (Spring Boot — Docker container on port 8081)
    location /api/ {
        proxy_pass         http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Rate-limited login endpoint
    location /api/auth/login {
        limit_req zone=login_limit burst=2 nodelay;
        limit_req_status 429;
        proxy_pass         http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
    }

    # Block Swagger UI in production
    location ~ ^/api/(swagger-ui|v3/api-docs|webjars) {
        return 403;
    }

    # Block actuator endpoints (except /health)
    location /api/actuator/ {
        return 403;
    }
    location = /api/actuator/health {
        proxy_pass http://127.0.0.1:8081/actuator/health;
        proxy_set_header Host \$host;
    }
}
NGINXEOF

nginx -t && systemctl reload nginx
info "Full HTTPS Nginx config deployed."

# ─── Step 7: Test auto-renewal ────────────────────────────────
section "Step 7: Testing SSL auto-renewal"
certbot renew --dry-run
info "SSL auto-renewal OK."

# ─── Done ─────────────────────────────────────────────────────
section "✅ SSL Setup Complete!"
echo ""
echo -e "  ${GREEN}✔${NC} Nginx           — active with HTTPS"
echo -e "  ${GREEN}✔${NC} SSL certificate — issued for $DOMAIN"
echo -e "  ${GREEN}✔${NC} HTTP → HTTPS    — redirect active"
echo -e "  ${GREEN}✔${NC} Security headers — HSTS, CSP, X-Frame, etc."
echo -e "  ${GREEN}✔${NC} Auto-renewal    — configured"
echo ""
echo -e "  🌐 Your site: ${GREEN}https://$DOMAIN${NC}"
echo ""
info "Next step: Set up PostgreSQL — bash scripts/setup-postgres.sh"
