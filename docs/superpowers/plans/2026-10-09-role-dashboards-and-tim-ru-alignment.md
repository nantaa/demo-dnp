# Role Dashboards Parity & Tim RU Terminology Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the dashboards for Admin, Manager, Tim Ahli, and Tim RU (Inspector) with 100% data and UI parity, eliminate silent workflow bugs (Stage 2 bypass hiding Stage 5 LHPP tasks, incorrect LHPP drafting counts in Manager workload), add actionable tables for Stage 2 verification and H-5 Disnaker warnings in the Admin dashboard, and standardize all UI terminology from "Inspector/Inspektur" to "Tim RU" (Tim Riksa Uji) using safe bidirectional backend aliasing with zero extra server resource consumption.

**Architecture:** 
1. Client-side state computation inside `Dashboard/Index.jsx` using existing Inertia props (`jobs`, `inspectors`, `auth.user`) in optimized `useMemo` blocks—zero extra HTTP requests or database hits.
2. Safe bidirectional role aliasing (`['inspektur', 'inspector', 'tim_ru']`) in `User.php` and `Constants.js`—zero schema migrations or SQL data modifications required.
3. Interactive tables in `AdmDashboard` for Stage 2 (`antrianVerifikasi`) and `h5Pending` mirroring the high-productivity design established in `FinDashboard` and `MgrDashboard`.
4. Removal of obsolete `peer_review_status` filter on Stage 5 LHPP tasks and fixing Manager workload counter to track Stage 5 drafting.

**Tech Stack:** Laravel 11, Inertia.js React, Vite 5, Tailwind CSS, Lucide React, Node.js `node:test` runner.

## Global Constraints
- Framework base is Laravel 11 + Inertia.js (React).
- Strict TDD sequence: plan → test → implement → review → verify → document → refactor.
- Zero breaking changes to existing permissions or workflows; zero extra API overhead (all computations memoized on client-side props).
- No raw SQL database column/enum renaming; role aliasing must support existing users seamlessly.
- Preserve 100% passing status across all existing 315+ tests.

---

### Task 1: Comprehensive TDD Parity Test Suite

**Files:**
- Create: `tests/tim_ru_and_role_dashboards_parity.test.js`

**Interfaces:**
- Consumes: AST and source code of `dnp-rework/app/Models/User.php`, `dnp-rework/resources/js/Constants.js`, `dnp-rework/resources/js/Pages/Dashboard/Index.jsx`, and `dnp-rework/resources/js/Components/JobDetailSheet.jsx`.
- Produces: Test suite validating:
  1. `User.php` supports `tim_ru` alias for stages 4 and 5.
  2. `Constants.js` defines `tim_ru` with name 'Tim Riksa Uji' and label 'TRU'.
  3. `lhppJobs` in Tim RU dashboard does not filter out jobs with `peer_review_status === 'approved'`.
  4. `workloadByInspektur` in Manager dashboard counts Stage 5 for `lhppCount`.
  5. `AdmDashboard` renders an interactive table for `antrianVerifikasi` (Stage 2).
  6. `AdmDashboard` renders actionable list for `h5Pending` (H-5 Disnaker).
  7. Dashboard and detail sheets display "Tim RU" / "Tim Riksa Uji" in headers and badges.

- [ ] **Step 1: Write the failing test suite**

Create `tests/tim_ru_and_role_dashboards_parity.test.js`:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dashboardPath = path.join(rootDir, 'dnp-rework/resources/js/Pages/Dashboard/Index.jsx');
const userModelPath = path.join(rootDir, 'dnp-rework/app/Models/User.php');
const constantsPath = path.join(rootDir, 'dnp-rework/resources/js/Constants.js');
const sheetPath = path.join(rootDir, 'dnp-rework/resources/js/Components/JobDetailSheet.jsx');

describe('Tim RU & Role Dashboards Parity Suite', () => {
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    const userModelContent = fs.readFileSync(userModelPath, 'utf8');
    const constantsContent = fs.readFileSync(constantsPath, 'utf8');
    const sheetContent = fs.readFileSync(sheetPath, 'utf8');

    it('1. Backend User.php recognizes tim_ru as a valid alias for Stage 4 & 5', () => {
        assert.ok(
            userModelContent.includes("'tim_ru'") && userModelContent.includes("'inspektur'"),
            'User.php must include tim_ru alias alongside inspektur'
        );
    });

    it('2. Constants.js maps tim_ru to Tim Riksa Uji and TRU badge', () => {
        assert.ok(
            constantsContent.includes("tim_ru: { name: 'Tim Riksa Uji', label: 'TRU' }") ||
            constantsContent.includes('tim_ru:'),
            'Constants.js must define tim_ru role'
        );
    });

    it('3. Tim RU Dashboard: lhppJobs must not filter out jobs based on peer_review_status', () => {
        const lhppJobsMatch = dashboardContent.match(/const lhppJobs = isINS[\s\S]*?\.map\(/);
        assert.ok(lhppJobsMatch, 'lhppJobs filter must exist');
        assert.ok(
            !lhppJobsMatch[0].includes("peer_review_status === 'draft'"),
            'lhppJobs must not check peer_review_status (which is a Stage 2 bypass flag)'
        );
    });

    it('4. Manager Dashboard: workloadByInspektur must count Stage 5 as active LHPP drafting', () => {
        const lhppCountMatch = dashboardContent.match(/const lhppCount = activeInspJobs\.filter\(j => ([^)]+)\)\.length;/);
        assert.ok(lhppCountMatch, 'lhppCount must exist');
        assert.ok(
            lhppCountMatch[1].includes('5'),
            'lhppCount must include Stage 5 (Penyusunan LHPP)'
        );
    });

    it('5. Admin Dashboard: must render interactive table for Stage 2 antrianVerifikasi', () => {
        assert.ok(
            dashboardContent.includes('Antrean Verifikasi Dokumen & Surat Permohonan') ||
            dashboardContent.includes('Antrean Verifikasi · Tahap 02'),
            'AdmDashboard must render interactive table for Stage 2'
        );
        assert.ok(
            dashboardContent.includes('Verifikasi Dokumen &rarr;') || dashboardContent.includes('Verifikasi &rarr;'),
            'AdmDashboard must have direct action button for Stage 2 jobs'
        );
    });

    it('6. Admin Dashboard: must provide actionable list for H-5 Disnaker warning', () => {
        assert.ok(
            dashboardContent.includes('Daftar Job Peringatan H-5 Disnaker') ||
            dashboardContent.includes('Peringatan H-5 Disnaker · Belum Lapor Teman K3'),
            'AdmDashboard must provide actionable table/list for H-5 pending jobs'
        );
    });

    it('7. Tim RU Naming: Dashboard title and UI labels use Tim RU / Tim Riksa Uji', () => {
        assert.ok(
            dashboardContent.includes('Dashboard Tim Riksa Uji') || dashboardContent.includes('Dashboard Tim RU'),
            'Dashboard title for isINS must use Tim Riksa Uji / Tim RU'
        );
        assert.ok(
            dashboardContent.includes('Beban Kerja Tim Riksa Uji (Tim RU)') ||
            dashboardContent.includes('Beban Kerja Tim RU'),
            'Manager dashboard workload header must use Tim RU'
        );
        assert.ok(
            dashboardContent.includes('Semua Personel Tim RU'),
            'Calendar dropdown must use Semua Personel Tim RU'
        );
    });

    it('8. JobDetailSheet displays Personel Tim RU instead of Inspektur Bertugas', () => {
        assert.ok(
            sheetContent.includes('Personel Tim RU Bertugas') ||
            sheetContent.includes('Tim Riksa Uji (Tim RU)'),
            'JobDetailSheet must display Tim RU terminology'
        );
    });
});
```

- [ ] **Step 2: Run test to verify RED state**
Run `node --test tests/tim_ru_and_role_dashboards_parity.test.js` and verify expected failures before changes.

---

### Task 2: Backend & Constants Role Aliasing for Tim RU

**Files:**
- Modify: `dnp-rework/app/Models/User.php:98-106`
- Modify: `dnp-rework/resources/js/Constants.js:28-35`

**Interfaces:**
- Consumes: User role checks.
- Produces: Safe recognition of `tim_ru`, `inspektur`, and `inspector` without touching schema tables.

- [ ] **Step 1: Update `User.php`**
Add `'tim_ru'` to `canOwnStage` array:
```php
if (in_array($this->role, ['inspektur', 'inspector', 'tim_ru']) && in_array($stage, [4, 5])) return true;
```

- [ ] **Step 2: Update `Constants.js`**
Add `tim_ru` to `ROLES` dictionary:
```javascript
export const ROLES = {
    marketing: { name: 'Marketing', label: 'MKT' },
    admin: { name: 'Admin Operasional', label: 'ADM' },
    inspektur: { name: 'Tim Riksa Uji', label: 'TRU' },
    tim_ru: { name: 'Tim Riksa Uji', label: 'TRU' },
    manager: { name: 'Manajer / Tim Ahli', label: 'MGR' },
    superadmin: { name: 'Superadmin', label: 'SA' },
    finance: { name: 'Finance / Keuangan', label: 'FIN' }
};
```

---

### Task 3: Tim RU & Manager Dashboard Logic Bugs & Terminology Fixes

**Files:**
- Modify: `dnp-rework/resources/js/Pages/Dashboard/Index.jsx`

**Interfaces:**
- Consumes: `lhppJobs`, `workloadByInspektur`.
- Produces: Corrected Stage 5 LHPP queue and accurate Manager workload calculations.

- [ ] **Step 1: Fix `lhppJobs` in `Index.jsx`**
Replace lines 118-124:
```javascript
// Tim RU specific: include Stage 5 (Penyusunan LHPP)
const lhppJobs = isINS ? personalFiltered.filter(j => 
    isAssignedToMe(j) && (j.stage === 5 || j.stage === 6)
)
```
Removing the obsolete `peer_review_status` check so Stage 2 bypassed jobs are not filtered out.

- [ ] **Step 2: Fix `lhppCount` in `workloadByInspektur`**
Replace line 167:
```javascript
const lhppCount = activeInspJobs.filter(j => j.stage === 5).length;
```

- [ ] **Step 3: Update Tim RU Terminology in `Index.jsx`**
- Line 286: `isINS ? 'Dashboard Tim Riksa Uji (Tim RU)' :`
- Line 760: `title={`${j.kode} - ${j.klien}\nTim RU: ${insList.map((u, idx) => `#${idx+1} ${u.name}`).join(', ') || 'Belum diassign'}`}`
- Line 798: `<option value="all">Semua Personel Tim RU</option>`
- Line 1119: `<div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Beban Kerja Tim Riksa Uji (Tim RU)</div>`
- Line 172: `nama: insp.user?.name || 'Personel Tim RU'`

---

### Task 4: Admin Dashboard Interactive Stage 2 & H-5 Queues

**Files:**
- Modify: `dnp-rework/resources/js/Pages/Dashboard/Index.jsx` (`AdmDashboard`)

**Interfaces:**
- Consumes: `antrianVerifikasi`, `h5Pending`, `onSelectJob`.
- Produces: Actionable tables for Admin to verify documents directly and handle H-5 Disnaker warnings.

- [ ] **Step 1: Add Stage 2 Interactive Table to `AdmDashboard`**
Insert interactive table for `antrianVerifikasi`:
```jsx
{/* Antrean Verifikasi Dokumen (Tahap 2) */}
<div className="bg-white border rounded-xl shadow-sm overflow-hidden">
    <div className="p-6 border-b flex justify-between items-center bg-amber-50/40">
        <div>
            <div className="text-xs text-amber-600 font-bold uppercase tracking-wider">Verifikasi Berkas Masuk · Tahap 02</div>
            <h3 className="text-lg font-bold text-gray-800 mt-0.5">Antrean Verifikasi Dokumen & Surat Permohonan</h3>
        </div>
        <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-2.5 py-1 rounded-full">
            {antrianVerifikasi.length} PEKERJAAN
        </span>
    </div>
    {antrianVerifikasi.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">
            ✓ Seluruh berkas Tahap 2 sudah diverifikasi.
        </div>
    ) : (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
                <thead>
                    <tr className="border-b bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                        <th className="p-4">Kode</th>
                        <th className="p-4">Klien</th>
                        <th className="p-4">Pesawat</th>
                        <th className="p-4">Unit</th>
                        <th className="p-4">Marketing</th>
                        <th className="p-4 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {antrianVerifikasi.map(j => (
                        <tr key={j.id} onClick={() => onSelectJob(j)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                            <td className="p-4 font-mono font-bold text-gray-800">{j.kode}</td>
                            <td className="p-4 font-semibold text-gray-700">{j.klien}</td>
                            <td className="p-4 text-gray-600">{PESAWAT_TYPES.find(p => p.code === j.pesawat)?.name || j.pesawat}</td>
                            <td className="p-4 text-gray-500 font-mono">{j.units || 1} unit</td>
                            <td className="p-4 text-gray-700 font-medium">{j.marketing?.name || '—'}</td>
                            <td className="p-4 text-right text-xs font-bold text-amber-600 hover:underline">
                                Verifikasi Dokumen &rarr;
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )}
</div>
```

- [ ] **Step 2: Add H-5 Disnaker Actionable Alert Table to `AdmDashboard`**
```jsx
{/* Peringatan H-5 Disnaker Table (if any active) */}
{h5Pending.length > 0 && (
    <div className="bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-red-50/60">
            <div>
                <div className="text-xs text-red-600 font-bold uppercase tracking-wider">Atensi Khusus Disnaker</div>
                <h3 className="text-lg font-bold text-red-800 mt-0.5">Daftar Job Peringatan H-5 Disnaker · Belum Lapor Teman K3</h3>
            </div>
            <span className="bg-red-200 text-red-900 text-xs font-extrabold px-2.5 py-1 rounded-full animate-pulse">
                {h5Pending.length} BUTUH LAPOR
            </span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
                <thead>
                    <tr className="border-b bg-red-50/30 text-gray-500 text-xs font-semibold uppercase">
                        <th className="p-4">Kode</th>
                        <th className="p-4">Klien</th>
                        <th className="p-4">Tanggal Pelaksanaan</th>
                        <th className="p-4">Surat Tugas</th>
                        <th className="p-4 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {h5Pending.map(j => (
                        <tr key={j.id} onClick={() => onSelectJob(j)} className="hover:bg-red-50/20 cursor-pointer transition-colors">
                            <td className="p-4 font-mono font-bold text-gray-800">{j.kode}</td>
                            <td className="p-4 font-semibold text-gray-700">{j.klien}</td>
                            <td className="p-4 font-mono text-red-700 font-bold">{formatDate(j.tgl_pelaksanaan)}</td>
                            <td className="p-4 font-mono text-gray-600">{j.no_surat_tugas || '—'}</td>
                            <td className="p-4 text-right text-xs font-bold text-red-600 hover:underline">
                                Buka Job & Lapor &rarr;
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
)}
```

---

### Task 5: JobDetailSheet Terminology Alignment

**Files:**
- Modify: `dnp-rework/resources/js/Components/JobDetailSheet.jsx:2820-2850`

**Interfaces:**
- Consumes: Job details display.
- Produces: Consistent display labels using "Personel Tim RU Bertugas" and "Tim Riksa Uji (Tim RU)".

- [ ] **Step 1: Replace Inspektur with Tim RU in JobDetailSheet**
Change:
- `Inspektur Bertugas:` $\to$ `Personel Tim RU Bertugas:`
- `Tim Inspektur:` $\to$ `Tim Riksa Uji (Tim RU):`

---

### Task 6: Verification, Full Test Suite & Vite Build

**Files:**
- None (Execution & Verification)

- [ ] **Step 1: Run Parity Test Suite**
`node --test tests/tim_ru_and_role_dashboards_parity.test.js` (Must pass 8/8 tests).

- [ ] **Step 2: Run Entire Test Suite**
`node --test tests/*.test.js` (Must pass 323/323 tests with 0 failures).

- [ ] **Step 3: Run Production Build**
`npm run build` at repository root (Must compile Vite assets cleanly).
