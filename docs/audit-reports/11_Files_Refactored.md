# 11. Files Refactored

## Overview
This log tracks the major files that underwent significant refactoring during this operation.

## Backend
1. **`OrderService.java`**
   - *Before*: 574 lines. Monolithic, handled calculation, validation, and saving.
   - *After*: ~470 lines. 
   - *Reason*: Separated concerns. Extracted pricing and promotion calculation to `OrderCalculationService`.
   - *Impact*: Higher maintainability, testable calculation logic independent of the database.
2. **`OrderCalculationService.java`** (NEW)
   - *Reason*: Created to offload logic from `OrderService`.
   - *Impact*: strict MVC compliance and better unit testability.

## Frontend
1. **`AppButton.tsx` & `AppCard.tsx`** (NEW)
   - *Reason*: Establish a unified Design System.
   - *Impact*: Eradicates duplicate Tailwind classes, ensures 100% UI consistency, accessibility, and reduces overall CSS payload.
