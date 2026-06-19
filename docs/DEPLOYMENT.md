# Production Deployment & Operations Guide — BKB System

## Document Control
| Version | Date | Author | Description |
|---|---|---|---|
| v1.0.0 | 2026-06-14 | Antigravity AI | Initial production deployment baseline. |

---

## 1. Production Deployment Guides

Deploying the BKB system can be accomplished via two methods on an **Ubuntu 24.04 LTS** virtual private server (VPS).

### Method A: Docker Compose Deployment (Recommended)
This approach encapsulates both application layers into isolated Docker containers while connecting directly to a host-level PostgreSQL database.

#### Step 1: Install Docker Runtime
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

#### Step 2: Clone repository & Configure `.env`
Clone files into `/var/www/bkb`:
```bash
git clone <repository_url> /var/www/bkb
cd /var/www/bkb
cp .env.example .env
nano .env
```
Ensure correct environment parameters are configured.

#### Step 3: Run Containers
```bash
docker compose up -d --build
```

---

### Method B: Native Systemd & Nginx Deployment (No Docker)
Compiles Java to a local Jar file and hosts React via static build assets on the web server.

#### Step 1: Install Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y openjdk-17-jdk openjdk-17-jre nodejs npm nginx git
```

#### Step 2: Compile & Run Java Backend
```bash
cd /var/www/bkb/backend
./mvnw clean package -DskipTests
```
Create service file `/etc/systemd/system/bkb-backend.service`:
```ini
[Unit]
Description=BKB Spring Boot Backend Service
After=syslog.target network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/var/www/bkb/backend
EnvironmentFile=/var/www/bkb/backend/.env
ExecStart=/usr/bin/java -jar /var/www/bkb/backend/target/bkb-backend-1.0.0.jar
SuccessExitStatus=143
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```
Start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable bkb-backend
sudo systemctl start bkb-backend
```

#### Step 3: Build & Host React Assets
```bash
cd /var/www/bkb/frontend
npm install --legacy-peer-deps
VITE_API_BASE_URL=https://yourdomain.com npm run build
```
Copy build folder files to `/var/www/bkb/frontend/dist` and point Nginx root directive to it.

---

## 2. Environment Variables Reference

Configure these parameters inside your production environment file (`.env`):

| Variable Name | Purpose | Example Value | Severity |
|---|---|---|---|
| `DATABASE_URL` | JDBC target connection string | `jdbc:postgresql://localhost:5432/bkb` | Critical |
| `DB_USER` | DB owner username | `bkb_user` | Critical |
| `DB_PASSWORD` | Secure database password | `SuperSecurePassword2026!` | Critical |
| `JWT_SECRET` | 256-bit access signing token | `long_secure_jwt_random_string...` | Critical |
| `JWT_REFRESH_SECRET` | 256-bit refresh signing token | `long_secure_refresh_random_string...` | Critical |
| `FRONTEND_URL` | Origin validation parameter | `https://yourdomain.com` | High |
| `CORS_ALLOWED_ORIGINS` | Permitted origins for REST operations | `https://yourdomain.com` | High |
| `VITE_API_BASE_URL` | Target url for frontend client | `https://yourdomain.com` | High |

---

## 3. Database Migration Guide
Spring Boot runs Flyway migrations sequentially upon initialization:
* **Manual baseline check**: If the database was set up manually, baseline flyway first:
  ```bash
  mvn flyway:baseline -Dflyway.user=bkb_user -Dflyway.password=...
  ```
* **Verify migrations status**:
  ```bash
  # Inside backend folder
  ./mvnw spring-boot:run -Dspring-boot.run.arguments="--flyway.clean-on-validation-error=false"
  ```
* **Validation Issues**: If checksum validation errors occur (e.g. migration script edits), fix check values:
  ```bash
  mvn flyway:repair -Dflyway.user=bkb_user -Dflyway.password=...
  ```

---

## 4. Backup Strategy
To prevent data loss, database dump files must be scheduled daily.

### 4.1 Daily PostgreSQL Dump Script
Create `/opt/backup_bkb.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/bkb"
DATE=$(date +%Y-%m-%d_%H%M%S)
DB_NAME="bkb"
USER="bkb_user"

mkdir -p $BACKUP_DIR
pg_dump -U $USER -h localhost -F c -b -v -f "$BACKUP_DIR/bkb_backup_$DATE.dump" $DB_NAME

# Remove backups older than 14 days
find $BACKUP_DIR -type f -name "*.dump" -mtime +14 -delete
```
Make script executable:
```bash
chmod +x /opt/backup_bkb.sh
```

### 4.2 Cron Automation
Add script execution to root cron tab (`sudo crontab -e`):
```cron
0 2 * * * /opt/backup_bkb.sh >> /var/log/bkb_backup.log 2>&1
```

---

## 5. Disaster Recovery Plan

### Scenario 1: Database Corruption / System Crash
1. Stop the application services:
   ```bash
   docker compose down   # or systemctl stop bkb-backend
   ```
2. Re-create the empty database schema:
   ```bash
   dropdb -h localhost -U bkb_user bkb
   createdb -h localhost -U bkb_user bkb
   ```
3. Load the latest valid backup dump:
   ```bash
   pg_restore -h localhost -U bkb_user -d bkb /var/backups/bkb/bkb_backup_latest.dump
   ```
4. Start the application services:
   ```bash
   docker compose up -d
   ```

### Scenario 2: High Connection Timeout Spikes (Pool Exhaustion)
1. Temporarily increase database connections limits inside `postgresql.conf`:
   ```ini
   max_connections = 100
   ```
2. Restart Postgres and clean up stale client threads:
   ```bash
   sudo systemctl restart postgresql
   ```

---

## 6. Monitoring Strategy
* **System Metrics**: Monitor Docker containers via logs:
  ```bash
  docker compose logs -f --tail=100 backend
  ```
* **Application Health**: Query Actuator periodically:
  ```bash
  curl -I http://localhost:8081/actuator/health
  ```
* **System Resource Checks**: Track memory usage via Linux shell commands:
  ```bash
  free -m
  df -h
  ```

---

## 7. Security Hardening Checklist
- [ ] Enforce SSL/TLS by installing Let's Encrypt certificates using Certbot.
- [ ] Disable SSH password logins on the host VPS (use public SSH keys).
- [ ] Close port `5432` from public traffic in VPS firewall rules (only permit internal local bridge IPs).
- [ ] Verify that `JWT_SECRET` and `JWT_REFRESH_SECRET` are not set to default developer keys.
- [ ] Change baseline password credentials for default seeded users (`manager@bkb.com`, `admin@bkb.com`) immediately upon deploy.
- [ ] Set `SPRING_PROFILES_ACTIVE` environment parameter to `prod` to disable trace error responses.
- [ ] Set database connection limits and verify the auto-restart service is enabled.
