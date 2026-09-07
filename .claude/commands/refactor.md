# /refactor — Code Refactoring Command

## Purpose
Safely refactor existing code to enhance structure, readability, modularity, and maintainability without altering external behavior.

## Phase
**Improve** (Part of the Improve Phase: Step 7 of the workflow)

## When to Use
- When a file or method has grown unwieldy (e.g. `JobDetailSheet.jsx` or `JobController.php` with thousands of lines).
- Eliminating code duplication (DRY) and dead code.
- Extracting inline queries/business logic into dedicated domain services, custom hooks, or action classes.

## Workflow & Guidelines
1. **Verify Baseline Green**:
   - Before touching any code, run existing tests (`php artisan test`, `npm run test`) to ensure all tests pass. Never refactor on broken tests.
2. **Identify Refactoring Smells**:
   - Long methods, god classes, duplicated logic, bloated props, deep nesting, tight coupling.
3. **Incremental Transformation**:
   - Make small, localized transformations.
   - Extract functions, components, or service classes with explicit interfaces.
   - Preserve all public contracts, return types, and route signatures.
4. **Continuous Regression Testing**:
   - Run tests after each transformation.
   - If tests fail, diagnose and fix immediately.
5. **Commit**:
   - Commit refactored code separately from feature additions with clear messages (e.g. `refactor(jobs): extract unit table to separate component`).
