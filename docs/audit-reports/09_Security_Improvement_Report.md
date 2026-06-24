# 9. Security Improvement Report

## Overview
This report reviews the security posture of the application.

## Findings
- **JWT Handling**: Ensure tokens are stored securely (HttpOnly cookies preferred over LocalStorage for session tokens) and that token expiration is strictly enforced.
- **Input Validation**: While DTOs exist, `@Valid` annotations and regex-based input constraints must be universally applied across all Controller endpoints to prevent injection or bad data.
- **Role-Based Access Control (RBAC)**: Ensure that all endpoints in Manager and Admin controllers have strict `@PreAuthorize` or `SecurityConfig` rules applied.

## Action Plan
- Enforce strict validation on all incoming request DTOs.
- Audit `JwtAuthFilter` and `SecurityConfig` to guarantee no unauthenticated pathways exist beyond public routes (e.g., Login, Registration).
- Ensure all logging (via `SecurityLogService`) strips PII (Personally Identifiable Information) and passwords.
