# DNP Monitor – User Guide Manual
> **PT Delta Nusantara Persada** | Riksa Uji Monitoring System  
> Version: Rework v2.4 | Stack: Laravel 11 · React · Inertia.js

---

## Table of Contents
- [SECTION 1: System Overview, Interface & Navigation](#section-1-system-overview-interface--navigation)
  - [1. What Is DNP Monitor?](#1-what-is-dnp-monitor)
  - [2. The 14-Stage Lifecycle](#2-the-14-stage-lifecycle)
  - [3. User Roles & Access Permissions](#3-user-roles--access-permissions)
  - [4. Accessing the Application](#4-accessing-the-application)
  - [5. Main Menu Pages](#5-main-menu-pages)
  - [6. Kanban Board (`/kanban`)](#6-kanban-board-kanban)
  - [7. Daftar Job (`/jobs`)](#7-daftar-job-jobs)
  - [8. Job Detail Sheet — Complete Interface Guide](#8-job-detail-sheet--complete-interface-guide)
  - [9. Stage-by-Stage Form Reference](#9-stage-by-stage-form-reference)
  - [10. Notification Bell](#10-notification-bell)
  - [11. Profile & Account Settings (`/profile`)](#11-profile--account-settings-profile)
- [SECTION 2: Step-by-Step SOPs by Role](#section-2-step-by-step-sops-by-role)
  - [SOP Overview by Role](#sop-overview-by-role)
  - [SOP 1: Marketing Personnel (`MKT`)](#sop-1-marketing-personnel-mkt)
  - [SOP 2: Admin Dokumen & RU (`ADM`)](#sop-2-admin-dokumen--ru-adm)
  - [SOP 3: Tim Ahli / Inspektur (`INS`)](#sop-3-tim-ahli--inspektur-ins)
  - [SOP 4: Kadiv RU / Manager (`MGR`)](#sop-4-kadiv-ru--manager-mgr)
  - [SOP 5: Admin Keuangan / Finance (`FIN`)](#sop-5-admin-keuangan--finance-fin)
  - [SOP 6: Super Administrator (`SUP`)](#sop-6-super-administrator-sup)
- [SECTION 3: Troubleshooting, Edge Cases & FAQ](#section-3-troubleshooting-edge-cases--faq)
  - [1. Common Issues & How to Fix Them](#1-common-issues--how-to-fix-them)
  - [2. Document Upload FAQ](#2-document-upload-faq)
  - [3. Role & Permission FAQ](#3-role--permission-faq)
  - [4. Stage Transition Reference Card](#4-stage-transition-reference-card)
  - [5. Dashboard KPI Reference by Role](#5-dashboard-kpi-reference-by-role)
  - [6. Quick Glossary](#6-quick-glossary)
  - [7. Emergency Contacts & Escalation](#7-emergency-contacts--escalation)

---

# SECTION 1: System Overview, Interface & Navigation

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

# SECTION 2: Step-by-Step SOPs by Role

## SOP Overview by Role

| Role | Label | Core Responsibilities |
|---|:---:|---|
| Marketing | `MKT` | Create jobs, actualize units, deliver Suket |
| Admin Dokumen & RU | `ADM` | Verify docs, schedule jobs, manage Disnaker & Suket |
| Tim Ahli / Inspektur | `INS` | Execute field inspection, write LHPP |
| Kadiv RU / Manager | `MGR` | Approve docs, review LHPP, verify Disnaker submission |
| Admin Keuangan | `FIN` | Issue invoices, settle payments, close jobs |
| Super Administrator | `SUP` | Global oversight, user management, system maintenance |

---

## SOP 1: Marketing Personnel (`MKT`)

### A. Creating a New Job (Stage 1 — PO / SPK)

**When to do this**: A new client order (PO or SPK) has been received.

**Step-by-step:**
1. Log in with your Marketing credentials.
2. Click **Job Baru** in the left sidebar or the `+ Job Baru` button on the Kanban board header.
3. Fill in the **New Job Form**:
   - **Klien**: Full client company name.
   - **Pesawat / Jenis Alat**: Select the equipment category from the dropdown (8 options available, e.g., *Lift / Dumbwaiter*, *Proteksi Kebakaran*).
   - **Jumlah Unit**: Enter the total unit count from the PO (e.g., `3` for 3 units).
   - **Nilai Pekerjaan (Rp)**: Enter the total contract value from the PO/SPK.
   - **Lokasi**: Description of the inspection site.
   - **Provinsi**: Select the province where the equipment is located.
   - **Kota / Kabupaten**: Select city/district (auto-populated after selecting province).
4. Upload required documents in the **Upload Dokumen** section:
   - **PO / SPK** *(mandatory — job cannot advance to Stage 2 without this)*
   - **Surat Permohonan** *(mandatory)*
   - **Surat Kuasa** *(mandatory)*
   - Supporting documents (Pernyataan Keabsahan, Form Checklist, Drawing, Manual Book, Copy Suket Lama) if available.
5. Click **Kirim ke Admin Dokumen (Stage 2) →**.
6. The job now appears in the Stage 2 column on the Kanban board. Your job is complete for now — Admin Dokumen will process it next.

> **Tip**: You can add documents to Stage 1 at any time while the job is in Stage 1. Once it moves to Stage 2, you can still upload via the document tab in the Job Detail Sheet.

---

### B. Monitoring Your Jobs

1. Go to **Kanban Board** (`/kanban`).
2. Your jobs are visible across all stage columns.
3. Filter by your name using the **Dashboard** (`/`) which shows jobs assigned to you specifically in the MKT pipeline KPI cards.
4. Watch for **SLA badges** (🟨 Warning, 🟥 Overdue) — these indicate jobs that need urgent attention.

---

### C. Handling Stage 4b — Aktualisasi Unit

**When to do this**: After field inspection, the inspector found a different unit count than what was in the original PO. The job will be routed to Stage 4b automatically and appear in your Kanban column.

**Step-by-step:**
1. Find the job in the **Stage 4b (Aktualisasi Unit)** column on Kanban.
2. Click the job card to open the **Job Detail Sheet**.
3. Review the **inspector's notes** explaining the unit count discrepancy.
4. In the Stage 4b action panel:
   - Update **Jumlah Unit Aktual** to reflect the correct count confirmed with the client.
   - Add notes explaining the change (e.g., *"Client confirmed 2 units were decommissioned prior to inspection"*).
5. Click **Konfirmasi Aktualisasi — Lanjut ke Stage 5 (LHPP) →**.
6. The job advances to Stage 5 where the inspector can now draft the LHPP.

> **Important**: Contact the client to confirm the revised unit count before clicking confirm. This change affects the Suket validity and invoice amount.

---

### D. Delivering Suket to Client (Stage 11)

**When to do this**: The Suket (inspection certificate) has been issued by Disnaker and Finance has requested it be sent to the client.

**Step-by-step:**
1. Find the job in the **Stage 11 (Pengiriman SUKET ke Klien)** column on Kanban.
2. Click the job card.
3. Prepare the physical Suket document(s) for delivery.
4. Choose your delivery method:
   - **Courier** (JNE, TIKI, SiCepat, etc.): Ship and obtain the courier receipt.
   - **Hand Delivery**: Arrange direct handover with the client.
5. In the Stage 11 action panel, enter:
   - **No. Resi**: Enter the courier tracking number (e.g., `JNE-0012345678`). For hand-delivered, enter `Hand-Delivered by [Your Name] - [Date]`.
   - **Catatan Pengiriman**: Any delivery notes.
6. (Optional) Upload a photo of the courier receipt or the client's signed receiving document.
7. Click **Suket Terkirim — Lanjut ke Stage 11b (Pembayaran) →**.
8. Finance will handle payment verification in Stage 11b.

---

### E. Monitoring Suket Renewal Reminders

1. Click **Reminder Suket** in the sidebar.
2. This page shows all issued Sukets that are expiring within **90 days**, grouped by equipment type.
3. Use this to proactively reach out to clients for renewal orders before their certificates expire.

---

## SOP 2: Admin Dokumen & RU (`ADM`)

### A. Verifying Documents (Stage 2)

**When to do this**: A new job appears in the Stage 2 column on Kanban.

**Step-by-step:**
1. Open the job from the **Stage 2 (Verifikasi Dokumen)** column.
2. Switch to the **Dokumen & Histori** tab to review uploaded client documents.
3. Switch back to the **Form Aksi** tab.
4. Review the **10-item Verification Checklist**:
   - For each item, mark: **✓ OK**, **✕ Tidak**, or **N/A**
   - Items 01, 02, 03 (PO/SPK, Surat Permohonan, Surat Kuasa) are **WAJIB** (mandatory)
   - Items 04–10 are **OPSIONAL** — mark N/A if not applicable for this job type
5. **If all mandatory documents are OK:**
   - Click **✓ Verifikasi Selesai — Lanjut Penjadwalan (Stage 3) →**
6. **If mandatory documents are missing but scheduling is urgently needed:**
   - Click **Minta Persetujuan Kadiv/MGR**
   - The job status changes to awaiting Manager approval
   - Wait for Manager to approve or reject the bypass
7. **If documents are fundamentally incorrect or missing:**
   - Click **Tolak / Kembalikan ke Stage 1**
   - Add a note explaining what is missing

> **Tip**: Check the Document tab first to see what has been uploaded before reviewing the checklist. Sometimes Marketing uploads documents after submitting — refresh the page if you're not seeing expected files.

---

### B. Scheduling & Assigning Inspectors (Stage 3)

**When to do this**: Job moves from Stage 2 to Stage 3 after successful verification.

**Step-by-step:**
1. Open the job from the **Stage 3 (Penjadwalan & Surat Tugas)** column.
2. Fill in the scheduling fields:
   - **Tanggal Pelaksanaan RU**: Set the inspection date (coordinate with the client and inspector availability).
   - **Jam Mulai**: Default is 08:00 — adjust if needed.
   - **Durasi (hari)**: Number of inspection days.
   - **No. Surat Tugas**: Enter the ST number from your ST issuance register.
   - **Disnaker Tujuan**: Select the province of the Disnaker office that will receive the bundel.
3. Assign the inspection team:
   - **Tim Inspektur**: Select one or more inspectors from the pool. First selected is the lead.
   - **Report Writer**: Assign who will write the LHPP (can be the same as the lead inspector).
4. Assign testing equipment:
   - **Alat Uji**: Select relevant calibrated equipment from inventory.
   - **Sertifikat Alat**: Select the corresponding calibration certificates.
5. Upload documents:
   - **Surat Tugas** (generated ST document)
   - **Surat Pemberitahuan H-5** (H-5 Teman K3 notification letter)
   - **Bukti Submit Teman K3** (submission proof)
6. Click **Simpan & Lanjut ke Stage 4 (Pelaksanaan RU) →**.

> **H-5 Reminder**: The Surat Pemberitahuan must be submitted to Teman K3 / Disnaker at least **5 working days** before the inspection date. Your Dashboard KPI card "H-5 Pending" shows jobs where this is not yet done.

---

### C. Managing Disnaker Process (Stage 8)

**When to do this**: The bundel dokumen has been physically submitted to Disnaker by the Manager. The job is now in Stage 8.

**Step-by-step:**
1. Open the job from the **Stage 8 (Proses Disnaker)** column.
2. Update the **Status Disnaker**:
   - `Progress (Dalam Proses)`: Documents submitted, Disnaker is processing.
   - `Stuck (Terkendala)`: There is a problem — document returned, revision needed, etc.
   - `Ready (Selesai Disnaker)`: Disnaker has approved and documents are ready for pickup.
3. When Disnaker returns the documents:
   - Enter **Tanggal Dokumen Diterima Kembali**.
   - Upload **Tanda Terima Disnaker**, **Scan File Disnaker**, or revised documents.
4. Click **Lanjut ke Stage 9 (Pengurusan Suket) →**.

> **SLA Note**: Stage 8 has a 30-day SLA — the longest in the pipeline. If Stuck for more than a few days, escalate to the Manager.

---

### D. Issuing the Suket (Stage 9)

**When to do this**: Disnaker has returned the approved documents and issued the official Suket certificate.

**Step-by-step:**
1. Open the job from the **Stage 9 (Pengurusan Suket)** column.
2. Enter Suket details:
   - **No. Suket**: The official certificate number issued by Disnaker.
   - **Masa Berlaku Sampai**: The expiry date of the Suket.
     - *Default validity by type:* Bejana Tekan & Boiler = 24 months; all others = 12 months.
   - **Progress Status**: Set to `Done` when complete.
3. Upload the **Suket (Asli) dari Disnaker** document scan.
4. Click **Lanjut ke Stage 10 (Penagihan) →**.

> **Important**: The Suket expiry date you enter here is what populates the **Reminder Suket** system. Enter it accurately to ensure renewal alerts work correctly.

---

## SOP 3: Tim Ahli / Inspektur (`INS`)

### A. Checking Your Assigned Jobs

1. Log in with your Inspector credentials.
2. Your **Dashboard** (`/`) shows:
   - **Stage 4 Jobs**: Jobs currently scheduled for your field inspection.
   - **LHPP Queue**: Jobs in Stage 5 awaiting your report draft.
   - **SLA Timers**: How many days remaining in each job's SLA.
3. You can also see your assigned jobs on the **Kanban board** in the Stage 4 and Stage 5 columns.

---

### B. Executing Field Inspection (Stage 4)

**When to do this**: On the day of inspection (or after returning from the field), update the job with inspection proof.

**Step-by-step:**
1. Open the job from the **Stage 4 (Pelaksanaan RU)** column.
2. Upload the **3 mandatory proof photos** *(all 3 required — cannot proceed without them)*:
   - `Foto Keberangkatan` — Photo taken before leaving office/departure.
   - `Foto Sampai Lokasi Riksauji` — Photo at the inspection site.
   - `Foto Kepulangan` — Photo after completion, returning.
   
   *How to upload:* Click the `+ Upload` button next to each photo type. Supported: JPG, PNG, PDF.

3. Complete the **Field Inspection Checklist** (8 items). For each item:
   - Mark **✓ Selesai** or leave unchecked
   - Add `Catatan` if there are relevant observations
   - Critical items (⚠️): nameplate, visual inspection, safety device test, functional test, BAP signature

4. Enter **Jumlah Unit Aktual Terinspeksi**:
   - If this matches the PO unit count → job will move directly to Stage 5.
   - If this **differs** from the PO → choose **Stage 4b (Aktualisasi Unit)** action.

5. Upload additional field documentation:
   - Foto Nameplate, Foto Kondisi Fisik, BAP (signed), Foto Hasil Pengukuran, Foto Alat Pengaman, Foto APD & Tim di Lokasi, Foto Dokumentasi Lapangan, Data Pengukuran

6. Add **Catatan Lapangan** (field notes).

7. Choose action:
   - **Units match PO**: Click `Selesai Inspeksi — Lanjut ke Stage 5 (LHPP) →`
   - **Units mismatch**: Click `Kirim ke Stage 4b (Aktualisasi Unit — Marketing)`

> **Mobile Tip**: If you are on-site with your phone, you can open the job on mobile browser and directly upload photos from your camera. The upload slot supports camera capture on mobile.

---

### C. Drafting the LHPP (Stage 5)

**When to do this**: The job has moved to Stage 5, and you are assigned as the Report Writer.

**Step-by-step:**
1. Open the job from the **Stage 5 (Penyusunan LHPP)** column.
2. For **each unit** inspected, add an evaluation entry:
   - **Status Kelayakan**: Select one:
     - `LAIK` — Unit fully meets safety standards.
     - `LAIK BERSYARAT` — Unit meets standards with noted conditions.
     - `TIDAK LAIK` — Unit does not meet safety standards.
   - **Temuan (Findings)**: Describe the technical findings observed.
   - **Rekomendasi**: Provide recommendations (repair, replacement, conditions for laik bersyarat, etc.).

3. **Smart Recommendation Assistant** (AI Tool):
   - Click the assistant button to open the recommendation panel.
   - Enter equipment details, condition description, and test results.
   - The system will generate standard LHPP language based on common inspection patterns.
   - Review and edit the suggestion before copying it to your report.

4. Enter **Catatan LHPP Umum** (overall report notes).

5. Upload documents:
   - **LHPP** *(the completed report document — PDF/Word)*
   - **BAP** *(Berita Acara Pemeriksaan — signed)*
   - Laporan Teknis Tambahan *(if any)*

6. Click **Submit LHPP ke Manager Review (Stage 6) →**.
   - The job status updates to `peer_review_status: submitted`.
   - The Manager receives a notification to review.

> **SLA Note**: Stage 5 has a **3-day SLA per unit** — e.g., a job with 3 units has a 9-day SLA. Your Dashboard SLA timer shows remaining days.

---

## SOP 4: Kadiv RU / Manager (`MGR`)

### A. Approving Stage 2 Bypass (Manager Intercept)

**When to do this**: Admin has requested a document bypass and the notification appears on your Dashboard or Notification Bell.

**Step-by-step:**
1. Check your **Dashboard** — the "Menunggu Persetujuan" KPI card shows pending intercepts.
2. Alternatively, check the **Notification Bell** (🔔) in the header.
3. Click the pending job to open its **Job Detail Sheet**.
4. Review the Admin's notes explaining why documents are missing.
5. Contact the client or Admin for context if needed.
6. Choose:
   - **Setujui**: Admin can proceed to Schedule Stage 3 despite missing documents.
   - **Tolak**: Return job to Marketing (Stage 1) to obtain missing documents first.
7. Add a note explaining your decision.
8. Click confirm.

---

### B. Reviewing LHPP Technical Report (Stage 6)

**When to do this**: An inspector has submitted a completed LHPP and the job appears in the Stage 6 column.

**Step-by-step:**
1. Open the job from the **Stage 6 (Review Laporan Teknis)** column.
2. Review the LHPP:
   - Switch to **Dokumen & Histori** tab — download and read the LHPP PDF.
   - Review each unit's evaluation status and findings.
   - Check BAP for completeness.
3. Switch to the **Form Aksi** tab.
4. Select your **Review Decision**:
   - `Setujui` — Report is complete and technically sound. Advances to Stage 7.
   - `Setujui Bersyarat` — Approve with conditions noted (e.g., client must address items before Suket validity period). Advances to Stage 7 with conditions.
   - `Tolak / Revisi` — Report requires correction. Returns to Stage 5 for inspector revision.
5. Enter **Catatan Review MGR** (required for Tolak, recommended for Setujui Bersyarat).
6. Upload reviewed/annotated documents if needed.
7. Click the action button matching your decision.

> **Quality Gate**: This is the critical quality checkpoint before the bundel goes to Disnaker. Take time to review carefully — errors at this stage create costly revisions post-Disnaker.

---

### C. Recording Disnaker Submission (Stage 7)

**When to do this**: You have physically submitted the bundel dokumen to the Disnaker office.

**Step-by-step:**
1. Prepare the physical bundel (verified in Stage 7 checklist).
2. Open the job from the **Stage 7 (Verifikasi ke Dinas)** column.
3. Review the **Bundel Dokumen Checklist**:
   - **Grup A** (8 client documents): Surat Permohonan, Surat Kuasa, Pernyataan Keabsahan, Form Checklist Disnaker, Drawing, Manual Book, Pengesahan Gambar Kemnaker, Copy Suket Lama
   - **Grup B** (6 technical documents): LHPP, BAP, Copy SKP Ahli K3, Sertifikat PJK3, Foto Dokumentasi, Sertifikat Kalibrasi Alat
   - **Grup C** (4 physical preparation items): Cover bundel, Daftar Isi, Dijilid rapi, Salinan arsip
   - Tick each item as confirmed ready.
4. After physically submitting to Disnaker:
   - Enter **Tanggal Penyerahan ke Disnaker**.
   - Upload **Bukti Penyerahan ke Disnaker** (photo/scan of submission receipt).
5. Click **Lanjut ke Stage 8 (Proses Disnaker) →**.
6. Admin Dokumen will monitor the Disnaker process from Stage 8 onward.

---

### D. Monitoring Inspector Workload

From your **Dashboard**:
1. The **Workload by Inspector** section shows each assigned inspector with:
   - Total active jobs
   - Jobs in Stage 4 (Lapangan)
   - Jobs in Stage 6 (LHPP)
   - Overdue count
2. Use this to **balance assignments** when creating new ST assignments in Stage 3.
3. **Tidak Laik / Laik Bersyarat** summary shows all units with safety issues across all jobs — use for escalation tracking.

---

## SOP 5: Admin Keuangan / Finance (`FIN`)

### A. Issuing an Invoice (Stage 10)

**When to do this**: A job enters Stage 10 after the Suket has been issued and handed off from Admin Dokumen.

**Step-by-step:**
1. Check your **Dashboard** — the "Siap Tagih" KPI shows jobs ready for invoicing.
2. Open the job from the **Stage 10 (Penagihan)** column.
3. Fill in invoice details:
   - **Total Invoice (Rp)**: Enter the final billing amount (may differ from PO nilai if units were actualized).
   - **No. Invoice**: Enter your invoice reference number from your invoicing system.
   - **Tanggal Invoice Diterbitkan**: Today's date or invoice date.
   - **Payment Due Date**: Expected payment deadline (e.g., 30 days from invoice date).
   - **Status Penagihan**: Set initial status (e.g., `In Progress`).
4. Upload:
   - **Invoice (PDF)**: The formal invoice document.
   - **Kwitansi**: Receipt template.
5. Click **Kirim Invoice & Lanjut ke Stage 11 (Marketing) →**.
6. Marketing will receive the job in Stage 11 to ship the Suket.

---

### B. Monitoring Accounts Receivable (AR)

From your **Finance Dashboard**:
1. **Piutang Berjalan**: All outstanding invoices by client and amount.
2. **AR Aging Buckets**:
   - `0–30 days`: Recent invoices within normal terms.
   - `31–60 days`: Approaching follow-up threshold.
   - `61–90 days`: Overdue — client follow-up required.
   - `>90 days`: Critical overdue — escalate to management.
3. **Piutang Overdue**: Jobs where `payment_due_date` has passed without payment.
4. **Total Piutang (Rp)**: Sum of all outstanding receivables.

---

### C. Recording Payment & Closing the Job (Stage 11b / 14)

**When to do this**: Marketing has confirmed Suket delivery and the job is now in Stage 11b for payment verification.

**Step-by-step:**
1. Open the job from the **Stage 11b (Pembayaran / Pelunasan)** column.
2. Verify payment receipt (check bank statement, transfer proof):
   - **Payment Status**:
     - `Paid (Lunas)` — Full payment received. Proceed to close.
     - `Partial` — Partial payment received. Update amount, leave in Stage 11b.
     - `Pending` — No payment yet. Leave in Stage 11b, update notes.
   - **Tanggal Pembayaran**: Date payment was received.
   - **Catatan Keuangan**: Notes (e.g., "50% down payment received, balance due 2024-12-01").
3. Upload payment proof:
   - **Bukti Transfer / Pembayaran**: Bank transfer screenshot or receipt.
   - **Kwitansi Lunas**: Signed payment receipt.
   - **Keterangan Pelunasan**: Additional payment documentation.
4. **If fully Paid**:
   - Click **Pelunasan Selesai — Archive & Close Job (Stage 12) →**.
   - The job moves to Stage 12 and is marked **Closed**.
5. **If Partial or Pending**:
   - Save progress — job remains in Stage 11b.
   - Follow up with client per your AR schedule.
   - Return and update when full payment is received.

---

## SOP 6: Super Administrator (`SUP`)

### A. User Management (`/users`)

**Creating a New User:**
1. Go to `/users` in the sidebar.
2. Click **+ Tambah User**.
3. Fill in:
   - **Nama Lengkap**
   - **Email** (used as login)
   - **Password** (temporary — user should change on first login)
   - **Role**: Select from Marketing, Admin, Inspektur, Manager, Finance, Superadmin.
4. Click **Simpan**.
5. Share login credentials with the new user securely.

**Editing/Deactivating Users:**
1. Find the user in the Users table.
2. Click the edit (✏️) icon.
3. Update fields as needed or change role.
4. To remove access, delete the user account.

**Stage Permission Matrix:**
- By default, each role has standard stage ownership based on `ROLES` constant.
- Superadmin can override individual stage permissions via the permission matrix in user settings.

---

### B. Inventory & Equipment Management (`/inventory`)

**Alat Uji (Testing Equipment):**
1. Go to **Alat & SKP** in the sidebar.
2. View all equipment with calibration status:
   - 🟢 **Available**: Calibration valid and within date.
   - 🟡 **Expiring Soon**: Calibration expires within 30 days.
   - 🔴 **Expired**: Calibration has expired — equipment should not be used in inspections.
3. To add/edit equipment: Click the equipment item and update calibration dates.

**Inspector SKP Monitoring:**
1. In the same **Alat & SKP** page, scroll to the SKP / License section.
2. View each inspector's:
   - SKP (Surat Kompetensi) expiry date
   - License type and scope
   - Days until expiry
3. Flag inspectors with expired SKPs — they should not be assigned to new jobs until renewed.

---

### C. Resetting the Database (Kanban Board)

> [!CAUTION]
> This action is **irreversible**. It permanently deletes ALL job data from the database. Use only in development/testing environments or after explicit senior management approval.

**Steps:**
1. Go to the **Kanban Board** (`/kanban`).
2. Click the **red "Kosongkan Database"** button in the top right header.
3. A confirmation dialog will appear — read it carefully.
4. Click **Hapus Semua Data** to confirm.
5. All jobs, documents, and audit history are permanently removed.
6. The Kanban board resets to empty.

---

### D. Reporting (`/pelaporan`)

1. Go to **Pelaporan** in the sidebar.
2. View aggregated reports across:
   - Jobs completed per period
   - Revenue realized vs pipeline
   - Inspector productivity by period
   - Stage-by-stage throughput analytics
3. Export to CSV or PDF as needed.

---

# SECTION 3: Troubleshooting, Edge Cases & FAQ

## 1. Common Issues & How to Fix Them

### Issue 1: Job is stuck in Stage 4 — cannot move forward

**Symptom**: The button to progress to Stage 5 is grayed out or a warning appears.

**Root Cause**: One or more of the following are incomplete:
- Not all **3 mandatory proof photos** have been uploaded (Keberangkatan, Sampai Lokasi, Kepulangan).
- The **Jumlah Unit Aktual** field has not been filled.
- The **Field Inspection Checklist** has critical items unchecked.

**Fix:**
1. Open the job in Stage 4.
2. Check each mandatory photo slot — all 3 must show a file (not the "Belum ada dokumen" placeholder).
3. Verify the **Jumlah Unit Aktual** field has a number entered.
4. Check the checklist — critical items (nameplate, visual, pengaman, fungsi, BAP) must be checked.
5. Once all are complete, the progression button will become active.

**If you have a unit count mismatch**: Do not leave the job stuck — explicitly click the **"Kirim ke Stage 4b (Aktualisasi Unit)"** button so Marketing can update the units. The job is not stuck; it needs to route through Stage 4b.

---

### Issue 2: Stage shows as "Stage 13" instead of "Stage 4b"

**Symptom**: In some views (older browser cache or certain report exports), the stage displays the raw database ID `13` instead of the friendly code `4b`.

**Explanation**: Stage 4b has an internal database ID of `13`. The frontend maps this to display as `4b` using the `displayId` property in the stage configuration. Raw API responses or cached pages may show `13`.

**Fix:**
- **Hard refresh** the page: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac).
- If the issue persists in a specific report or export, report it to Superadmin for a build update.
- The Kanban board, Timeline, and Dashboard all correctly show `4b` after the latest build.

---

### Issue 3: Job is stuck — "alat count is 1 but system blocks progression"

**Symptom**: A job with only 1 unit cannot move from Stage 4 to Stage 5. An error or validation message appears.

**Fix** (this was a known bug — resolved in the latest deployment):
- The previous validation required `actual_units === units` before allowing Stage 5 progression.
- This restriction has been removed. Jobs with 1 unit now move freely.
- If you still see this error:
  1. Hard-refresh the browser to clear cached JS files.
  2. If still blocked, ask Superadmin to re-deploy: `npm run build` on the server.

---

### Issue 4: Cannot see the "Minta Persetujuan MGR" button in Stage 2

**Symptom**: The Manager approval request button is missing from the Stage 2 action panel.

**Cause**: This button is only visible to `Admin` role users. Marketing or other roles viewing Stage 2 will not see it.

**Fix:**
- Confirm you are logged in with an **Admin Dokumen** (`ADM`) account.
- If you are Admin and still don't see it, check your stage permission matrix in `/users` — your account must have `is_owner: true` for Stage 2.

---

### Issue 5: Documents uploaded but showing on wrong stage in the Document tab

**Symptom**: A file uploaded during Stage 4 appears under Stage 2 in the Dokumen & Histori tab.

**Cause**: The upload was triggered from a different stage slot (e.g., using the global document tab instead of the specific stage slot in the Form tab).

**Fix:**
- Use the **upload slots within the Form Aksi tab** of the current stage — these automatically tag documents to the correct stage.
- Documents uploaded from the **Dokumen & Histori tab** may not carry the correct stage tag.
- To re-tag a document: delete it and re-upload via the correct stage slot in the Form Aksi tab.

---

### Issue 6: Inspector not appearing in the inspector assignment dropdown (Stage 3)

**Symptom**: An expected inspector is not listed when assigning Tim Riksa Uji in Stage 3.

**Causes & Fixes:**

| Cause | Fix |
|---|---|
| Inspector user account not created yet | Ask Superadmin to create the user account at `/users` with role `inspektur` |
| Inspector profile not set up | Ask Superadmin to set up the inspector profile in `/inventory` (Alat & SKP section) |
| Inspector's SKP is expired | The system may filter out inspectors with expired credentials — renew their SKP record |

---

### Issue 7: No. Resi field is not visible in Stage 11

**Symptom**: The `No. Resi` tracking number input field is missing from the Stage 11 action panel.

**Cause**: Viewing Stage 11 as a non-MKT role — the No. Resi input is a Marketing-specific field.

**Fix:**
- Confirm the logged-in user is **Marketing** (`MKT`) or **Superadmin**.
- If you are MKT and still don't see it: hard-refresh the page.
- If the field still doesn't appear after refresh: check with Superadmin if a migration may be pending (`php artisan migrate`).

---

### Issue 8: Kanban board not updating — jobs not moving between columns

**Symptom**: After a stage transition, the job card stays in the old column and doesn't move to the new column.

**Cause**: The 10-second auto-refresh may have a delay, or there was a background sync conflict.

**Fix:**
1. Wait 10–15 seconds — the Kanban auto-syncs every 10 seconds.
2. If still not updated, do a manual page refresh (`F5`).
3. If the issue is consistent, check the browser console for JavaScript errors and report to your Superadmin.

---

### Issue 9: SLA badge shows OVERDUE but the job is actually on time

**Symptom**: A job shows the red OVERDUE badge even though it entered the stage today.

**Cause**: The `stage_started_at` timestamp may not have been updated correctly during the last stage transition, or the server's timezone is misaligned.

**Fix:**
- Ask Superadmin to check the `stage_started_at` field on the job record in the database.
- The correct value should be the timestamp when the job entered its current stage.
- If the field is null, the system falls back to `updated_at`, which may be older.

---

## 2. Document Upload FAQ

**Q: What file types are supported for uploads?**  
A: The system accepts **PDF, JPG, JPEG, PNG**. For documents (LHPP, invoices, BAP), use PDF. For photos (field photos, proof photos), JPG or PNG is recommended.

**Q: Is there a file size limit?**  
A: The default Laravel upload limit is typically **10MB per file**. If you receive an error uploading a large file, compress it or split it into smaller parts. Contact Superadmin to adjust the server upload limit if needed.

**Q: Can I drag and drop files to upload?**  
A: Yes. Each upload slot supports **drag-and-drop** — drag a file from your file explorer directly onto the dashed upload area. The area will highlight blue when a file is being dragged over it.

**Q: Can I upload multiple files at once to one slot?**  
A: Each slot is designed for one file per upload action. For stages that require multiple documents of the same type, click `+ Upload` multiple times to attach multiple files to the same slot.

**Q: How do I delete a document I uploaded by mistake?**  
A: In the **Dokumen & Histori** tab, hover over the file chip — an `×` button appears. Click it to delete. Only users with management permission for that stage can delete documents.

---

## 3. Role & Permission FAQ

**Q: I can see a job but the action buttons are grayed out. Why?**  
A: Your role does not own that stage. For example, a Finance user viewing a Stage 4 (Inspector) job can read it but cannot take action. Actions are only enabled for the designated role of that stage.

**Q: Can a Manager act on behalf of Marketing if Marketing is unavailable?**  
A: Managers have broad view access but not ownership of MKT stages (1, 4b, 11). The Superadmin can temporarily grant override permissions, or a Superadmin can perform the action directly.

**Q: I was assigned as inspector on a job but I can't see it. Why?**  
A: Confirm:
1. You are logged into the correct inspector account.
2. The job was saved with your inspector ID in the Tim Riksa Uji assignment (Stage 3).
3. Try refreshing the Dashboard or checking the Kanban board directly.

**Q: Why does the Superadmin see a red "Kosongkan Database" button that others don't?**  
A: This is a development/testing utility restricted to Superadmin. It permanently deletes all job data and is not visible to any other role to prevent accidental data loss.

---

## 4. Stage Transition Reference Card

A quick reference for which role takes action at each stage transition:

| From Stage | Action Required By | Transitions To | Notes |
|---|:---:|---|---|
| 1 (PO/SPK) | MKT | 2 | After uploading PO/SPK, Surat Permohonan, Surat Kuasa |
| 2 (Verifikasi) | ADM | 3 | After completing 10-item checklist |
| 2 (Verifikasi) | ADM → MGR → ADM | 3 | If MGR bypass approved |
| 2 (Verifikasi) | ADM | 1 | Rejected — return to MKT |
| 3 (Jadwal) | ADM | 4 | After ST, inspector assignment, equipment |
| 4 (Inspeksi) | INS | 5 | Units match, photos uploaded, checklist done |
| 4 (Inspeksi) | INS | 4b (13) | Unit count mismatch |
| 4b (Aktualisasi) | MKT | 5 | After confirming actual unit count |
| 5 (LHPP) | INS | 6 | After uploading LHPP and submitting for review |
| 6 (Review) | MGR | 7 | Decision: Setujui / Setujui Bersyarat |
| 6 (Review) | MGR | 5 | Decision: Tolak / Revisi |
| 7 (Ke Dinas) | MGR | 8 | After physical bundel submission |
| 8 (Disnaker) | ADM | 9 | After Disnaker returns documents |
| 9 (Suket) | ADM | 10 | After issuing Suket with No. Suket & expiry |
| 10 (Tagihan) | FIN | 11 | After issuing invoice |
| 11 (Kirim SUKET) | MKT | 11b (14) | After entering No. Resi and shipping |
| 11b (Pembayaran) | FIN | 12 | After confirming full payment received |

---

## 5. Dashboard KPI Reference by Role

### Marketing Dashboard
| KPI Card | What It Shows |
|---|---|
| Pipeline Value | Total Rp value of all active jobs |
| Target Bulan Ini | Monthly revenue target vs realization |
| Funnel by Stage | Count of jobs in each stage group |
| Suket Expiring | Units with Suket expiring within 90 days |

### Admin Dokumen Dashboard
| KPI Card | What It Shows |
|---|---|
| Antrian Verifikasi | Jobs waiting in Stage 2 |
| Butuh Jadwal | Stage 3 jobs without No. Surat Tugas yet |
| H-5 Pending | Stage 3 jobs without H-5 notification sent |
| Kalender Inspeksi | Calendar view of all scheduled Stage 4 jobs |

### Inspektur Dashboard
| KPI Card | What It Shows |
|---|---|
| Jadwal Lapangan | Your assigned Stage 4 jobs |
| LHPP Antrian | Your Stage 5 draft queue with SLA timers |
| SLA Countdown | Days remaining per job in active stages |

### Manager Dashboard
| KPI Card | What It Shows |
|---|---|
| LHPP Menunggu Review | Stage 5 jobs with `submitted` peer review status |
| Workload Inspektur | Active job count per inspector |
| Tidak Laik / Laik Bersyarat | Units flagged with safety concerns |
| Proses Disnaker | Stage 8 jobs and days elapsed |

### Finance Dashboard
| KPI Card | What It Shows |
|---|---|
| Siap Tagih | Stage 10 jobs ready for invoicing |
| Piutang Berjalan | Active outstanding receivables |
| AR Aging | Receivables by age bucket (0-30, 31-60, 61-90, >90 days) |
| Tanda Terima Pending | Stage 11 jobs without confirmed receipt |

---

## 6. Quick Glossary

| Term | Definition |
|---|---|
| **RiksaUji** | Short for Riksa dan Uji — the formal technical inspection and testing process |
| **LHPP** | Laporan Hasil Pemeriksaan dan Pengujian — Technical Inspection & Testing Report |
| **BAP** | Berita Acara Pemeriksaan — Official Inspection Minutes (signed by PIC client on-site) |
| **Suket** | Surat Keterangan — Official certificate issued by Disnaker confirming equipment safety |
| **ST** | Surat Tugas — Official assignment letter issued to the inspection team |
| **Disnaker** | Dinas Ketenagakerjaan — Provincial Manpower Office (government authority) |
| **PJK3** | Perusahaan Jasa Keselamatan dan Kesehatan Kerja — Certified K3 service company (DNP's legal status) |
| **SKP** | Surat Kompetensi — Competency Certificate for Ahli K3 inspectors |
| **H-5** | H minus 5 — notification sent 5 working days before inspection to Teman K3 / Disnaker |
| **Teman K3** | Online platform / database for K3 activities, Disnaker notification system |
| **Laik** | Equipment is safe and meets all K3 standards |
| **Laik Bersyarat** | Equipment is conditionally safe — approved with specific conditions attached |
| **Tidak Laik** | Equipment does not meet safety standards — cannot be certified |
| **PO / SPK** | Purchase Order / Surat Perintah Kerja — client contract document |
| **SLA** | Service Level Agreement — maximum time allotted for a stage to be completed |
| **AR Aging** | Accounts Receivable Aging — categorization of outstanding invoices by days overdue |

---

## 7. Emergency Contacts & Escalation

| Situation | Who to Contact |
|---|---|
| Cannot log in / lost password | Superadmin — request password reset |
| Job moved to wrong stage | Superadmin — can manually override stage |
| Document accidentally deleted | Superadmin — database-level recovery may be possible |
| System error / page crash | Superadmin — check server error logs |
| Client disputes unit count | Marketing PIC → Superadmin for job data audit trail |
| Disnaker rejection of bundel | Manager → Admin → fix and resubmit Stage 7 |

---

*Document End — Complete DNP Monitor User Guide Manual*  
*PT Delta Nusantara Persada | Riksa Uji Monitoring System v2.4*
