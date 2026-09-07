# /frontend — Frontend Implementation Command

## Purpose
Implement user interfaces, React/Inertia components, forms, interactive sheets, modals, Kanban boards, and responsive layouts.

## Phase
**Implement** (Part of the Implementation Phase)

## When to Use
- Building or updating React views and components in `resources/js` or `src/`.
- Developing interactive workflows (Kanban boards, Job sheets, Unit management, Batch grouping, Stage action panels).
- Implementing responsive styling, animations, toasts, and loading states.

## Workflow & Guidelines
1. **Component Architecture & Clean Code**:
   - Decompose large views into focused, reusable components.
   - Keep props clean and strongly typed (or documented with PropTypes/TypeScript interfaces).
2. **State Management & Form Handling**:
   - Use Inertia form helpers (`useForm`) for server-driven state and validation error bindings.
   - Handle loading, disabled, and processing states gracefully.
3. **UI / UX Polish & Accessibility**:
   - Apply modern, harmonious Tailwind CSS styles (clean typography, subtle borders, accessible color contrast).
   - Ensure role-aware visibility: display actions and fields only to authorized roles (e.g. Stage 2 verification, price masking, stage advancement buttons).
   - Add intuitive micro-interactions, tooltips, and confirmation dialogs for destructive or gate-moving actions.
4. **Verification**:
   - Test UI interactions across desktop and tablet/mobile viewports.
   - Verify that client-side forms validate inputs and cleanly display backend errors.
