# /plan — Project & Feature Planning Command

## Purpose
Initiate structured planning for features, system rework, or architectural changes. Analyzes requirements, checks constraints, breaks down tasks into bite-sized testable units, and produces an actionable implementation plan.

## Phase
**Plan** (Step 1 of the workflow: Plan → Test → Implement → Review → Verify → Remember → Improve)

## When to Use
- Starting a new feature, major change, or multi-step refactor.
- Reviewing requirement documents, feedback reports, or PRDs.
- Scoping out architectural or database changes.

## Workflow & Guidelines
1. **Analyze Requirements & Domain**:
   - Read all relevant reference documents, issue descriptions, and user feedback completely.
   - Clarify domain entities, user roles, business rules, and constraints.
2. **Decompose into Bite-Sized Tasks**:
   - Follow DRY, YAGNI, and TDD principles.
   - Each task must have a clear scope, touch specific files, define interfaces (consumes/produces), and carry its own test cycle.
3. **Plan TDD Execution Order**:
   - Always plan test creation before implementation code.
   - Define exact failing test cases, minimal implementation steps, and verification commands.
4. **Coordinate Specialized Commands**:
   - Run `/architect` for system boundary and domain entity modeling.
   - Run `/api-design` for endpoint contracts, request schemas, and Inertia props.
   - Run `/db-schema` for migration designs, tables, foreign keys, and indexes.
5. **Output**:
   - Structured implementation plan formatted with clear markdown sections, task checkboxes, and verification plans.
   - Wait for explicit user review and approval before proceeding to implementation.
