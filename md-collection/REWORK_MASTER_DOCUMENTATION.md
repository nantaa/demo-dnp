# DNP Riksa Uji Monitor — `dnp-rework` Master End-to-End Documentation

> **Project Target:** `dnp-rework` (Laravel 11 + Inertia.js + React 18 + Vite 5)  
> **Repository:** `demo-dnp` (`d:\Download Backup\Lovable\dnp-monitor`)  
> **Version:** 2.0-Production (12-Stage Riksa Uji Pipeline System)  
> **Last Updated:** August 2026  

---

## 1. Executive Summary & Project Background

### 1.1 Business Purpose
**PT Delta Nusantara Persada (DNP)** operates in the field of Occupational Safety & Health Testing and Inspection (**PJK3 Riksa Uji**). The **DNP Riksa Uji Monitor** application manages the complete end-to-end lifecycle of technical inspection jobs—from initial purchase orders (PO/SPK), document verification, inspector scheduling, field inspection execution, LHPP drafting, technical review, Disnaker submission, Suket issuance, billing, to client handover and payment closure.

### 1.2 The Rework Imperative: Prototype vs Production
* **Legacy Prototype (`dnp-monitor` v1.0)**:
  * Built as a ~7,000-line monolithic React Single-Page Application (`App.jsx`) powered by a custom Node.js Express server and SQLite database.
  * **Core Shortcomings**:
    1. *Unvalidated Data Injection*: Express API blindly saved unvalidated JSON strings directly into SQLite columns (`INSERT INTO jobs VALUES (?, JSON.stringify(job))`).
    2. *Performance Bottlenecks*: Monolithic state meant any minor input trigger re-rendered the entire 7,000-line component tree, leading to lag on mobile devices.
    3. *Lack of Schema Control*: Hardcoded `CREATE TABLE IF NOT EXISTS` with zero migration tools, risking data corruption during structural updates.
    4. *Insecure Auth*: Relied on `localStorage` key-value pairs without HTTP-only cookie or session validation.

* **Production Stack Rework (`dnp-rework` v2.0)**:
  * Architecture choice: **Laravel 11 + Inertia.js + React 18 + Vite 5**.
  * **Key Upgrades**:
    1. *Zero API Plumbing*: Inertia.js acts as the seamless bridge, letting Laravel controllers pass typed props directly to React page components without separate REST API boilerplate.
    2. *Relational Schema Integrity*: 30 structured Eloquent migration files with PostgreSQL/SQLite compatibility, proper foreign keys, indexed query columns, and JSON columns (`JSONB` in Postgres).
    3. *Role-Based Security*: Server-side authentication, middleware authorization (`user_stage_permissions`), and strict field validation.
    4. *Automated Document Generator*: Server-side `.docx` generation using PHPWord for Surat Tugas and field inspection forms.

---

## 2. Architecture & Technical Stack Rework

```
                             Architecture Overview
                             
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 BROWSER CLIENT                                  │
│   React 18 Pages (Inertia.js) ── Modal Dialogs ── Card View ── Mobile Nav      │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │ Inertia JSON Request / Props
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                LARAVEL 11 SERVER                                │
│   Middleware & Router (web.php) ── Auth & Stage Permission Guards (RBAC)         │
│   Controllers: JobController ── InventoryController ── UserController          │
│   Document Engine: PHPWord (Surat Tugas & Form Riksa Uji .docx Generation)      │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │ Eloquent ORM / SQL Queries
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             DATABASE (PostgreSQL / SQLite)                       │
│   dnp_jobs ── job_documents ── job_evaluations ── units_tracking ── alat_ujis   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Technical Stack Comparison
| Layer | Legacy Prototype | Rework Production (`dnp-rework`) | Benefit |
|---|---|---|---|
| **Backend Framework** | Node.js + Express.js | **Laravel 11.x (PHP 8.2+)** | Enterprise ORM, built-in validation, secure session auth |
| **Frontend Adapter** | Custom REST Fetch | **Inertia.js v1.x** | Eliminates manual state sync & API endpoint boilerplate |
| **Frontend UI** | Monolithic `App.jsx` | **Modular React 18 + Vite 5** | High-performance component splitting & instant HMR |
| **Database** | Raw SQLite JSON Blobs | **PostgreSQL / SQLite** | Relational integrity, MVCC concurrency, indexable fields |
| **Document Generator** | Client-side export | **PHPWord (`TemplateProcessor`)** | Accurate server-side `.docx` formatting with dynamic tags |
| **Styling** | Custom CSS | **Tailwind CSS + Glassmorphism** | Modern, responsive, mobile-first design |

---

## 3. Database Migration Timeline & Schema Evolution

Between January 2026 and August 2026, 30 migrations were created to structure and enhance the schema.

### 3.1 Migration Changelog Summary
1. `2026_01_01_000010_create_dnp_monitor_schema.php`: Core schema creation (`dnp_jobs`, `job_documents`, `job_history`, `user_stage_permissions`, `job_evaluations`, `units_tracking`, `disnaker_followups`).
2. `2026_01_01_000011_create_inspector_profiles_table.php`: Created `inspector_profiles` table linking users to SKP K3 numbers, specializations, and seniority levels.
3. `2026_06_24_000000_create_master_data_tables.php`: Added `alat_ujis`, `sertifikat_pjk3s`, and `master_templates` tables.
4. `2026_07_01` to `2026_07_06`: Fixed stage permission ownership flags, converted `job_inspectors` pivot user IDs to bigint, added scheduling fields (`tgl_h5`, `h5_confirmed`).
5. `2026_07_07`: Added Stage 4 actual unit counts, `returned_from_stage` history tracking, swapped Stages 5 & 6 order, added review fields (`s5_review_decision`), Disnaker submission dates (`tgl_submit_disnaker`), Suket progress status, invoice billing fields, and Marketing submit dates (`tgl_submit_mkt`).
6. `2026_08_19`: Added `s2_verify_data` JSON persistence column for real-time document verification, seeded 23 complete technical testing tools in `alat_ujis`, updated calibration expiry tracking.
7. `2026_08_21`: Added Stage 4 field inspection checklist (`s4_checklist`), Stage 7 physical bundle checklist (`s7_bundel_checklist`), Stage 8 progress status tracking (`s8_progress_status`).
8. `2026_08_24`: Added phone numbers to `users` table, established real-time web `notifications` system table.
9. `2026_08_26`: Added inspector credential file uploads (`skp_files`), SKP license expiry details, and natural template sorting by `kode_form`.

### 3.2 Key Entity Schemas

#### `dnp_jobs` (Primary Workflow Table)
* `id` (UUID Primary Key)
* `kode` (string, unique sequential e.g. `DNP/2026/0042`)
* `klien` (string, searchable)
* `lokasi` (string, format `"Kota, Provinsi"`)
* `pesawat` (string(100), e.g. `FIRE`, `PV`, `LIFT`, `CRANE`)
* `units` (integer, contractual unit count)
* `actual_units` (integer, field verified count)
* `nilai` (decimal 15,2, contract value in IDR)
* `no_po` (string, PO/SPK reference)
* `stage` (smallint, 1 through 12)
* `owner_marketing` (string)
* `s2_verify_data` (JSON, verification checklist states)
* `tgl_pelaksanaan`, `jam_mulai`, `durasi_hari`, `disnaker_tujuan` (date/string, Stage 3 scheduling)
* `s5_review_decision` (`approved` | `approved_conditional` | `rejected`)
* `s5_review_notes`, `s5_reviewed_by`, `s5_reviewed_at`
* `tgl_submit_disnaker`, `disnaker_deadline_at`, `disnaker_sla_status`
* `invoice_no`, `total_invoice_amount`, `tgl_invoice_issued`, `top_days`, `payment_status`, `paid` (boolean), `payment_paid_at`

#### `job_evaluations` (Per-Unit Technical Evaluations - Stage 5)
* `id` (bigint PK), `job_id` (FK uuid → `dnp_jobs`)
* `unit_no` (integer, 1..N)
* `unit_label` (string, e.g. "Boiler Unit A")
* `status` (`laik` | `laik_bersyarat` | `tidak_laik`)
* `findings` (text), `recommendation` (text)

#### `units_tracking` (Per-Unit Suket Issuance - Stage 8 & 9)
* `id` (bigint PK), `job_id` (FK uuid → `dnp_jobs`)
* `unit_no` (integer), `unit_label` (string)
* `no_suket` (string), `tgl_suket` (date), `suket_validity_months` (integer)
* `suket_expired_at` (date, indexed for expiry reminder engine)
* `status` (`pending` | `submitted` | `issued` | `rejected`)

#### `alat_ujis` (Testing Equipment Master Inventory)
* `id` (bigint PK), `kode_alat` (string unique), `nama` (string), `merk` (string), `tipe` (string), `serial` (string)
* `kategori` (JSON array e.g. `["Listrik"]`, `["Umum"]`)
* `kalibrasi_terakhir` (date), `kalibrasi_expired` (date)
* `lab` (string e.g. `B4T`, `Sucofindo`), `status` (`tersedia` | `dipakai`)

---

## 4. End-to-End 12-Stage Riksa Uji Workflow Specification

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                               12-STAGE WORKFLOW PIPELINE                                    │
│                                                                                             │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐         │
│  │ 1. PO / SPK  │ ───► │ 2. Verifikasi│ ───► │3. Penjadwalan│ ───► │4. Pelaksanaan│         │
│  │ (Marketing)  │      │ (Admin/MGR)  │      │   (Admin)    │      │ (Inspektur)  │         │
│  └──────────────┘      └──────────────┘      └──────────────┘      └──────┬───────┘         │
│                                                                           │                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐             │ Unit Mismatch   │
│  │ 8. Disnaker  │ ◄─── │7. Serah Dsnkr│ ◄─── │  6. Review   │ ◄─── ┌──────▼───────┐         │
│  │ (Admin SLA)  │      │  (Manager)   │      │ (Manager RU) │      │  5. LHPP     │         │
│  └──────┬───────┘      └──────────────┘      └──────────────┘      │  (Admin)     │         │
│         │                                                          └──────────────┘         │
│  ┌──────▼───────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐         │
│  │  9. Suket    │ ───► │10. Penagihan │ ───► │11. Serah Sukt│ ───► │ 12. Closed   │         │
│  │   (Admin)    │      │  (Finance)   │      │ (Marketing)  │      │  (Finance)   │         │
│  └──────────────┘      └──────────────┘      └──────────────┘      └──────────────┘         │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Stage Matrix

| # | Stage Name | Primary Role Owner | Input Requirements & Key Operations | Auto-Generated / Calculated Fields | Advance Gate Criteria |
|---|---|---|---|---|---|
| **1** | **PO / SPK** | Marketing | Klien, Lokasi (514 dropdown), Pesawat, Units, Nilai Kontrak, No PO/SPK, Tanggal PO, PIC details. Upload scan PO/SPK, Surat Permohonan, or Surat Kuasa. | `kode` (`DNP/YYYY/####`), `stage=1`, `stage_started_at` | Minimum 1 valid uploaded document (`PO/SPK`, `Surat Permohonan`, `Surat Kuasa`). |
| **2** | **Verifikasi Dokumen** | Admin | Verify document completeness checklist (8 items). Store checklist choices into `s2_verify_data` real-time JSON via `POST /jobs/{job}/s2-verify`. | Real-time `s2_verify_data` persistence. Bypass tracking (`peer_review_status`). | All mandatory document types present OR Manager bypass approval (`peer_review_status = 'approved'`). |
| **3** | **Penjadwalan** | Admin | Set `tgl_pelaksanaan`, `jam_mulai`, `durasi_hari`, `disnaker_tujuan`. Assign inspector(s) via `job_inspectors` pivot. Select `alat_ids` & `cert_ids`. | Auto-calculates `tgl_h5` (`tgl_pelaksanaan - 5 days`). `h5_confirmed` logic. | Date, time, duration, Disnaker target, and at least 1 assigned inspector filled. |
| **4** | **Pelaksanaan Lapangan** | Inspektur | Execute field inspection. Input `actual_units`. Complete digital checklist. Upload field photos + scan signed BAP. Access **Document Generator Hub** (Surat Tugas & Form Riksa Uji download). | If `actual_units != units`, system blocks and redirects to Marketing via `return-to-stage1`. | `actual_units` recorded & matches contract units. |
| **5** | **Penyusunan LHPP** | Admin | Draft LHPP & BAP documents. Fill per-unit evaluation matrix (`job_evaluations`: unit label, status `laik`/`laik_bersyarat`/`tidak_laik`, findings, recommendations). | Aggregate `laik_status` derived automatically across all units. | Uploaded `LHPP` + `BAP` documents AND all units evaluated in `job_evaluations`. |
| **6** | **Review Laporan Teknis** | Manager (Kadiv RU) | Review LHPP & BAP. Submit decision (`approved`, `approved_conditional`, or `rejected`) with notes. | `s5_reviewed_by`, `s5_reviewed_at`. Rejection sends job back to Stage 5. | Decision = `approved` or `approved_conditional`. |
| **7** | **Penyerahan ke Disnaker** | Manager (Kadiv RU) | Prepare physical document bundle (Group A client docs, Group B PJK3 docs, Group C cover/binding). Input `tgl_submit_disnaker`. | `disnaker_deadline_at` set to `tgl_submit_disnaker + 30 days`. | `tgl_submit_disnaker` recorded. |
| **8** | **Proses Disnaker** | Admin | Track 30-day SLA countdown. Log Disnaker follow-ups every 7 days in `disnaker_followups`. Record `tgl_doc_submitted_disnaker`. Upload Disnaker receipt. | `disnaker_sla_status` (`on_track`, `last_day`, `overdue`). Warning if follow-up ≥ 7 days. | Document submission date recorded; Disnaker processing underway. |
| **9** | **Pengurusan Suket** | Admin | Record issued Suket number (`no_suket`), terbit date, and validity months per unit in `units_tracking`. Track progress status (`s9_progress_status`). | Auto-calculates `suket_expired_at`. H-90 reminder engine enabled. | **Otomatis advance** to Stage 10 when ALL units in `units_tracking` reach status `issued`. |
| **10** | **Penagihan** | Finance | Issue invoice. Input `invoice_no`, `total_invoice_amount`, `invoice_date`, `top_days`, `tgl_submit_mkt`. Upload Invoice PDF. | `payment_due_date` calculated (`invoice_date + top_days`). **Enforces PDF-only upload**. | Mandatory Invoice PDF uploaded + invoice billing details recorded. |
| **11** | **Penyerahan Suket ke Klien** | Marketing | Hand over original Suket to client. Input `tgl_submit_mkt`. Upload signed receipt proof (`Tanda Terima Suket`). | Exclusive Marketing stage. MGR cannot intercept. | `tgl_submit_mkt` recorded. |
| **12** | **Lunas / Closed** | Finance | Confirm full payment. Set `paid = true`, input `payment_amount_received` & `payment_paid_at`. Upload transfer proof / receipt. | Final closed pipeline state. Job marked as completed archive. | `paid = true`, `payment_amount_received > 0`, `payment_paid_at` recorded. |

---

## 5. Role-Based Access Control (RBAC) & Security Matrix

The system implements multi-layered access permissions combining primary roles and stage ownership tables (`user_stage_permissions`).

### 5.1 Permission Matrix
| Role | Stage Ownership | Access Privileges & Restrictions |
|---|---|---|
| `marketing` | Stage 1, Stage 11 | **Exclusive ownership** of Stages 1 & 11. Manager cannot intercept. Exclusive access to "+ Job Baru". |
| `admin` | Stage 2, 3, 5, 8, 9 | Manages document verification, scheduling, LHPP drafting, Disnaker tracking, and Suket registration. |
| `inspektur` | Stage 4 | **Job-level lock**: Only inspectors assigned to the specific job via `job_inspectors` pivot can view and edit Stage 4. |
| `manager` (Kadiv RU) | Stage 6, Stage 7 | Review authority, Disnaker submission authority, and Stage 2 bypass approval. Restricted from creating jobs. |
| `finance` | Stage 10, Stage 12 | **Exclusive ownership** of billing, invoice PDF uploads, and payment settlement closure. |
| `superadmin` | All Stages (1–12) | Unrestricted global access, configuration, user management, and manual stage overrides. |

### 5.2 Dynamic UI Guards & Restrictions
- **"+ Job Baru" Menu**: Restricted in `AppLayout.jsx` strictly to `roles: ['marketing', 'superadmin']`. Hidden from `manager`, `admin`, `inspektur`, and `finance`.
- **"Pekerjaan Saya / Semua Job" Header Toggle**: Restricted in `Dashboard/Index.jsx` to `role === 'manager'` and `superadmin`. Standard operators only see jobs relevant to their assigned stages.

---

## 6. Automated Document Generator Engine

To streamline field operations for Ahli K3 and Petugas Riksa Uji, `dnp-rework` incorporates an automated server-side Word document engine powered by **PHPWord**.

### 6.1 Generated Field Documents
1. **Surat Tugas (`.docx`)**:
   - Route: `GET /jobs/{job}/download-surat-tugas`
   - Generated dynamically from template `storage/app/templates/surat_tugas_template.docx`.
   - Replaces tags `${KODE_JOB}`, `${NAMA_KLIEN}`, `${LOKASI}`, `${PESAWAT}`, `${UNITS}`, `${TGL_PELAKSANAAN}`, and `${TIM_INSPEKTUR}`.
2. **Form Riksa Uji / Inspection Checklist (`.docx`)**:
   - Route: `GET /jobs/{job}/download-form-riksauji`
   - Pre-fills technical inspection fields tailored to equipment category (`FIRE`, `PV`, `LIFT`, `CRANE`, `BOILER`).
3. **Inspector Credentials Download**:
   - Direct download links for attached SKP/Lisensi documents from `inspector_profiles`.

---

## 7. Major Bug Fixes, UI/UX Refinements & Optimizations

During the rework development phase, several critical technical issues were resolved:

1. **Inertia HTTP 303 Redirect Fix**:
   - *Issue*: Standard `redirect()->back()` after deleting a job triggered Inertia `MethodNotAllowedHttpException` (HTTP 405) because Inertia expects an HTTP 303 See Other status code for non-GET requests.
   - *Fix*: Updated `JobController@destroy` and `@clearAll` to explicitly return `redirect()->route('dashboard')->with('success', '...')->setStatusCode(303)`.
2. **Job Code Generation Unique Constraint Violation Fix**:
   - *Issue*: Sequential job code generator (`DNP/2026/XXXX`) queried max integer ID, which produced duplicate code errors if recent jobs were deleted.
   - *Fix*: Updated generator logic in `JobController` to extract max numerical suffix from existing `kode` strings (`MAX(CAST(SUBSTRING_INDEX(kode, '/', -1) AS UNSIGNED))`).
3. **Master Template Natural Sorting**:
   - *Issue*: Document templates in Master Data were sorted lexicographically, placing `FM-PJK3-RIKU-010` before `FM-PJK3-RIKU-002`.
   - *Fix*: Applied natural language sorting (`ORDER BY kode_form NATURALSORT`) in `InventoryController`.
4. **Mobile & Field UI Overhaul**:
   - Added responsive hamburger drawer navigation, sticky bottom mobile action bar, full-screen inspection modals, and touch-optimized card list views for field inspectors on mobile devices.

---

## 8. VPS Production Deployment & Operations SOP

The production system is deployed on an Ubuntu Server VPS behind an Nginx reverse proxy.

### 8.1 Build & Deployment Architecture
- **Web Server**: Nginx (Port 80/443) handling SSL termination and static asset serving (`public/build`).
- **Application Process**: PHP 8.2+ FPM (or PM2 Node wrapper for Vite SSR if enabled).
- **Vite & Node Build Compatibility Pinning**:
  - `vite` pinned to `^5.4.0` in `package.json` to ensure compatibility with Node 18/20 on Ubuntu VPS.
  - `esbuild` pinned to `0.24.0` to resolve `AggregateErrorIntoJsError` during VPS production compilation.

### 8.2 Continuous Deployment SOP
```bash
# Connect to VPS
ssh root@vps_ip_address

# Navigate to application root
cd /var/www/dnp-monitor/dnp-rework

# Pull latest commits
git pull origin main

# Install PHP dependencies
composer install --no-dev --optimize-autoloader

# Run database migrations
php artisan migrate --force

# Install Node dependencies & build production assets
npm install
npm run build

# Clear and optimize Laravel cache
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 8.3 Automated Database Backup Script (`backup.sh`)
```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/www/dnp-monitor/backups"
mkdir -p "$BACKUP_DIR"

# Perform safe database dump
sqlite3 /var/www/dnp-monitor/dnp-rework/database/database.sqlite ".backup '$BACKUP_DIR/dnp_backup_$TIMESTAMP.sqlite'"
gzip "$BACKUP_DIR/dnp_backup_$TIMESTAMP.sqlite"

# Retention: Remove backups older than 30 days
find "$BACKUP_DIR" -type f -name "*.sqlite.gz" -mtime +30 -delete
```

---

*End of Document — DNP Riksa Uji Monitor `dnp-rework` Master End-to-End Documentation v2.0*
