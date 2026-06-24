# 1. Code Cleanup Report

## Overview
This report identifies areas of technical debt, bloated files, and code smells across the BKB codebase.

## Backend Findings
### Bloated Services (> 300 lines)
- **`OrderService.java` (494 lines)**: Contains mixed responsibilities (order creation, validation, status updates, analytics). **Action:** Split into `OrderService`, `OrderValidationService`, `OrderWorkflowService`.
- **`AuthService.java` (401 lines)**: Handles JWT generation, user registration, OTP logic, and session management. **Action:** Split into `AuthService`, `JwtTokenService`, `OtpService`.
- **`EmailService.java` (303 lines)**: Contains large HTML string templates for emails. **Action:** Move templates to separate resource files or use a templating engine (Thymeleaf/Freemarker).

### Code Smells
- **Missing Checkstyle/PMD**: The backend lacks static analysis enforcement in `pom.xml`.
- **Large Controllers**: `OrderController` is nearly 200 lines, suggesting some business logic may have leaked from the service layer.

## Frontend Findings
### Bloated Pages & Components
- **`SettingsPage.tsx` (~1500 lines)**: A massive monolithic file handling all user settings. **Action:** Break into `<ProfileSettings />`, `<SecuritySettings />`, `<NotificationSettings />`.
- **`CheckoutPage.tsx` (~1000 lines)**: Too large. **Action:** Split into `<DeliveryForm />`, `<OrderSummary />`, `<PaymentSelection />`.
- **`CartPage.tsx` (~900 lines)** and **`PaymentPage.tsx` (~800 lines)**: Need component extraction.
- **`BurgerStackGame.tsx` (660 lines)**: Extremely large for a mini-game component.
- **`CustomiseModal.tsx` (369 lines)**: Needs extraction of form components.

### Tech Debt
- **No ESLint**: `package.json` does not have ESLint configured for code quality checks.
- **Duplicate Styles**: Many components use ad-hoc Tailwind classes instead of a unified design system.
