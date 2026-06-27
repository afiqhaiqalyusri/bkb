# Walkthrough: BKB System Documentation Suite

All documentation files for the Bukan Kedai Burger (BKB) system are saved in this directory and reflect the actual implemented codebase.

## Project Overview

| Item | Detail |
|---|---|
| **System** | Bukan Kedai Burger — Food Ordering & Store Management System |
| **Live URL** | https://fyp.afiqhaiqal.my |
| **Backend** | Java 17 + Spring Boot 3.2.x (REST API) |
| **Frontend** | React 18 + TypeScript + Tailwind CSS 4.x + Vite 5.x (SPA) |
| **Database** | PostgreSQL 16 (Flyway migrations) |
| **Auth** | JWT — dual-token (access 15 min + refresh 7 days) with blacklist |
| **Payment** | ToyyibPay FPX — **fully implemented** (create bill, callback, spoofing detection) |
| **Deployment** | VPS Ubuntu 24.04 LTS + Docker + Nginx + GHCR + GitHub Actions CI/CD |

---

## Documentation Files

### 1. Requirements & Management Documents

- **[PRD.md](file:///c:/Users/yusri/.gemini/antigravity/scratch/bkb/docs/PRD.md)** — Product Requirements Document outlining the core value proposition, stakeholder personas, feature definitions (store status, mini-game, loyalty, promotions), and future roadmap items.
- **[SPMP.md](file:///c:/Users/yusri/.gemini/antigravity/scratch/bkb/docs/SPMP.md)** — Software Project Management Plan (IEEE 1058) mapping development phases, resources, configuration management, and deployment environments.
- **[SRS.md](file:///c:/Users/yusri/.gemini/antigravity/scratch/bkb/docs/SRS.md)** — Software Requirements Specification (IEEE 830) covering all functional requirements (FR-U, FR-MN, FR-O, FR-P, FR-I, FR-R, FR-L, FR-PR), non-functional requirements, and interface descriptions.

### 2. Architecture & Design Documents

- **[SDD.md](file:///c:/Users/yusri/.gemini/antigravity/scratch/bkb/docs/SDD.md)** — Software Design Document (IEEE 1016) covering the decoupled REST API + SPA architecture, backend service designs, frontend routing and state management, JWT security flows, and component dependency schemas.
- **[DATABASE.md](file:///c:/Users/yusri/.gemini/antigravity/scratch/bkb/docs/DATABASE.md)** — Complete database documentation: entity relationship model, all table definitions (22 tables), the `update_inventory_status` PostgreSQL trigger, and Flyway migration log.
- **[API.md](file:///c:/Users/yusri/.gemini/antigravity/scratch/bkb/docs/API.md)** — OpenAPI-style endpoint reference covering all controllers (`/api/auth`, `/api/menu`, `/api/orders`, `/api/payments`, `/api/inventory`, `/api/reports`, `/api/loyalty`, `/api/game`, `/api/promotions`, `/api/staff`, `/api/settings`), with auth requirements, path variables, request bodies, and response shapes.

### 3. Deployment & Validation Plans

- **[DEPLOYMENT.md](file:///c:/Users/yusri/.gemini/antigravity/scratch/bkb/docs/DEPLOYMENT.md)** — Full deployment guide: GitHub Actions CI/CD pipeline (build → GHCR push → VPS SSH deploy), one-time VPS setup (UFW, Fail2Ban, Docker, Nginx), Let's Encrypt SSL, PostgreSQL host setup, daily backup container, and troubleshooting commands.
- **[TESTPLAN.md](file:///c:/Users/yusri/.gemini/antigravity/scratch/bkb/docs/TESTPLAN.md)** — QA framework covering unit, integration, system, and user acceptance testing (UAT) with concrete test case maps for all core features.

---

## Key Technical Facts (Corrected)

| Topic | Actual Implementation |
|---|---|
| **ToyyibPay** | Fully implemented — `ToyyibPayService.createBill()`, `verifyPayment()` callback handler, secondary `getBillTransactions` verification, spoofing detection logged to `security_logs` |
| **Deployment** | VPS (Ubuntu 24.04) + Docker Compose + Nginx reverse proxy + Let's Encrypt SSL + GHCR image registry + GitHub Actions 3-job CI/CD pipeline |
| **Database** | PostgreSQL 16 (not MySQL) — managed by Flyway, runs on VPS host |
| **Frontend** | React 18 SPA with TypeScript + Tailwind CSS (not Thymeleaf/plain HTML) |
| **Role hierarchy** | `ADMIN > MANAGER > STAFF > CUSTOMER > GUEST` — enforced via Spring Security `@PreAuthorize` |
| **Inventory deduction** | Recipe-linked, customisation-aware, pessimistic-locked (`SELECT FOR UPDATE`), publishes `InventoryDepletedEvent` on zero stock |
| **JWT invalidation** | Blacklist table `invalidated_tokens` + `SessionCleanupScheduler` runs periodically to purge expired entries |
| **Mini-game** | Burger Stack game — awards up to 20 bonus loyalty points per order session; dedup via in-memory `ConcurrentHashMap` |
| **Promotions** | `Promotion` entity with `DiscountType` (PERCENTAGE / FIXED), validated at checkout via `/api/promotions/validate` |
| **Email** | Spring Boot Mail (Gmail SMTP) — OTP verification, password reset link, order receipt |
