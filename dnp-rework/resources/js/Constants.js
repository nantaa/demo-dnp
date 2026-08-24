export const STAGES = [
    { id: 1, name: 'PO / SPK', short: 'PO', role: 'marketing', sla: null },
    { id: 2, name: 'Verifikasi Dokumen', short: 'Verifikasi', role: 'admin', sla: 1 },
    { id: 3, name: 'Penjadwalan & Surat Tugas', short: 'Jadwal', role: 'admin', sla: 1 },
    { id: 4, name: 'Pelaksanaan RU', short: 'Inspeksi', role: 'inspektur', sla: null },
    { id: 13, name: 'Aktualisasi Unit', short: 'Aktualisasi', role: 'marketing', sla: 1, displayId: '4b' },
    { id: 5, name: 'Penyusunan LHPP', short: 'LHPP', role: 'inspektur', sla: 3 },
    { id: 6, name: 'Review Laporan Teknis', short: 'Rev. Laporan', role: 'manager', sla: 1 },
    { id: 7, name: 'Verifikasi ke Dinas', short: 'Penyerahan', role: 'manager', sla: 1 },
    { id: 8, name: 'Proses Disnaker', short: 'Disnaker', role: 'admin', sla: 30 },
    { id: 9, name: 'Pengurusan Suket', short: 'Suket', role: 'admin', sla: 1 },
    { id: 10, name: 'Penagihan', short: 'Tagihan', role: 'finance', sla: 1 },
    { id: 11, name: 'Pengiriman SUKET ke Klien', short: 'Kirim SUKET', role: 'marketing', sla: null },
    { id: 14, name: 'Pembayaran / Pelunasan', short: 'Pembayaran', role: 'finance', sla: 1, displayId: '11b' },
    { id: 12, name: 'Selesai / Closed', short: 'Closed', role: 'finance', sla: null },
];

export const ROLES = {
    marketing: { name: 'Marketing', label: 'MKT' },
    admin: { name: 'Admin Dokumen & RU', label: 'ADM' },
    inspektur: { name: 'Tim Ahli / Inspektur', label: 'INS' },
    manager: { name: 'Kadiv RU / Manager', label: 'MGR' },
    finance: { name: 'Admin Keuangan', label: 'FIN' },
    superadmin: { name: 'Super Administrator', label: 'SUP' },
};

// Marketing-only stages (locked for MGR intercept)
export const MKT_STAGES = [1, 11, 13];
// Finance-only stages (locked for MGR intercept)
export const FIN_STAGES = [10, 14, 12];

// Jenis alat yang di RiksaUji (Task 3)
export const PESAWAT_TYPES = [
    'Proteksi Kebakaran (Form 65 K)',
    'Lift / Dumbwaiter (Form 36/38/39)',
    'Eskalator / Travelator (Form 52)',
    'PAPA (Crane/Forklift/dll) (Form A 52)',
    'Instalasi Listrik & PP (Form 55 L)',
    'Pesawat Uap (Boiler) (Form 6)',
    'Bejana Tekan (Form 45 A.1)',
    'PTP (Compressor/Genset) (Form 54 A)',
];

// Stage 4 mandatory photo types (Task 9)
export const STAGE4_PHOTO_TYPES = [
    'Foto Keberangkatan',
    'Foto Sampai Lokasi Riksauji',
    'Foto Kepulangan',
];

// INS subroles (Task 8) — informational only for now
export const INS_SUBROLES = {
    tenaga_ahli: 'Tenaga Ahli INS',
    teknisi: 'Teknisi INS',
};

// Stage 5 review decisions (Task 14)
export const STAGE5_DECISIONS = [
    { value: 'approved', label: 'Setujui' },
    { value: 'approved_conditional', label: 'Setujui Bersyarat' },
    { value: 'rejected', label: 'Tolak' },
];

// Stage 8 progress / disnaker status
export const STAGE8_DISNAKER_STATUSES = [
    { value: 'progress', label: 'Progress (Dalam Proses)' },
    { value: 'stuck', label: 'Stuck (Terkendala)' },
    { value: 'ready', label: 'Ready (Selesai Disnaker)' },
];

// Stage 9 progress statuses (Task 17)
export const PROGRESS_STATUSES = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'delayed', label: 'Delayed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'almost_done', label: 'Almost Done' },
    { value: 'done', label: 'Done' },
];

// Stage 2 verification checklist (Task 6)
export const STAGE2_VERIFY_CHECKLIST = [
    { no: '01', type: 'PO/SPK', label: 'PO / SPK dari Klien', badge: 'WAJIB', hasNa: false, hint: null },
    { no: '02', type: 'Surat Permohonan', label: 'Surat Permohonan Riksa Uji (bermaterai)', badge: 'WAJIB', hasNa: false, hint: null },
    { no: '03', type: 'Surat Kuasa', label: 'Surat Kuasa dari Pemilik (bermaterai)', badge: 'WAJIB', hasNa: false, hint: null },
    { no: '04', type: 'Pernyataan Keabsahan', label: 'Surat Pernyataan Keabsahan Data', badge: 'OPSIONAL', hasNa: true, hint: null },
    { no: '05', type: 'Form Checklist Klien', label: 'Form Checklist Disnaker (diisi klien)', badge: 'OPSIONAL', hasNa: true, hint: null },
    { no: '06', type: 'Drawing/As-Built', label: 'Drawing / Gambar Teknis (as-built)', badge: 'OPSIONAL', hasNa: true, hint: 'Opsional' },
    { no: '07', type: 'Manual Book', label: 'Manual Book / Spesifikasi Teknis', badge: 'OPSIONAL', hasNa: true, hint: 'Opsional' },
    { no: '08', type: 'Pengesahan Gambar Kemnaker', label: 'Pengesahan Gambar dari Kemnaker', badge: 'OPSIONAL', hasNa: true, hint: 'Opsional' },
    { no: '09', type: 'Copy Suket Lama', label: 'Copy Suket Lama (perpanjangan)', badge: 'OPSIONAL', hasNa: true, hint: null },
    { no: '10', type: 'Catatan Verifikasi', label: 'Verifikasi: Drawing SESUAI dengan Nameplate (cek visual foto)', badge: 'OPSIONAL', badge2: 'CEK VISUAL', hasNa: true, hint: 'Cek manual oleh Admin', isManual: true },
];

// Required document types per stage
export const DOC_TYPES_BY_STAGE = {
    1: ['PO/SPK', 'Surat Permohonan', 'Surat Kuasa', 'Pernyataan Keabsahan', 'Form Checklist Klien', 'Drawing/As-Built', 'Manual Book', 'Copy Suket Lama'],
    2: ['PO/SPK', 'Surat Permohonan', 'Surat Kuasa', 'Pernyataan Keabsahan', 'Form Checklist Klien', 'Drawing/As-Built', 'Manual Book', 'Pengesahan Gambar Kemnaker', 'Copy Suket Lama', 'Catatan Verifikasi'],
    3: ['Surat Tugas', 'Surat Pemberitahuan H-5', 'Bukti Submit Teman K3'],
    4: ['Foto Nameplate', 'Foto Kondisi Fisik', 'BAP', 'Foto Hasil Pengukuran', 'Foto Alat Pengaman', 'Foto APD & Tim di Lokasi', 'Foto Dokumentasi Lapangan', 'Data Pengukuran'],
    5: ['LHPP', 'BAP', 'Laporan Teknis Tambahan'],         // Stage 5 = Penyusunan LHPP (Admin)
    6: ['LHPP Draft', 'BAP', 'Catatan Review MGR'],         // Stage 6 = Review Laporan Teknis (Manager)
    7: ['Bukti Penyerahan ke Disnaker'],
    8: ['Tanda Terima Disnaker', 'Revisi Dokumen Disnaker', 'Scan File Disnaker'],
    9: ['Suket (Asli) dari Disnaker'],
    10: ['Invoice (PDF)', 'Kwitansi', 'Bukti Transfer'],
    11: ['Tanda Terima Suket'],
    12: ['Bukti Transfer / Pembayaran', 'Kwitansi Lunas'],
    13: [],
    14: ['Bukti Transfer / Pembayaran', 'Kwitansi Lunas', 'Keterangan Pelunasan'],
};

// Stage 1 docs that gate Stage 2 (at least one required — Task 5)
export const STAGE1_REQUIRED_DOCS = ['PO/SPK', 'Surat Permohonan', 'Surat Kuasa'];

// Stage 2 mandatory docs (can be bypassed by Kadiv approval — Task 6)
export const STAGE2_REQUIRED_DOCS = ['PO/SPK', 'Surat Permohonan', 'Surat Kuasa'];

// Stage 4 lapangan checklist items (saved as s4_checklist JSON on dnp_jobs)
// Each item key matches the id; stored as { [id]: { status: 'checked'|'unchecked', catatan: string } }
export const STAGE4_CHECKLIST_ITEMS = [
    { id: 'nameplate', label: 'Verifikasi Nameplate', kritis: true },
    { id: 'visual', label: 'Pemeriksaan Visual (korosi, retak, kebocoran, deformasi)', kritis: true },
    { id: 'dimensi', label: 'Pengukuran Dimensi & Ketebalan Material', kritis: false },
    { id: 'kelistrikan', label: 'Pemeriksaan Sistem Kelistrikan & Grounding', kritis: false },
    { id: 'pengaman', label: 'Test Fungsi Alat Pengaman (safety valve, limit switch)', kritis: true },
    { id: 'fungsi', label: 'Test Fungsi Operasional (load/pressure/functional test)', kritis: true },
    { id: 'apd', label: 'APD lengkap digunakan selama pengujian', kritis: false },
    { id: 'bap', label: 'BAP ditandatangani PIC Klien di lapangan', kritis: true },
];

// Stage 7 bundel fisik checklist items (saved as s7_bundel_checklist JSON on dnp_jobs)
// Stored as { grupA: [...], grupB: [...], grupC: [...] } where each item is { id, status, catatan }
export const STAGE7_BUNDEL_GRUP_A = [
    { id: 'surat_permohonan_disnaker', label: 'Surat Permohonan ke Disnaker (asli, bermaterai)' },
    { id: 'surat_kuasa', label: 'Surat Kuasa dari Pemilik ke PJK3 (asli, bermaterai)' },
    { id: 'pernyataan_keabsahan', label: 'Pernyataan Keabsahan Data (asli, bermaterai)' },
    { id: 'form_checklist_disnaker', label: 'Form Checklist Disnaker (TTD klien)' },
    { id: 'drawing_as_built', label: 'Drawing / As-Built' },
    { id: 'manual_book', label: 'Manual Book / Spesifikasi Pabrik' },
    { id: 'pengesahan_gambar', label: 'Pengesahan Gambar Kemnaker (kondisional)' },
    { id: 'copy_suket_lama', label: 'Copy Suket Lama (perpanjangan saja)' },
];

export const STAGE7_BUNDEL_GRUP_B = [
    { id: 'lhpp', label: 'LHPP (dari Upload Stage 5)' },
    { id: 'bap', label: 'BAP (dari Upload Stage 5)' },
    { id: 'copy_skp_ak3', label: 'Copy SKP Ahli K3 Inspektur' },
    { id: 'sertifikat_pjk3', label: 'Copy Sertifikat PJK3 (SK Kemnaker)' },
    { id: 'foto_dokumentasi', label: 'Foto Dokumentasi Pemeriksaan (dari Upload Stage 4)' },
    { id: 'sertifikat_kalibrasi', label: 'Copy Sertifikat Kalibrasi Alat Ukur' },
];

export const STAGE7_BUNDEL_GRUP_C = [
    { id: 'cover_bundel', label: 'Cover bundel (nama klien & jenis pesawat)' },
    { id: 'daftar_isi', label: 'Daftar isi bundel' },
    { id: 'dijilid', label: 'Dokumen dijilid / distaples rapi' },
    { id: 'salinan_arsip', label: 'Salinan bundel untuk arsip internal' },
];

// Default Suket validity in months per pesawat type (Stage 9)
export const SUKET_VALIDITY_DEFAULTS = {
    'Bejana Tekan (Form 45 A.1)': 24,  // Luar — 24 bln; Hydrotest — 60 bln
    'Pesawat Uap (Boiler) (Form 6)': 24,
    'Proteksi Kebakaran (Form 65 K)': 12,
    'PAPA (Crane/Forklift/dll) (Form A 52)': 12,
    'Lift / Dumbwaiter (Form 36/38/39)': 12,
    'Eskalator / Travelator (Form 52)': 12,
    'Instalasi Listrik & PP (Form 55 L)': 12,
    'PTP (Compressor/Genset) (Form 54 A)': 12,
};
