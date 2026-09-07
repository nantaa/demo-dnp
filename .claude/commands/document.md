# /document — System Documentation & Technical Writing Command

## Purpose
Produce, update, and maintain comprehensive system documentation, API references, architecture diagrams, user guides, and changelogs.

## Phase
**Remember** (Part of the Remember Phase: Step 6 of the workflow)

## When to Use
- After completing feature development or architectural revisions.
- Updating user manuals, role-based SOPs, and stage guidelines.
- Writing Architectural Decision Records (ADRs) and release notes.

## Workflow & Guidelines
1. **Identify Documentation Scope**:
   - Technical docs: Architecture design, entity-relationship diagrams, API endpoints, migration notes.
   - User guides: SOP per role (Marketing, Admin, INS, Ahli, Management, Finance).
   - Changelogs: Bulleted release notes capturing features, fixes, breaking changes, and configuration requirements.
2. **Keep Docs Synchronized with Implementation**:
   - Cross-check documentation against current code, database columns, and route names.
   - Never leave outdated diagrams, obsolete stage names, or incorrect parameter types.
3. **Clarity & Accessibility**:
   - Use clear, professional markdown formatting, tables, alert callouts, and Mermaid diagrams.
   - For Indonesian operational guides, use clear standard terminology (e.g., Surat Tugas, Surat Permohonan, LHPP, BAP, SUKET, Kwitansi, Termin).
4. **File Placement**:
   - Place project specs/plans in `docs/` or repo documentation directories.
   - Maintain historical revision records.
