# REST API Reference Documentation — BKB System

## Document Control
| Version | Date | Author | Description |
|---|---|---|---|
| v1.0.0 | 2026-06-14 | Antigravity AI | Initial production API specifications. |

---

## 1. Overview
All BKB API responses return a standardized JSON structure:

```json
{
  "success": true,
  "message": "Message detailing outcome",
  "data": { ... }
}
```

* **Default Port**: `8081`
* **Content Type**: `application/json`
* **Authentication**: Token-based using JWT Bearer headers (`Authorization: Bearer <access_token>`).

---

## 2. Authentication API (`/api/auth`)

### 2.1 Register Account
* **URL**: `/api/auth/register`
* **Method**: `POST`
* **Auth**: Public
* **Request Body**:
```json
{
  "name": "Alex Tan",
  "email": "alex@customer.com",
  "phone": "0123456789",
  "password": "SecurePassword123!"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "role": "CUSTOMER"
  }
}
```

### 2.2 User Login
* **URL**: `/api/auth/login`
* **Method**: `POST`
* **Auth**: Public
* **Request Body**:
```json
{
  "email": "manager@bkb.com",
  "password": "BKBManager2024!"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "role": "MANAGER"
  }
}
```

### 2.3 Guest Session Creation
* **URL**: `/api/auth/guest`
* **Method**: `POST`
* **Auth**: Public
* **Request Body**:
```json
{
  "name": "Guest Customer",
  "phone": "0199999999"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Guest session created",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "role": "GUEST"
  }
}
```

### 2.4 Token Refresh
* **URL**: `/api/auth/refresh`
* **Method**: `POST`
* **Auth**: Public
* **Request Body**:
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Tokens refreshed",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

### 2.5 User Logout
* **URL**: `/api/auth/logout`
* **Method**: `POST`
* **Auth**: Authenticated
* **Request Params**: `reason` (Optional, Default: `"MANUAL"`)
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

---

## 3. Categories API (`/api/categories`)

### 3.1 Get All Categories
* **URL**: `/api/categories`
* **Method**: `GET`
* **Auth**: Public
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    { "id": 1, "name": "Burger", "displayOrder": 1 },
    { "id": 2, "name": "Sides", "displayOrder": 2 }
  ]
}
```

### 3.2 Create Category
* **URL**: `/api/categories`
* **Method**: `POST`
* **Auth**: Requires `MANAGER` role
* **Request Body**:
```json
{
  "name": "Milkshakes"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": { "id": 6, "name": "Milkshakes", "displayOrder": 6 }
}
```

---

## 4. Menu API (`/api/menu`)

### 4.1 Get Available Menu
* **URL**: `/api/menu`
* **Method**: `GET`
* **Auth**: Public
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Classic Cheeseburger",
      "price": 12.50,
      "category": "Burger",
      "isAvailable": true
    }
  ]
}
```

### 4.2 Toggle Item Availability
* **URL**: `/api/menu/{id}/toggle`
* **Method**: `PATCH`
* **Auth**: Requires `STAFF` role
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Menu item availability toggled",
  "data": { "id": 1, "name": "Classic Cheeseburger", "isAvailable": false }
}
```

---

## 5. Ingredient Customizations & Outages API (`/api/ingredients`)

### 5.1 Get Item Customizations
* **URL**: `/api/ingredients/item/{menuItemId}`
* **Method**: `GET`
* **Auth**: Public
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "menuItemId": 1,
      "ingredientName": "Cheese",
      "defaultLevel": "MEDIUM"
    }
  ]
}
```

### 5.2 Get Ingredient Outages
* **URL**: `/api/ingredients/outage`
* **Method**: `GET`
* **Auth**: Public
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    { "name": "Tomatoes", "outOfStock": false },
    { "name": "Cheese", "outOfStock": true }
  ]
}
```

### 5.3 Toggle Ingredient Outage
* **URL**: `/api/ingredients/outage/{name}/toggle`
* **Method**: `PATCH`
* **Auth**: Requires `STAFF` role
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Ingredient availability updated",
  "data": { "name": "Tomatoes", "outOfStock": true }
}
```

---

## 6. Orders API (`/api/orders`)

### 6.1 Check Store Operations Status
* **URL**: `/api/orders/store-status`
* **Method**: `GET`
* **Auth**: Public
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": true
}
```

### 6.2 Toggle Store Operations Status
* **URL**: `/api/orders/store-status`
* **Method**: `POST`
* **Auth**: Requires `MANAGER` role
* **Request Body**:
```json
{
  "open": false
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Store status updated successfully",
  "data": false
}
```

### 6.3 Place Order
* **URL**: `/api/orders/create`
* **Method**: `POST`
* **Auth**: Public
* **Request Body**:
```json
{
  "guestName": "Sarah Cole",
  "guestPhone": "0172345678",
  "items": [
    {
      "menuItemId": 1,
      "quantity": 2,
      "customisations": [
        { "name": "Cheese", "level": "EXTRA" }
      ]
    }
  ],
  "paymentMethod": "CASH",
  "pickupTime": "2026-06-14T22:30:00",
  "notes": "No onions please"
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "id": 15,
    "orderNumber": "BKB-1718379200",
    "status": "PENDING",
    "subtotal": 25.00,
    "tax": 1.50,
    "total": 26.50
  }
}
```

### 6.4 Update Order Status
* **URL**: `/api/orders/{id}/status`
* **Method**: `PATCH`
* **Auth**: Requires `STAFF` role
* **Request Body**:
```json
{
  "status": "READY"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": { "id": 15, "status": "READY" }
}
```

### 6.5 Cancel Order
* **URL**: `/api/orders/{id}/cancel`
* **Method**: `DELETE`
* **Auth**: Authenticated
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": { "id": 15, "status": "CANCELLED" }
}
```

---

## 7. Payments API (`/api/payments`)

### 7.1 Confirm Cash Payment at Counter
* **URL**: `/api/payments/{orderId}/cash-confirm`
* **Method**: `PATCH`
* **Auth**: Requires `STAFF` role
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Cash payment confirmed",
  "data": null
}
```

### 7.2 Get Payment Status
* **URL**: `/api/payments/{ref}/status`
* **Method**: `GET`
* **Auth**: Public
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "orderId": 15,
    "orderNumber": "BKB-1718379200",
    "paymentStatus": "PAID",
    "transactionRef": "TXN-1718379250"
  }
}
```

---

## 8. Loyalty & Game API (`/api/loyalty` & `/api/game`)

### 8.1 Submit Game Score to claim points
* **URL**: `/api/game/submit`
* **Method**: `POST`
* **Auth**: Requires `CUSTOMER` role
* **Request Body**:
```json
{
  "orderId": 15,
  "score": 1500
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "🎉 15 bonus loyalty points added to your account!",
  "data": {
    "pointsAwarded": 15
  }
}
```

### 8.2 Redeem Loyalty Reward
* **URL**: `/api/loyalty/redeem`
* **Method**: `POST`
* **Auth**: Requires `CUSTOMER` role
* **Request Body**:
```json
{
  "rewardId": 2
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Reward redeemed successfully!",
  "data": null
}
```

### 8.3 Adjust Loyalty Account Points Manually
* **URL**: `/api/loyalty/accounts/{id}/adjust`
* **Method**: `POST`
* **Auth**: Requires `ADMIN` role
* **Request Body**:
```json
{
  "points": 50,
  "reason": "Customer service goodwill adjustment"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Points adjusted successfully",
  "data": null
}
```

---

## 9. Inventory API (`/api/inventory`)

### 9.1 Add Waste Log
* **URL**: `/api/inventory/{id}/waste`
* **Method**: `POST`
* **Auth**: Requires `STAFF` role
* **Request Body**:
```json
{
  "quantity": 10.00,
  "reason": "Moldy burger buns detected"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Stock recorded as waste",
  "data": { "id": 1, "itemName": "Burger Bun", "status": "LOW" }
}
```

---

## 10. Reports API (`/api/reports`)

### 10.1 Export Sales Data
* **URL**: `/api/reports/export`
* **Method**: `GET`
* **Auth**: Requires `MANAGER` role
* **Request Params**: `from` (e.g. "2026-06-01"), `to` (e.g. "2026-06-14")
* **Success Response (200 OK)**: Returns CSV file stream payload.

---

## 11. Staff API (`/api/staff`)

### 11.1 Fetch Security Audit Logs
* **URL**: `/api/staff/security-logs`
* **Method**: `GET`
* **Auth**: Requires `ADMIN` role
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "userEmail": "admin@bkb.com",
        "action": "Payment Status Override",
        "details": "Overrode cash payment status to PAID for order ID 15",
        "previousValue": "UNPAID",
        "newValue": "PAID",
        "ipAddress": "127.0.0.1",
        "createdAt": "2026-06-14T21:58:00"
      }
    ]
  }
}
```
