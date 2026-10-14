# Kanban Flow Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a standalone, executive-grade interactive HTML Kanban Flow Simulator (`KANBAN_FLOW_SIMULATOR.html`) demonstrating how jobs move across the complete 16-stage pipeline without backend servers, role restrictions, or document validation gates.

**Architecture:** Single-file HTML5/CSS/JavaScript with Tailwind CSS, HTML5 native Drag & Drop, one-click forward/backward progression buttons, responsive horizontal navigation per phase, and real-time movement history logging.

**Tech Stack:** HTML5, Tailwind CSS, Vanilla JS, Node.js Test Runner.

## Global Constraints

- Standalone executable file: Must open and operate offline directly in any browser (`file://` or HTTP).
- Faithful to DNP Monitor 16-Stage Architecture: Must match `Constants.js` sequence: 1 -> 2 -> 3 -> 4 -> 13 (4b) -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 14 (11b) -> 15 (11c) -> 12 -> 16 (✓ Selesai).
- Zero Logic Gates: No upload requirements, no backend authorization locks, no payment blockers. Pure operational movement simulation.
- TDD Order: Write failing test in `tests/kanban_simulator.test.js` before writing implementation code.

---

### Task 1: Write TDD Test Specification (tests/kanban_simulator.test.js)

**Files:**
- Create: `tests/kanban_simulator.test.js`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**

### Task 2: Implement Interactive Kanban Simulator (public/KANBAN_FLOW_SIMULATOR.html)

**Files:**
- Create: `public/KANBAN_FLOW_SIMULATOR.html`
- Mirror: `KANBAN_FLOW_SIMULATOR.html`

- [ ] **Step 3: Implement HTML layout, 16 stage columns, and sample jobs**
- [ ] **Step 4: Implement drag-and-drop and forward/backward buttons**
- [ ] **Step 5: Run test to verify it passes**

### Task 3: Full Workspace Verification & Documentation

- [ ] **Step 6: Run full test suite (`node --test tests/*.test.js`)**
- [ ] **Step 7: Commit and push changes to git**
