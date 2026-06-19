# Software Testing Documentation (TESTPLAN) — BKB System

## Document Control
| Version | Date | Author | Description |
|---|---|---|---|
| v1.0.0 | 2026-06-14 | Antigravity AI | Initial test strategy and case index. |

---

## 1. Test Strategy

This document defines the testing strategy and contains the test plan for verifying the functional and non-functional requirements of the Bukan Kedai Burger (BKB) system.

### 1.1 Scope
The scope of verification encompasses:
* **Backend REST API**: Validating response payloads, database constraints, input verification, and security middleware filters.
* **Frontend Client**: Verifying page routing, state management, form submissions, and UI validation errors.
* **Database Triggers**: Verifying auto-status calculations for inventory levels.

### 1.2 Test Methodology
The testing framework operates across four distinct abstraction layers:

```
+-------------------------------------------------------------+
|               User Acceptance Testing (UAT)                 |
|   - Manual browser workflows, orders creation, game play     |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                    System Testing                           |
|   - E2E flows, store closed blocks, multi-user simulation   |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                  Integration Testing                        |
|   - API endpoints, security filters, database operations    |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                     Unit Testing                            |
|   - Services logic, repository checks, validation rules     |
+-------------------------------------------------------------+
```

### 1.3 Test Environments & Automation Tools
* **Backend Unit & Integration Tests**: Written in Java 17 using **JUnit 5**, **Mockito** (for mock services), and **Spring Boot Test** configuration templates.
* **Frontend Assertions**: Validated using **Jest** and **React Testing Library** for screen component verification.
* **Manual Testing**: Performed on local dev setups and staging environments.

---

## 2. Test Plan Index & Traceability Matrix

| Requirement ID | Test Case ID | Test Objective | Test Level |
|---|---|---|---|
| **FR-001** | TC-AUTH-01 | Verify successful user registration and JWT token output. | Unit |
| **FR-001** | TC-AUTH-02 | Verify login with incorrect credentials returns HTTP 401. | Integration |
| **FR-005** | TC-GAME-01 | Prevent double score submissions for the same order session. | Unit |
| **FR-007** | TC-LOYL-01 | Validate point deductions when redeeming a loyalty reward. | Unit |
| **FR-008** | TC-INVT-01 | Verify DB trigger updates status from GOOD to CRITICAL on stock cuts. | System |
| **FR-002** | TC-SECU-01 | Ensure role hierarchy blocks non-managers from creating categories. | Integration |
| **FR-004** | TC-STOR-01 | Verify store status closed blocks guest checkouts. | System |
| **FR-006** | TC-PAYM-01 | Verify access token check on secure online payment URLs. | Integration |
| **FR-009** | TC-COMP-01 | Verify typhoid expiration update checks. | UAT |

---

## 3. Test Cases

### 3.1 Unit & Integration Test Cases

#### Test ID: TC-AUTH-01 (User Registration)
* **Test Objective**: Verify that customer registration validates passwords and generates correct JWT outputs.
* **Preconditions**: Target database does not contain email `newuser@test.com`.
* **Steps**:
  1. Call `POST /api/auth/register` with name `"Test User"`, email `"newuser@test.com"`, phone `"0123456"` and password `"ValidPass123!"`.
  2. Verify HTTP response code.
  3. Verify that the response contains `accessToken` and the role is marked `CUSTOMER`.
* **Expected Results**: Returns HTTP 200 OK. Hashed password is saved in DB, and access token is returned.

#### Test ID: TC-AUTH-02 (Invalid Login)
* **Test Objective**: Verify that login attempts with incorrect passwords return authorization errors.
* **Preconditions**: User `manager@bkb.com` exists with password `BKBManager2024!`.
* **Steps**:
  1. Call `POST /api/auth/login` with email `"manager@bkb.com"` and password `"wrong_pass"`.
  2. Verify HTTP response code.
  3. Verify body shows `success` is `false`.
* **Expected Results**: Returns HTTP 401 Unauthorized or HTTP 400 Bad Request with error messages.

#### Test ID: TC-GAME-01 (Double Claim Prevention)
* **Test Objective**: Verify that the backend prevents farming points via repeated calls for the same order.
* **Preconditions**: Customer is authenticated. Order 15 belongs to the customer. No points claimed yet.
* **Steps**:
  1. Post game score for order ID 15: `{ "orderId": 15, "score": 1000 }`.
  2. Verify points are added.
  3. Repeat step 1 with the same token.
  4. Verify the second response.
* **Expected Results**:
  * Step 2 returns `pointsAwarded` as 10.
  * Step 4 returns `pointsAwarded` as 0 with message "Points already claimed for this order session!".

#### Test ID: TC-LOYL-01 (Reward Balance Validation)
* **Test Objective**: Verify that point balances prevent rewards purchase if customer balance is insufficient.
* **Preconditions**: Customer points balance is 50. Reward 2 costs 100 points.
* **Steps**:
  1. Authenticate customer session.
  2. Post reward claim: `POST /api/loyalty/redeem` with body `{ "rewardId": 2 }`.
  3. Verify response status and error messages.
* **Expected Results**: Throws `BkbException` with message "Insufficient points balance" and returns HTTP 400. Point balance remains 50.

#### Test ID: TC-SECU-01 (Role Permissions Guard)
* **Test Objective**: Verify that API routes block access to unauthorized roles.
* **Preconditions**: User has role `CUSTOMER`.
* **Steps**:
  1. Authenticate user session with Customer token.
  2. Send request to `/api/categories` with method `POST` and body `{ "name": "Desserts" }`.
  3. Verify HTTP response code.
* **Expected Results**: Returns HTTP 403 Forbidden. Category is not created.

---

### 3.2 System & UAT Test Cases

#### Test ID: TC-INVT-01 (DB Trigger Thresholds)
* **Test Objective**: Verify that the database trigger automatically flags stock status based on threshold parameters.
* **Preconditions**: Database contains inventory item "Beef Patty" with `min_stock` = 10 and `current_stock` = 20 (Status: GOOD).
* **Steps**:
  1. Execute update statement reducing `current_stock` to 9.
  2. Query item details from DB and verify status.
  3. Execute update statement reducing `current_stock` to 4.
  4. Query item details from DB and verify status.
* **Expected Results**:
  * After Step 1, status is marked `LOW` (since current_stock <= 10).
  * After Step 3, status is marked `CRITICAL` (since current_stock <= 5).

#### Test ID: TC-STOR-01 (Store Status Lockdown)
* **Test Objective**: Verify that checkout requests fail if the store is marked closed.
* **Preconditions**: Store is closed (`isStoreOpen = false`).
* **Steps**:
  1. Send request to `POST /api/orders/create` with valid order details.
  2. Verify HTTP response code.
  3. Verify response contains error message.
* **Expected Results**: Returns HTTP 400 Bad Request with exception message "Store is closed. We are not accepting new orders at this time."

#### Test ID: TC-PAYM-01 (Secure URL Parameter Token Check)
* **Test Objective**: Verify that accessing online order trackers requires the correct token.
* **Preconditions**: Order is configured with payment method `ONLINE` and `payment_token` = "secure_key_123".
* **Steps**:
  1. Access URL `/api/orders/ref/BKB-12345` without token.
  2. Access URL `/api/orders/ref/BKB-12345?token=wrong_key`.
  3. Access URL `/api/orders/ref/BKB-12345?token=secure_key_123`.
* **Expected Results**:
  * Steps 1 and 2 return HTTP 400 Bad Request with error message: "Access Denied: Invalid or missing secure payment token".
  * Step 3 returns HTTP 200 OK with order details.

#### Test ID: TC-COMP-01 (Staff Expiration Date Tracking)
* **Test Objective**: Verify document tracking for staff members.
* **Preconditions**: Manager user logged in. Staff member ID 3 exists.
* **Steps**:
  1. Access URL `PUT /api/staff/3/documents` with body containing `"typhoidExpiry": "2026-06-30"`.
  2. Verify response status.
  3. Query staff details database record.
* **Expected Results**: Returns HTTP 200 OK with success confirmation message. Typhoid date updates to `2026-06-30` in the database.
