# Developer Sprint Handover Documentation: `dnp-rework`

> **Target Version:** 2.0-Production (12-Stage Riksa Uji Pipeline System)
> **Stack:** Laravel 11, Inertia.js (React 18 + Vite 5), PostgreSQL/SQLite
> **Purpose:** Granular component-by-component, input-by-input, and handler-by-handler technical specification for developers.

---

## Section 1: Application Architecture & State Management

### 1.1 Inertia.js Page Lifecycle & Shared Props
`dnp-rework` uses Inertia.js to seamlessly pass data from Laravel controllers to React components without REST API overhead.
* **Shared Props**: Defined in `HandleInertiaRequests.php` middleware. Available globally via `usePage().props`.
  * `auth.user`: Current authenticated user (ID, name, email, role).
  * `auth.permissions`: Array of `user_stage_permissions` mapping stage ownership and view rights.
  * `flash`: Session flash messages (`success`, `error`, `info`) for toast notifications.
  * `errors`: Server-side validation errors mapped directly to form inputs.
* **Global Shell**: `AppLayout.jsx` wraps all pages, managing the sidebar, header, mobile drawer, and notification bell states.

---

## Section 2: Comprehensive Component & Button-by-Button Catalog

### 2.1 `AppLayout.jsx` (Global Navigation Shell)
* **Sidebar Menu Links**: Standard Inertia `<Link>` components routing to `/dashboard`, `/jobs`, `/kanban`, `/alat-skp`, `/reminder-suket`, `/pelaporan`, `/users`.
* **`+ Job Baru` Button**:
  * **Visibility Guard**: `roles: ['marketing', 'superadmin']`. Hidden from all other roles.
  * **Handler**: `router.visit('/jobs/create')`.
* **`NotificationBell.jsx` Popover**:
  * **Badge**: Unread notifications counter fetched dynamically.
  * **Trigger**: Click toggles the dropdown popover list of notifications.
  * **Action Button**: `Mark All as Read` triggers `POST /notifications/read-all` and resets badge state.
* **User Profile & Logout Dropdown**:
  * **UI**: Displays user avatar, name, and active role badge.
  * **Trigger**: Click opens profile dropdown.
  * **Action Button**: `Logout` triggers `POST /logout` (handled by standard Laravel Breeze auth).
* **Mobile Hamburger Toggle**: Expands/collapses mobile sidebar drawer.

### 2.2 `JobDetailSheet.jsx` (12-Stage Core Panel — 114 KB Component)
This is the most complex component, acting as a dynamic modal for job processing.
* **Header**: Displays Job Code (`DNP/YYYY/####`), Client Name, Equipment Badge, Stage Status Badge, and Close `X` button.
* **Stage Navigation Tabs**: Horizontal scrollable tabs (Stages 1–12). Click switches the active panel state.

#### Stage 1 (PO/SPK Panel)
* **Inputs**:
  * `Client Name` (Text)
  * `Location` (Dropdown via `IndonesiaLocationSelect.jsx`)
  * `Pesawat` (Category Dropdown)
  * `Units` (Number input)
  * `Contract Value` (IDR formatted text input)
  * `PO Number` (Text), `PO Date` (Date Picker)
* **Dropzone**: File uploaders for Scan PO/SPK, Surat Permohonan, Surat Kuasa.
* **Action Button**: `Lanjutkan ke Stage 2`. Triggers `POST /jobs/{job}/advance`.

#### Stage 2 (Verifikasi Dokumen Panel)
* **Checklist Actions**:
  * Buttons `OK`, `Tidak`, `NA` for each document requirement.
  * **Handler**: Saves state in real-time to `s2_verify_data` column via `POST /jobs/{job}/s2-verify`.
* **Action Button**: `Request Bypass Manager`. Triggers update setting `peer_review_status = 'requested'`.
* **Action Button**: `Lanjutkan ke Stage 3`. Advances stage.

#### Stage 3 (Penjadwalan Panel)
* **Inputs**: `Execution Date` (Date), `Start Time` (Time), `Duration` (Number, days), `Target Disnaker` (Text).
* **Multi-selects**:
  * `Inspectors`: Uses `job_inspectors` pivot.
  * `Tools (alat_ids)`: Selects from master inventory.
  * `PJK3 Certificates (cert_ids)`: Selects from master certs.
* **Action Button**: `Rekomendasi Inspektur` Modal Trigger. Opens `SmartRecommendation.jsx`.
* **Action Button**: `Lanjutkan ke Stage 4`.

#### Stage 4 (Pelaksanaan Lapangan Panel)
* **Input**: `actual_units` (Number). Must match contractual units.
* **Action Button**: `Kembalikan ke Stage 1`. Appears if `actual_units != units`. Triggers `POST /jobs/{job}/return-to-stage1`.
* **Checkboxes**: Digital field checklist (`nameplate`, `visual`, `pengaman`, `bap`).
* **Dropzone**: Photo upload with `photo_notes` text input. BAP upload.
* **Document Generator Hub Buttons**:
  * `Download Surat Tugas`: Triggers `GET /jobs/{job}/download-surat-tugas`.
  * `Download Form Riksa Uji`: Triggers `GET /jobs/{job}/download-form-riksauji`.
  * `Download Credentials`: Links to inspector SKP files.
* **Action Button**: `Lanjutkan ke Stage 5`.

#### Stage 5 (Penyusunan LHPP Panel)
* **Per-Unit Matrix**:
  * `Unit Label` (Text), `Status` (Dropdown: `laik`/`laik_bersyarat`/`tidak_laik`), `Findings` (Textarea), `Recommendations` (Textarea).
* **Dropzone**: LHPP PDF & BAP uploads.
* **Action Button**: `Lanjutkan ke Stage 6`.

#### Stage 6 (Review Laporan Teknis Panel)
* **Inputs**:
  * Manager Decision Radios: `Approved`, `Approved Conditional`, `Rejected`.
  * Review Notes: Textarea.
* **Action Button**: `Submit Review`. Triggers `POST /jobs/{job}/stage5-review`. If rejected, returns to Stage 5.

#### Stage 7 (Penyerahan Disnaker Panel)
* **Inputs**: Physical bundle checklist checkboxes (Groups A, B, C). Submit date input.
* **Action Button**: `Lanjutkan ke Stage 8`.

#### Stage 8 (Proses Disnaker Panel)
* **UI**: 30-Day SLA badge (`on_track`, `last_day`, `overdue`).
* **Action Button**: `Tambah Log Follow-Up Disnaker`. Opens modal.
* **Dropzone**: Disnaker receipt upload.
* **Action Button**: `Lanjutkan ke Stage 9`.

#### Stage 9 (Pengurusan Suket Panel)
* **Inputs**: Per-unit Suket Number (Text), Terbit Date (Date), Validity Months (Dropdown).
* **Dropzone**: Suket PDF upload.
* **Action Button**: `Simpan Data Suket`. Triggers `POST /jobs/{job}/stage9-data`. Auto-advances to Stage 10 when all units issue Suket.

#### Stage 10 (Penagihan Panel)
* **Inputs**: Invoice No (Text), Amount (Number), Invoice Date (Date), TOP days (Number), Submit to MKT date (Date).
* **Dropzone**: Enforced PDF-only Invoice Upload button.
* **Action Button**: `Lanjutkan ke Stage 11`.

#### Stage 11 (Penyerahan Suket ke Klien Panel)
* **Input**: Handover date (`tgl_submit_mkt`).
* **Dropzone**: Signed receipt upload.
* **Action Button**: `Lanjutkan ke Stage 12`.

#### Stage 12 (Lunas / Closed Panel)
* **Inputs**: Settlement toggle (`paid`), Received Amount (Number), Payment Timestamp.
* **Dropzone**: Transfer proof.
* **Action Button**: `Tutup Job (Closed)`. Triggers `POST /jobs/{job}/stage12-close`.

#### Global Footer Actions
* **Action Button**: `Reject / Kembalikan`. Opens modal requiring notes. Triggers `POST /jobs/{job}/reject`.
* **Action Button**: `Hapus Job`. Guarded for Manager/Superadmin. Triggers `DELETE /jobs/{job}` with 303 redirect.

### 2.3 `Dashboard/Index.jsx` (Dashboard & Lists)
* **KPI Cards**: Render aggregate stats passed from `DashboardController`.
* **Action Button**: `Pekerjaan Saya / Semua Job` Toggle. Guarded (MGR/Superadmin). Toggles prop filter for scoped job view.
* **Action Buttons**: `Kanban View` vs `List View` toggles. Adjusts rendering strategy.
* **Job Cards**: Click handler triggers `JobDetailSheet` opening with job context.

### 2.4 `Dashboard/AlatSkp.jsx` (Master Data Hub)
* **Tab 1: Alat Uji Inventory**:
  * **Action Button**: `+ Tambah Alat Uji`. Opens create modal.
  * **Action Buttons**: `Edit Alat` & `Hapus Alat`. Triggers `PUT/DELETE` to Inventory API.
  * **Badges**: Calibration countdown UI logic.
* **Tab 2: Sertifikat PJK3**:
  * **Action Button**: `+ Tambah Sertifikat PJK3`. Opens create modal.
* **Tab 3: Master Templates**:
  * **Table UI**: Implements natural sorting (`kode_form`).
  * **Action Button**: `Download Template File`.
* **Tab 4: Profil Inspektur & SKP**:
  * **Action Button**: `+ Edit Profil Inspektur`. Opens modal for SKP date, specializations, subrole edits.
  * **Action Links**: Credential download triggers.

### 2.5 `Jobs/Create.jsx` (Job Creation)
* **Inputs**: Client, Location (uses `IndonesiaLocationSelect.jsx`), Category, Units, Value, PO Date, PIC details.
* **Dropzone**: Initial document upload panel.
* **Action Button**: `Simpan & Buat Job`. Triggers `POST /jobs`.

### 2.6 Helper Components
* **`SmartRecommendation.jsx`**: Auto-match modal algorithm interface. Actions: `Pilih Inspektur` assigns inspector to form state.
* **`IndonesiaLocationSelect.jsx`**: Cascading dropdown processing 514 location records.
* **`Kanban/Index.jsx`**: Implements drag/drop handlers for pipeline visualization.
* **`Users/Index.jsx`**: Admin table. Action Button: `Edit Permission` opens matrix modal for `user_stage_permissions`.

---

## Section 3: Input Field & Validation Matrix

*Backend validation is enforced via Laravel Form Requests or inline `validate()` in controllers.*

| Field | Input Type | Validation Rule | DB Mapping |
|---|---|---|---|
| `klien` | Text | `required\|string\|max:255` | `dnp_jobs.klien` |
| `lokasi` | Dropdown | `required\|string` | `dnp_jobs.lokasi` |
| `nilai` | Number (IDR) | `required\|numeric\|min:0` | `dnp_jobs.nilai` |
| `tgl_pelaksanaan` | Date | `required\|date` | `dnp_jobs.tgl_pelaksanaan` |
| `actual_units` | Number | `required\|integer\|min:1` | `dnp_jobs.actual_units` |
| `invoice_file` | File | `required\|mimes:pdf\|max:10240` | `job_documents` (type: Invoice) |

---

## Section 4: Document Generator Subsystem

Powered by **PHPWord `TemplateProcessor`**.
* **Engine Route**: `JobController@downloadSuratTugas` and `JobController@downloadFormRiksaUji`.
* **Mechanics**:
  1. Component button triggers `GET` request.
  2. Controller loads `.docx` template from `storage/app/templates/`.
  3. Replaces placeholder tags (e.g., `${KODE_JOB}`, `${TIM_INSPEKTUR}`).
  4. Saves temporary output in `storage/app/public/job-documents/{job_id}/`.
  5. Returns HTTP download response with headers set for immediate browser download.

---

## Section 5: Controller API Route Reference

| Method | Route | Controller Action | Payload / Purpose |
|---|---|---|---|
| POST | `/jobs` | `JobController@store` | Job creation form data |
| POST | `/jobs/{job}/advance` | `JobController@advanceStage` | Trigger stage increment |
| POST | `/jobs/{job}/reject` | `JobController@reject` | `notes` |
| POST | `/jobs/{job}/return-to-stage1` | `JobController@returnToStage1` | `notes` |
| POST | `/jobs/{job}/s2-verify` | `JobController@s2Verify` | JSON payload of checklist states |
| POST | `/jobs/{job}/stage5-review` | `JobController@stage5Review` | `decision`, `notes` |
| GET | `/jobs/{job}/download-surat-tugas` | `JobController@downloadSuratTugas` | Generates & downloads .docx |
| POST | `/notifications/read-all` | `NotificationController@markAllRead` | Clears unread badge |
| DELETE | `/jobs/{job}` | `JobController@destroy` | Deletes job, returns 303 Redirect |

---

## Section 6: Database Architecture & Key Entity Relationships

### 6.1 Core Relational Entities
```
+----------------+       1:N       +-------------------+
|    dnp_jobs    |---------------->|     job_units     |
+----------------+                 +-------------------+
        |                                    |
        | 1:N                                | (Suket data per unit)
        v                                    v
+----------------+                 +-------------------+
| job_documents  |                 |  suket_histories  |
+----------------+                 +-------------------+
```

* **`dnp_jobs`**: Core pipeline record holding client data, stage state (1–12), `s2_verify_data` (JSON checklist), `disnaker_followups` (JSON log array), and status flags.
* **`job_units`**: Per-unit granularity for inspection outcomes, Suket issuing (`no_suket`, `tgl_suket`, `masa_berlaku`), and evaluation status (`laik`, `laik_bersyarat`, `tidak_laik`).
* **`job_documents`**: Stores file uploads linked by type (`PO/SPK`, `LHPP`, `BAP`, `Invoice`, `Suket_PDF`, `Bukti_Transfer`).
* **`alat_ujis`**: Master inventory of 23 calibration testing tools with calibration expiry tracking (`tgl_kalibrasi`, `tgl_kadaluarsa`).
* **`sertifikat_pjk3s`**: Master Kemnaker PJK3 SK licenses with expiration alerts.
* **`master_templates`**: Word document templates (`.docx`) sorted naturally by `kode_form` for PHPWord generation.
* **`user_stage_permissions`**: Stage ownership matrix defining which user roles can view or advance specific stages.

---

## Section 7: Build & Deployment SOP

### 7.1 Local & Staging Environment Setup
```bash
# 1. Clone & Install Dependencies
git clone <repository_url>
cd dnp-rework
composer install
npm install

# 2. Environment Configuration
cp .env.example .env
php artisan key:generate

# 3. Create Storage Link (Mandatory for Document Uploads)
php artisan storage:link

# 4. Run Database Migrations & Seeders
php artisan migrate --seed

# 5. Start Development Servers
php artisan serve
npm run dev
```

### 7.2 Production Build & Pinning Specs
* **Node.js**: Pin to Node 20 LTS.
* **Vite**: Pin to Vite 5.x.
* **Esbuild**: Pin to Esbuild 0.24.0.
* **Production Build Command**: `npm run build && php artisan config:cache && php artisan route:cache`.

---

## Section 8: Security & Role-Based Access Control (RBAC)

1. **Stage Ownership Enforcement**: Users can only edit jobs on stages they own via `user_stage_permissions` or if they hold the `superadmin` role.
2. **Exclusive Stage Protection**:
   * **Stage 1 & 11**: Exclusive to Marketing & Superadmin.
   * **Stage 10 & 12**: Exclusive to Finance & Superadmin.
3. **File Security**: All user-uploaded files undergo server-side extension and MIME validation (e.g., Invoice uploads require `mimes:pdf` and max 10MB file size).

---

## Section 9: Automated Background Tasks & WhatsApp Notification Integration (Wablas)

### 9.1 Services Overview
* **`WablasService.php`**: Encapsulates external API communication with the Wablas gateway for automated SMS/WhatsApp alerts.
* **`SendWaEscalations.php` (`php artisan app:send-wa-escalations`)**: Scheduled Artisan command triggered daily via Laravel Scheduler.

### 9.2 Escalation Triggers
1. **Stage 8 Disnaker SLA Alerts**: Automatically pings Admin and Manager if a job in Stage 8 reaches 25+ days without resolution (overdue warning).
2. **Suket Expiry Reminders (H-90, H-60, H-30)**: Scans `job_units` and alerts Marketing/Admin when Suket licenses approach expiration.
3. **Alat Uji Calibration Expiry Alerts (H-30)**: Scans `alat_ujis` and pings Admin when equipment calibration validity is within 30 days of expiring.

---

## Section 10: Inspector Recommendation Scoring Algorithm (`InspectorRecommendationService.php`)

### 10.1 Matching Logic
The recommendation engine ranks candidate inspectors based on 4 criteria:
1. **Category Specialization**: Filters inspectors who hold active credentials for the job's `pesawat_category`.
2. **SKP Validity Check**: Excludes inspectors whose SKP license expiration date (`tgl_kadaluarsa_skp`) is in the past.
3. **Subrole Weighting**: Grants **+50 points** bonus for matching requested subrole.
4. **Active Workload Penalty**: Subtracts **-10 points** for each job currently assigned to the inspector in active field stages (Stages 3–5).

---

## Section 11: Automated Database Backup & Maintenance (`backup-sqlite.sh`)

* **Location**: `dnp-rework/scripts/backup-sqlite.sh`
* **Cron Schedule**: `0 2 * * *` (Daily at 02:00 AM server time).
* **Workflow**:
  1. Executes SQLite `.backup` command on `database.sqlite` to prevent lock/corruption errors.
  2. Compresses the snapshot into `database_YYYYMMDD_HHMMSS.sqlite.gz`.
  3. Prunes backups older than 30 days automatically.

---

## Section 12: Environment Variables Reference (`.env`)

| Key | Example Value | Description |
|---|---|---|
| `APP_NAME` | `"DNP Riksa Uji Monitor"` | Application display name |
| `APP_ENV` | `production` / `local` | Environment state |
| `APP_KEY` | `base64:...` | Laravel encryption key |
| `APP_URL` | `https://monitor.deltanusa.co.id` | Base URL for Inertia routing & links |
| `DB_CONNECTION` | `sqlite` / `pgsql` | Primary database driver |
| `DB_DATABASE` | `database/database.sqlite` | Absolute or relative DB path |
| `WABLAS_DOMAIN` | `https://wablas.com` | Wablas WhatsApp API Endpoint |
| `WABLAS_TOKEN` | `your_wablas_api_token` | API authentication token for WA alerts |
| `VITE_APP_NAME` | `"${APP_NAME}"` | Client-side Vite environment variable |

---

## Section 13: Disaster Recovery & Emergency Rollback Procedures

### 13.1 Restoring Database Snapshot
If a database corruption or erroneous deletion occurs:
```bash
# 1. Stop background artisan services or queues
pm2 stop dnp-monitor

# 2. Decompress desired backup snapshot from storage
gunzip -c storage/app/backups/database_20260830_020000.sqlite.gz > database/database.sqlite

# 3. Clear application & route caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# 4. Restart application service
pm2 restart dnp-monitor
```

### 13.2 Clearing Inertia & Vite Cache Issues
```bash
# Force rebuild frontend assets in production
rm -rf public/build
npm run build
php artisan inertia:start-ssr # If SSR enabled
```

