import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import ErrorBoundary from '@/Components/ErrorBoundary';
import { Wrench, AlertCircle, Clock, User, Award, BriefcaseBusiness, ClipboardList, Download, Plus, Pencil, Trash } from 'lucide-react';
import { STAGES } from '@/Constants';

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

const PESAWAT_CATEGORIES = ['PUBT', 'PV', 'Listrik', 'Kebakaran', 'PAA', 'PTP', 'Lift', 'Umum', 'BOILER'];

function AlatSkp({ inspectors = [], alat_uji = [], sertifikat_pjk3 = [], regulasi_k3 = [], form_disnaker = [], users = [], auth = {} }) {
    const [tab, setTab] = useState('alat');
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
        domisili: '',
        senior_level: false
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
        const expired = inspectors.filter(i => i.skp_expired_at && daysBetween(todayStr, i.skp_expired_at) < 0);
        const expiring = inspectors.filter(i => {
            if (!i.skp_expired_at) return false;
            const d = daysBetween(todayStr, i.skp_expired_at);
            return d >= 0 && d < 180;
        });
        return { expired, expiring };
    }, [inspectors, todayStr]);

    // Handle Alat Submit
    const submitAlat = (e) => {
        e.preventDefault();
        if (selectedAlat) {
            alatForm.put(`/inventory/alat/${selectedAlat.id}`, {
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

    const deleteAlat = (id) => {
        if (confirm('Hapus alat uji ini dari database?')) {
            router.delete(`/inventory/alat/${id}`);
        }
    };

    // Handle Inspector Submit
    const submitInspector = (e) => {
        e.preventDefault();
        if (selectedInspector) {
            inspectorForm.put(`/inventory/inspector/${selectedInspector.id}`, {
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
        let spec = [];
        try {
            spec = typeof i.spesialisasi === 'string' ? JSON.parse(i.spesialisasi) : (i.spesialisasi || []);
        } catch(e) {
            spec = Array.isArray(i.spesialisasi) ? i.spesialisasi : [];
        }
        inspectorForm.setData({
            user_id: i.user_id,
            skp: i.skp || '',
            skp_expired_at: i.skp_expired_at ? i.skp_expired_at.substring(0, 10) : '',
            spesialisasi: spec,
            domisili: i.domisili || '',
            senior_level: !!i.senior_level
        });
        setShowInspectorModal(true);
    };

    const deleteInspector = (id) => {
        if (confirm('Hapus profil inspektur ini?')) {
            router.delete(`/inventory/inspector/${id}`);
        }
    };

    // Handle Sertifikat Submit
    const submitSertifikat = (e) => {
        e.preventDefault();
        if (selectedSertifikat) {
            sertifikatForm.put(`/inventory/sertifikat/${selectedSertifikat.id}`, {
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
            file: c.file || '',
            kategori: c.kategori || 'Umum'
        });
        setShowSertifikatModal(true);
    };

    const deleteSertifikat = (id) => {
        if (confirm('Hapus sertifikat PJK3 ini?')) {
            router.delete(`/inventory/sertifikat/${id}`);
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
                            Database alat uji terkalibrasi, SKP Ahli K3, dan Sertifikat PJK3 perusahaan
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
                                <button onClick={() => { setSelectedInspector(null); inspectorForm.reset(); setShowInspectorModal(true); }} className="bg-black text-white px-4 py-2 flex items-center gap-2 rounded text-sm font-medium hover:bg-gray-800">
                                    <Plus size={16} /> Tambah Ahli K3
                                </button>
                            )}
                            {tab === 'cert' && (
                                <button onClick={() => { setSelectedSertifikat(null); sertifikatForm.reset(); setShowSertifikatModal(true); }} className="bg-black text-white px-4 py-2 flex items-center gap-2 rounded text-sm font-medium hover:bg-gray-800">
                                    <Plus size={16} /> Tambah Sertifikat
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
                    <KPICard label="SKP Akan Expire" value={inspekturStats.expiring.length} sub="<180 hari, perpanjangan" icon={User} accentClass={inspekturStats.expiring.length > 0 ? 'text-yellow-600' : 'text-gray-500'} />
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex gap-2 flex-wrap">
                        {[
                            { id: 'alat', label: 'Alat Uji Terkalibrasi', icon: Wrench, count: alat_uji.length },
                            { id: 'inspektur', label: 'Ahli K3 (SKP)', icon: User, count: inspectors.length },
                            { id: 'cert', label: 'Sertifikat PJK3', icon: Award, count: sertifikat_pjk3.length },
                            { id: 'regulasi', label: 'Regulasi K3', icon: BriefcaseBusiness, count: regulasi_k3.length },
                            { id: 'form', label: 'Form Standar Disnaker', icon: ClipboardList, count: form_disnaker.length },
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
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                        <th className="p-4 font-semibold">ID</th>
                                        <th className="p-4 font-semibold">Nama</th>
                                        <th className="p-4 font-semibold">No. SKP</th>
                                        <th className="p-4 font-semibold">Spesialisasi</th>
                                        <th className="p-4 font-semibold">Berlaku sd</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        {canManage && <th className="p-4 font-semibold text-center">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {inspectors.map((insp) => {
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
                                        return (
                                            <tr key={insp.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                                                <td className="p-4 font-mono font-semibold">{insp.id}</td>
                                                <td className="p-4 font-semibold text-gray-900">{insp.user?.name || 'Unknown'}</td>
                                                <td className="p-4 font-mono text-xs">{insp.skp || '—'}</td>
                                                <td className="p-4">
                                                    <div className="flex gap-1 flex-wrap">
                                                        {specs.map(s => (
                                                            <span key={s} className="bg-gray-100 border border-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">AK3 {s}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono text-xs">{insp.skp_expired_at ? formatDate(insp.skp_expired_at) : '—'}</td>
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
                                                <td className="p-4">
                                                    <span className="flex items-center gap-1 text-gray-600">
                                                        <Download size={14} /> <span className="text-xs">{c.file || '—'}</span>
                                                    </span>
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {form_disnaker.map((f) => (
                                        <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                                            <td className="p-4 font-mono font-semibold">{f.kode_form}</td>
                                            <td className="p-4 font-mono font-semibold text-orange-600">{f.kode_disnaker}</td>
                                            <td className="p-4 text-gray-900 font-medium">{f.nama}</td>
                                            <td className="p-4 text-xs">{f.pesawat}</td>
                                            <td className="p-4 font-mono text-xs">{f.revisi}</td>
                                            <td className="p-4 font-mono text-xs">{formatDate(f.last_updated)}</td>
                                            <td className="p-4">
                                                <span className="flex items-center gap-1 text-gray-600">
                                                    <Download size={14} />
                                                </span>
                                            </td>
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
                        <h2 className="text-lg font-bold text-gray-900 mb-4">{selectedInspector ? 'Edit Ahli K3' : 'Tambah Ahli K3 Baru'}</h2>
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
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nomor SKP</label>
                                <input type="text" value={inspectorForm.data.skp} onChange={e => inspectorForm.setData('skp', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Berlaku s/d</label>
                                <input type="date" value={inspectorForm.data.skp_expired_at} onChange={e => inspectorForm.setData('skp_expired_at', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Spesialisasi</label>
                                <div className="grid grid-cols-2 gap-2 border p-3 rounded max-h-32 overflow-y-auto">
                                    {['PUBT', 'Listrik', 'Kebakaran', 'PAA', 'PTP', 'Elevator & Eskalator', 'Lift'].map(s => {
                                        const isChecked = inspectorForm.data.spesialisasi.includes(s);
                                        return (
                                            <label key={s} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                                <input type="checkbox" checked={isChecked} onChange={() => {
                                                    inspectorForm.setData('spesialisasi', isChecked ? inspectorForm.data.spesialisasi.filter(x => x !== s) : [...inspectorForm.data.spesialisasi, s]);
                                                }} />
                                                AK3 {s}
                                            </label>
                                        );
                                    })}
                                </div>
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
                                        <option value="PAA">PAA</option>
                                        <option value="Listrik">Listrik</option>
                                        <option value="Kebakaran">Kebakaran</option>
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
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">File Name (pdf)</label>
                                <input type="text" placeholder="SK-PJK3-DNP.pdf" value={sertifikatForm.data.file} onChange={e => sertifikatForm.setData('file', e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <button type="button" onClick={() => setShowSertifikatModal(false)} className="px-4 py-2 border rounded text-sm font-medium hover:bg-gray-50">Batal</button>
                                <button type="submit" disabled={sertifikatForm.processing} className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
