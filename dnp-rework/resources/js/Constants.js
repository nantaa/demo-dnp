export const STAGES = [
    { id: 1, name: 'PO / SPK', short: 'Marketing', role: 'marketing', sla: null },
    { id: 2, name: 'Verifikasi Dokumen', short: 'Adm. Dokumen', role: 'admin', sla: 1 },
    { id: 3, name: 'Penjadwalan', short: 'Adm. Riksa Uji', role: 'admin', sla: 1 },
    { id: 4, name: 'Surat Tugas & H-5', short: 'Adm. Riksa Uji', role: 'admin', sla: 1 },
    { id: 5, name: 'Logistik & Alat', short: 'Adm. Riksa Uji', role: 'admin', sla: 1 },
    { id: 6, name: 'Pelaksanaan RU', short: 'Tim Ahli', role: 'inspektur', sla: null },
    { id: 7, name: 'Penyusunan LHPP', short: 'Tim Ahli', role: 'inspektur', sla: 3 },
    { id: 8, name: 'Review LHPP', short: 'Kadiv RU', role: 'manager', sla: 2 },
    { id: 9, name: 'Pengurusan Suket', short: 'Kadiv RU', role: 'manager', sla: 60 },
    { id: 10, name: 'Penagihan', short: 'Adm. Keuangan', role: 'finance', sla: 1 },
    { id: 11, name: 'Pembayaran Lunas', short: 'Adm. Keuangan', role: 'finance', sla: null },
];

export const ROLES = {
    marketing: { name: 'Marketing', label: 'MKT' },
    admin: { name: 'Admin Dokumen & RU', label: 'ADM' },
    inspektur: { name: 'Tim Ahli / Inspektur', label: 'INS' },
    manager: { name: 'Kadiv RU / Manager', label: 'MGR' },
    finance: { name: 'Admin Keuangan', label: 'FIN' },
    superadmin: { name: 'Super Administrator', label: 'SUP' },
};
