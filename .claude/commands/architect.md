# /architect — System Architecture & Domain Modeling Command

## Purpose
Design system architecture, domain models, state machines, bounded contexts, and service boundaries. Ensures technical design aligns with business operations and scales reliably.

## Phase
**Plan** (Part of the Planning Phase)

## When to Use
- Designing new subsystems, entities, or major workflows (e.g. Job, Unit, Batch, LHPP, BAP).
- Managing complex state transitions, approval loops, or stage gates.
- Refactoring monolith components into clean domain services.

## Workflow & Guidelines
1. **Define Bounded Contexts & Entities**:
   - Identify domain aggregates, root entities, and value objects.
   - Establish cardinality and relationships (e.g. 1 Job → N Units, 1 Job → N Batches, 1 Unit → N LHPPs, 1 InspectionEvent → N Units).
2. **Design State Transitions & Gateways**:
   - Map states, transitions, valid triggers, role-based authorities (PIC per stage), and rollback/loopback rules (e.g. Stage 11c Partial → loop to Stage 11).
   - Distinguish Job-level vs Unit-level vs Batch-level states.
3. **Establish Component Boundaries**:
   - Separate concerns across Controllers, Domain Services, Repositories, Events, and UI layers.
   - Design clean abstractions for external integrations (e.g., file storage, notification services).
4. **Evaluate Trade-offs & Risks**:
   - Assess data consistency, concurrency, idempotency, and failure modes.
   - Document Architectural Decision Records (ADRs).
