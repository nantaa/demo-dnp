# DNP Monitor - Deep Refactoring & Tech Stack Rework Proposal

This document extends the initial refactoring audit with deeper architectural insights and proposes alternative technology stacks to rework the 7,000-line React prototype into a robust, high-performance production system.

---

## Part 1: Additional Refactoring Discoveries (Beyond `REFACTORING_PROPOSAL.md`)

While the initial proposal covered structural splitting (files, state, routing) and environment setup, a deeper look reveals critical performance and security gaps in the current Node.js + React implementation:

### 1. Missing Input Validation & API Security (Critical)
* **Current State**: The Express API blindly accepts incoming JSON and saves it directly to SQLite: `INSERT INTO jobs ... VALUES (?, JSON.stringify(job))`. 
* **The Risk**: Zero payload validation. A malformed request or malicious payload could corrupt the K3 records or inject harmful data. 
* **Refactoring Needed**: Implement an input validation layer (e.g., **Zod** or **Joi**) on the backend to enforce strict types for `pesawat`, `stage`, and `documents` before hitting the database.

### 2. Frontend Performance: Excessive Re-renders
* **Current State**: A single massive `App.jsx` holding all state means any minor state change (like typing in a search bar or toggling a dropdown) likely triggers a re-render of the entire 7,000-line DOM tree.
* **The Risk**: Noticeable UI lag, high memory usage in the browser, and battery drain on mobile devices.
* **Refactoring Needed**: Wrap expensive components in `React.memo()`, use `useMemo` for heavy data filtering, and implement **virtualization** (e.g., `react-window`) for long lists of jobs or inspectors.

### 3. Lack of Database Migration System
* **Current State**: The schema is hardcoded with `CREATE TABLE IF NOT EXISTS` in `db.js`.
* **The Risk**: When the data model needs to change (e.g., adding a new column for notifications), there is no safe, version-controlled way to migrate the production SQLite database.
* **Refactoring Needed**: Integrate a migration tool like **Knex.js** or an ORM like **Prisma** to manage schema changes safely.

### 4. Authentication Vulnerability
* **Current State**: The system relies on `localStorage` and a generic Key-Value pair (`app:user`) in SQLite.
* **Refactoring Needed**: Implement secure HTTP-only cookies with JWTs or server-side sessions to properly secure the K3 data.

---

## Part 2: Rework Proposal - Alternative Tech Stacks

The current architecture (SPA React + Custom Node/Express API + SQLite JSON blobs) requires a lot of manual plumbing (routing, state management, API writing, ORM setup). Reworking the project into an established, opinionated framework will drastically improve smoothness, maintainability, and VPS performance.

Here are the top three proposed architectures for the rework:

### Option 1: Laravel + Inertia.js + React/Vue (🌟 Highly Recommended)
*Given the project's requirement to run exclusively on a private VPS and handle complex relational data (Jobs, Inspectors, Clients), this is the most robust choice.*

* **How it works**: Laravel serves as the backend, handling routing, database, and auth. Inertia.js acts as the glue, allowing you to build the frontend as standard React (or Vue) components without needing to write a separate API layer.
* **Why it's smoother**:
  * **No API Plumbing**: You pass data directly from Laravel controllers to React components.
  * **First-Class PostgreSQL Support**: Laravel has native, out-of-the-box support for PostgreSQL. Switching from SQLite to Postgres is as simple as updating your `.env` configuration file on the VPS:
    ```ini
    DB_CONNECTION=pgsql
    DB_HOST=127.0.0.1
    DB_PORT=5432
    DB_DATABASE=dnp_monitor
    DB_USERNAME=dnp_user
    DB_PASSWORD=your_secure_password
    ```
  * **PostgreSQL for Massive Scaling**: 
    * **Concurrency**: Unlike SQLite, which locks the entire database file during a write operation, PostgreSQL uses Multi-Version Concurrency Control (MVCC) with row-level locking, meaning it can easily handle thousands of concurrent read/write actions as the database grows massive.
    * **Advanced JSONB Support**: Because the current prototype stores K3 data (documents, evaluations) as unstructured JSON, PostgreSQL's native `JSONB` columns allow you to store these objects while still indexing and querying keys *inside* the JSON using GIN indexes.
    * **Robust Indexing & Partitioning**: Easily handle millions of rows by adding indexes or table partitioning directly in Laravel migration files.
  * **Eloquent ORM & Migrations**: Laravel's ORM and migration system will easily untangle your SQLite JSON blobs into properly structured Postgres tables, letting you run database migrations via simple command line utilities (`php artisan migrate`).
  * **VPS Friendly**: PHP-FPM and Nginx are incredibly stable and memory-efficient on a VPS compared to managing long-running Node.js processes with PM2.
  * **Built-in Auth & Validation**: Laravel provides bulletproof authentication, session management, and request validation out of the box.

### Option 2: Next.js (App Router) + Prisma ORM
*If the team wants to remain 100% in the React/JavaScript ecosystem.*

* **How it works**: A full-stack React framework where the backend API and frontend live in the same codebase.
* **Why it's smoother**:
  * **Server-Side Rendering (SSR)**: Initial page loads are instant because HTML is generated on the server, drastically reducing the massive client-side JavaScript bundle present in the current prototype.
  * **Prisma ORM**: Provides type-safe database queries and an excellent migration system for your SQLite database.
  * **Simplified Deployment**: Next.js can be built into a standalone Node server that runs beautifully behind Nginx on a VPS.

### Option 3: Go (Golang) API + React SPA
*If raw performance, concurrency, and minimal server resources are the absolute top priorities.*

* **How it works**: The backend is rewritten in Go, providing a blazing-fast JSON API. The frontend remains a React SPA (built with Vite), completely decoupled from the backend.
* **Why it's smoother**:
  * **Extreme Performance**: Go compiles to a single binary. It uses a fraction of the RAM that Node.js uses, making it perfect for small VPS environments.
  * **Strict Typing**: Go's strong typing ensures that data payloads (Jobs, Documents, Evaluations) are strictly enforced before hitting the database.
  * **Simple Deployment**: You just upload the single compiled Go executable to the VPS and run it via systemd. No Node.js runtime or PM2 required.

### 💡 Recommendation Summary

If the goal is to transform this 7,000-line prototype into a secure, production-ready system rapidly:
**Choose Laravel + Inertia.js**. It eliminates the overhead of managing a separate API, provides world-class database tooling, and aligns perfectly with traditional VPS hosting, all while allowing you to reuse your existing React UI components.
