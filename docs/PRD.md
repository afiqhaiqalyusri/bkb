# Product Requirements Document (PRD) — Bukan Kedai Burger (BKB)

## Document Control
| Version | Date | Author | Description |
|---|---|---|---|
| v1.0.0 | 2026-06-14 | Antigravity AI | Initial production-grade release based on codebase analysis. |

---

## 1. Executive Summary

### 1.1 Project Name
**Bukan Kedai Burger (BKB)** (translates to "Not a Burger Shop").

### 1.2 Project Description
Bukan Kedai Burger (BKB) is a full-stack food ordering, real-time kitchen tracking, and store management system. The platform allows guest and registered customers to view menus, customize burger ingredients, place orders, and play an interactive mini-game while waiting. It also supplies a robust administrative back-office for kitchen staff to track and advance order states, managers to audit sales and inventory, and administrators to govern system roles and security.

### 1.3 Business Purpose
The primary business purpose of BKB is to digitize ordering operations, automate inventory tracking, incentivize repeat orders via a gamified loyalty program, and ensure regulatory health compliance tracking for staff members.

### 1.4 Problem Statement
Traditional burger joints suffer from operational inefficiencies, including:
* Manual order intake leading to preparation errors.
* Lack of real-time preparation tracking, causing customer anxiety during wait times.
* Difficulty in monitoring ingredient levels dynamically, causing "out-of-stock" order placements.
* Inability to run audit trails on cash override payments, leading to financial leaks.
* Complexities in manually tracking health requirements (typhoid vaccination and food handler certificate expirations) for food service personnel.

### 1.5 Proposed Solution
The BKB system resolves these issues via a unified platform comprising:
* A modern React-based frontend for customers and staff.
* A secure Spring Boot backend API with role-based JWT authentication.
* An automated inventory status tracking trigger.
* A live order-tracking pipeline with a integrated mini-game.
* Full security audit logs for critical operations.

---

## 2. Product Vision

### 2.1 Vision Statement
To establish a seamless, automated, and engaging quick-service food platform where operational transparency, customer engagement, and kitchen efficiency coexist.

### 2.2 Mission Statement
Deliver an intuitive, robust digital ordering and administrative toolset that eliminates waste, gamifies customer loyalty, and keeps compliance and security at the center of food service operations.

### 2.3 Product Goals
* **Operational Accuracy**: Reduce food customization errors to zero by defining clear ingredient levels in order configurations.
* **Customer Retention**: Increase engagement through the "Burger Stack" game and point redemption system.
* **Proactive Inventory Control**: Alert managers immediately when stock enters low or critical status via visual dashboards.
* **Compliance Safeguarding**: Prevent non-compliant staff scheduling by tracking typhoid and food handler certifications.

---

## 3. Stakeholders
Based on the codebase roles (`user_role` enum and security mappings), the system defines the following stakeholders:

* **End Users (Customers / Guests)**: Place orders, customize food, view tracking pages, play mini-games, and redeem loyalty points.
* **Staff (Kitchen / Counter)**: Accept, grill, assemble, and complete orders. Toggle menu item and ingredient outages. Adjust stock and record waste logs.
* **Managers**: Add/edit categories, menu items, and customization rules. Manage loyalty rewards. Add new staff, edit documents, and analyze daily/monthly sales reports.
* **Administrators (System Owners)**: Manage user status, delete/modify accounts, manually override loyalty points, and review system security logs.

---

## 4. User Personas
Generated based on the actual roles and operational functions discovered within the code.

```
+------------------------------------+------------------------------------+
| CUSTOMER / GUEST                   | KITCHEN STAFF                      |
| "Ahmad, 24, University Student"     | "Siti, 29, Line Cook"              |
| - Goal: Order food fast, customize | - Goal: Prep orders without errors |
|   burgers, earn rewards.           |   and manage ingredient outages.   |
| - Pain: Long queues, boring waits. | - Pain: Inaccurate tickets, running|
| - Journey: Browser -> Customize ->  |   out of ingredients mid-rush.     |
|   Order -> Play Stack Game -> Eat. | - Journey: Dashboard -> Prepare ->  |
|                                    |   Pack -> Update Status -> Done.   |
+------------------------------------+------------------------------------+
| BUSINESS MANAGER                   | SYSTEM ADMIN                       |
| "Ravi, 35, Store Manager"          | "Sarah, 31, Technical Admin"       |
| - Goal: Track inventory levels,    | - Goal: Maintain data security,    |
|   compliance, and export reports.  |   oversee audit trails, resolve accounts|
| - Pain: Expired typhoid certs,     | - Pain: Security breaches, manual  |
|   unknown stock wastage.           |   data override tracking.          |
| - Journey: Reports -> Inventory -> | - Journey: Security Logs -> User   |
|   Add Staff -> Audit Docs -> Out.  |   Admin -> Points Override -> Done.|
+------------------------------------+------------------------------------+
```

---

## 5. Functional Requirements

### 5.1 System Control & Configuration
#### Feature: Store Operations Toggle
* **Description**: Allows managers and administrators to open or close the store for ordering.
* **User Story**: As a Manager, I want to toggle the store status to closed during holidays so customers cannot place orders.
* **Acceptance Criteria**:
  * Toggling the status logs the change in `security_logs`.
  * If the store is closed, any call to `/api/orders` throws a `BkbException` ("Store is closed").
* **Business Rules**: Defaults to open (`isStoreOpen = true`). Requires `MANAGER` or `ADMIN` roles.
* **Dependencies**: `OrderController`, `SecurityLogService`.

### 5.2 Menu & Customization
#### Feature: Menu Item Ingredients Customization
* **Description**: Allows customers to select ingredient levels when ordering a menu item.
* **User Story**: As a Customer, I want to set ingredient levels (e.g., "NO cheese", "EXTRA sauce") so my burger is prepared to my liking.
* **Acceptance Criteria**:
  * Levels must be configured per ingredient: `NONE`, `LESS`, `MEDIUM`, or `EXTRA`.
  * Customizations are saved in `order_items` as a JSONB array.
* **Business Rules**: Validated levels map to the `IngredientLevel` enum.
* **Dependencies**: `MenuItemIngredient`, `OrderItem`.

#### Feature: Ingredient Outage Management
* **Description**: Allows staff to temporarily flag specific ingredients as out-of-stock.
* **User Story**: As a Staff member, I want to mark "Tomatoes" as out-of-stock so customers are aware when ordering.
* **Acceptance Criteria**:
  * Out-of-stock status is updated instantly.
  * System lists current out-of-stock ingredients.
* **Business Rules**: Toggle is restricted to `STAFF` role or higher.
* **Dependencies**: `IngredientOutageController`, `IngredientOutageRepository`.

### 5.3 Ordering & Tracking
#### Feature: Guest & Customer Checkout
* **Description**: Supports checkout for logged-in customers as well as non-registered guests.
* **User Story**: As a Guest, I want to place an order by providing my name and phone number without registering an account.
* **Acceptance Criteria**:
  * Guest orders must include `guest_name` and `guest_phone`.
  * Registered users have orders linked via `user_id`.
* **Business Rules**: If the store is closed, checkout fails.
* **Dependencies**: `OrderService`, `OrderController`.

#### Feature: Burger Stack Mini-Game
* **Description**: An interactive mini-game embedded on the order tracking page that awards points based on score.
* **User Story**: As a Customer, I want to play a game while waiting for my order so I can earn bonus loyalty points.
* **Acceptance Criteria**:
  * Customers earn 1 point per 100 score points, capped at 20 points per order session.
  * Score submissions are de-duplicated via in-memory session keys (`userId:orderId`).
  * Only logged-in customers can claim points.
* **Business Rules**: Max points: 20. Score conversion: `score / 100`. Double submissions for the same order session return a warning.
* **Dependencies**: `GameController`, `LoyaltyService`, `OrderRepository`.

### 5.4 Payments
#### Feature: Counter Cash Payments
* **Description**: Orders can be paid with cash at the counter, with preparation commencing immediately or upon confirmation.
* **User Story**: As a Staff member, I want to mark a cash order as paid when the customer hands me the money.
* **Acceptance Criteria**:
  * Staff changes order payment status to `PAID` via counter confirmation.
  * Overrides are captured in the security logs.
* **Business Rules**: Restricted to `STAFF` role or higher.
* **Dependencies**: `PaymentService`, `PaymentController`, `SecurityLogService`.

#### Feature: Online FPX Payments (Simulated / Future Integration)
* **Description**: Customers pay online via simulated FPX callbacks. ToyyibPay integration serves as a future roadmap milestone.
* **User Story**: As a Customer, I want to choose online payment during checkout so I can pay securely before picking up my food.
* **Acceptance Criteria**:
  * Order generates a secure access token `payment_token` and `payment_channel`.
  * Order details lookup via reference URL requires the token if payment is `ONLINE` to prevent unauthorized access.
  * Payment simulation endpoints (`/simulate-success`, `/simulate-failure`) verify state transitions.
* **Business Rules**:
  * **Assumption - Requires Stakeholder Confirmation**: Production integration with ToyyibPay FPX API (including checksum calculations and redirection routines) is scaffolded but not yet functional; it is targeted for the Phase 2 launch.
* **Dependencies**: `PaymentService`, `OrderController`.

### 5.5 Loyalty Program
#### Feature: Loyalty Points & Rewards Redemption
* **Description**: Earn points on purchases and redeem them for menu items.
* **User Story**: As a Customer, I want to redeem my accumulated points for a free side dish.
* **Acceptance Criteria**:
  * Earning rate: 1 point per RM10 spent (configured via `rm-per-point: 10` property).
  * Redemptions check point balance and deduct the designated `points_cost`.
  * Active rewards can be managed by managers.
* **Business Rules**: Points balance cannot drop below zero. Manual point adjustments are restricted strictly to `ADMIN` roles.
* **Dependencies**: `LoyaltyController`, `LoyaltyService`, `LoyaltyAccount`.

### 5.6 Inventory & Waste
#### Feature: Automatic Threshold Status Alerts
* **Description**: Evaluates and updates inventory status dynamically based on min/max parameters.
* **User Story**: As a Manager, I want inventory items to automatically update their status so I know what needs restocking.
* **Acceptance Criteria**:
  * Trigger runs on inserts or updates of `inventory`.
  * If `current_stock <= min_stock * 0.5`, status is marked `CRITICAL`.
  * If `current_stock <= min_stock`, status is marked `LOW`.
  * Otherwise, status is marked `GOOD`.
* **Business Rules**: Handled in PostgreSQL trigger `trg_inventory_status` executing function `update_inventory_status()`.
* **Dependencies**: Database level trigger, `InventoryService`.

#### Feature: Waste Log Tracking
* **Description**: Staff logs wasted ingredients with quantities and reasons.
* **User Story**: As a Staff member, I want to log spoiled buns as waste so the inventory balances match actual stock.
* **Acceptance Criteria**:
  * Waste logs record inventory ID, type `WASTE`, quantity, reason, and logger name.
* **Business Rules**: Requires `STAFF` role or higher.
* **Dependencies**: `InventoryController`, `InventoryService`, `InventoryTransaction`.

### 5.7 Staff Compliance & Security
#### Feature: Medical & Food Handler Document Tracking
* **Description**: Tracks typhoid vaccination and food handler certificate expiration dates for staff.
* **User Story**: As a Manager, I want to enter typhoid vaccination expiry dates for staff so I can ensure regulatory compliance.
* **Acceptance Criteria**:
  * Expiry dates are editable by managers and admins.
  * Tracks IC number, typhoid expiration, food handler certificate expiration, emergency contact name/phone, and notes.
* **Business Rules**: Unique document record per staff member.
* **Dependencies**: `StaffController`, `StaffService`, `StaffDocument`.

#### Feature: Security Logs Audit
* **Description**: Records system-wide overrides and sensitive actions.
* **User Story**: As an Administrator, I want to review security logs so I can detect potential internal abuse.
* **Acceptance Criteria**:
  * Logs actions, details, IP addresses, previous values, new values, user roles, and emails.
  * Restricts log inspection to administrators.
* **Business Rules**: Pageable audit trails. IPs resolved from `X-Forwarded-For` or request origin.
* **Dependencies**: `StaffController` (`/api/staff/security-logs`), `SecurityLogRepository`, `SecurityLogService`.

---

## 6. Non-Functional Requirements

### 6.1 Performance
* **API Response Time**: Key operations (menu load, order placement) must respond under 200ms under standard loads.
* **Database Pool Efficiency**: Configured Hikari Connection Pool limit is 20, ensuring efficient query concurrency.

### 6.2 Security
* **Access Tokens**: Short-lived JWT access tokens (15 minutes expiry) and long-lived refresh tokens (7 days expiry) are used.
* **Token Blacklisting**: Logouts invalidate active tokens by adding them to the `invalidated_tokens` blacklist table.
* **Password Hashing**: BCrypt encryption using work factor strength of 12.
* **Route Protection**: Strictly maps role access levels (GUEST, CUSTOMER, STAFF, MANAGER, ADMIN) using method-level security (`@PreAuthorize`).

### 6.3 Reliability
* **Database Migrations**: Managed via Flyway, ensuring schema migrations run sequentially during app booting.
* **Container Failover**: Docker compose configurations specify `restart: unless-stopped` to handle container crashes automatically.

### 6.4 Scalability
* **Stateless Operations**: Stateless REST APIs allow horizontal backend scaling behind a reverse proxy (Nginx).
* **Database Constraints**: Clean separation of transactional tables (orders, order_items) and logging/audit tables (security_logs, inventory_transactions).

### 6.5 Availability
* **Health Checks**: Uses Spring Boot Actuator `/actuator/health` to feed Docker healthchecks for container monitoring.

### 6.6 Maintainability
* **Separation of Concerns**: Traditional controller-service-repository patterns in Java Spring Boot.
* **TypeScript Typing**: Strict type checks across the Vite React app configuration.

---

## 7. Success Metrics

### 7.1 Key Performance Indicators (KPIs)
* **Average Ticket Prep Time**: Duration from PENDING to READY (tracked via status logs). Target: < 15 minutes.
* **Inventory Accuracy**: Discrepancy margin between physical audits and recorded stock counts. Target: < 1%.

### 7.2 User Metrics
* **Mini-Game Engagement**: Percentage of customers playing the Burger Stack game while waiting. Target: > 40%.
* **Loyalty Redemption Rate**: Percentage of points earned that are redeemed for free menu items. Target: > 25%.

### 7.3 System Metrics
* **Error Rate**: Ratio of HTTP 5xx responses compared to total API requests. Target: < 0.1%.
* **Audit Coverage**: 100% of payment override and store operations actions must appear in `security_logs`.

---

## 8. Product Roadmap

### 8.1 Current Version (v1.0.0)
* Core ordering pipeline for guests and registered customers.
* Real-time kitchen staff dashboard.
* Ingredient outage switches.
* Inventory tracking triggers and waste logs.
* Loyalty earning, point redemption, and Burger Stack mini-game.
* Staff compliance tracking (Typhoid & Food Handler certificates).
* Administrator security logs dashboard.

### 8.2 Future Enhancements (Phase 2)
* **Real ToyyibPay FPX API Integration**: Replace online payment stubs with actual ToyyibPay callbacks and signature validation logic.
* **Push Notifications**: Integrate SMS or web push notifications when orders enter the `READY` pickup state.
* **Advanced Analytics**: Interactive visual charts representing category-based sales trends and stock forecast maps.

### 8.3 Technical Debt
* **In-Memory Game Dedup**: The current `claimedSessions` set is stored in-memory in `GameController`. If the backend is restarted or scaled to multiple instances, customers can farm points. Needs migration to PostgreSQL or Redis.
* **Hardcoded Tax Rate**: Tax is configured inside `application.yml` (`tax.rate: 0.06`). Needs migration to a database configurations table so changes can be made without rebuilds.

---

## 9. Glossary
* **BKB**: Bukan Kedai Burger, the name of the system.
* **FPX**: Financial Process Exchange, the Malaysian online payment gateway system.
* **SST**: Sales and Services Tax (currently configured at 6% in the system).
* **JWT**: JSON Web Token, used for stateless authentication.
* **Flyway**: Database migration engine used to manage schemas incrementally.

---

## 10. Assumptions
* **Assumption - Requires Stakeholder Confirmation**: It is assumed that the 6% tax rate (SST) remains fixed for the immediate future. If regulatory rates change, it requires an environment variable or config update.
* **Assumption - Requires Stakeholder Confirmation**: It is assumed that the local system time zone "Asia/Kuala_Lumpur" is preferred for all audit trail stamps and report exports.
