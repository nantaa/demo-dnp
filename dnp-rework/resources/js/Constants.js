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
