export const STAGES = [
    { id: 1,  name: 'PO / SPK',                  short: 'PO',          role: 'marketing',  sla: null },
    { id: 2,  name: 'Verifikasi Dokumen',          short: 'Verifikasi',  role: 'admin',      sla: 1    },
    { id: 3,  name: 'Penjadwalan & Surat Tugas',   short: 'Jadwal',      role: 'admin',      sla: 1    },
    { id: 4,  name: 'Pelaksanaan RU',              short: 'Inspeksi',    role: 'inspektur',  sla: null },
    { id: 13, name: 'Perubahan Unit',              short: 'Perubahan',   role: 'marketing',  sla: 1    },
    { id: 5,  name: 'Review Laporan Teknis',       short: 'Rev. Laporan',role: 'manager',    sla: 1    },
    { id: 6,  name: 'Penyusunan LHPP',             short: 'LHPP',        role: 'inspektur',  sla: 3    },
    { id: 7,  name: 'Penyerahan ke Dinas',         short: 'Penyerahan',  role: 'manager',    sla: 1    },
    { id: 8,  name: 'Proses Disnaker',             short: 'Disnaker',    role: 'admin',      sla: 30   },
    { id: 9,  name: 'Pengurusan Suket',            short: 'Suket',       role: 'admin',      sla: 1    },
    { id: 10, name: 'Penagihan',                   short: 'Tagihan',     role: 'finance',    sla: 1    },
    { id: 11, name: 'Pengiriman SUKET ke Klien',   short: 'Kirim SUKET', role: 'marketing',  sla: null },
    { id: 12, name: 'Selesai / Closed',            short: 'Closed',      role: 'finance',    sla: null },
];

export const ROLES = {
    marketing:   { name: 'Marketing',             label: 'MKT' },
    admin:       { name: 'Admin Dokumen & RU',    label: 'ADM' },
    inspektur:   { name: 'Tim Ahli / Inspektur',  label: 'INS' },
    manager:     { name: 'Kadiv RU / Manager',    label: 'MGR' },
    finance:     { name: 'Admin Keuangan',         label: 'FIN' },
    superadmin:  { name: 'Super Administrator',   label: 'SUP' },
};

// Marketing-only stages (locked for MGR intercept)
export const MKT_STAGES = [1, 11, 13];
// Finance-only stages (locked for MGR intercept)
export const FIN_STAGES = [10, 12];

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
    teknisi:     'Teknisi INS',
};

// Stage 5 review decisions (Task 14)
export const STAGE5_DECISIONS = [
    { value: 'approved',             label: 'Setujui' },
    { value: 'approved_conditional', label: 'Setujui Bersyarat' },
    { value: 'rejected',             label: 'Tolak' },
];

// Stage 9 progress statuses (Task 17)
export const PROGRESS_STATUSES = [
    { value: 'not_started',   label: 'Not Started'  },
    { value: 'delayed',       label: 'Delayed'       },
    { value: 'in_progress',   label: 'In Progress'   },
    { value: 'almost_done',   label: 'Almost Done'   },
    { value: 'done',          label: 'Done'          },
];

// Required document types per stage
export const DOC_TYPES_BY_STAGE = {
    1:  ['PO/SPK', 'Surat Permohonan', 'Surat Kuasa', 'Pernyataan Keabsahan', 'Form Checklist Klien', 'Drawing/As-Built', 'Manual Book', 'Copy Suket Lama'],
    2:  ['Pengesahan Gambar Kemnaker', 'Catatan Verifikasi'],
    3:  ['Surat Tugas', 'Surat Pemberitahuan H-5', 'Bukti Submit Teman K3'],
    4:  ['Foto Keberangkatan', 'Foto Sampai Lokasi Riksauji', 'Foto Kepulangan', 'Data Pengukuran', 'Checklist Lapangan'],
    5:  ['LHPP Draft', 'BAP', 'Catatan Review MGR'],        // Stage 5 = Review Laporan Teknis (was stage 6)
    6:  ['LHPP Final', 'BAP Final', 'Bundel Dokumen'],      // Stage 6 = Penyusunan LHPP (was stage 5)
    7:  ['Bukti Penyerahan ke Disnaker'],
    8:  ['Bukti Penerimaan Dokumen Disnaker', 'Suket dari Disnaker'],
    9:  ['Suket (Asli) dari Disnaker', 'Bukti Submit ke FIN'],
    10: ['Invoice (PDF)', 'Faktur Pajak'],
    11: ['Proposal', 'Suket', 'Kwitansi'],
    12: ['Arsip Final'],
    13: [],
};

// Stage 1 docs that gate Stage 2 (at least one required — Task 5)
export const STAGE1_REQUIRED_DOCS = ['PO/SPK', 'Surat Permohonan', 'Surat Kuasa'];

// Stage 2 docs ALL required (can be bypassed by Kadiv approval — Task 6)
export const STAGE2_REQUIRED_DOCS = ['Pengesahan Gambar Kemnaker', 'Catatan Verifikasi'];
