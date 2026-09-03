# DNP Monitor – User Guide Manual
## PART 2: Step-by-Step SOPs by Role
> **PT Delta Nusantara Persada** | Riksa Uji Monitoring System

---

*← Back to [Part 1: System Overview & Navigation](./USER_GUIDE_PART1_OVERVIEW_AND_NAVIGATION.md)*  
*→ Continue to [Part 3: Troubleshooting & FAQ](./USER_GUIDE_PART3_TROUBLESHOOTING.md)*

---

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
   - Foto Nameplate, Foto Kondisi Fisik, BAP (signed), Foto Hasil Pengukuran, Foto Alat Pengaman, Foto APD & Tim, Data Pengukuran

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

*← Back to [Part 1: System Overview & Navigation](./USER_GUIDE_PART1_OVERVIEW_AND_NAVIGATION.md)*  
*→ Continue to [Part 3: Troubleshooting & FAQ](./USER_GUIDE_PART3_TROUBLESHOOTING.md)*
