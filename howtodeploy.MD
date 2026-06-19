# BKB — Deployment Guide

This guide walks you through deploying BKB from scratch: fresh VPS → SSL → PostgreSQL → Docker → GitHub Actions CI/CD.

**Stack:**
- **VPS:** Ubuntu 24.04 LTS
- **Domain:** `fyp.afiqhaiqal.my`
- **Backend:** Spring Boot (Docker container, port 8081)
- **Frontend:** React/Vite served by Nginx (Docker container, port 5173)
- **Database:** PostgreSQL on the VPS host (not in Docker)
- **Reverse proxy:** Nginx on VPS host (ports 80/443)
- **CI/CD:** GitHub Actions → SSH → Docker Compose

---

## Prerequisites

Before starting, you need:
- A VPS running Ubuntu 24.04 with a public IP
- A domain name (`fyp.afiqhaiqal.my`) with a DNS `A` record pointing to that IP
- SSH access to the VPS as a non-root user with `sudo`
- Your SSH public key added to the VPS (`~/.ssh/authorized_keys`)

---

## Step 1 — Initial Server Setup

SSH into your VPS and run the setup script once:

```bash
ssh your-user@your-vps-ip

# Clone the repo (or the script will already be there if you rsync'd)
# If starting from scratch:
sudo apt-get install -y git
git clone https://github.com/afiqhaiqalyusri/bkb.git ~/bkb
cd ~/bkb

sudo bash scripts/server-setup.sh
```

This installs:
- UFW firewall (allows only SSH/HTTP/HTTPS)
- Fail2Ban (brute-force protection)
- Docker + Docker Compose plugin
- SSH hardening (disables root login and password auth)

> ⚠️ **IMPORTANT:** Make sure your SSH public key is in `~/.ssh/authorized_keys` before this script runs — it will disable password auth!

---

## Step 2 — SSL Certificate + Nginx

```bash
sudo bash ~/bkb/scripts/ssl-setup.sh fyp.afiqhaiqal.my
```

This installs Nginx, obtains a Let's Encrypt SSL certificate, and deploys the full HTTPS configuration.

---

## Step 3 — Set GitHub Secrets

Go to: **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

Add all of the following:

| Secret Name | How to get the value |
|---|---|
| `VPS_SSH_PRIVATE_KEY` | Your private SSH key (the one that matches your `authorized_keys`) |
| `VPS_HOST` | Your VPS IP address or hostname |
| `VPS_USER` | Your SSH username |
| `DATABASE_URL` | `jdbc:postgresql://host.docker.internal:5432/bkb` |
| `DB_USER` | Choose a username, e.g. `bkb_user` |
| `DB_PASSWORD` | A strong password |
| `JWT_SECRET` | Run: `openssl rand -hex 64` |
| `JWT_REFRESH_SECRET` | Run: `openssl rand -hex 64` (different value) |
| `MAIL_USERNAME` | Your Gmail address |
| `MAIL_PASSWORD` | Gmail App Password — generate at https://myaccount.google.com/apppasswords |

> 💡 **Generate JWT secrets on your local machine or any Linux/Mac terminal:**
> ```bash
> openssl rand -hex 64
> ```

---

## Step 4 — First Deploy

Push to the `main` branch (or trigger manually):

```bash
git add -A
git commit -m "chore: initial deployment setup"
git push origin main
```

GitHub Actions will:
1. Build and test the backend (Maven)
2. Build the frontend (npm)
3. SSH into your VPS and rsync the project files
4. Write the `.env` file securely on the VPS
5. Run `setup-postgres.sh` (creates DB user and database)
6. Run `docker compose -f docker-compose.prod.yml up -d --build`
7. Wait for the backend health check to pass
8. Reload nginx

---

## Step 5 — Verify Deployment

After the GitHub Action completes:

```bash
# SSH into VPS
ssh your-user@your-vps-ip

# Check containers are running
docker ps

# Check backend health
curl http://localhost:8081/actuator/health

# Check via nginx (HTTPS)
curl https://fyp.afiqhaiqal.my/api/actuator/health

# View logs
docker compose -f ~/bkb/docker-compose.prod.yml logs -f backend
docker compose -f ~/bkb/docker-compose.prod.yml logs -f frontend
```

---

## Useful Commands (on VPS)

```bash
# Restart all containers
cd ~/bkb
docker compose -f docker-compose.prod.yml restart

# Stop everything
docker compose -f docker-compose.prod.yml down

# Rebuild and restart (after changes)
docker compose -f docker-compose.prod.yml up -d --build

# View backend logs (last 100 lines)
docker compose -f docker-compose.prod.yml logs --tail=100 backend

# View all running containers
docker ps

# Check PostgreSQL
sudo systemctl status postgresql
pg_isready -h 127.0.0.1 -p 5432

# Check nginx
sudo systemctl status nginx
sudo nginx -t

# Renew SSL manually (runs automatically via cron)
sudo certbot renew
```

---

## Troubleshooting

### Backend won't start
```bash
docker compose -f ~/bkb/docker-compose.prod.yml logs --tail=100 backend
```
Common causes:
- Missing or wrong `.env` values → check `~/bkb/.env`
- PostgreSQL not reachable → run `pg_isready -h 127.0.0.1 -p 5432`
- JWT secret missing → check `JWT_SECRET` in GitHub Secrets

### Can't reach the site
```bash
sudo systemctl status nginx
sudo nginx -t
```

### PostgreSQL connection refused from Docker
```bash
# Confirm Docker bridge IPs are in pg_hba.conf
sudo grep 172 /etc/postgresql/*/main/pg_hba.conf

# Re-run the setup script (safe — it's idempotent)
bash ~/bkb/scripts/setup-postgres.sh
```

### SSL certificate expired
```bash
sudo certbot renew --dry-run   # Test first
sudo certbot renew             # Actually renew
```

---

## Architecture

```
Internet
   │
   ▼
Nginx (VPS host — ports 80/443)
   ├── /          → Docker bkb_frontend (:5173)  [React SPA]
   ├── /api/      → Docker bkb_backend  (:8081)  [Spring Boot]
   └── /actuator/health → Docker bkb_backend (:8081)

Docker Compose (docker-compose.prod.yml)
   ├── bkb_backend   (Spring Boot, port 8081 — localhost only)
   └── bkb_frontend  (Nginx SPA,  port 5173 — localhost only)

PostgreSQL
   └── Running on VPS host (:5432)
       Containers connect via host.docker.internal
```
