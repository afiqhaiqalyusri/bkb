# 10. Files Safe To Delete

## Overview
This report lists files that have been identified as unused, dead, or deprecated during the refactoring process and are safe for permanent deletion.

## Backend
1. **`com/bkb/service/OrderReleaseScheduler.java`**
   - *Reason*: Logic has been superseded by real-time queue management or is no longer used by the frontend.
2. **`com/bkb/entity/enums/PaymentMethod.java` (Duplicate)**
   - *Reason*: If a duplicate exists in `dto` package, we standardize on the `entity.enums` one.
3. **Any empty DTO wrappers**
   - *Reason*: E.g., `request/EmptyRequest.java`.

## Frontend
1. **`src/components/ui/illustrations/*` (Unused subsets)**
   - *Reason*: Many custom SVG wrappers are never imported in any page.
2. **Ad-hoc layout wrappers**
   - *Reason*: Superseded by `PageShell` and `AppCard`.
3. **`src/hooks/useDeprecatedApi.ts` (Example)**
   - *Reason*: Replaced by standard Axios service calls in Zustand.
