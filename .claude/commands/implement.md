# /implement — Implementation Orchestrator Command

## Purpose
Execute approved implementation plan tasks following strict TDD green-phase discipline. Coordinates between backend, frontend, and infrastructure tasks.

## Phase
**Implement** (Step 3 of the workflow: Plan → Test → Implement → Review → Verify → Remember → Improve)

## When to Use
- Implementing features, bugfixes, or refactors that have an approved plan and failing tests in place.
- Orchestrating multi-layered tasks involving database, backend services, and frontend UI.

## Workflow & Guidelines
1. **Pre-Implementation Verification**:
   - Ensure the implementation plan has been approved by the user.
   - Confirm failing tests exist for the current task (`/test`).
2. **Execute Bite-Sized Implementation**:
   - Write the MINIMAL code necessary to turn failing tests green.
   - Follow YAGNI (You Aren't Gonna Need It) and DRY (Don't Repeat Yourself).
   - Use `/backend` for Laravel controllers, models, services, migrations.
   - Use `/frontend` for React/Inertia components, pages, forms, and styles.
   - Use `/devops` for configuration, environment, build pipelines, or containerization.
3. **Run Test Runner**:
   - Run tests immediately after writing code to verify green status.
   - Ensure no regressions were introduced to existing tests.
4. **Frequent Commits**:
   - Make clean, atomic git commits per completed task with descriptive messages.
