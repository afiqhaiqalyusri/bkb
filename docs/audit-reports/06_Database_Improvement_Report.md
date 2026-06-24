# 6. Database Improvement Report

## Overview
This report identifies optimizations for the PostgreSQL database schema and Spring Data JPA configurations.

## Schema Improvements
- **Missing Indexes**: Foreign keys in `order_items`, `inventory_transactions`, and `loyalty_transactions` may lack indexes, slowing down JOIN operations. We will add indexes to `user_id`, `order_id`, and `menu_item_id`.
- **Constraint Polish**: Ensure all critical constraints (NOT NULL, UNIQUE) are enforced at the DB level, not just in JPA.

## JPA/Hibernate Improvements
- **N+1 Query Problem**: Many relationships (like `Order` -> `OrderItems`) might be fetched eagerly or loaded sequentially. We will use `@EntityGraph` or `JOIN FETCH` to load related entities in a single query.
- **Pagination**: Large tables (`InventoryTransaction`, `Order`) must strictly enforce pagination on the API layer to prevent `OutOfMemoryError` on large datasets.

## Migration Strategy
- We will set up **Flyway** (or Liquibase) for schema versioning, moving away from relying on Hibernate's `spring.jpa.hibernate.ddl-auto=update` in production.
