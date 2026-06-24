# 4. MVC Compliance Report

## Overview
This report evaluates the current codebase against strict Model-View-Controller architecture principles.

## Current Violations
- **Controllers Containing Business Logic**: `OrderController` performs some business-level validation (e.g., checking stock or point balances) before calling the Service. This must be moved entirely to `OrderService` or `OrderValidationService`.
- **Services Containing View/Presentation Logic**: `EmailService` is tightly coupled with HTML presentation logic. HTML templates should be extracted to resource files, not concatenated as strings in Java.
- **Entities Containing Logic**: Some entities have helper methods that resemble business logic rather than simple domain modeling.

## Action Plan
- **Strict Separation**: 
  - `Controller` = Route mapping + DTO validation (`@Valid`).
  - `Service` = Core business logic, transaction boundaries.
  - `Repository` = Interface for DB access.
  - `Entity` = Pure JPA mapping.
