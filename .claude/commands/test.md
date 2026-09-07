# /test — Test-Driven Development (TDD) Command

## Purpose
Enforce strict Test-Driven Development (TDD): write failing tests before any implementation code, run test runners, and ensure proper coverage and assertions.

## Phase
**Test** (Step 2 of the workflow: Plan → Test → Implement → Review → Verify → Remember → Improve)

## When to Use
- Before writing ANY implementation code or modifying system behavior.
- Designing test specifications for models, policies, services, controllers, and UI components.
- Reproducing bugs or edge cases with a failing regression test.

## Workflow & Guidelines
1. **Red Phase (Write Failing Tests First)**:
   - Formulate test cases based on task requirements, user stories, and acceptance criteria.
   - For backend: Write Pest or PHPUnit feature/unit tests (e.g. `tests/Feature/JobStageTest.php`).
   - For frontend: Write component tests or integration tests (Vitest/Jest/Testing Library).
   - Test both happy paths and edge cases (e.g., unauthorized access, invalid transitions, stage gate blocking).
2. **Execute Tests to Confirm Failure**:
   - Run the specific test command: e.g. `php artisan test --filter=TestName` or `npm run test`.
   - Verify the test fails for the expected reason (e.g., missing method, failed assertion, 403 Forbidden), NOT due to syntax errors.
3. **Guardrails**:
   - Never skip writing tests before implementation.
   - Assertions must be specific; avoid tautological assertions (`assert(true)`).
   - Use test factories, database refreshes, and isolated test databases.
4. **Transition to Green Phase**:
   - Once tests fail properly, proceed to `/implement` or `/backend`/`/frontend` to write the minimal passing code.
