# /backend — Backend Implementation Command

## Purpose
Implement backend logic, services, controllers, models, policies, events, listeners, jobs, and migrations in the Laravel environment.

## Phase
**Implement** (Part of the Implementation Phase)

## When to Use
- Writing Laravel application logic, domain services, or database queries.
- Implementing authorization gates/policies and request validation.
- Handling background jobs, queue processing, or event listeners.

## Workflow & Guidelines
1. **Models & Eloquent Relationships**:
   - Define model attributes, casts (e.g. datetimes, enums), mass assignment protections (`$fillable`), and relationships (`hasMany`, `belongsTo`, `belongsToMany`).
   - Implement query scopes and computed attributes (e.g. `job_status`, `closed_unit_count`).
2. **Form Requests & Validation**:
   - Encapsulate validation logic in dedicated Laravel `FormRequest` classes.
   - Enforce domain constraints and custom error messages.
3. **Controllers & Actions**:
   - Keep controllers thin; delegate complex business rules to dedicated Service or Action classes.
   - Return Inertia responses or JSON APIs as appropriate.
4. **Authorization & Security**:
   - Use Laravel Policies (`Gate::authorize` / `$this->authorize`) to enforce role-based access control.
   - Respect sensitive data masking (e.g. hiding prices from non-authorized roles).
5. **Testing & Verification**:
   - Run `php artisan test` or targeted Pest/PHPUnit tests to confirm the implementation passes.
