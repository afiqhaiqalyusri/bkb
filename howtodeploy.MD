# BKB — Deployment Guide

This guide walks you through deploying BKB from scratch.

**CI/CD Pipeline:**
```
git push origin main
       │
  Job 1: Build & Test
  ├── mvn clean package (backend)
  └── npm run build (frontend)
       │
  Job 2: Build & Push Docker Images → GitHub Container Registry (GHCR)
  ├── Build bkb-backend image → ghcr.io/afiqhaiqalyusri/bkb-backend:latest
  └── Build bkb-frontend image → ghcr.io/afiqhaiqalyusri/bkb-frontend:latest
       │
  Job 3: Deploy to VPS
  ├── SSH into VPS
  ├── Sync config files
  ├── Write .env from GitHub Secrets
  ├── setup-postgres.sh
  ├── docker login ghcr.io
  ├── docker compose pull (download pre-built images)
  ├── docker compose up -d
  ├── Wait for /actuator/health → UP
  └── Reload nginx
```

**Stack:**
- **VPS:** Ubuntu 24.04 LTS
- **Domain:** `fyp.afiqhaiqal.my`
- **Backend:** Spring Boot (Docker, port 8081)
- **Frontend:** React/Vite served by Nginx (Docker, port 5173)
- **Database:** PostgreSQL on VPS host (not in Docker)
- **Reverse proxy:** Nginx on VPS host (ports 80/443)
- **Image registry:** GitHub Container Registry (ghcr.io)

---

## One-time VPS Setup

### Step 1 — Initial server setup

SSH into your VPS and run the setup script once:

```bash
ssh your-user@your-vps-ip

sudo apt-get install -y git
git clone https://github.com/afiqhaiqalyusri/bkb.git ~/bkb
sudo bash ~/bkb/scripts/server-setup.sh
```

Installs: UFW firewall, Fail2Ban, Docker, Docker Compose, SSH hardening.

> ⚠️ **IMPORTANT:** Ensure your SSH public key is in `~/.ssh/authorized_keys` before running — it disables password auth!

### Step 2 — SSL Certificate + Nginx

```bash
sudo bash ~/bkb/scripts/ssl-setup.sh fyp.afiqhaiqal.my
```

Installs Nginx, obtains Let's Encrypt SSL certificate, deploys full HTTPS config.

### Step 3 — Log in to GHCR on VPS

The VPS needs to authenticate with GitHub Container Registry to pull private images.

```bash
# On your VPS
docker login ghcr.io -u afiqhaiqalyusri --password YOUR_GHCR_TOKEN
```

*(You'll create `YOUR_GHCR_TOKEN` in the next step)*

---

## GitHub Setup

### Step 4 — Create a GHCR Token (Personal Access Token)

1. Go to: **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Click **"Generate new token (classic)"**
3. Name it: `bkb-vps-pull`
4. Select scope: ✅ **`read:packages`** (only — nothing else needed)
5. Click **Generate token** → **copy it immediately** (shown only once)

### Step 5 — Set GitHub Secrets

Go to: **`https://github.com/afiqhaiqalyusri/bkb/settings/secrets/actions`**

Add all of these:

| Secret Name | Value |
|---|---|
| `VPS_SSH_PRIVATE_KEY` | Your VPS private SSH key (PEM format) |
| `VPS_HOST` | VPS IP address or hostname |
| `VPS_USER` | SSH username |
| `GHCR_TOKEN` | The token you created in Step 4 |
| `DATABASE_URL` | `jdbc:postgresql://host.docker.internal:5432/bkb` |
| `DB_USER` | PostgreSQL username (e.g. `bkb_user`) |
| `DB_PASSWORD` | Strong database password |
| `JWT_SECRET` | Run: `openssl rand -hex 64` |
| `JWT_REFRESH_SECRET` | Run: `openssl rand -hex 64` (must be different) |
| `MAIL_USERNAME` | Gmail address |
| `MAIL_PASSWORD` | Gmail App Password — https://myaccount.google.com/apppasswords |

> 💡 Generate JWT secrets:
> ```bash
> openssl rand -hex 64
> ```

### Step 6 — Make GHCR Packages Visible (Optional but Recommended)

After the first deploy, your Docker images will appear at:
`https://github.com/afiqhaiqalyusri?tab=packages`

To make them public (so VPS can pull without a token):
1. Click on the package → **Package settings**
2. Change visibility to **Public**

If public, you can remove `GHCR_TOKEN` from secrets and the `docker login` step.

---

## First Deploy

Push to `main` to trigger the pipeline:

```bash
git push origin main
```

Watch it run at: `https://github.com/afiqhaiqalyusri/bkb/actions`

---

## Verify Deployment

```bash
# SSH into VPS
ssh your-user@your-vps-ip

# Check containers are running
docker ps

# Backend health (direct)
curl http://localhost:8081/actuator/health

# Backend health (via nginx + HTTPS)
curl https://fyp.afiqhaiqal.my/api/actuator/health

# View logs
docker compose -f ~/bkb/docker-compose.prod.yml logs -f backend
docker compose -f ~/bkb/docker-compose.prod.yml logs -f frontend
```

---

## Useful Commands on VPS

```bash
# Update to latest images (after a deploy)
cd ~/bkb
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Restart containers
docker compose -f ~/bkb/docker-compose.prod.yml restart

# Stop everything
docker compose -f ~/bkb/docker-compose.prod.yml down

# View all images
docker images | grep ghcr.io

# Clean up old images
docker image prune -f

# Check PostgreSQL
pg_isready -h 127.0.0.1 -p 5432
sudo systemctl status postgresql

# Check nginx
sudo nginx -t
sudo systemctl status nginx

# Renew SSL (runs auto via cron, but manual if needed)
sudo certbot renew
```

---

## Troubleshooting

### Backend won't start
```bash
docker compose -f ~/bkb/docker-compose.prod.yml logs --tail=100 backend
```
Common causes:
- Missing `.env` values → check `~/bkb/.env`
- PostgreSQL not running → `pg_isready -h 127.0.0.1 -p 5432`
- JWT secret missing → check `JWT_SECRET` in GitHub Secrets

### VPS can't pull images from GHCR
```bash
docker login ghcr.io -u afiqhaiqalyusri --password YOUR_GHCR_TOKEN
```
Check that `GHCR_TOKEN` secret is set and has `read:packages` scope.

### PostgreSQL connection refused from Docker
```bash
# Re-run the setup script (safe — idempotent)
bash ~/bkb/scripts/setup-postgres.sh
```

### Site not loading after deploy
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Architecture

```
Internet (port 80/443)
   │
Nginx (VPS host)
   ├── /          → 127.0.0.1:5173  (Docker: bkb_frontend)
   ├── /api/      → 127.0.0.1:8081  (Docker: bkb_backend)
   └── /api/actuator/health → 127.0.0.1:8081

Docker containers (pull from GHCR)
   ├── bkb_backend   ghcr.io/afiqhaiqalyusri/bkb-backend:SHA
   └── bkb_frontend  ghcr.io/afiqhaiqalyusri/bkb-frontend:SHA

PostgreSQL
   └── Running on VPS host (:5432)
       Containers connect via host.docker.internal
```
