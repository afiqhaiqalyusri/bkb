# Walkthrough: BKB System Documentation Suite

All requested documentation files for the Bukan Kedai Burger (BKB) system have been generated and saved to the project docs directory.

## Accomplishments

### 1. Requirements & Management Documents
* **[PRD.md](file:///c:/Users/yusri/.gemini/antigravity/scratch/bkb/docs/PRD.md)**: Product Requirements Document outlining the core value proposition, stakeholder personas, specific feature definitions (store status, mini-game, compliance tracking), and future roadmap items.
* **[SPMP.md](file:///c:/Users/yusri/.gemini/antigravity/scratch/bkb/docs/SPMP.md)**: Software Project Management Plan conforming to IEEE 1058 standards mapping agile sprints, resources, configuration management strategies, and deployment environments.
* **[SRS.md](file:///c:/Users/yusri/.gemini/antigravity/scratch/bkb/docs/SRS.md)**: Software Requirements Specification adhering to IEEE 830 standards outlining architectural perspective, functional logic maps (FR-001 through FR-010), non-functional requirements, and detailed screen interface descriptions.

### 2. Architecture & Design Documents
* **[SDD.md](file:///c:/Users/yusri/.gemini/antigravity/scratch/bkb/docs/SDD.md)**: Software Design Document following IEEE 1016 standards with modular backend service designs, frontend routing state notes, stateless JWT security flows, and component dependency schemas.
* **[DATABASE.md](file:///c:/Users/yusri/.gemini/antigravity/scratch/bkb/docs/DATABASE.md)**: Database documentation listing the complete entity relationship model, triggers (e.g. inventory status alert checker trigger), table definitions, and sequential Flyway migration logs.
* **[API.md](file:///c:/Users/yusri/.gemini/antigravity/scratch/bkb/docs/API.md)**: OpenAPI-style endpoint logs outlining path variables, authorization requirements, sample request payloads, and success response shapes.

### 3. Deployments & Validation Plans
* **[DEPLOYMENT.md](file:///c:/Users/yusri/.gemini/antigravity/scratch/bkb/docs/DEPLOYMENT.md)**: Operations documentation detailing Docker Compose virtual network build tasks, native systemd scripts, SSL setup commands, database backup routines, and recovery rules.
* **[TESTPLAN.md](file:///c:/Users/yusri/.gemini/antigravity/scratch/bkb/docs/TESTPLAN.md)**: QA framework detailing test levels (unit, integration, system, UAT) and concrete test case maps verifying core features.

---

## Technical Alignment Details

* **ToyyibPay FPX Integration**: Properly marked as a *Phase 2 / Future Roadmap* item, since the current codebase provides stubs/callbacks simulation only.
* **Role Hierarchy**: The documentation explicitly maps Spring Security's `ROLE_ADMIN > ROLE_MANAGER > ROLE_STAFF > ROLE_CUSTOMER > ROLE_GUEST` chain.
* **Database Triggers**: The plpgsql function `update_inventory_status` trigger is mapped in detail in the Database and Design documents.
* **JWT Token Invalidation**: Blacklisted token structures (`invalidated_tokens`) and the 10-minute scheduler are fully documented.
