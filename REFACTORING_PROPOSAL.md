# DNP Monitor - Refactoring & Code Quality Audit

This document outlines structural refactoring recommendations for the **DNP Monitor** project. It addresses critical issues observed in development, deployment (based on the VPS setup logs), and the application architecture.

---

## 🚨 Critical Hotfix: VPS Permission & NVM Issue

Based on the server install logs (`vpserrordnp.txt`), there is a critical environmental issue during deployment:

### The Problem
1. **Permission Denied (`EACCES`)**: Running `npm install` as the standard `delta` user failed because the `node_modules` folder or parent directory was owned by a different user (likely `root`), preventing the creation of package folders.
2. **Wrong Node Version via `sudo`**: Bypassing the permission check by running `sudo npm install` bypassed the user's NVM environment. It defaulted to the global system Node.js version **`v12.22.9`**.
3. **Compilation Failure**: `better-sqlite3@12.x` requires Node.js **v20+** to compile its native bindings. Compiling on `v12.22.9` failed due to missing C++ API signatures (`GetCreationContext` in V8).

### The Solution
Never use `sudo npm install` under NVM. Instead, restore ownership of the project files to the deployment user and run npm install normally:

```bash
# 1. Change ownership of the project files to the deployment user 'delta'
sudo chown -R delta:delta /var/www/demo-dnp/demo-dnp

# 2. Verify you are using the correct Node.js version (should be v20.x+)
node -v

# 3. Clean up any broken installations
rm -rf node_modules package-lock.json

# 4. Install dependencies as the standard user (no sudo!)
npm install
```

---

## 🛠️ Backend Refactoring Proposals (`server/`)

### 1. Externalize Configurations via Environment Variables (`.env`)
**Current State**: Ports, database paths, and CORS origins are hardcoded.
* `server/index.js` hardcodes `PORT = 3001` and the development CORS origin (`http://localhost:5173`).
* `server/db.js` hardcodes `dnp.db` in the server root.

**Proposed Change**: Use `dotenv` to load configurations.
```javascript
// server/config.js
import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 3001;
export const DB_PATH = process.env.DB_PATH || './server/dnp.db';
export const CORS_ORIGINS = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:5173'];
```

### 2. Standardize Database Schema & Query Execution
**Current State**: 
The database uses a NoSQL-in-SQL design:
```sql
CREATE TABLE IF NOT EXISTS jobs (
  id          TEXT PRIMARY KEY,
  data        TEXT NOT NULL, -- JSON payload of the entire job
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
```
**Issues**:
- Since the entire job payload is stored in the `data` column as stringified JSON, you cannot easily perform server-side filters, searches, index queries (e.g. filter by stage, marketing owner, or PIC) without fetching all jobs and parsing them in Node.js memory.
- Over time, as the database grows, this will cause high CPU and RAM usage.

**Proposed Change**:
Extract core indexable fields into dedicated columns:
```sql
CREATE TABLE IF NOT EXISTS jobs (
  id               TEXT PRIMARY KEY,
  kode             TEXT UNIQUE NOT NULL,
  klien            TEXT NOT NULL,
  pesawat          TEXT NOT NULL,
  stage            INTEGER NOT NULL,
  nilai            INTEGER NOT NULL,
  owner_marketing  TEXT,
  tgl_pelaksanaan  TEXT,
  data             TEXT NOT NULL, -- Keep details as JSON
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
```

### 3. Implement Centralized Error-Handling Middleware
**Current State**: Every route handler wraps logic in local `try-catch` blocks and manually returns `res.status(500).json(...)`.
**Proposed Change**: Write a global error handling middleware and pass async errors using `next(error)`.

```javascript
// server/middleware/errorHandler.js
export default (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url} - ${err.stack}`);
  res.status(err.status || 500).json({
    ok: false,
    error: err.message || 'Internal Server Error'
  });
};
```

---

## 🎨 Frontend Refactoring Proposals (`src/`)

### 1. Split `App.jsx` (Currently 7,000+ Lines)
**Current State**: The entire frontend resides in `src/App.jsx`. It contains constant lookups (like standard forms, regulation lists, inspector details), helper utilities, custom routing, stateful sheets/modals, and layout containers.

**Proposed Folder Structure**:
```
src/
├── constants/
│   ├── safetyRegs.js        # REGULASI_K3, FORM_CHECKLIST_STANDARD
│   ├── equipment.js         # ALAT_INVENTORY
│   ├── inspectors.js        # INSPEKTUR_LIST, PESAWAT_SPESIALISASI
│   └── stages.js            # STAGES, ROLES, STAGE_PERMISSIONS
├── utils/
│   ├── formatting.js        # formatRp, formatDate, formatDateTime
│   ├── dateUtils.js         # daysBetween, today
│   └── algorithms.js        # recommendInspektur, hasScheduleConflict
├── components/
│   ├── common/              # Button, Badge, Modal, FormInput
│   ├── dashboard/           # MarketingDashboard, FinanceDashboard, AdminDashboard
│   ├── jobs/                # JobCard, JobDetailSheet, VerificationList
│   └── layout/              # Sidebar, Header
├── hooks/
│   └── useJobs.js           # Custom hook encapsulating API fetch/save logic
├── App.jsx                  # Main wrapper coordinating top-level view states
└── main.jsx
```

### 2. Introduce React Context or State Management (Zustand)
**Current State**: Shared states (like active filters, jobs list, current logged-in role) are passed down through multiple levels of components (prop drilling) or handled in a single giant tree in `App.jsx`.
**Proposed Change**: Use `Zustand` for lightweight, low-boilerplate state management:

```javascript
// src/store/useJobStore.js
import { create } from 'zustand';

export const useJobStore = create((set) => ({
  jobs: [],
  isLoading: false,
  filters: { search: '', stage: null, role: null },
  setJobs: (jobs) => set({ jobs }),
  setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  fetchJobs: async () => {
    set({ isLoading: true });
    const res = await fetch('/api/jobs');
    const data = await res.json();
    set({ jobs: data.ok ? data.jobs : [], isLoading: false });
  }
}));
```

### 3. Replace Custom State-Based Navigation with `react-router-dom`
**Current State**: Navigation is simulated by updating state variables (e.g. `const [view, setView] = useState('dashboard')`).
**Issues**:
- Back button/forward button in browser doesn't work.
- Cannot bookmark specific jobs or screens (e.g. `/jobs/demo-1`).
- Reloading the page resets the user to the default screen.

**Proposed Change**: Install `react-router-dom` and route natively:
* `/` -> Overview Dashboard
* `/jobs` -> Active Jobs Pipeline
* `/jobs/:id` -> Single Job Detail Pane
* `/admin/inspectors` -> Inspector Registry & Availability

---

## 📈 Tooling & DX (Developer Experience) Improvements

1. **Migrate to TypeScript**:
   The domain models in K3 (Stages, Jobs, Inspectors, Suket certificates) have strict relationships, validation limits (like `MAX_FILE_SIZE`), and nullable values. Migrating to TypeScript prevents runtime crashes when parsing database JSON records.
2. **Move LocalStorage Session Sync to HTTP Sessions/Tokens**:
   Authentication credentials should be handled via HTTP cookies or proper session checks against the database, rather than trusting unencrypted `localStorage` states directly in client-side code.
