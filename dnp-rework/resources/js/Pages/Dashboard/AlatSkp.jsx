import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import ErrorBoundary from '@/Components/ErrorBoundary';
import { Wrench, AlertCircle, Clock, User, Award, BriefcaseBusiness, ClipboardList, Download, Plus, Pencil, Trash, FileText, FileCheck } from 'lucide-react';
import { STAGES } from '@/Constants';
import { showConfirm } from '@/swal';

export default function AlatSkpWrapper(props) {
    return (
        <ErrorBoundary>
            <AlatSkp {...props} />
        </ErrorBoundary>
    );
}

function KPICard({ label, value, sub, icon: Icon, accentClass = 'text-gray-500' }) {
    return (
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col relative">
            <div className="flex justify-between items-start">
                <div className="text-xs tracking-wider uppercase text-gray-500 font-semibold">
                    {label}
                </div>
                <Icon size={18} className={accentClass} />
            </div>
            <div className={`text-4xl font-semibold mt-3 ${accentClass !== 'text-gray-500' ? accentClass : 'text-gray-900'}`}>
                {value}
            </div>
            <div className="text-sm text-gray-500 mt-2">
                {sub}
            </div>
        </div>
    );
}

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
};

const daysBetween = (d1, d2) => {
    if (!d1 || !d2) return null;
    const a = new Date(d1);
    const b = new Date(d2);
    return Math.floor((b - a) / (1000 * 60 * 60 * 24));
};

function StatusBadge({ status, children }) {
    let cls = 'bg-gray-100 text-gray-700 border-gray-200';
    if (status === 'valid' || status === 'aktif' || status === 'tersedia') cls = 'bg-green-100 text-green-700 border-green-200';
    if (status === 'expiring_soon' || status === 'sedang dipakai') cls = 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (status === 'expired' || status === 'rusak') cls = 'bg-red-100 text-red-700 border-red-200';
    
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>
            {children}
        </span>
    );
}

const PESAWAT_CATEGORIES = ['PUBT / PV', 'Listrik & IPP', 'IPK', 'PAPA', 'PTP', 'Elevator & Eskalator', 'Lift', 'Umum', 'BOILER'];

const PESAWAT_OPTIONS = [
    { value: 'Umum', label: 'Umum' },
    { value: 'PAPA', label: 'PAPA (Pesawat Angkat & Angkut)' },
    { value: 'Listrik & IPP', label: 'Listrik & IPP (Instalasi Penyalur Petir)' },
    { value: 'IPK', label: 'IPK (Instalasi Proteksi Kebakaran)' },
    { value: 'PUBT / PV', label: 'PUBT / PV (Pesawat Uap & Bejana Tekan)' },
    { value: 'PTP', label: 'PTP (Pesawat Tenaga & Produksi)' },
    { value: 'Elevator & Eskalator', label: 'Elevator & Eskalator' }
];

function AlatSkp({ inspectors = [], alat_uji = [], sertifikat_pjk3 = [], regulasi_k3 = [], form_disnaker = [], users = [], auth = {} }) {
    const [tab, setTab] = useState('alat');
    const [subTab, setSubTab] = useState('ahli');
    const todayStr = new Date().toISOString().slice(0, 10);
    
    const { role } = auth.user || {};
    const canManage = ['superadmin', 'admin', 'manager'].includes(role);

    // Modals states
    const [showAlatModal, setShowAlatModal] = useState(false);
    const [selectedAlat, setSelectedAlat] = useState(null);

    const [showInspectorModal, setShowInspectorModal] = useState(false);
    const [selectedInspector, setSelectedInspector] = useState(null);

    const [showSertifikatModal, setShowSertifikatModal] = useState(false);
    const [selectedSertifikat, setSelectedSertifikat] = useState(null);

    const [showRegulasiModal, setShowRegulasiModal] = useState(false);
    const [selectedRegulasi, setSelectedRegulasi] = useState(null);

    const [showFormDisnakerModal, setShowFormDisnakerModal] = useState(false);
    const [selectedFormDisnaker, setSelectedFormDisnaker] = useState(null);

    // Form Hooks
    const alatForm = useForm({
        kode_alat: '',
        nama: '',
        merk: '',
        serial: '',
        kategori: [],
        kalibrasi_terakhir: '',
        kalibrasi_expired: '',
        lab: '',
        status: 'tersedia'
    });

    const inspectorForm = useForm({
        user_id: '',
        skp: '',
        skp_expired_at: '',
        spesialisasi: [],
        skp_details_input: {},
        skp_files_input: {},
        domisili: '',
        senior_level: false,
        subrole: 'tenaga_ahli'
    });

    const sertifikatForm = useForm({
        kode_cert: '',
        nama: '',
        no_sk: '',
        terbit: '',
        expired: '',
        file: null,
        kategori: 'Umum'
    });

    const regulasiForm = useForm({
        kode_reg: '',
        kategori: '',
        nama: '',
        tentang: '',
        terbit: '',
        status: 'aktif',
        file: null,
        revisi_terakhir: ''
    });

    const formDisnakerForm = useForm({
        kode_form: '',
        kode_disnaker: '',
        nama: '',
        pesawat: '',
        revisi: '',
        last_updated: '',
        file: null
    });

    const renderAlatStatus = (a) => {
        const days = daysBetween(todayStr, a.kalibrasi_expired);
        if (days < 0) return { status: 'expired', label: `EXPIRED ${Math.abs(days)}h lalu` };
        if (days < 30) return { status: 'expiring_soon', label: `${days} hari lagi` };
        return { status: 'valid', label: `Valid (${days} hari)` };
    };

    const alatStats = useMemo(() => {
        const expired = alat_uji.filter(a => daysBetween(todayStr, a.kalibrasi_expired) < 0);
        const expiring = alat_uji.filter(a => {
            const d = daysBetween(todayStr, a.kalibrasi_expired);
            return d >= 0 && d < 30;
        });
        return { expired, expiring, total: alat_uji.length };
    }, [alat_uji, todayStr]);

    const inspekturStats = useMemo(() => {
        let expiredList = [];
        let expiringList = [];

        inspectors.forEach(i => {
            let skpDetails = {};
            try {
                skpDetails = typeof i.skp_details === 'string' ? JSON.parse(i.skp_details) : (i.skp_details || {});
            } catch (e) {
                skpDetails = i.skp_details || {};
            }

            let expDates = [];
            Object.values(skpDetails).forEach(d => {
                if (d?.expired_at) expDates.push(d.expired_at);
            });
            if (expDates.length === 0 && i.skp_expired_at) {
                expDates.push(i.skp_expired_at);
            }

            if (expDates.length > 0) {
                expDates.sort();
                const mainExpDate = expDates[0];
                const d = daysBetween(todayStr, mainExpDate);
                if (d < 0) expiredList.push(i);
                else if (d >= 0 && d < 180) expiringList.push(i);
            }
        });

        return { expired: expiredList, expiring: expiringList };
    }, [inspectors, todayStr]);

    // Filter master template items for Surat Permohonan, Surat Tugas, and Form Disnaker
    const suratPermohonanList = useMemo(() => {
        const filtered = form_disnaker.filter(f => 
            (f.pesawat && f.pesawat.toUpperCase() === 'SURAT_PERMOHONAN') ||
            (f.kode_disnaker && f.kode_disnaker.toLowerCase().includes('permohonan')) ||
            (f.nama && f.nama.toLowerCase().includes('permohonan'))
        );
        if (filtered.length > 0) return filtered;
        return [
            {
                id: 'sp-default-1',
                kode_form: 'SP-DISNAKER-01',
                kode_disnaker: 'Surat Permohonan',
                nama: 'Template Surat Permohonan Riksa Uji (Disnaker RI)',
                pesawat: 'Umum',
                revisi: 'Rev. 2026',
                last_updated: '2026-01-01',
                file: null
            }
        ];
    }, [form_disnaker]);

    const suratTugasList = useMemo(() => {
        const filtered = form_disnaker.filter(f => 
            (f.pesawat && f.pesawat.toUpperCase() === 'SURAT_TUGAS') ||
            (f.kode_disnaker && f.kode_disnaker.toLowerCase().includes('tugas')) ||
            (f.nama && f.nama.toLowerCase().includes('tugas'))
        );
        if (filtered.length > 0) return filtered;
        return [
            {
                id: 'st-default-1',
                kode_form: 'ST-OFFICIAL-01',
                kode_disnaker: 'Surat Tugas',
                nama: 'Template Official Surat Tugas Penugasan Riksa Uji (Word .docx)',
                pesawat: 'Umum',
                revisi: 'Rev. 2026',
                last_updated: '2026-01-01',
                file: null
            }
        ];
    }, [form_disnaker]);

    const formDisnakerList = useMemo(() => {
        const spIds = new Set(suratPermohonanList.map(p => p.id));
        const stIds = new Set(suratTugasList.map(t => t.id));
        return form_disnaker.filter(f => !spIds.has(f.id) && !stIds.has(f.id));
    }, [form_disnaker, suratPermohonanList, suratTugasList]);

    // Handle Alat Submit
    const submitAlat = (e) => {
        e.preventDefault();
        if (selectedAlat && selectedAlat.id) {
            alatForm.post(`/inventory/alat/${selectedAlat.id}`, {
                onSuccess: () => {
                    setShowAlatModal(false);
                    setSelectedAlat(null);
                    alatForm.reset();
                }
            });
        } else {
            alatForm.post('/inventory/alat', {
                onSuccess: () => {
                    setShowAlatModal(false);
                    alatForm.reset();
                }
            });
        }
    };

    const openEditAlat = (a) => {
        setSelectedAlat(a);
        let kat = [];
        try {
            kat = typeof a.kategori === 'string' ? JSON.parse(a.kategori) : (a.kategori || []);
        } catch(e) {
            kat = Array.isArray(a.kategori) ? a.kategori : [];
        }
        alatForm.setData({
            kode_alat: a.kode_alat,
            nama: a.nama,
            merk: a.merk || '',
            serial: a.serial || '',
            kategori: kat,
            kalibrasi_terakhir: a.kalibrasi_terakhir ? a.kalibrasi_terakhir.substring(0, 10) : '',
            kalibrasi_expired: a.kalibrasi_expired ? a.kalibrasi_expired.substring(0, 10) : '',
            lab: a.lab || '',
            status: a.status || 'tersedia'
        });
        setShowAlatModal(true);
    };

    const deleteAlat = async (id) => {
        const res = await showConfirm('Hapus Alat Uji', 'Hapus alat uji ini dari database?');
        if (res.isConfirmed) {
            router.delete(`/inventory/alat/${id}`);
        }
    };

    // Handle Inspector Submit
    const submitInspector = (e) => {
        e.preventDefault();
        if (selectedInspector && selectedInspector.id) {
            inspectorForm.post(`/inventory/inspector/${selectedInspector.id}`, {
                onSuccess: () => {
                    setShowInspectorModal(false);
                    setSelectedInspector(null);
                    inspectorForm.reset();
                }
            });
        } else {
            inspectorForm.post('/inventory/inspector', {
                onSuccess: () => {
                    setShowInspectorModal(false);
                    inspectorForm.reset();
                }
            });
        }
    };

    const openEditInspector = (i) => {
        setSelectedInspector(i);
        if (i) {
            let spec = [];
            try {
                spec = typeof i.spesialisasi === 'string' ? JSON.parse(i.spesialisasi) : (i.spesialisasi || []);
            } catch(e) {
                spec = Array.isArray(i.spesialisasi) ? i.spesialisasi : [];
            }
            let details = {};
            try {
                details = typeof i.skp_details === 'string' ? JSON.parse(i.skp_details) : (i.skp_details || {});
            } catch(e) {
                details = i.skp_details || {};
            }

            const detailsInput = {};
            spec.forEach(s => {
                detailsInput[s] = {
                    no_skp: details[s]?.no_skp || i.skp || '',
                    expired_at: details[s]?.expired_at ? details[s].expired_at.substring(0, 10) : (i.skp_expired_at ? i.skp_expired_at.substring(0, 10) : '')
                };
            });

            inspectorForm.setData({
                user_id: i.user_id,
                skp: i.skp || '',
                skp_expired_at: i.skp_expired_at ? i.skp_expired_at.substring(0, 10) : '',
                spesialisasi: spec,
                skp_details_input: detailsInput,
                skp_files_input: {},
                domisili: i.domisili || '',
                senior_level: !!i.senior_level,
                subrole: i.subrole || 'tenaga_ahli'
            });
        } else {
            inspectorForm.reset();
            inspectorForm.setData({
                user_id: '',
                skp: '',
                skp_expired_at: '',
                spesialisasi: [],
                skp_details_input: {},
                skp_files_input: {},
                domisili: '',
                senior_level: false,
                subrole: subTab === 'petugas' ? 'teknisi' : 'tenaga_ahli'
            });
        }
        setShowInspectorModal(true);
    };

    const deleteInspector = async (id) => {
        const res = await showConfirm('Hapus Inspektur', 'Hapus profil inspektur ini?');
        if (res.isConfirmed) {
            router.delete(`/inventory/inspector/${id}`);
        }
    };

    // Handle Sertifikat Submit
    const submitSertifikat = (e) => {
        e.preventDefault();
        if (selectedSertifikat && selectedSertifikat.id) {
            sertifikatForm.post(`/inventory/sertifikat/${selectedSertifikat.id}`, {
                onSuccess: () => {
                    setShowSertifikatModal(false);
                    setSelectedSertifikat(null);
                    sertifikatForm.reset();
                }
            });
        } else {
            sertifikatForm.post('/inventory/sertifikat', {
                onSuccess: () => {
                    setShowSertifikatModal(false);
                    sertifikatForm.reset();
                }
            });
        }
    };

    const openEditSertifikat = (c) => {
        setSelectedSertifikat(c);
        sertifikatForm.setData({
            kode_cert: c.kode_cert,
            nama: c.nama,
            no_sk: c.no_sk || '',
            terbit: c.terbit ? c.terbit.substring(0, 10) : '',
            expired: c.expired ? c.expired.substring(0, 10) : '',
            file: null, // Reset to null so file input can be used
            kategori: c.kategori || 'Umum'
        });
        setShowSertifikatModal(true);
    };

    const deleteSertifikat = async (id) => {
        const res = await showConfirm('Hapus Sertifikat', 'Hapus sertifikat PJK3 ini?');
        if (res.isConfirmed) {
            router.delete(`/inventory/sertifikat/${id}`);
        }
    };

    // Handle Regulasi Submit
    const submitRegulasi = (e) => {
        e.preventDefault();
        if (selectedRegulasi && selectedRegulasi.id) {
            regulasiForm.post(`/inventory/regulasi/${selectedRegulasi.id}`, {
                onSuccess: () => {
                    setShowRegulasiModal(false);
                    setSelectedRegulasi(null);
                    regulasiForm.reset();
                }
            });
        } else {
            regulasiForm.post('/inventory/regulasi', {
                onSuccess: () => {
                    setShowRegulasiModal(false);
                    regulasiForm.reset();
                }
            });
        }
    };

    const openEditRegulasi = (r) => {
        setSelectedRegulasi(r);
        regulasiForm.setData({
            kode_reg: r.kode_reg,
            kategori: r.kategori || '',
            nama: r.nama,
            tentang: r.tentang || '',
            terbit: r.terbit ? r.terbit.substring(0, 10) : '',
            status: r.status || 'aktif',
            file: null,
            revisi_terakhir: r.revisi_terakhir || ''
        });
        setShowRegulasiModal(true);
    };

    const deleteRegulasi = async (id) => {
        const res = await showConfirm('Hapus Regulasi', 'Hapus regulasi K3 ini?');
        if (res.isConfirmed) {
            router.delete(`/inventory/regulasi/${id}`);
        }
    };

    // Handle FormDisnaker Submit
    const submitFormDisnaker = (e) => {
        e.preventDefault();
        if (selectedFormDisnaker && selectedFormDisnaker.id) {
            formDisnakerForm.post(`/inventory/form-disnaker/${selectedFormDisnaker.id}`, {
                onSuccess: () => {
                    setShowFormDisnakerModal(false);
                    setSelectedFormDisnaker(null);
                    formDisnakerForm.reset();
                }
            });
        } else {
            formDisnakerForm.post('/inventory/form-disnaker', {
                onSuccess: () => {
                    setShowFormDisnakerModal(false);
                    formDisnakerForm.reset();
                }
            });
        }
    };

    const openEditFormDisnaker = (f) => {
        setSelectedFormDisnaker(f);
        formDisnakerForm.setData({
            kode_form: f.kode_form,
            kode_disnaker: f.kode_disnaker || '',
            nama: f.nama,
            pesawat: f.pesawat || '',
            revisi: f.revisi || '',
            last_updated: f.last_updated ? f.last_updated.substring(0, 10) : '',
            file: null
        });
        setShowFormDisnakerModal(true);
    };

    const deleteFormDisnaker = async (id) => {
        if (!id) return;

        // If string fallback ID (not saved in database yet), don't send invalid DELETE request
        if (typeof id === 'string' && (id.startsWith('sp-default') || id.startsWith('st-default'))) {
            const res = await showConfirm('Hapus Form', 'Master template ini belum tersimpan di database. Hapus dari tampilan?');
            if (res.isConfirmed) {
                router.reload();
            }
            return;
        }

        const res = await showConfirm('Hapus Form', 'Hapus form disnaker ini?');
        if (res.isConfirmed) {
            router.delete(`/inventory/form-disnaker/${id}`);
        }
    };

    return (
        <AppLayout>
            <Head title="Manajemen Alat & SKP" />
            
            <div className="pb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div>
                        <div className="text-xs tracking-widest uppercase text-gray-500 font-bold">Master Data</div>
                        <h1 className="text-3xl font-bold text-gray-900 mt-1">Inventaris Alat & Sertifikat</h1>
                        <div className="text-sm text-gray-500 mt-1">
                            Database alat uji terkalibrasi, Tim RU (SKP & Lisensi), dan Sertifikat PJK3 perusahaan
                        </div>
                    </div>
                    {canManage && (
                        <div className="mt-4 md:mt-0">
                            {tab === 'alat' && (
                                <button onClick={() => { setSelectedAlat(null); alatForm.reset(); setShowAlatModal(true); }} className="bg-black text-white px-4 py-2 flex items-center gap-2 rounded text-sm font-medium hover:bg-gray-800">
                                    <Plus size={16} /> Tambah Alat
                                </button>
                            )}
                            {tab === 'inspektur' && (
                                <button onClick={() => openEditInspector(null)} className="bg-black text-white px-4 py-2 flex items-center gap-2 rounded text-sm font-medium hover:bg-gray-800">
                                    <Plus size={16} /> {subTab === 'petugas' ? 'Tambah Petugas / PIC' : 'Tambah Ahli K3'}
                                </button>
                            )}
                            {tab === 'cert' && (
                                <button onClick={() => { setSelectedSertifikat(null); sertifikatForm.reset(); setShowSertifikatModal(true); }} className="bg-black text-white px-4 py-2 flex items-center gap-2 rounded text-sm font-medium hover:bg-gray-800">
                                    <Plus size={16} /> Tambah Sertifikat
                                </button>
                            )}
                            {tab === 'regulasi' && (
                                <button onClick={() => { setSelectedRegulasi(null); regulasiForm.reset(); setShowRegulasiModal(true); }} className="bg-black text-white px-4 py-2 flex items-center gap-2 rounded text-sm font-medium hover:bg-gray-800">
                                    <Plus size={16} /> Tambah Regulasi
                                </button>
                            )}
                            {tab === 'form' && (
                                <button onClick={() => { setSelectedFormDisnaker(null); formDisnakerForm.reset(); setShowFormDisnakerModal(true); }} className="bg-black text-white px-4 py-2 flex items-center gap-2 rounded text-sm font-medium hover:bg-gray-800">
                                    <Plus size={16} /> Tambah Form Disnaker
                                </button>
                            )}
                            {tab === 'surat_permohonan' && (
                                <button onClick={() => { setSelectedFormDisnaker(null); formDisnakerForm.setData({ kode_form: 'SP-01', kode_disnaker: 'Surat Permohonan', nama: '', pesawat: 'Umum', revisi: 'Rev. 2026', last_updated: todayStr, file: null }); setShowFormDisnakerModal(true); }} className="bg-black text-white px-4 py-2 flex items-center gap-2 rounded text-sm font-medium hover:bg-gray-800">
                                    <Plus size={16} /> Tambah Surat Permohonan
                                </button>
                            )}
                            {tab === 'surat_tugas' && (
                                <button onClick={() => { setSelectedFormDisnaker(null); formDisnakerForm.setData({ kode_form: 'ST-01', kode_disnaker: 'Surat Tugas', nama: '', pesawat: 'Umum', revisi: 'Rev. 2026', last_updated: todayStr, file: null }); setShowFormDisnakerModal(true); }} className="bg-black text-white px-4 py-2 flex items-center gap-2 rounded text-sm font-medium hover:bg-gray-800">
                                    <Plus size={16} /> Tambah Template Surat Tugas
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <KPICard label="Total Alat" value={alat_uji.length} sub="di inventaris" icon={Wrench} />
                    <KPICard label="Kal. Expired" value={alatStats.expired.length} sub={alatStats.expired.length > 0 ? 'Tidak boleh dipakai' : 'Semua valid'} icon={AlertCircle} accentClass={alatStats.expired.length > 0 ? 'text-red-600' : 'text-green-600'} />
                    <KPICard label="Kal. Akan Expire" value={alatStats.expiring.length} sub="<30 hari, re-kalibrasi" icon={Clock} accentClass={alatStats.expiring.length > 0 ? 'text-yellow-600' : 'text-gray-500'} />
                    <KPICard label="SKP/Lisensi Expire" value={inspekturStats.expiring.length} sub="<180 hari, perpanjangan" icon={User} accentClass={inspekturStats.expiring.length > 0 ? 'text-yellow-600' : 'text-gray-500'} />
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex gap-2 flex-wrap">
                        {[
                            { id: 'alat', label: 'Alat Uji Terkalibrasi', icon: Wrench, count: alat_uji.length },
                            { id: 'inspektur', label: 'Tim RU', icon: User, count: inspectors.length },
                            { id: 'cert', label: 'Sertifikat PJK3', icon: Award, count: sertifikat_pjk3.length },
                            { id: 'regulasi', label: 'Regulasi K3', icon: BriefcaseBusiness, count: regulasi_k3.length },
                            { id: 'form', label: 'Form Standar Disnaker', icon: ClipboardList, count: formDisnakerList.length },
                            { id: 'surat_permohonan', label: 'Surat Permohonan', icon: FileText, count: suratPermohonanList.length },
                            { id: 'surat_tugas', label: 'Template Surat Tugas', icon: FileCheck, count: suratTugasList.length },
                        ].map(t => {
                            const Icon = t.icon;
                            const active = tab === t.id;
                            return (
                                <button key={t.id} onClick={() => setTab(t.id)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${
                                        active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-200'
                                    }`}>
                                    <Icon size={16} /> {t.label} <span className="opacity-70 text-xs">({t.count})</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="overflow-x-auto">
                        {/* Alat Tab */}
                        {tab === 'alat' && (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                        <th className="p-4 font-semibold">Kode</th>
                                        <th className="p-4 font-semibold">Nama Alat / Merk</th>
                                        <th className="p-4 font-semibold">Serial</th>
                                        <th className="p-4 font-semibold">Kategori</th>
                                        <th className="p-4 font-semibold">Lab Kalibrasi</th>
                                        <th className="p-4 font-semibold">Kal. Expired</th>
                                        <th className="p-4 font-semibold text-center">Status Kal.</th>
                                        <th className="p-4 font-semibold text-center">Ketersediaan</th>
                                        {canManage && <th className="p-4 font-semibold text-center">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {alat_uji.map((a) => {
                                        const stat = renderAlatStatus(a);
                                        let categories = [];
                                        try {
                                            categories = typeof a.kategori === 'string' ? JSON.parse(a.kategori) : (a.kategori || []);
                                        } catch (e) {
                                            categories = Array.isArray(a.kategori) ? a.kategori : [];
                                        }
                                        return (
                                            <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                                                <td className="p-4 font-mono font-semibold">{a.kode_alat}</td>
                                                <td className="p-4">
                                                    <div className="font-semibold text-gray-900">{a.nama}</div>
                                                    <div className="text-xs text-gray-500">{a.merk}</div>
                                                </td>
                                                <td className="p-4 font-mono text-xs">{a.serial}</td>
                                                <td className="p-4">
                                                    <div className="flex gap-1 flex-wrap">
                                                        {categories.map(k => (
                                                            <span key={k} className="bg-gray-100 border border-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">{k}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono text-xs text-gray-600">{a.lab}</td>
                                                <td className="p-4 font-mono text-xs">{formatDate(a.kalibrasi_expired)}</td>
                                                <td className="p-4 text-center"><StatusBadge status={stat.status}>{stat.label}</StatusBadge></td>
                                                <td className="p-4 text-center">
                                                    <StatusBadge status={a.status}>{a.status}</StatusBadge>
                                                </td>
                                                {canManage && (
                                                    <td className="p-4 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            <button onClick={() => openEditAlat(a)} className="text-gray-500 hover:text-black" title="Edit">
                                                                <Pencil size={15} />
                                                            </button>
                                                            <button onClick={() => deleteAlat(a.id)} className="text-red-500 hover:text-red-700" title="Hapus">
                                                                <Trash size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}

                        {/* Inspektur Tab */}
                        {tab === 'inspektur' && (
                            <div>
                                <div className="px-4 py-3 border-b border-gray-200 bg-white flex justify-between items-center flex-wrap gap-2">
                                    <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setSubTab('ahli')}
                                            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                                                subTab === 'ahli' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'
                                            }`}
                                        >
                                            AHLI
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSubTab('petugas')}
                                            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                                                subTab === 'petugas' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'
                                            }`}
                                        >
                                            Petugas / PIC
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium">
                                        Menampilkan: {subTab === 'ahli' ? 'Tenaga Ahli K3' : 'Petugas & PIC Lapangan'}
                                    </div>
                                </div>

                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                            <th className="p-4 font-semibold">ID</th>
                                            <th className="p-4 font-semibold">Nama</th>
                                            <th className="p-4 font-semibold">{subTab === 'petugas' ? 'No. Lisensi' : 'No. SKP'}</th>
                                            <th className="p-4 font-semibold">Spesialisasi</th>
                                            <th className="p-4 font-semibold">Berlaku sd</th>
                                            <th className="p-4 font-semibold">Status</th>
                                            {canManage && <th className="p-4 font-semibold text-center">Aksi</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inspectors.filter((insp) => {
                                            if (subTab === 'petugas') {
                                                return insp.subrole === 'teknisi';
                                            } else {
                                                return !insp.subrole || insp.subrole === 'tenaga_ahli';
                                            }
                                        }).map((insp) => {
                                            const days = insp.skp_expired_at ? daysBetween(todayStr, insp.skp_expired_at) : null;
                                            let statObj = null;
                                            if (days !== null) {
                                                if (days < 0) statObj = { status: 'expired', label: 'EXPIRED' };
                                                else if (days < 180) statObj = { status: 'expiring_soon', label: `${days} hari lagi` };
                                                else statObj = { status: 'valid', label: 'Valid' };
                                            }
                                            let specs = [];
                                            try {
                                                specs = typeof insp.spesialisasi === 'string' ? JSON.parse(insp.spesialisasi) : (insp.spesialisasi || []);
                                            } catch (e) {
                                                specs = Array.isArray(insp.spesialisasi) ? insp.spesialisasi : [];
                                            }
                                            const isInspPetugas = insp.subrole === 'teknisi';
                                            const prefixLabel = isInspPetugas ? 'Lisensi' : 'AK3';
                                            return (
                                                <tr key={insp.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                                                    <td className="p-4 font-mono font-semibold">{insp.id}</td>
                                                    <td className="p-4 font-semibold text-gray-900">{insp.user?.name || 'Unknown'}</td>
                                                    <td className="p-4 font-mono text-xs">
                                                        {(() => {
                                                            let skpDetails = {};
                                                            try {
                                                                skpDetails = typeof insp.skp_details === 'string' ? JSON.parse(insp.skp_details) : (insp.skp_details || {});
                                                            } catch (e) {
                                                                skpDetails = insp.skp_details || {};
                                                            }

                                                            if (specs.length > 0) {
                                                                return (
                                                                    <div className="flex flex-col gap-1">
                                                                        {specs.map(s => {
                                                                            const num = skpDetails[s]?.no_skp || insp.skp;
                                                                            if (!num) return null;
                                                                            return (
                                                                                <div key={s} className="truncate max-w-[220px]" title={`${prefixLabel} ${s}: ${num}`}>
                                                                                    {specs.length > 1 && <span className="font-semibold text-gray-500 mr-1">{s}:</span>}
                                                                                    <span className="font-mono text-gray-900">{num}</span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                );
                                                            }
                                                            return insp.skp || '—';
                                                        })()}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex gap-1.5 flex-wrap">
                                                            {specs.map(s => {
                                                                let skpFiles = {};
                                                                try {
                                                                    skpFiles = typeof insp.skp_files === 'string' ? JSON.parse(insp.skp_files) : (insp.skp_files || {});
                                                                } catch(e) {
                                                                    skpFiles = insp.skp_files || {};
                                                                }
                                                                const filePath = skpFiles[s];
                                                                return (
                                                                    <span key={s} className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider">
                                                                        <span>{prefixLabel} {s}</span>
                                                                        {filePath && (
                                                                            <a href={`/storage/${filePath}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-0.5" title={`Download ${isInspPetugas ? 'Lisensi' : 'SKP'} ${s}`}>
                                                                                <Download size={11} />
                                                                            </a>
                                                                        )}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-mono text-xs">
                                                        {(() => {
                                                            let skpDetails = {};
                                                            try {
                                                                skpDetails = typeof insp.skp_details === 'string' ? JSON.parse(insp.skp_details) : (insp.skp_details || {});
                                                            } catch (e) {
                                                                skpDetails = insp.skp_details || {};
                                                            }
                                                            const hasSpecExp = specs.some(s => skpDetails[s]?.expired_at);
                                                            if (hasSpecExp) {
                                                                return (
                                                                    <div className="flex flex-col gap-1">
                                                                        {specs.map(s => {
                                                                            const exp = skpDetails[s]?.expired_at || insp.skp_expired_at;
                                                                            if (!exp) return null;
                                                                            return (
                                                                                <div key={s} className="truncate" title={`${prefixLabel} ${s}: ${formatDate(exp)}`}>
                                                                                    {specs.length > 1 && <span className="font-semibold text-gray-500 mr-1">{s}:</span>}
                                                                                    <span>{formatDate(exp)}</span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                );
                                                            }
                                                            return insp.skp_expired_at ? formatDate(insp.skp_expired_at) : '—';
                                                        })()}
                                                    </td>
                                                    <td className="p-4">{statObj ? <StatusBadge status={statObj.status}>{statObj.label}</StatusBadge> : '—'}</td>
                                                    {canManage && (
                                                        <td className="p-4 text-center">
                                                            <div className="flex justify-center gap-2">
                                                                <button onClick={() => openEditInspector(insp)} className="text-gray-500 hover:text-black" title="Edit">
                                                                    <Pencil size={15} />
                                                                </button>
                                                                <button onClick={() => deleteInspector(insp.id)} className="text-red-500 hover:text-red-700" title="Hapus">
                                                                    <Trash size={15} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* PJK3 Certs Tab */}
                        {tab === 'cert' && (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                        <th className="p-4 font-semibold">Kode</th>
                                        <th className="p-4 font-semibold">Nama Sertifikat</th>
                                        <th className="p-4 font-semibold">No. SK</th>
                                        <th className="p-4 font-semibold">Terbit</th>
                                        <th className="p-4 font-semibold">Berlaku sd</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold">File</th>
                                        {canManage && <th className="p-4 font-semibold text-center">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sertifikat_pjk3.map((c) => {
                                        const days = daysBetween(todayStr, c.expired);
                                        let statObj = { status: 'valid', label: 'Valid' };
                                        if (days < 0) statObj = { status: 'expired', label: 'EXPIRED' };
                                        else if (days < 90) statObj = { status: 'expiring_soon', label: `${days} hari` };
                                        
                                        return (
                                            <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                                                <td className="p-4 font-mono font-semibold">{c.kode_cert}</td>
                                                <td className="p-4 font-semibold text-gray-900">{c.nama}</td>
                                                <td className="p-4 font-mono text-xs">{c.no_sk}</td>
                                                <td className="p-4 font-mono text-xs">{formatDate(c.terbit)}</td>
                                                <td className="p-4 font-mono text-xs">{formatDate(c.expired)}</td>
                                                <td className="p-4"><StatusBadge status={statObj.status}>{statObj.label}</StatusBadge></td>
                                                <td className="p-4 font-medium">
                                                    {c.file ? (
                                                        <a href={`/storage/${c.file}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                                            <Download size={14} /> <span className="text-xs">Download</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </td>
                                                {canManage && (
                                                    <td className="p-4 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            <button onClick={() => openEditSertifikat(c)} className="text-gray-500 hover:text-black" title="Edit">
                                                                <Pencil size={15} />
                                                            </button>
                                                            <button onClick={() => deleteSertifikat(c.id)} className="text-red-500 hover:text-red-700" title="Hapus">
                                                                <Trash size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}

                        {/* Regulasi Tab */}
                        {tab === 'regulasi' && (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                        <th className="p-4 font-semibold">Kode</th>
                                        <th className="p-4 font-semibold">Kategori</th>
                                        <th className="p-4 font-semibold">Regulasi</th>
                                        <th className="p-4 font-semibold">Tentang</th>
                                        <th className="p-4 font-semibold">Terbit</th>
                                        <th className="p-4 font-semibold">Revisi Terakhir</th>
                                        <th className="p-4 font-semibold text-center">Status</th>
                                        <th className="p-4 font-semibold">File</th>
                                        {canManage && <th className="p-4 font-semibold text-center">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {regulasi_k3.map((r) => (
                                        <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                                            <td className="p-4 font-mono font-semibold">{r.kode_reg}</td>
                                            <td className="p-4"><span className="bg-gray-100 border border-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">{r.kategori}</span></td>
                                            <td className="p-4 font-semibold text-gray-900">{r.nama}</td>
                                            <td className="p-4 text-xs text-gray-500">{r.tentang}</td>
                                            <td className="p-4 font-mono text-xs">{formatDate(r.terbit)}</td>
                                            <td className="p-4 text-xs text-gray-500">{r.revisi_terakhir}</td>
                                            <td className="p-4 text-center"><StatusBadge status={r.status === 'aktif' ? 'valid' : 'expired'}>{r.status}</StatusBadge></td>
                                            <td className="p-4 font-medium">
                                                {r.source ? (
                                                    <a href={`/storage/${r.source}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                                        <Download size={14} /> <span className="text-xs">Download</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            {canManage && (
                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => openEditRegulasi(r)} className="text-gray-500 hover:text-black" title="Edit">
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button onClick={() => deleteRegulasi(r.id)} className="text-red-500 hover:text-red-700" title="Hapus">
                                                            <Trash size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Form Checklist Tab */}
                        {tab === 'form' && (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                        <th className="p-4 font-semibold">Kode</th>
                                        <th className="p-4 font-semibold">Form No</th>
                                        <th className="p-4 font-semibold">Nama Form</th>
                                        <th className="p-4 font-semibold">Untuk Pesawat</th>
                                        <th className="p-4 font-semibold">Revisi</th>
                                        <th className="p-4 font-semibold">Last Updated</th>
                                        <th className="p-4 font-semibold">File</th>
                                        {canManage && <th className="p-4 font-semibold text-center">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {formDisnakerList.map((f) => (
                                        <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                                            <td className="p-4 font-mono font-semibold">{f.kode_form}</td>
                                            <td className="p-4 font-mono font-semibold text-orange-600">{f.kode_disnaker}</td>
                                            <td className="p-4 text-gray-900 font-medium">{f.nama}</td>
                                            <td className="p-4 text-xs">{f.pesawat}</td>
                                            <td className="p-4 font-mono text-xs">{f.revisi}</td>
                                            <td className="p-4 font-mono text-xs">{formatDate(f.last_updated)}</td>
                                            <td className="p-4 font-medium">
                                                {f.file ? (
                                                    <a href={`/storage/${f.file}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                                        <Download size={14} /> <span className="text-xs">Download</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            {canManage && (
                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => openEditFormDisnaker(f)} className="text-gray-500 hover:text-black" title="Edit">
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button onClick={() => deleteFormDisnaker(f.id)} className="text-red-500 hover:text-red-700" title="Hapus">
                                                            <Trash size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Surat Permohonan Tab */}
                        {tab === 'surat_permohonan' && (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                        <th className="p-4 font-semibold">Kode</th>
                                        <th className="p-4 font-semibold">Kategori Surat</th>
                                        <th className="p-4 font-semibold">Nama Template Document</th>
                                        <th className="p-4 font-semibold">Tujuan Disnaker</th>
                                        <th className="p-4 font-semibold">Revisi</th>
                                        <th className="p-4 font-semibold">Last Updated</th>
                                        <th className="p-4 font-semibold">File Template</th>
                                        {canManage && <th className="p-4 font-semibold text-center">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {suratPermohonanList.map((f) => (
                                        <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                                            <td className="p-4 font-mono font-semibold">{f.kode_form}</td>
                                            <td className="p-4 font-mono font-semibold text-blue-600">{f.kode_disnaker}</td>
                                            <td className="p-4 text-gray-900 font-medium">{f.nama}</td>
                                            <td className="p-4 text-xs">{f.pesawat || 'General Disnaker'}</td>
                                            <td className="p-4 font-mono text-xs">{f.revisi}</td>
                                            <td className="p-4 font-mono text-xs">{formatDate(f.last_updated)}</td>
                                            <td className="p-4 font-medium">
                                                {f.file ? (
                                                    <a href={f.file.startsWith('templates/') ? `/${f.file}` : `/storage/${f.file}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                                        <Download size={14} /> <span className="text-xs">Download Template</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            {canManage && (
                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => openEditFormDisnaker(f)} className="text-gray-500 hover:text-black" title="Edit / Upload File">
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button onClick={() => deleteFormDisnaker(f.id)} className="text-red-500 hover:text-red-700" title="Hapus">
                                                            <Trash size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Template Surat Tugas Tab */}
                        {tab === 'surat_tugas' && (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                        <th className="p-4 font-semibold">Kode</th>
                                        <th className="p-4 font-semibold">Kategori Surat</th>
                                        <th className="p-4 font-semibold">Nama Template Surat Tugas</th>
                                        <th className="p-4 font-semibold">Kategori Pesawat</th>
                                        <th className="p-4 font-semibold">Revisi</th>
                                        <th className="p-4 font-semibold">Last Updated</th>
                                        <th className="p-4 font-semibold">File Master Template</th>
                                        {canManage && <th className="p-4 font-semibold text-center">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {suratTugasList.map((f) => (
                                        <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                                            <td className="p-4 font-mono font-semibold">{f.kode_form}</td>
                                            <td className="p-4 font-mono font-semibold text-emerald-600">{f.kode_disnaker}</td>
                                            <td className="p-4 text-gray-900 font-medium">{f.nama}</td>
                                            <td className="p-4 text-xs font-semibold text-indigo-600">{f.pesawat || 'Umum'}</td>
                                            <td className="p-4 font-mono text-xs">{f.revisi}</td>
                                            <td className="p-4 font-mono text-xs">{formatDate(f.last_updated)}</td>
                                            <td className="p-4 font-medium">
                                                {f.file ? (
                                                    <a href={f.file.startsWith('templates/') ? `/${f.file}` : `/storage/${f.file}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                                        <Download size={14} /> <span className="text-xs">Download Template</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            {canManage && (
                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => openEditFormDisnaker(f)} className="text-gray-500 hover:text-black" title="Edit / Upload File">
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button onClick={() => deleteFormDisnaker(f.id)} className="text-red-500 hover:text-red-700" title="Hapus">
                                                            <Trash size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        
                        <div className="p-4 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
                            💡 Data sinkronisasi master inventory.
                        </div>
                    </div>
                </div>

                <div className="text-xs text-gray-500 leading-relaxed px-1">
                    Hanya Admin RU & Manager yang bisa edit master data ini.
                </div>
            </div>

            {/* Modal Alat Uji */}
            {showAlatModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">{selectedAlat ? 'Edit Alat Uji' : 'Tambah Alat Uji Baru'}</h2>
                        <form onSubmit={submitAlat} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Kode Alat</label>
                                <input type="text" disabled={!!selectedAlat} required value={alatForm.data.kode_alat} onChange={e => alatForm.setData('kode_alat', e.target.value)} className="w-full border px-3 py-2 rounded text-sm disabled:bg-gray-100" />
                                {alatForm.errors.kode_alat && <div className="text-red-500 text-xs mt-1">{alatForm.errors.kode_alat}</div>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nama Alat</label>
                                <input type="text" required value={alatForm.data.nama} onChange={e => alatForm.setData('nama', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Merk</label>
                                    <input type="text" value={alatForm.data.merk} onChange={e => alatForm.setData('merk', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Serial</label>
                                    <input type="text" value={alatForm.data.serial} onChange={e => alatForm.setData('serial', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Kategori (Pilih minimal 1)</label>
                                <div className="grid grid-cols-3 gap-2 border p-3 rounded max-h-32 overflow-y-auto">
                                    {PESAWAT_CATEGORIES.map(c => {
                                        const isChecked = alatForm.data.kategori.includes(c);
                                        return (
                                            <label key={c} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                                <input type="checkbox" checked={isChecked} onChange={() => {
                                                    alatForm.setData('kategori', isChecked ? alatForm.data.kategori.filter(x => x !== c) : [...alatForm.data.kategori, c]);
                                                }} />
                                                {c}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Kalibrasi Terakhir</label>
                                    <input type="date" value={alatForm.data.kalibrasi_terakhir} onChange={e => alatForm.setData('kalibrasi_terakhir', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Kalibrasi Expired</label>
                                    <input type="date" value={alatForm.data.kalibrasi_expired} onChange={e => alatForm.setData('kalibrasi_expired', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Lab Kalibrasi</label>
                                    <input type="text" value={alatForm.data.lab} onChange={e => alatForm.setData('lab', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Ketersediaan</label>
                                    <select value={alatForm.data.status} onChange={e => alatForm.setData('status', e.target.value)} className="w-full border px-3 py-2 rounded text-sm bg-white">
                                        <option value="tersedia">Tersedia</option>
                                        <option value="sedang dipakai">Sedang Dipakai</option>
                                        <option value="rusak">Rusak</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <button type="button" onClick={() => setShowAlatModal(false)} className="px-4 py-2 border rounded text-sm font-medium hover:bg-gray-50">Batal</button>
                                <button type="submit" disabled={alatForm.processing} className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Ahli K3 / Inspector */}
            {showInspectorModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            {selectedInspector 
                                ? (inspectorForm.data.subrole === 'teknisi' ? 'Edit Petugas / PIC' : 'Edit Ahli K3')
                                : (inspectorForm.data.subrole === 'teknisi' ? 'Tambah Petugas / PIC Baru' : 'Tambah Ahli K3 Baru')
                            }
                        </h2>
                        <form onSubmit={submitInspector} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">User Account</label>
                                <select disabled={!!selectedInspector} required value={inspectorForm.data.user_id} onChange={e => inspectorForm.setData('user_id', e.target.value)} className="w-full border px-3 py-2 rounded text-sm bg-white disabled:bg-gray-100">
                                    <option value="">-- Pilih User --</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                                {inspectorForm.errors.user_id && <div className="text-red-500 text-xs mt-1">{inspectorForm.errors.user_id}</div>}
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Subrole / Posisi</label>
                                <select value={inspectorForm.data.subrole} onChange={e => inspectorForm.setData('subrole', e.target.value)} className="w-full border px-3 py-2 rounded text-sm bg-white">
                                    <option value="tenaga_ahli">Ahli K3</option>
                                    <option value="teknisi">Petugas / PIC Lapangan</option>
                                </select>
                                {inspectorForm.errors.subrole && <div className="text-red-500 text-xs mt-1">{inspectorForm.errors.subrole}</div>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Spesialisasi</label>
                                <div className="grid grid-cols-2 gap-2 border p-3 rounded max-h-32 overflow-y-auto">
                                    {['PUBT / PV', 'Listrik & IPP', 'IPK', 'PAPA', 'PTP', 'Elevator & Eskalator', 'Umum'].map(s => {
                                        const isChecked = inspectorForm.data.spesialisasi.includes(s);
                                        const prefix = inspectorForm.data.subrole === 'teknisi' ? 'Lisensi' : 'AK3';
                                        return (
                                            <label key={s} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                                <input type="checkbox" checked={isChecked} onChange={() => {
                                                    inspectorForm.setData('spesialisasi', isChecked ? inspectorForm.data.spesialisasi.filter(x => x !== s) : [...inspectorForm.data.spesialisasi, s]);
                                                }} />
                                                {prefix} {s}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Section Detail & File SKP / Lisensi */}
                            <div className="space-y-3 border-t pt-3">
                                <label className="block text-xs font-bold uppercase text-gray-700">
                                    Detail & File {inspectorForm.data.subrole === 'teknisi' ? 'Lisensi' : 'SKP'}
                                </label>
                                {inspectorForm.data.spesialisasi.length === 0 ? (
                                    <div className="bg-gray-50 p-3 rounded border border-gray-200 text-xs space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                                                    Nomor {inspectorForm.data.subrole === 'teknisi' ? 'Lisensi' : 'SKP'}
                                                </label>
                                                <input 
                                                    type="text" 
                                                    placeholder={`Nomor ${inspectorForm.data.subrole === 'teknisi' ? 'Lisensi' : 'SKP'}`} 
                                                    value={inspectorForm.data.skp || ''} 
                                                    onChange={e => inspectorForm.setData('skp', e.target.value)} 
                                                    className="w-full border px-2 py-1.5 rounded text-xs bg-white" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Berlaku s/d</label>
                                                <input 
                                                    type="date" 
                                                    value={inspectorForm.data.skp_expired_at || ''} 
                                                    onChange={e => inspectorForm.setData('skp_expired_at', e.target.value)} 
                                                    className="w-full border px-2 py-1.5 rounded text-xs bg-white" 
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                                                Upload File {inspectorForm.data.subrole === 'teknisi' ? 'Lisensi' : 'SKP'}
                                            </label>
                                            <input type="file" accept="*" onChange={e => {
                                                const file = e.target.files[0];
                                                inspectorForm.setData('skp_files_input', {
                                                    ...inspectorForm.data.skp_files_input,
                                                    'Umum': file
                                                });
                                            }} className="w-full border px-2 py-1 rounded text-xs bg-white" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
                                        {inspectorForm.data.spesialisasi.map(s => {
                                            let skpFiles = {};
                                            try {
                                                skpFiles = typeof selectedInspector?.skp_files === 'string' ? JSON.parse(selectedInspector.skp_files) : (selectedInspector?.skp_files || {});
                                            } catch(e) {
                                                skpFiles = selectedInspector?.skp_files || {};
                                            }
                                            const existingFile = skpFiles[s] || skpFiles['Umum'];
                                            const detail = inspectorForm.data.skp_details_input?.[s] || {};
                                            const prefix = inspectorForm.data.subrole === 'teknisi' ? 'Lisensi' : 'AK3';
                                            const docName = inspectorForm.data.subrole === 'teknisi' ? 'Lisensi' : 'SKP';

                                            return (
                                                <div key={s} className="bg-gray-50 p-3 rounded border border-gray-200 text-xs space-y-2">
                                                    <div className="font-bold text-gray-800 flex justify-between items-center border-b pb-1">
                                                        <span>{prefix} {s}</span>
                                                        {existingFile && (
                                                            <a href={`/storage/${existingFile}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-[11px] font-medium">
                                                                <Download size={12} /> File saat ini
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Nomor {docName}</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder={`Nomor ${docName}`} 
                                                                value={detail.no_skp || inspectorForm.data.skp || ''} 
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    inspectorForm.setData('skp_details_input', {
                                                                        ...inspectorForm.data.skp_details_input,
                                                                        [s]: { ...(inspectorForm.data.skp_details_input?.[s] || {}), no_skp: val }
                                                                    });
                                                                }} 
                                                                className="w-full border px-2 py-1.5 rounded text-xs bg-white" 
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Berlaku s/d</label>
                                                            <input 
                                                                type="date" 
                                                                value={detail.expired_at || inspectorForm.data.skp_expired_at || ''} 
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    inspectorForm.setData('skp_details_input', {
                                                                        ...inspectorForm.data.skp_details_input,
                                                                        [s]: { ...(inspectorForm.data.skp_details_input?.[s] || {}), expired_at: val }
                                                                    });
                                                                }} 
                                                                className="w-full border px-2 py-1.5 rounded text-xs bg-white" 
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Upload File {docName}</label>
                                                        <input type="file" accept="*" onChange={e => {
                                                            const file = e.target.files[0];
                                                            inspectorForm.setData('skp_files_input', {
                                                                ...inspectorForm.data.skp_files_input,
                                                                [s]: file
                                                            });
                                                        }} className="w-full border px-2 py-1 rounded text-xs bg-white" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Domisili</label>
                                    <input type="text" value={inspectorForm.data.domisili} onChange={e => inspectorForm.setData('domisili', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 cursor-pointer">
                                        <input type="checkbox" checked={inspectorForm.data.senior_level} onChange={e => inspectorForm.setData('senior_level', e.target.checked)} />
                                        Senior Level
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <button type="button" onClick={() => setShowInspectorModal(false)} className="px-4 py-2 border rounded text-sm font-medium hover:bg-gray-50">Batal</button>
                                <button type="submit" disabled={inspectorForm.processing} className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Sertifikat PJK3 */}
            {showSertifikatModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">{selectedSertifikat ? 'Edit Sertifikat PJK3' : 'Tambah Sertifikat PJK3 Baru'}</h2>
                        <form onSubmit={submitSertifikat} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Kode Cert</label>
                                    <input type="text" required value={sertifikatForm.data.kode_cert} onChange={e => sertifikatForm.setData('kode_cert', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Kategori</label>
                                    <select value={sertifikatForm.data.kategori} onChange={e => sertifikatForm.setData('kategori', e.target.value)} className="w-full border px-3 py-2 rounded text-sm bg-white">
                                        <option value="Umum">Umum</option>
                                        <option value="PAPA">PAPA (Pesawat Angkat & Angkut)</option>
                                        <option value="Listrik & IPP">Listrik & IPP (Instalasi Penyalur Petir)</option>
                                        <option value="IPK">IPK (Instalasi Proteksi Kebakaran)</option>
                                        <option value="PUBT / PV">PUBT / PV (Pesawat Uap & Bejana Tekan)</option>
                                        <option value="PTP">PTP (Pesawat Tenaga & Produksi)</option>
                                        <option value="Elevator & Eskalator">Elevator & Eskalator</option>
                                        {sertifikatForm.data.kategori && !['Umum', 'PAPA', 'Listrik & IPP', 'IPK', 'PUBT / PV', 'PTP', 'Elevator & Eskalator'].includes(sertifikatForm.data.kategori) && (
                                            <option value={sertifikatForm.data.kategori}>{sertifikatForm.data.kategori}</option>
                                        )}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nama Sertifikat</label>
                                <input type="text" required value={sertifikatForm.data.nama} onChange={e => sertifikatForm.setData('nama', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">No. SK</label>
                                <input type="text" value={sertifikatForm.data.no_sk} onChange={e => sertifikatForm.setData('no_sk', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Terbit</label>
                                    <input type="date" value={sertifikatForm.data.terbit} onChange={e => sertifikatForm.setData('terbit', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Berlaku s/d</label>
                                    <input type="date" value={sertifikatForm.data.expired} onChange={e => sertifikatForm.setData('expired', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">File Sertifikat (PDF/Image)</label>
                                <input type="file" accept="*" onChange={e => sertifikatForm.setData('file', e.target.files[0])} className="w-full border px-3 py-2 rounded text-sm bg-white" />
                                {selectedSertifikat?.file && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        File saat ini: <a href={`/storage/${selectedSertifikat.file}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Download</a>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <button type="button" onClick={() => setShowSertifikatModal(false)} className="px-4 py-2 border rounded text-sm font-medium hover:bg-gray-50">Batal</button>
                                <button type="submit" disabled={sertifikatForm.processing} className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Regulasi K3 */}
            {showRegulasiModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">{selectedRegulasi ? 'Edit Regulasi K3' : 'Tambah Regulasi K3 Baru'}</h2>
                        <form onSubmit={submitRegulasi} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Kode Regulasi</label>
                                    <input type="text" required disabled={!!selectedRegulasi} value={regulasiForm.data.kode_reg} onChange={e => regulasiForm.setData('kode_reg', e.target.value)} className="w-full border px-3 py-2 rounded text-sm disabled:bg-gray-100" />
                                    {regulasiForm.errors.kode_reg && <div className="text-red-500 text-xs mt-1">{regulasiForm.errors.kode_reg}</div>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Kategori</label>
                                    <input type="text" placeholder="e.g. UU, PP, Permen" value={regulasiForm.data.kategori} onChange={e => regulasiForm.setData('kategori', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nama Regulasi</label>
                                <input type="text" required value={regulasiForm.data.nama} onChange={e => regulasiForm.setData('nama', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tentang</label>
                                <textarea value={regulasiForm.data.tentang} onChange={e => regulasiForm.setData('tentang', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" rows={2} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Terbit</label>
                                    <input type="date" value={regulasiForm.data.terbit} onChange={e => regulasiForm.setData('terbit', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Revisi Terakhir</label>
                                    <input type="text" placeholder="e.g. N/A or Tahun" value={regulasiForm.data.revisi_terakhir} onChange={e => regulasiForm.setData('revisi_terakhir', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Status</label>
                                    <select value={regulasiForm.data.status} onChange={e => regulasiForm.setData('status', e.target.value)} className="w-full border px-3 py-2 rounded text-sm bg-white">
                                        <option value="aktif">Aktif</option>
                                        <option value="tidak aktif">Tidak Aktif</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Upload File Regulasi</label>
                                <input type="file" accept="*" onChange={e => regulasiForm.setData('file', e.target.files[0])} className="w-full border px-3 py-2 rounded text-sm bg-white" />
                                {selectedRegulasi?.source && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        File saat ini: <a href={`/storage/${selectedRegulasi.source}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Download</a>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <button type="button" onClick={() => setShowRegulasiModal(false)} className="px-4 py-2 border rounded text-sm font-medium hover:bg-gray-50">Batal</button>
                                <button type="submit" disabled={regulasiForm.processing} className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Form Disnaker */}
            {showFormDisnakerModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">{selectedFormDisnaker ? 'Edit Form Disnaker' : 'Tambah Form Disnaker Baru'}</h2>
                        <form onSubmit={submitFormDisnaker} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Kode Form</label>
                                    <input type="text" required disabled={!!selectedFormDisnaker} value={formDisnakerForm.data.kode_form} onChange={e => formDisnakerForm.setData('kode_form', e.target.value)} className="w-full border px-3 py-2 rounded text-sm disabled:bg-gray-100" />
                                    {formDisnakerForm.errors.kode_form && <div className="text-red-500 text-xs mt-1">{formDisnakerForm.errors.kode_form}</div>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Form No (Disnaker)</label>
                                    <input type="text" placeholder="e.g. Form 6, Form 36" value={formDisnakerForm.data.kode_disnaker} onChange={e => formDisnakerForm.setData('kode_disnaker', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nama Form</label>
                                <input type="text" required value={formDisnakerForm.data.nama} onChange={e => formDisnakerForm.setData('nama', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Untuk Pesawat</label>
                                    <select 
                                        value={formDisnakerForm.data.pesawat} 
                                        onChange={e => formDisnakerForm.setData('pesawat', e.target.value)} 
                                        className="w-full border px-3 py-2 rounded text-sm bg-white"
                                    >
                                        <option value="">-- Pilih Kategori --</option>
                                        {PESAWAT_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Revisi</label>
                                    <input type="text" placeholder="e.g. 01, 02" value={formDisnakerForm.data.revisi} onChange={e => formDisnakerForm.setData('revisi', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Last Updated</label>
                                <input type="date" value={formDisnakerForm.data.last_updated} onChange={e => formDisnakerForm.setData('last_updated', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Upload File Form</label>
                                <input type="file" accept="*" onChange={e => formDisnakerForm.setData('file', e.target.files[0])} className="w-full border px-3 py-2 rounded text-sm bg-white" />
                                {selectedFormDisnaker?.file && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        File saat ini: <a href={`/storage/${selectedFormDisnaker.file}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Download</a>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <button type="button" onClick={() => setShowFormDisnakerModal(false)} className="px-4 py-2 border rounded text-sm font-medium hover:bg-gray-50">Batal</button>
                                <button type="submit" disabled={formDisnakerForm.processing} className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
