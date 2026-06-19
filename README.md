# 🍔 Bukan Kedai Burger (BKB)

Full-stack food ordering & store management system for Bukan Kedai Burger.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17 + Spring Boot 3.x |
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh tokens) |
| Build | Maven (backend) / Vite (frontend) |

---

## Quick Start (Docker)

```bash
# 1. Clone the repo
git clone <repo-url> && cd bkb

# 2. Set up environment
cp .env.example .env
# Edit .env — set DB_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET

# 3. Start everything
docker compose up --build

# Backend available at:  http://localhost:8081
# Frontend available at: http://localhost:5173
# Swagger UI:            http://localhost:8081/swagger-ui.html
```

---

## Local Development (without Docker)

### Prerequisites
- Java 17+
- Node.js 20+
- PostgreSQL 16 running locally

### Backend

```bash
cd backend

# Copy and configure
cp ../.env.example .env

# Run (dev profile — auto-runs Flyway migrations)
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Frontend

```bash
cd frontend
npm install
cp ../.env.example .env.local
# Set VITE_API_BASE_URL=http://localhost:8081
npm run dev
```

---

## Default Accounts (seeded)

| Role | Email | Password |
|---|---|---|
| Manager | manager@bkb.com | BKBManager2024! |
| Staff | staff@bkb.com | BKBStaff2024! |

---

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

| Variable | Description |
|---|---|
| `DATABASE_URL` | JDBC connection string |
| `DB_USER` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | Access token signing secret (≥256 bits) |
| `JWT_REFRESH_SECRET` | Refresh token signing secret (≥256 bits) |
| `FRONTEND_URL` | Frontend origin for CORS + redirects |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins |
| `VITE_API_BASE_URL` | Backend API base URL (frontend env) |

---

## Project Structure

```
bkb/
├── backend/          Spring Boot Maven project
├── frontend/         React + TypeScript + Tailwind
├── db/               Flyway migrations (embedded in backend resources)
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## API Documentation

Swagger UI is available at `/swagger-ui.html` when the backend is running.

---

## Deployment

- **Backend** → [Railway](https://railway.app) — connect GitHub repo, set env vars
- **Frontend** → [Vercel](https://vercel.com) — connect GitHub repo, set `VITE_API_BASE_URL`
- **Database** → Railway PostgreSQL (connection string auto-injected as `DATABASE_URL`)

---

## Payment Integration (Coming Soon)

ToyyibPay (FPX) integration is scaffolded but not yet active.  
See `PaymentService.java` for `// TODO: ToyyibPay` markers.
