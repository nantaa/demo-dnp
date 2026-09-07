# /remember — Knowledge Persistence & Learnings Command

## Purpose
Persist architectural knowledge, domain rules, operational edge cases, debugging learnings, and conventions into persistent agent memory and project knowledge items.

## Phase
**Remember** (Part of the Remember Phase: Step 6 of the workflow)

## When to Use
- After resolving a complex bug, discovering a tricky edge case, or establishing a project-specific pattern.
- Storing lessons learned about domain constraints (e.g. infinite ceiling escalation, price masking across roles, batch SUKET delivery).
- Creating or updating project knowledge items (KI), agent rules, or skills.

## Workflow & Guidelines
1. **Extract Key Insights**:
   - What was the non-obvious problem or domain nuance?
   - What solution was proven to work?
   - What traps or pitfalls should future developers/agents avoid?
2. **Format for Longevity**:
   - Write clear, concise takeaways with code examples, filenames, and context.
   - Separate generic programming wisdom from project-specific business rules.
3. **Persist Knowledge**:
   - Update agent memory, project rules (`.gemini/rules/`, `AGENTS.md`, or `CLAUDE.md`), or project knowledge directories.
   - Use memory MCP tools (e.g., `create_entities`, `add_observations`) or local knowledge stores.
