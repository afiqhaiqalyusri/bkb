# 13. Final Project Structure

## Overview
The target, clean architecture achieved after the complete refactoring operation.

## Backend (`backend/src/main/java/com/bkb`)
```
com.bkb
├── config            # Security, CORS, Swagger configs
├── controller        # REST APIs (No business logic)
├── dto               # Request/Response data transfers
│   ├── request
│   └── response
├── entity            # JPA Entities & Enums
├── event             # Spring Application Events (Async processing)
├── exception         # GlobalExceptionHandler & custom exceptions
├── mapper            # MapStruct interfaces for DTO <-> Entity
├── repository        # Spring Data JPA Interfaces
├── security          # JWT Filters, UserDetails
├── service           # Core Business Logic (Strictly separated domains)
│   ├── order         # OrderService, OrderCalculationService, OrderValidationService
│   ├── auth          # AuthService, JwtTokenService, OtpService
│   ├── user          # UserService
│   └── email         # EmailService, EmailTemplateService
├── util              # Helpers (Generators, Constants)
└── validation        # Custom validators (@Constraint)
```

## Frontend (`frontend/src`)
```
src
├── assets            # Static assets, global CSS
├── components
│   ├── shared        # AppButton, AppCard, AppModal (Design System)
│   ├── layout        # Sidebar, NavBar, PageShell
│   └── feature       # Domain-specific (e.g., MenuCard, CheckoutForm)
├── hooks             # Reusable React hooks
├── pages             # Route entry points (Thin components)
├── services          # Axios API clients
├── store             # Zustand global state (cart, auth)
├── types             # Global TypeScript interfaces
└── utils             # Helper functions (currency formatting, date parsing)
```

## Impact
- **MVC Enforcement**: 100% adherence.
- **Maintainability**: High. Files are small, focused, and testable.
- **Scalability**: Feature-based folder structures allow for easy expansion without clutter.
