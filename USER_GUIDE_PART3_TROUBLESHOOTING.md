# DNP Monitor – User Guide Manual
## PART 3: Troubleshooting, Edge Cases & FAQ
> **PT Delta Nusantara Persada** | Riksa Uji Monitoring System

---

*← Back to [Part 2: SOPs by Role](./USER_GUIDE_PART2_SOP_BY_ROLE.md)*  
*← Back to [Part 1: System Overview & Navigation](./USER_GUIDE_PART1_OVERVIEW_AND_NAVIGATION.md)*

---

## 1. Common Issues & How to Fix Them

---

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

*Document End — DNP Monitor User Guide Manual (3 Parts)*  
*PT Delta Nusantara Persada | Riksa Uji Monitoring System v2.4*

---

**Index of All Manual Files:**
- [Part 1 — System Overview, Interface & Navigation](./USER_GUIDE_PART1_OVERVIEW_AND_NAVIGATION.md)
- [Part 2 — Step-by-Step SOPs by Role](./USER_GUIDE_PART2_SOP_BY_ROLE.md)
- [Part 3 — Troubleshooting, Edge Cases & FAQ](./USER_GUIDE_PART3_TROUBLESHOOTING.md) *(this file)*
