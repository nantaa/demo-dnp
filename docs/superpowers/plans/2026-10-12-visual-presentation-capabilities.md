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
  2. Side-by-Side Scope Comparison Matrix (DNP Monitor vs HRIS Absensi vs Versi 3).
  3. SLA Functional Clarity Infographic (Alarm Berkas vs Rapor Kinerja Staf).
- TDD Order: Write failing test in `tests/capabilities_matrix.test.js` before implementing the visuals.

---

### Task 1: Update TDD Test Specification (tests/capabilities_matrix.test.js)

**Files:**
- Modify: `tests/capabilities_matrix.test.js`

**Interfaces:**
- Asserts that:
  1. HTML contains a dedicated visual presentation section (`visualPresentation` / `diagramAlur`).
  2. HTML contains the 16-Stage Pipeline visual diagram with milestone gate highlights.
  3. HTML contains the visual comparison matrix comparing DNP Monitor vs HRIS vs v3.
  4. HTML contains the SLA Functional Infographic (Alarm Berkas vs Rapor KPI).

- [ ] **Step 1: Write the failing test**

```javascript
  test('HTML contains visual presentation and chart comparison diagrams', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('visualPresentation') || content.includes('diagramAlur'), 'Must contain visual presentation section');
    assert.ok(content.includes('Visualisasi Alur') || content.includes('Bagan Alur 16 Tahap'), 'Must include 16-stage visual pipeline');
    assert.ok(content.includes('Matriks Perbandingan') || content.includes('Tabel Perbandingan Visual'), 'Must include visual comparison matrix');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/capabilities_matrix.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement Visual Sections in HTML**

Add visual diagrams (SVG pipeline, comparison matrix, SLA gauge) to `public/PROJECT_CAPABILITIES_AND_BOUNDARIES.html` and mirror to root.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/capabilities_matrix.test.js`
Expected: PASS.

- [ ] **Step 5: Verify entire test suite**

Run: `node --test tests/*.test.js`
Expected: PASS (all 340+ tests pass).
