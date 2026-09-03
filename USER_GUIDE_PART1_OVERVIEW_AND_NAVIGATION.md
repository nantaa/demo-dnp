# DNP Monitor – User Guide Manual
## PART 1: System Overview, Interface & Navigation
> **PT Delta Nusantara Persada** | Riksa Uji Monitoring System  
> Version: Rework v2.4 | Stack: Laravel 11 · React · Inertia.js

---

## Table of Contents (Full Manual)
- **Part 1** *(this file)*: System Overview, Interface & Navigation, Job Detail Sheet Controls
- **Part 2** `USER_GUIDE_PART2_SOP_BY_ROLE.md`: Step-by-step SOPs for all 6 user roles
- **Part 3** `USER_GUIDE_PART3_TROUBLESHOOTING.md`: Edge cases, FAQ, and maintenance

---

## 1. What Is DNP Monitor?

DNP Monitor is a workflow management system for tracking **RiksaUji** (Technical Inspection) jobs across every phase of the process — from initial client order (PO/SPK) through field inspection, technical reporting (LHPP), government verification (Disnaker), Suket issuance, invoicing, and final payment closure.

Every job progresses through a defined **14-stage pipeline**. Each stage has a designated department responsible for completing it before the job can advance.

---

## 2. The 14-Stage Lifecycle

| # | Display Code | Stage Name | Department (PIC) | SLA |
|---|:---:|---|:---:|:---:|
| 1 | `1` | PO / SPK | Marketing (MKT) | — |
| 2 | `2` | Verifikasi Dokumen | Admin Dokumen (ADM) | 1 hari |
| 3 | `3` | Penjadwalan & Surat Tugas | Admin Dokumen (ADM) | 1 hari |
| 4 | `4` | Pelaksanaan RU | Tim Ahli / Inspektur (INS) | — |
| 5 | `4b` | Aktualisasi Unit *(kondisional)* | Marketing (MKT) | 1 hari |
| 6 | `5` | Penyusunan LHPP | Tim Ahli / Inspektur (INS) | 3 hari |
| 7 | `6` | Review Laporan Teknis | Kadiv RU / Manager (MGR) | 1 hari × unit |
| 8 | `7` | Verifikasi ke Dinas | Kadiv RU / Manager (MGR) | 1 hari |
| 9 | `8` | Proses Disnaker | Admin Dokumen (ADM) | 30 hari |
| 10 | `9` | Pengurusan Suket | Admin Dokumen (ADM) | 1 hari |
| 11 | `10` | Penagihan | Admin Keuangan (FIN) | 1 hari |
| 12 | `11` | Pengiriman SUKET ke Klien | Marketing (MKT) | — |
| 13 | `11b` | Pembayaran / Pelunasan *(kondisional)* | Admin Keuangan (FIN) | 1 hari |
| 14 | `12` | Selesai / Closed | System (archived) | — |

> **Note:** Stage `4b` (internal ID: 13) is only triggered when field inspection reveals a unit count mismatch with the original PO. Stage `11b` (internal ID: 14) is a conditional payment sub-stage before final closure.

---

## 3. User Roles & Access Permissions

| Role | Label | Stages Owned | Can View All? |
|---|:---:|---|:---:|
| Marketing | `MKT` | 1, 4b (13), 11 | Own stages only |
| Admin Dokumen & RU | `ADM` | 2, 3, 8, 9 | All stages |
| Tim Ahli / Inspektur | `INS` | 4, 5 | All stages |
| Kadiv RU / Manager | `MGR` | 6, 7 | All stages |
| Admin Keuangan | `FIN` | 10, 11b (14), 12 | All stages |
| Super Administrator | `SUP` | All stages | Full override |

---

## 4. Accessing the Application

### 4.1 Login
1. Open your browser and navigate to the application URL provided by your system administrator.
2. Enter your **Email** and **Password**, then click **Masuk**.
3. You will land on your role-specific **Dashboard** automatically.

### 4.2 Interface Layout

The application has two layout modes:

**Desktop (lg screens and above):**
- **Left Sidebar** (dark navy): Primary navigation menu. Active page is highlighted in blue.
- **Top Header Bar**: Company logo, Notification Bell, Profile pill (shows your name & role), Logout button.
- **Main Content Area**: Displays the active page.

**Mobile (smaller than lg):**
- **Top Header**: Hamburger menu (☰) on the left, Profile on the right.
- **Bottom Navigation Bar**: Quick-access icons for Dashboard, Kanban, Daftar Job, Job Baru, and Pelaporan.
- **Mobile Sidebar Drawer**: Full navigation accessible via hamburger or the "Lainnya" bottom button.

---

## 5. Main Menu Pages

| Menu Item | Route | Visible To |
|---|---|---|
| Dashboard | `/` | All roles |
| Kanban | `/kanban` | All roles |
| Daftar Job | `/jobs` | All roles |
| Job Baru | `/jobs/create` | MKT, Superadmin |
| Pelaporan | `/pelaporan` | MGR, Superadmin |
| Users | `/users` | Superadmin only |
| Reminder Suket | `/reminder-suket` | MKT, MGR, ADM, Superadmin |
| Alat & SKP | `/inventory` | ADM, MGR, INS, Superadmin |
| Profile / Akun | `/profile` | All roles |

---

## 6. Kanban Board (`/kanban`)

### 6.1 Overview
The Kanban Board is the primary workspace. It displays all jobs as cards organized in **columns by stage** from left to right.

- **Auto-Refresh**: The board syncs silently every **10 seconds** in the background — no manual refresh needed.
- **Column Header**: Shows stage name and current job count (e.g., `Pelaksanaan RU · 3`).
- **Horizontal Scroll**: Scroll right to see all 14 stage columns.

### 6.2 Reading a Job Card

Each card shows:
| Element | Description |
|---|---|
| **Kode Job** | Unique job code (e.g., `DNP-2024-001`) |
| **Klien** | Client company name |
| **Pesawat / Alat** | Equipment type (e.g., `Lift / Dumbwaiter`) |
| **Unit** | Number of units to be inspected |
| **Tim Riksa** | Inspector avatars assigned to the job |
| **MKT Owner** | Marketing person who owns the job |
| **SLA Badge** | Color-coded SLA indicator pill |

### 6.3 SLA Status Badges

| Badge | Color | Meaning |
|---|:---:|---|
| ON TRACK | 🟩 Green | Well within SLA deadline |
| WARNING | 🟨 Yellow | 1 day remaining in SLA |
| OVERDUE | 🟥 Red | SLA deadline has passed |
| HARI H / H-X | 🟦 Blue | Inspection day countdown (Stage 4) |
| — | Gray | No SLA defined for this stage |

### 6.4 Kanban Header Buttons

- **+ Job Baru** *(MKT & Superadmin only)*: Shortcut to create a new job.
- **Kosongkan Database** *(Superadmin only — red button)*: Permanently deletes ALL job data. Requires confirmation. Used only for testing/seeding resets.

### 6.5 Opening a Job
Click any job card to open the **Job Detail Sheet** (a slide-over drawer from the right side). Click anywhere outside the drawer or the `×` button to close it.

---

## 7. Daftar Job (`/jobs`)

The Job List page shows all jobs in a sortable, filterable table/card layout.

### 7.1 Features
- **Search**: Filter by Kode Job, Klien name, or Equipment type.
- **Stage Filter**: Click a stage badge to filter jobs to that stage only.
- **CSV Export**: Download the visible filtered list as a `.csv` spreadsheet.
- **Delete Job**: Each row has a trash icon (🗑) to delete a single job. Requires confirmation.
- **Responsive**: On mobile, each job displays as a stacked card instead of a table row.

---

## 8. Job Detail Sheet — Complete Interface Guide

Clicking a job card opens the **Job Detail Sheet** — a panel that slides in from the right. This is where all stage-specific data entry, file uploads, and stage progression actions happen.

### 8.1 Header Section
- **Job Kode & Client Name** (top left)
- **Stage Badge**: Current stage display code (e.g., `Stage 4b`)
- **Peer Review / MGR Intercept Alert**: Yellow warning bar appears when Manager approval is pending or a review decision is required.
- **Edit Button** (pencil icon): Edit basic job details (Klien, Pesawat, Lokasi, Nilai, Units). Only available to the job owner and Superadmin.
- **Close Button** (×): Closes the drawer.

### 8.2 The Three Tabs

#### Tab 1: Form Aksi (Stage Actions)
The active input panel for the current stage. Content changes depending on the job's current stage. Full details in **Section 9** below.

#### Tab 2: Timeline
Visual progress tracker showing:
- **✓ (Green dot)**: Completed stages
- **Glowing blue ring**: Current active stage
- **Faded**: Future stages not yet reached

Each completed stage also shows uploaded documents and any notes recorded at that stage.

#### Tab 3: Dokumen & Histori
- **Document Repository**: All uploaded files, organized by stage. Click to download/view. Delete button appears on hover (only for authorized users).
- **Audit History**: Full change log showing every stage transition, with timestamp, who made the change, and any notes recorded.

---

## 9. Stage-by-Stage Form Reference

### Stage 1 — PO / SPK (Marketing)

**Purpose**: Create a new job entry.

**Required Fields:**
| Field | Description |
|---|---|
| Klien | Client company name |
| Pesawat / Jenis Alat | Select from 8 equipment categories (see list below) |
| Jumlah Unit | Initial estimated unit count |
| Nilai Pekerjaan (Rp) | PO / SPK contract value |
| Lokasi | Free-text location description |
| Provinsi | Province selector (34 Indonesian provinces) |
| Kota / Kabupaten | City/district (auto-populated from province) |

**Equipment Categories (Pesawat):**
1. Proteksi Kebakaran (Form 65 K)
2. Lift / Dumbwaiter (Form 36/38/39)
3. Eskalator / Travelator (Form 52)
4. PAPA — Crane/Forklift/dll (Form A 52)
5. Instalasi Listrik & PP (Form 55 L)
6. Pesawat Uap / Boiler (Form 6)
7. Bejana Tekan (Form 45 A.1)
8. PTP — Compressor/Genset (Form 54 A)

**Documents to Upload at Stage 1:**
- PO / SPK *(required to unlock Stage 2)*
- Surat Permohonan
- Surat Kuasa
- Pernyataan Keabsahan
- Form Checklist Klien
- Drawing / As-Built
- Manual Book
- Copy Suket Lama

**Progression Button**: `Kirim ke Admin Dokumen (Stage 2) →`

---

### Stage 2 — Verifikasi Dokumen (Admin)

**Purpose**: Verify client-submitted documents against a 10-item checklist.

**Verification Checklist:**

| # | Document | Badge | Has N/A? |
|---|---|:---:|:---:|
| 01 | PO / SPK dari Klien | WAJIB | No |
| 02 | Surat Permohonan Riksa Uji (bermaterai) | WAJIB | No |
| 03 | Surat Kuasa dari Pemilik (bermaterai) | WAJIB | No |
| 04 | Surat Pernyataan Keabsahan Data | OPSIONAL | Yes |
| 05 | Form Checklist Disnaker (diisi klien) | OPSIONAL | Yes |
| 06 | Drawing / Gambar Teknis (as-built) | OPSIONAL | Yes |
| 07 | Manual Book / Spesifikasi Teknis | OPSIONAL | Yes |
| 08 | Pengesahan Gambar dari Kemnaker | OPSIONAL | Yes |
| 09 | Copy Suket Lama (perpanjangan) | OPSIONAL | Yes |
| 10 | Verifikasi Drawing SESUAI Nameplate (cek visual foto) | OPSIONAL · CEK VISUAL | Yes |

Each item has three states: **✓ OK** / **✕ Tidak** / **N/A**

**Action Buttons:**
- `✓ Verifikasi Selesai — Lanjut Penjadwalan (Stage 3) →`: All mandatory docs verified.
- `Minta Persetujuan Kadiv/MGR`: When mandatory docs are missing — sends an intercept request to Manager.
- `Tolak / Kembalikan ke Stage 1`: Return job to Marketing.

---

### Stage 3 — Penjadwalan & Surat Tugas (Admin)

**Purpose**: Schedule the inspection and assign the field team.

**Fields:**
| Field | Description |
|---|---|
| Tanggal Pelaksanaan RU | Scheduled inspection date |
| Jam Mulai | Start time (default 08:00) |
| Durasi (hari) | Duration in days |
| No. Surat Tugas | Official ST number |
| Disnaker Tujuan | Target Disnaker office (Province select) |
| Tim Inspektur | Assign lead inspectors (multi-select from inspector pool) |
| Report Writer | Assign LHPP writer (from inspector pool) |
| Alat Uji | Assign testing equipment from inventory |
| Sertifikat Alat | Assign equipment calibration certificates |

**Documents to Upload:**
- Surat Tugas
- Surat Pemberitahuan H-5
- Bukti Submit Teman K3

**Progression Button**: `Lanjut ke Stage 4 (Pelaksanaan RU) →`

---

### Stage 4 — Pelaksanaan RU (Inspektur)

**Purpose**: Record on-site inspection execution.

**Mandatory Photo Uploads** *(all 3 required before progression)*:
1. `Foto Keberangkatan`
2. `Foto Sampai Lokasi Riksauji`
3. `Foto Kepulangan`

**Field Inspection Checklist** (8 items, saved as JSON):

| ID | Item | Kritis? |
|---|---|:---:|
| nameplate | Verifikasi Nameplate | ✓ |
| visual | Pemeriksaan Visual (korosi, retak, kebocoran, deformasi) | ✓ |
| dimensi | Pengukuran Dimensi & Ketebalan Material | — |
| kelistrikan | Pemeriksaan Sistem Kelistrikan & Grounding | — |
| pengaman | Test Fungsi Alat Pengaman (safety valve, limit switch) | ✓ |
| fungsi | Test Fungsi Operasional (load/pressure/functional test) | ✓ |
| apd | APD lengkap digunakan selama pengujian | — |
| bap | BAP ditandatangani PIC Klien di lapangan | ✓ |

**Actual Unit Count**: Enter the actual number of units inspected on-site.

**Additional Documents:**
- Foto Nameplate, Foto Kondisi Fisik, BAP, Foto Hasil Pengukuran, Foto Alat Pengaman, Foto APD & Tim di Lokasi, Foto Dokumentasi Lapangan, Data Pengukuran

**Action Buttons:**
- `Selesai Inspeksi — Lanjut ke Stage 5 (LHPP) →` *(if actual units match PO)*
- `Kirim ke Stage 4b (Aktualisasi Unit — Marketing)` *(if unit count differs)*
- `Tolak / Kembalikan` *(return to Stage 3)*

---

### Stage 4b — Aktualisasi Unit (Marketing) — Stage ID: 13

**Purpose**: Update actual unit details when field count differs from PO.

**Fields:**
- Actual unit count adjustment
- Notes / justification for unit change

**Action Buttons:**
- `Konfirmasi Aktualisasi — Lanjut ke Stage 5 (LHPP) →`
- `Tolak / Kembalikan ke Stage 4`

---

### Stage 5 — Penyusunan LHPP (Inspektur)

**Purpose**: Draft the Technical Inspection Report (LHPP).

**Fields:**
- Per-unit evaluation entries:
  - **Status Kelayakan**: `LAIK` / `LAIK BERSYARAT` / `TIDAK LAIK`
  - **Temuan / Findings**: Text description of findings per unit
  - **Rekomendasi**: Recommendations per unit
- **Smart Recommendation Assistant**: AI-powered suggestion tool — enter equipment details and the system suggests standard LHPP language.
- **Catatan LHPP**: General report notes
- **Peer Review Status**: Set to `draft` before submission

**Documents to Upload:**
- LHPP *(draft)*
- BAP
- Laporan Teknis Tambahan

**Action Button**: `Submit LHPP ke Manager Review (Stage 6) →`

---

### Stage 6 — Review Laporan Teknis (Manager)

**Purpose**: Manager reviews and approves the technical report.

**Review Decision Options:**
| Decision | Value | Effect |
|---|---|---|
| Setujui | `approved` | Advances to Stage 7 |
| Setujui Bersyarat | `approved_conditional` | Advances with conditions noted |
| Tolak / Revisi | `rejected` | Returns to Stage 5 for revision |

**Fields:**
- **Catatan Review MGR**: Notes/conditions for the decision
- Reviewed by name auto-populated from logged-in user

**Documents to Upload:**
- LHPP Draft (reviewed version)
- BAP
- Catatan Review MGR

---

### Stage 7 — Verifikasi ke Dinas (Manager)

**Purpose**: Record Disnaker submission details and prepare the bundel dokumen.

**Fields:**
- **Tanggal Penyerahan ke Disnaker**: Date documents were submitted to Disnaker
- **Bundel Dokumen Checklist** (3 groups):
  - *Grup A*: Client documents (8 items: Surat Permohonan Disnaker, Surat Kuasa, Pernyataan Keabsahan, Form Checklist, Drawing, Manual Book, Pengesahan Gambar, Copy Suket Lama)
  - *Grup B*: Technical documents (6 items: LHPP, BAP, Copy SKP Ahli K3, Sertifikat PJK3, Foto Dokumentasi, Sertifikat Kalibrasi Alat)
  - *Grup C*: Physical bundel prep (4 items: Cover bundel, Daftar Isi, Dijilid rapi, Salinan arsip)

**Documents to Upload:**
- Bukti Penyerahan ke Disnaker

**Action Button**: `Lanjut ke Stage 8 (Proses Disnaker) →`

---

### Stage 8 — Proses Disnaker (Admin)

**Purpose**: Track the ongoing Disnaker verification process.

**Fields:**
| Field | Options |
|---|---|
| Status Disnaker | `Progress (Dalam Proses)` / `Stuck (Terkendala)` / `Ready (Selesai Disnaker)` |
| Tanggal Dokumen Diterima Kembali | Date Disnaker returned documents |
| Catatan | Free-text notes on any issues |

**Documents to Upload:**
- Tanda Terima Disnaker
- Revisi Dokumen Disnaker
- Scan File Disnaker

**SLA**: 30 days (longest SLA in the pipeline).

**Action Button**: `Lanjut ke Stage 9 (Pengurusan Suket) →`

---

### Stage 9 — Pengurusan Suket (Admin)

**Purpose**: Issue and record the official Suket (certificate).

**Fields:**
| Field | Description |
|---|---|
| No. Suket | Official Suket number from Disnaker |
| Masa Berlaku Sampai | Suket expiry date |
| Progress Status | `Not Started` / `Delayed` / `In Progress` / `Almost Done` / `Done` |

**Default Suket Validity by Equipment Type:**
| Equipment | Validity |
|---|:---:|
| Bejana Tekan | 24 months |
| Pesawat Uap / Boiler | 24 months |
| All other types | 12 months |

**Documents to Upload:**
- Suket (Asli) dari Disnaker

**Action Button**: `Lanjut ke Stage 10 (Penagihan) →`

---

### Stage 10 — Penagihan (Finance)

**Purpose**: Issue invoice and submit for payment collection.

**Fields:**
| Field | Description |
|---|---|
| Total Invoice (Rp) | Final invoice amount |
| Tanggal Invoice Diterbitkan | Invoice issue date |
| No. Invoice | Invoice reference number |
| Payment Due Date | Expected payment deadline |
| Status Penagihan | Progress status of billing |

**Documents to Upload:**
- Invoice (PDF)
- Kwitansi
- Bukti Transfer

**Action Button**: `Kirim Invoice & Lanjut ke Stage 11 (Marketing) →`

---

### Stage 11 — Pengiriman SUKET ke Klien (Marketing)

**Purpose**: Ship the Suket to the client and record tracking.

**Fields:**
| Field | Description |
|---|---|
| **No. Resi** | Courier tracking number *(mandatory)* — e.g., `JNE-9821734912` |
| Catatan Pengiriman | Delivery notes |

**Documents to Upload:**
- Tanda Terima Suket

**Action Button**: `Suket Terkirim — Lanjut ke Stage 11b (Pembayaran) →`

---

### Stage 11b — Pembayaran / Pelunasan (Finance) — Stage ID: 14

**Purpose**: Verify payment receipt and finalize financial settlement.

**Fields:**
| Field | Options |
|---|---|
| Payment Status | `Paid (Lunas)` / `Partial` / `Pending` |
| Tanggal Pembayaran | Date payment was received |
| Catatan Keuangan | Notes on payment terms / installments |

**Documents to Upload:**
- Bukti Transfer / Pembayaran
- Kwitansi Lunas
- Keterangan Pelunasan

**Action Button**: `Pelunasan Selesai — Close Job (Stage 12) →` *(only enabled when status = Paid)*

---

### Stage 12 — Selesai / Closed

**Purpose**: Job is archived as fully completed.

- No further actions available.
- Job card moves to the final `Closed` column on Kanban.
- Full document history and audit trail remain accessible.

---

## 10. Notification Bell

Located in the top header, the bell icon (🔔) shows real-time in-app notifications:
- Manager approval requests pending
- LHPP review tasks assigned
- Suket expiry reminders
- Stage transitions affecting your role

Click the bell to open the notification dropdown. Unread count is shown as a badge.

---

## 11. Profile & Account Settings (`/profile`)

- **Edit Display Name**: Update your display name.
- **Change Password**: Update your login password.
- **Role Display**: Shows your assigned role (read-only — managed by Superadmin).

---

*→ Continue to [Part 2: Step-by-Step SOPs by Role](./USER_GUIDE_PART2_SOP_BY_ROLE.md)*
