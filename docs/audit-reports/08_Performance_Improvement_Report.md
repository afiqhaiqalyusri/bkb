# 8. Performance Improvement Report

## Overview
This report outlines performance bottlenecks in both the frontend and backend architectures and suggests remediation strategies.

## Frontend Bottlenecks
- **Bundle Size**: Large dependencies and lack of code splitting mean the initial load time is suboptimal.
  - *Fix:* Implement React `lazy()` and `Suspense` to code-split routes (e.g., Manager and Admin pages should not load for standard customers).
- **Excessive Re-renders**: Complex pages (like `SettingsPage` or `CheckoutPage`) may re-render entirely on minor state changes.
  - *Fix:* Extract components and use `useMemo`/`useCallback` or Zustand slice selectors to minimize re-rendering.

## Backend Bottlenecks
- **N+1 Queries**: Fetching orders and their items often triggers multiple queries.
  - *Fix:* Use Spring Data JPA `@EntityGraph` to fetch relationships efficiently.
- **Large Payload Serialization**: Returning full nested entities instead of flat DTOs increases network payload size.
  - *Fix:* Strict DTO mapping for all responses.
