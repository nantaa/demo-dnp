# Visual Presentation & Chart Comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance `PROJECT_CAPABILITIES_AND_BOUNDARIES.html` (and public mirror) with rich, executive-grade visual presentations and comparative diagrams that visually illustrate the 16-stage pipeline, operational safety gates, and scope boundaries for Users and Managers.

**Architecture:** Interactive SVG & CSS-based visual infographics, comparative capability matrices, and visual status gauges embedded directly into the standalone HTML file, verified by Node.js automated tests.

**Tech Stack:** HTML5, CSS/Tailwind, SVG Visuals, Vanilla JS, Node.js Test Runner.

## Global Constraints

- Scope: Strictly tailored for User & Manager presentation.
- Presentation Format: Embedded interactive visual dashboard directly inside `PROJECT_CAPABILITIES_AND_BOUNDARIES.html` (no external CDNs that can fail offline).
- No Meaningless Fluff: No generic/childish pie charts. Must use concrete operational visuals:
  1. 16-Stage Visual Workflow Pipeline with Milestone Gate Callouts.
  2. SLA Functional Clarity Infographic (Alarm Berkas vs Rapor Kinerja Staf).
- Explicit Exclusion: Side-by-Side Comparison Matrix excluded per user instruction ("since you can't explain/create that clearly").
- TDD Order: Write failing test in `tests/capabilities_matrix.test.js` before implementing the visuals.

---

### Task 1: Update TDD Test Specification (tests/capabilities_matrix.test.js)

**Files:**
- Modify: `tests/capabilities_matrix.test.js`

**Interfaces:**
- Asserts that:
  1. HTML contains a dedicated visual presentation section (`visualSection` / `visual-section`).
  2. HTML contains the 16-Stage Pipeline visual diagram with milestone gate highlights.
  3. HTML contains the SLA Functional Infographic (Alarm Berkas vs Rapor KPI).
  4. HTML strictly excludes the Side-by-Side Comparison Matrix.

- [x] **Step 1: Write test specification**
- [x] **Step 2: Run test to verify assertions**
- [x] **Step 3: Implement Visual Sections in HTML (and mirror to root)**
- [x] **Step 4: Exclude Side-by-Side Comparison Matrix completely per user instruction**
- [x] **Step 5: Run test to verify it passes**
- [x] **Step 6: Verify entire test suite (all 340+ tests pass)**

