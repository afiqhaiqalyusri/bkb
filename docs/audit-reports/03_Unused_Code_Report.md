# 3. Unused Code Report

## Overview
This report highlights areas containing unused logic, imports, and variables.

## Backend
- **Unused Imports**: Standard Checkstyle will be run to eliminate all unused `java.util.*` and Spring Framework imports.
- **Dead Endpoints**: Endpoints in `KitchenController` or `ManagerController` that are no longer called by the React frontend.
- **Unused DTOs**: Several DTOs that were created for older API versions are no longer mapped in Controllers.

## Frontend
- **Unused Hooks**: Custom hooks in `src/hooks/` that are not imported.
- **Dead State Variables**: Zustand stores may contain state variables that are never accessed by components.
- **Unused Props**: React component props that are defined in the interface but never utilized in the render function.

*(We will use ESLint during the execution phase to enforce and automatically remove unused code).*
