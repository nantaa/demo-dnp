export const STAGES = [
    { id: 1, name: 'PO / SPK', short: 'PO', role: 'marketing', sla: null },
    { id: 2, name: 'Verifikasi Dokumen', short: 'Verifikasi', role: 'admin', sla: 1 },
    { id: 3, name: 'Penjadwalan & Surat Tugas', short: 'Jadwal', role: 'admin', sla: 1 },
    { id: 4, name: 'Pelaksanaan RU', short: 'Inspeksi', role: 'inspektur', sla: null },
    { id: 5, name: 'Dokumen Review', short: 'Review Dok', role: 'admin', sla: 1 },
    { id: 6, name: 'Penyusunan LHPP', short: 'LHPP', role: 'inspektur', sla: 3 },
    { id: 7, name: 'Verifikasi Laporan & Input SUKET', short: 'Input SUKET', role: 'admin', sla: 1 },
    { id: 8, name: 'Disnaker', short: 'Disnaker', role: 'manager', sla: 30 },
    { id: 9, name: 'Review SUKET', short: 'Rev. SUKET', role: 'admin', sla: 1 },
    { id: 10, name: 'Penagihan', short: 'Tagihan', role: 'finance', sla: 1 },
    { id: 11, name: 'Pengiriman SUKET', short: 'Kirim SUKET', role: 'marketing', sla: null },
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

// Required document types per stage (matches prototype DOC_TYPES_BY_STAGE)
export const DOC_TYPES_BY_STAGE = {
    1: ['PO/SPK', 'Surat Permohonan', 'Surat Kuasa', 'Pernyataan Keabsahan', 'Form Checklist Klien', 'Drawing/As-Built', 'Manual Book', 'Copy Suket Lama'],
    2: ['Pengesahan Gambar Kemnaker', 'Catatan Verifikasi'],
    3: ['Surat Tugas', 'Surat Pemberitahuan H-5', 'Bukti Submit Teman K3'],
    4: ['Foto Dokumentasi Lapangan', 'Data Pengukuran', 'Checklist Lapangan'],
    5: ['LHPP', 'BAP'],
    6: ['Bundel Dokumen Suket', 'Suket dari Disnaker'],
    7: ['Invoice', 'Tanda Terima Klien'],
    8: ['Surat Permohonan Disnaker', 'Bukti Penyerahan Disnaker'],
    9: ['Draft SUKET Review', 'Catatan Revisi SUKET'],
    10: ['Invoice Final', 'Bukti Pembayaran', 'Kwitansi'],
    11: ['Tanda Terima Pengiriman SUKET', 'Bukti Kirim'],
    12: ['Arsip Final'],
};
