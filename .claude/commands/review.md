# /review — Code Quality & Architecture Review Command

## Purpose
Conduct rigorous peer review on newly written or modified code. Evaluates correctness, architectural alignment, design patterns, maintainability, and test coverage before committing or merging.

## Phase
**Review** (Step 4 of the workflow: Plan → Test → Implement → Review → Verify → Remember → Improve)

## When to Use
- After completing implementation tasks and before claiming work is finished.
- Prior to merging a branch or opening a pull request.
- Evaluating code against established project standards and domain requirements.

## Workflow & Guidelines
1. **Scope & Diff Inspection**:
   - Run `git diff` to inspect every modified file, added dependency, and deleted line.
   - Verify changes match the approved implementation plan and nothing extraneous was included.
2. **Code Quality & Maintainability**:
   - Check SOLID principles, DRY, YAGNI, and single-responsibility decomposition.
   - Check for dead code, hardcoded values, missing type hints, or confusing variable names.
   - Ensure exceptions and edge cases are handled gracefully.
3. **Test Adequacy**:
   - Confirm tests cover new functionality, boundary conditions, and potential regression spots.
   - Check that tests test behavior, not implementation details.
4. **Actionable Feedback**:
   - Formulate structured review findings categorized by severity: Blocker, Major, Minor, or Nit.
   - Fix blocking issues immediately before proceeding to verification.
