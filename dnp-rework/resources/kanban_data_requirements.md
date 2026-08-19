# DNP Riksa Uji Monitor â€” Kanban Data Requirements
## Part 1: Stage 1â€“6

> **Source:** `dnp-rework/` (Laravel 12 backend, Inertia.js, 12-stage pipeline)
> **Ref:** `JobController.php`, all migration files, `DatabaseSeeder.php`

---

## Role Map

| Role | Stage Ownership |
|------|----------------|
| `marketing` | 1, 11 |
| `admin` | 2, 3, 5, 7, 8, 9 (assignable via `user_stage_permissions`) |
| `inspektur` | 4, 6 (only on assigned jobs) |
| `manager` | Can act on any stage **except** 1, 10, 11, 12. Explicitly owns 8 in seeder. |
| `finance` | 10, 12 |
| `superadmin` | All stages |

---

## Database Tables (shared across all stages)

### `dnp_jobs` (core job record)
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Auto |
| `kode` | string unique | Format: `DNP/YYYY/NNNN` |
| `klien` | string | Required |
| `lokasi` | string | Required |
| `owner_marketing` | string | Set at creation, locked after S2 |
| `pic_klien` | string | nullable |
| `pic_klien_phone` | string | nullable |
| `pesawat` | string | Equipment type code |
| `units` | integer | Contracted unit count |
| `actual_units` | integer | nullable â€” filled at Stage 4 |
| `unit_count_notes` | text | nullable |
| `nilai` | decimal(15,2) | Contract value |
| `no_po` | string | Required |
| `tgl_po` | date | nullable |
| `stage` | smallint | 1â€“12 |
| `stage_started_at` | datetime | Auto-set on stage move |
| `notes` | text | nullable |

### `job_documents`
| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint PK | |
| `job_id` | UUID FK | |
| `stage` | smallint | Which stage this doc belongs to |
| `type` | string(100) | Document type label |
| `name` | string | Original filename |
| `path` | string(512) | Storage path |
| `uploaded_by_user_id` | FK â†’ users | nullable |

### `job_history` (audit log)
| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint PK | |
| `job_id` | UUID FK | |
| `stage` | smallint | |
| `action` | string | Description of action |
| `notes` | text | nullable |
| `returned_from_stage` | smallint | nullable â€” set on rejection |
| `action_by_user_id` | FK â†’ users | nullable |

---

## Stage 1 â€” PO/SPK dari Marketing

**Owner:** `marketing`  
**Goal:** Input new job from client PO/SPK  
**Advance condition:** At least 1 document of type `PO/SPK`, `Surat Permohonan`, or `Surat Kuasa` uploaded

### Form Fields (POST `/jobs`)
| Field | Validation | Notes |
|-------|-----------|-------|
| `klien` | required, max:255 | Client company name |
| `pesawat` | required, max:100 | Equipment type |
| `lokasi` | required | Location |
| `owner_marketing` | required | Auto-filled from auth user if `marketing` role |
| `pic_klien` | nullable | Client PIC name + title |
| `pic_klien_phone` | nullable | Contact number |
| `units` | integer, min:1 | Contracted unit count |
| `nilai` | numeric, min:0 | Contract value (Rp) |
| `no_po` | required, max:255 | PO/SPK number |
| `tgl_po` | nullable, date | PO date |
| `notes` | text nullable | Scope of work / notes |

### Required Documents (upload at creation or later)
| Type Label | Required? |
|-----------|---------|
| `PO/SPK` | âœ… Minimum 1 of these 3 |
| `Surat Permohonan` | âœ… (or one of the above) |
| `Surat Kuasa` | âœ… (or one of the above) |
| `Pengesahan Gambar Kemnaker` | Optional at S1, mandatory check at S2 |
| `Copy Suket Lama` | Optional |
| `Drawing/Gambar Teknis` | Optional at S1 |
| `Manual Book` | Optional at S1 |

### Business Rules
- `kode` auto-generated: `DNP/{YEAR}/{4-digit seq}`
- `owner_marketing` locked to auth user name if role = `marketing`
- Data is **locked for Marketing** once job advances to Stage 2+
- Marketing can request revert to S1 via `POST /jobs/{job}/return-to-stage1`

---

## Stage 2 â€” Verifikasi Dokumen

**Owner:** `admin` (assigned via `user_stage_permissions.stage = 2`)  
**Goal:** Admin verifies all client documents are complete before scheduling  
**Advance condition:** Documents `Pengesahan Gambar Kemnaker` + `Catatan Verifikasi` present **OR** Manager bypass approval (`peer_review_status = 'approved'`)

### Fields Used
| Field (on `dnp_jobs`) | Notes |
|----------------------|-------|
| `peer_review_status` | `null` â†’ `'requested'` â†’ `'approved'` |
| `peer_review_submitted_at` | When Admin asked MGR for bypass |
| `peer_review_submitted_by` | Who asked |
| `peer_review_approved_at` | When MGR approved |
| `peer_review_approved_by` | MGR name |

> Fields are **reset to null** after moving to Stage 3 (reused for any future bypass flow)

### Required Documents (Stage 2)
| Type Label | Status |
|-----------|--------|
| `Pengesahan Gambar Kemnaker` | âœ… Mandatory (or bypass) |
| `Catatan Verifikasi` | âœ… Mandatory (or bypass) |
| `Surat Permohonan` | Checked from S1 uploads |
| `Surat Kuasa` | Checked from S1 uploads |
| `Drawing/Gambar Teknis` | Conditional (by pesawat type) |
| `Manual Book` | Conditional (by pesawat type) |

### Bypass / Approval Flow
- Admin triggers `POST /jobs/{job}/ask-approval` â†’ sets `peer_review_status = 'requested'`
- MGR approves via `POST /jobs/{job}/approve` â†’ sets `peer_review_status = 'approved'`
- Once approved, Admin can advance without full documents

---

## Stage 3 â€” Penjadwalan

**Owner:** `admin` (assigned stage 3)  
**Goal:** Schedule inspection, assign inspectors, select equipment  
**Advance condition:** All scheduling fields required (validated in `updateStage`)

### Fields Saved on Advance (S3 â†’ S4)
| Field | Validation | Notes |
|-------|-----------|-------|
| `tgl_pelaksanaan` | required, date | Inspection date |
| `jam_mulai` | required, string | Start time e.g. `08:00` |
| `durasi_hari` | required, integer min:1 | Duration in days |
| `disnaker_tujuan` | required, string | Target Disnaker office |
| `inspector_ids[]` | required, array min:1 | FK â†’ users (inspektur role) |
| `alat_ids[]` | nullable, array | FK â†’ `alat_ujis` |
| `cert_ids[]` | nullable, array | FK â†’ `sertifikat_pjk3s` |
| `tgl_h5` | auto-calc | `tgl_pelaksanaan - 5 days` |

### Extra Fields Set Automatically
| Field | Value |
|-------|-------|
| `tgl_h5` | `Carbon::parse(tgl_pelaksanaan)->subDays(5)` |
| `alat_ids` | JSON array stored on `dnp_jobs` |
| `cert_ids` | JSON array stored on `dnp_jobs` |

### Pivot Table: `job_inspectors`
| Column | Type |
|--------|------|
| `job_id` | UUID FK |
| `inspector_id` | string(50) FK â†’ users |

### Master Data Required
From `GET /api/master-data`:
- `alat_ujis`: `id`, `kode_alat`, `nama`, `merk`, `serial`, `kalibrasi_expired`, `status`
- `sertifikat_pjk3s`: `id`, `kode_cert`, `nama`, `no_sk`, `expired`

### `alat_ujis` table
| Column | Type |
|--------|------|
| `kode_alat` | string unique |
| `nama` | string |
| `merk` | string nullable |
| `serial` | string nullable |
| `kategori` | json nullable |
| `kalibrasi_terakhir` | date nullable |
| `kalibrasi_expired` | date nullable |
| `lab` | string nullable |
| `status` | string default `tersedia` |

### `inspector_profiles` table
| Column | Type |
|--------|------|
| `user_id` | FK â†’ users |
| `skp` | string |
| `skp_expired_at` | date |
| `spesialisasi` | json array |
| `domisili` | string |
| `senior_level` | integer |
| `subrole` | string nullable |
| `active` | boolean |

---

## Stage 4 â€” Pelaksanaan Riksa Uji

**Owner:** `inspektur` (only those assigned via `job_inspectors`)  
**Goal:** Field inspection execution â€” count actual units, upload photos  
**Advance condition:** Inspector submits `actual_units`; mismatch triggers flow to Marketing (S1) via `returnToStage1`

### Fields Saved (POST `/jobs/{job}/stage4-data`)
| Field | Validation | Notes |
|-------|-----------|-------|
| `actual_units` | required, integer min:0 | Actual units found on-site |
| `unit_count_notes` | nullable, string | Explanation if mismatch |

### Mismatch Logic (S4 â†’ S5)
```
if actual_units !== units â†’ block advance to S5
  â†’ Admin/MGR can call returnToStage1 for Marketing to fix units
  â†’ After fix, job restarts from S1
```

### Document Uploads (Stage 4)
| Type Label | Accepted Formats |
|-----------|-----------------|
| `Foto Nameplate` | jpg, jpeg, png |
| `Foto Kondisi Fisik` | jpg, jpeg, png |
| `Foto Hasil Pengukuran` | jpg, jpeg, png |
| `Foto Alat Pengaman` | jpg, jpeg, png |
| `Foto APD & Tim di Lokasi` | jpg, jpeg, png |
| `Foto Dokumentasi Lapangan` | jpg, jpeg, png |
| `BAP (scan tertandatangani)` | pdf, jpg, png |
| `Data Pengukuran` | pdf, xlsx, docx |

> **Photo notes:** Optional `photo_notes` field saved as a `job_history` entry alongside the document record.

### File Upload Rules
- Max size: 10 MB per file
- Accepted MIME: `pdf, jpg, jpeg, png, zip, docx, xlsx`
- Stored to `storage/app/public/job-documents/{job_id}/`

---

## Stage 5 â€” Penyusunan LHPP

**Owner:** `inspektur` (assigned) â€” uploads LHPP & BAP  
**Goal:** Inspector compiles the inspection report (LHPP) and field report (BAP)  
**Note:** This was swapped from old Stage 6 â€” now Stage 5 comes BEFORE manager review (Stage 6)

### Document Uploads (Stage 5)
| Type Label | Mandatory |
|-----------|----------|
| `LHPP` (Laporan Hasil Pemeriksaan & Pengujian) | âœ… |
| `BAP` (Berita Acara Pemeriksaan) | âœ… |
| `Draft Suket` | Optional |
| `Foto Pendukung` | Optional |

### `job_evaluations` table (filled at this stage)
| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint PK | |
| `job_id` | UUID FK | |
| `unit_no` | integer | 1-based index |
| `unit_label` | string | e.g. "Boiler Unit 1" |
| `status` | string(50) | `laik` / `laik_bersyarat` / `tidak_laik` |
| `findings` | text nullable | Field findings |
| `recommendation` | text nullable | Recommendations |

> One row per unit. Total rows = `dnp_jobs.units`

### `laik_status` aggregate on `dnp_jobs`
| Value | Meaning |
|-------|---------|
| `laik` | All units passed |
| `laik_bersyarat` | Some units conditional |
| `tidak_laik` | At least one unit failed |

---

## Stage 6 â€” Review Laporan Teknis (Manager)

**Owner:** `manager`  
**Goal:** Kadiv/MGR reviews LHPP & BAP uploaded by inspectors, makes decision  
**Advance condition:** `s5_review_decision` must be set to `approved` or `approved_conditional`

### Fields Saved (POST `/jobs/{job}/stage5-review`)
| Field | Validation | Notes |
|-------|-----------|-------|
| `s5_review_decision` | required, in:[approved, approved_conditional, rejected] | MGR decision |
| `s5_review_notes` | nullable, string | Review notes / conditions |

### Fields Set Automatically
| Field | Value |
|-------|-------|
| `s5_reviewed_by` | `Auth::user()->name` |
| `s5_reviewed_at` | `now()` (datetime) |

### Decision Outcomes
| Decision | Meaning | Next Action |
|----------|---------|------------|
| `approved` | Report accepted | Advance to S7 |
| `approved_conditional` | Accepted with conditions | Advance to S7 with notes |
| `rejected` | Rejected | Return to S5 (Inspector revises) |

### `units_tracking` table (initialized at this stage or S9)
| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint PK | |
| `job_id` | UUID FK | |
| `unit_no` | integer | |
| `unit_label` | string | From `job_evaluations` |
| `laik_status` | string(50) | Copied from evaluation |
| `status` | string(50) | `pending`/`submitted`/`issued`/`rejected` |
| `tgl_submit` | date nullable | |
| `no_registrasi` | string nullable | Disnaker registration no |
| `no_suket` | string nullable | Suket number |
| `tgl_suket` | date nullable | |
| `suket_expired_at` | date nullable | |
| `suket_validity_months` | integer nullable | |
| `notes` | text nullable | |
# DNP Riksa Uji Monitor â€” Kanban Data Requirements
## Part 2: Stage 7â€“12 + Master Data + Complete Field Reference

---

## Stage 7 â€” Penyerahan Bundel ke Disnaker (Manager)

**Owner:** `manager`  
**Goal:** MGR physically submits the document bundle to Disnaker  
**Side effect on advance:** `disnaker_deadline_at` auto-set to `now() + 30 days` (EWS deadline)

### Fields Saved (POST `/jobs/{job}/stage7-data`)
| Field | Validation | Notes |
|-------|-----------|-------|
| `tgl_submit_disnaker` | required, date | Date bundle handed to Disnaker |

### Fields Set Automatically on Advance (S7 â†’ S8)
| Field | Value |
|-------|-------|
| `disnaker_deadline_at` | `now()->addDays(30)` |

### Document Uploads (Stage 7 â€” Bundle Checklist)

**Group A â€” From Client:**
| Type Label | Conditional? |
|-----------|-------------|
| `Surat Permohonan ke Disnaker` | âœ… Mandatory |
| `Surat Kuasa (bermaterai)` | âœ… Mandatory |
| `Pernyataan Keabsahan Data` | âœ… Mandatory |
| `Form Checklist Disnaker` | âœ… Mandatory |
| `Drawing/As-Built` | âœ… Mandatory |
| `Manual Book` | âœ… Mandatory |
| `Pengesahan Gambar Kemnaker` | âš ï¸ Conditional (by pesawat type) |
| `Copy Suket Lama` | Optional (for renewal) |

**Group B â€” From PJK3:**
| Type Label | Notes |
|-----------|-------|
| `LHPP` | Must exist from S5 |
| `BAP` | Must exist from S5 |
| `Copy SKP Ahli K3` | Auto from inspector profile |
| `Copy Sertifikat PJK3` | Auto from `sertifikat_pjk3s` |
| `Foto Dokumentasi` | From S4 uploads |
| `Copy Sertifikat Kalibrasi Alat` | Auto from `alat_ujis` |

**Group C â€” Bundle Completeness:**
| Item | Notes |
|------|-------|
| Cover Bundel | Physical |
| Daftar Isi Bundel | Physical |
| Dokumen dijilid | Physical |
| Copy bundel untuk arsip | Physical |

---

## Stage 8 â€” Proses Disnaker (Admin)

**Owner:** `admin` (assigned stage 8; in seeder, MGR `terzha` also assigned)  
**Goal:** Track physical document processing at Disnaker office + SLA monitoring

### Fields Saved (POST `/jobs/{job}/stage8-data`)
| Field | Validation | Notes |
|-------|-----------|-------|
| `tgl_doc_submitted_disnaker` | nullable, date | Date docs physically received at Disnaker |
| `tgl_doc_received_disnaker` | nullable, date | Date docs formally accepted/stamped |

### Field Auto-Calculated
| Field | Logic |
|-------|-------|
| `disnaker_sla_status` | Based on `tgl_doc_submitted_disnaker` vs `now()` |

### SLA Status Values
| Value | Condition |
|-------|-----------|
| `on_track` | Days elapsed < 30 |
| `last_day` | Days elapsed == 30 |
| `overdue` | Days elapsed > 30 |

### `disnaker_followups` table
| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint PK | |
| `job_id` | UUID FK | |
| `action_by_user_id` | FK â†’ users | nullable |
| `status` | string(50) | `progress` / `stuck` / `ready` |
| `notes` | text | Follow-up notes |
| `created_at` | timestamp | |

> Follow-ups are mandatory every **7 days** during Stage 8. Dashboard shows overdue alert if gap > 7 days.

### Key Tracking Fields on `dnp_jobs`
| Field | Type | Notes |
|-------|------|-------|
| `disnaker_deadline_at` | date | Set when entering S8 (now + 30d) |
| `disnaker_sla_status` | string(20) | `on_track` / `last_day` / `overdue` |
| `tgl_doc_submitted_disnaker` | date | Physical submission date |
| `tgl_doc_received_disnaker` | date | Acceptance date at Disnaker |

---

## Stage 9 â€” Pengurusan Suket (Admin)

**Owner:** `admin` (assigned stage 9)  
**Goal:** Track status of Suket (Surat Keterangan Laik K3) issuance per unit by Disnaker

### Fields Saved (POST `/jobs/{job}/stage9-data`)
| Field | Validation | Values |
|-------|-----------|--------|
| `s9_progress_status` | required, in:[...] | `not_started`, `delayed`, `in_progress`, `almost_done`, `done` |

### `units_tracking` updates (at Stage 9)
Each unit row in `units_tracking` is updated as Suket is received:

| Field | Set When |
|-------|---------|
| `status` | `submitted` â†’ `issued` or `rejected` |
| `no_suket` | When Suket number received from Disnaker |
| `tgl_suket` | Suket issue date |
| `suket_expired_at` | Auto-calc: `tgl_suket + validity_months` |
| `suket_validity_months` | Based on pesawat type (see table below) |
| `no_registrasi` | Disnaker registration number |
| `notes` | If rejected â€” rejection reason |

### Suket Validity by Pesawat Type
| Pesawat Code | Validity |
|-------------|---------|
| `PV` (Bejana Tekan â€” pemeriksaan luar) | 24 months |
| `PV` (Hydrotest / pemeriksaan dalam) | 60 months |
| `FIRE` (Fire Extinguisher System) | 12 months |
| `LIFT` (Elevator) | 12 months |
| `CRANE` | 12 months |
| `BOILER` | 24 months |
| *(default)* | 12 months |

### Advance Condition
- All units in `units_tracking` must have `status = 'issued'` â†’ auto-advance to S10

---

## Stage 10 â€” Penagihan / Finance

**Owner:** `finance` (exclusively â€” Manager cannot act here)  
**Goal:** Finance creates and tracks invoice for the completed job

### Fields Saved (POST `/jobs/{job}/stage10-data`)
| Field | Validation | Notes |
|-------|-----------|-------|
| `total_invoice_amount` | nullable, numeric min:0 | Invoice total (may differ from `nilai`) |
| `tgl_invoice_issued` | nullable, date | Invoice issue date |
| `s10_progress_status` | nullable, in:[...] | Progress tracker |
| `tgl_submit_mkt` | nullable, date | Date submitted to Marketing |

### Progress Status Values
| Value | Meaning |
|-------|---------|
| `not_started` | Invoice not yet created |
| `delayed` | Invoice delayed |
| `in_progress` | Invoice sent, awaiting payment |
| `almost_done` | Payment confirmed, pending receipt |
| `done` | Fully paid and documented |

### Core Finance Fields on `dnp_jobs`
| Field | Type | Notes |
|-------|------|-------|
| `invoice_no` | string nullable | Invoice number |
| `invoice_date` | date nullable | Invoice date |
| `total_invoice_amount` | decimal(15,2) | From S10 data |
| `tgl_invoice_issued` | date | |
| `top_days` | integer default 30 | Terms of payment (days) |
| `payment_due_date` | date nullable | |
| `payment_status` | string(50) | `pending` / `sent` / `paid` |
| `payment_paid_at` | datetime nullable | |
| `payment_amount_received` | decimal(15,2) | |
| `paid` | boolean default false | |
| `s10_progress_status` | string(50) | Progress tracker |
| `tgl_submit_mkt` | date nullable | When Finance submits to MKT |

### Document Uploads (Stage 10)
| Type Label | Format Constraint |
|-----------|-----------------|
| `Invoice (PDF)` | **PDF only** (enforced server-side) |
| `Bukti Transfer` | pdf, jpg, png |
| `Kwitansi` | pdf, jpg, png |
| `Faktur Pajak` | pdf |

---

## Stage 11 â€” Penyerahan Suket ke Klien (Marketing)

**Owner:** `marketing` (exclusively â€” same as Stage 1, MGR cannot act here)  
**Goal:** Marketing delivers the Suket certificate(s) to the client and obtains tanda terima

### Fields
| Field on `dnp_jobs` | Type | Notes |
|--------------------|------|-------|
| `tanda_terima_kembali` | boolean default false | Confirmed receipt from client |
| `tgl_submit_mkt` | date nullable | When Finance handed docs to Marketing |

### Document Uploads (Stage 11)
| Type Label | Notes |
|-----------|-------|
| `Tanda Terima (TTD Klien)` | Signed delivery receipt from client |
| `Copy Suket (arsip)` | Copy kept internally |

### Advance Condition
- `tanda_terima_kembali = true` (confirmed delivery)
- Move to Stage 12 to close

---

## Stage 12 â€” Lunas / Closed

**Owner:** `finance`  
**Goal:** Finance confirms payment received, closes the job

### Fields
| Field | Type | Notes |
|-------|------|-------|
| `paid` | boolean | Set to `true` to close |
| `payment_paid_at` | datetime | When payment confirmed |
| `payment_amount_received` | decimal(15,2) | Actual amount received |
| `payment_status` | string | Set to `paid` |

### Closing Action
- Finance clicks "Tandai Selesai" â†’ `paid = true`, `payment_status = 'paid'`, `payment_paid_at = now()`
- Job enters closed/completed state, no further stage movement

---

## Suket Reminder System

Reads from `units_tracking` where `no_suket IS NOT NULL`:

| Alert Level | Days to Expiry |
|-------------|---------------|
| ðŸ”´ Expired | < 0 days |
| ðŸŸ¡ Expiring Soon | 0â€“90 days |
| âœ… Valid | > 90 days |

H-90 alert shown on dashboard for proactive renewal outreach.

---

## Complete `dnp_jobs` Field Reference

All columns across all migrations, in order:

| Column | Type | Stage Added | Notes |
|--------|------|------------|-------|
| `id` | UUID PK | Core | |
| `kode` | string unique | Core | DNP/YYYY/NNNN |
| `klien` | string | Core | |
| `lokasi` | string | Core | |
| `owner_marketing` | string | Core | |
| `pic_klien` | string | Core | |
| `pic_klien_phone` | string | Core | |
| `pesawat` | string(50) | Core | |
| `units` | integer | Core | Contracted |
| `actual_units` | integer nullable | S4 | Inspector-reported |
| `unit_count_notes` | text nullable | S4 | |
| `nilai` | decimal(15,2) | Core | |
| `no_po` | string nullable | Core | |
| `tgl_po` | date nullable | Core | |
| `stage` | smallint | Core | 1â€“12 |
| `stage_started_at` | datetime | Core | Auto-set |
| `tgl_pelaksanaan` | date nullable | Core | Set at S3 |
| `no_surat_tugas` | string nullable | Core | Set at S3 |
| `tgl_surat_tugas` | date nullable | Core | Set at S3 |
| `disnaker_tujuan` | string nullable | Core | Set at S3 |
| `tgl_h5` | date nullable | Core | Auto = tgl_pelaksanaan - 5d |
| `h5_confirmed` | boolean | Core | |
| `h5_method` | string(50) nullable | Core | `teman_k3` / `manual` |
| `h5_confirmed_at` | datetime nullable | Core | |
| `h5_confirmed_by` | string nullable | Core | |
| `peer_review_status` | string(50) nullable | Core | `requested`/`approved` |
| `peer_review_submitted_at` | datetime nullable | Core | |
| `peer_review_submitted_by` | string nullable | Core | |
| `peer_review_approved_at` | datetime nullable | Core | |
| `peer_review_approved_by` | string nullable | Core | |
| `disnaker_deadline_at` | date nullable | Core | Set when entering S8 |
| `laik_status` | string(50) nullable | Core | Aggregate from evaluations |
| `paid` | boolean | Core | |
| `invoice_no` | string nullable | Core | |
| `invoice_date` | date nullable | Core | |
| `top_days` | integer default 30 | Core | Terms of payment |
| `payment_due_date` | date nullable | Core | |
| `payment_status` | string(50) | Core | `pending`/`sent`/`paid` |
| `payment_paid_at` | datetime nullable | Core | |
| `payment_amount_received` | decimal(15,2) | Core | |
| `tanda_terima_kembali` | boolean | Core | |
| `notes` | text nullable | Core | |
| `s5_review_decision` | string(50) nullable | S6-mig | `approved`/`approved_conditional`/`rejected` |
| `s5_review_notes` | text nullable | S6-mig | |
| `s5_reviewed_by` | string nullable | S6-mig | |
| `s5_reviewed_at` | datetime nullable | S6-mig | |
| `tgl_submit_disnaker` | date nullable | S7-mig | |
| `tgl_doc_submitted_disnaker` | date nullable | S8-mig | |
| `tgl_doc_received_disnaker` | date nullable | S8-mig | |
| `disnaker_sla_status` | string(20) nullable | S8-mig | `on_track`/`last_day`/`overdue` |
| `s9_progress_status` | string(50) nullable | S9-mig | |
| `total_invoice_amount` | decimal(15,2) nullable | S10-mig | |
| `tgl_invoice_issued` | date nullable | S10-mig | |
| `s10_progress_status` | string(50) nullable | S10-mig | |
| `tgl_submit_mkt` | date nullable | S11-mig | |
| `alat_ids` | json (cast: array) | Model | Selected equipment IDs |
| `cert_ids` | json (cast: array) | Model | Selected cert IDs |

---

## Master Data Tables

### `sertifikat_pjk3s`
| Column | Type |
|--------|------|
| `kode_cert` | string unique |
| `nama` | string |
| `no_sk` | string nullable |
| `terbit` | date nullable |
| `expired` | date nullable |
| `file` | string nullable |
| `kategori` | string nullable |

### `regulasi_k3s`
| Column | Type |
|--------|------|
| `kode_reg` | string unique |
| `kategori` | string nullable |
| `nama` | string |
| `tentang` | string nullable |
| `terbit` | date nullable |
| `status` | string nullable |
| `source` | string nullable |
| `revisi_terakhir` | string nullable |

### `form_disnakers`
| Column | Type | Notes |
|--------|------|-------|
| `kode_form` | string unique | |
| `kode_disnaker` | string nullable | e.g. Form 6, Form 36 |
| `nama` | string | |
| `pesawat` | string nullable | Which equipment type uses it |
| `revisi` | string nullable | |
| `last_updated` | date nullable | |
| `file` | string nullable | Stored path |

---

## RBAC: `user_stage_permissions`
| Column | Type | Notes |
|--------|------|-------|
| `user_id` | FK â†’ users | |
| `stage` | smallint | 1â€“12 |
| `is_owner` | boolean | Can act on this stage |
| `can_view` | boolean | Can view jobs at this stage |

**Default Seeder Assignments:**
| User | Role | Stages Owned |
|------|------|-------------|
| Superadmin | superadmin | All |
| Andini Sari | marketing | 1, 11 |
| Budi Susanto | admin | 2, 3, 5, 7, 9 |
| Terzha R. P. | manager | 8 (+ all non-MKT/FIN via role) |
| Putri Wahyuni | finance | 10, 12 |
| Inspectors | inspektur | 4, 6 (per assigned job) |
