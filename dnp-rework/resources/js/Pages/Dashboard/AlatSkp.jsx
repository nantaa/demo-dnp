import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import ErrorBoundary from '@/Components/ErrorBoundary';
import { Wrench, AlertCircle, Clock, User, Award, BriefcaseBusiness, ClipboardList, Download } from 'lucide-react';

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

function AlatSkp({ inspectors = [], alat_uji = [], sertifikat_pjk3 = [], regulasi_k3 = [], form_disnaker = [], auth = {} }) {
    const [tab, setTab] = useState('alat');
    const todayStr = new Date().toISOString().slice(0, 10);

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

    return (
        <AppLayout>
            <Head title="Manajemen Alat & SKP" />
            
            <div className="pb-8">
                <div className="mb-6">
                    <div className="text-xs tracking-widest uppercase text-gray-500 font-bold">Master Data</div>
                    <h1 className="text-3xl font-bold text-gray-900 mt-1">Inventaris Alat & Sertifikat</h1>
                    <div className="text-sm text-gray-500 mt-1">
                        Database alat uji terkalibrasi, SKP Ahli K3, dan Sertifikat PJK3 perusahaan
                    </div>
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <KPICard label="Total Alat" value={alat_uji.length} sub="di inventaris" icon={Wrench} />
                    <KPICard label="Kal. Expired" value={alatStats.expired.length} sub={alatStats.expired.length > 0 ? 'Tidak boleh dipakai' : 'Semua valid'} icon={AlertCircle} accentClass={alatStats.expired.length > 0 ? 'text-red-600' : 'text-green-600'} />
                    <KPICard label="Kal. Akan Expire" value={alatStats.expiring.length} sub="<30 hari, jadwalkan re-kalibrasi" icon={Clock} accentClass={alatStats.expiring.length > 0 ? 'text-yellow-600' : 'text-gray-500'} />
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {alat_uji.map((a, i) => {
                                        const stat = renderAlatStatus(a);
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
                                                        {a.kategori && typeof a.kategori === 'string' ? JSON.parse(a.kategori).map(k => <span key={k} className="bg-gray-100 border border-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">{k}</span>) : null}
                                                        {a.kategori && Array.isArray(a.kategori) ? a.kategori.map(k => <span key={k} className="bg-gray-100 border border-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">{k}</span>) : null}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono text-xs text-gray-600">{a.lab}</td>
                                                <td className="p-4 font-mono text-xs">{formatDate(a.kalibrasi_expired)}</td>
                                                <td className="p-4 text-center"><StatusBadge status={stat.status}>{stat.label}</StatusBadge></td>
                                                <td className="p-4 text-center">
                                                    <StatusBadge status={a.status}>{a.status}</StatusBadge>
                                                </td>
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
                                        return (
                                            <tr key={insp.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                                                <td className="p-4 font-mono font-semibold">{insp.id}</td>
                                                <td className="p-4 font-semibold text-gray-900">{insp.user?.name || 'Unknown'}</td>
                                                <td className="p-4 font-mono text-xs">{insp.skp || '—'}</td>
                                                <td className="p-4">
                                                    <div className="flex gap-1 flex-wrap">
                                                        {insp.spesialisasi && Array.isArray(insp.spesialisasi) ? insp.spesialisasi.map(s => <span key={s} className="bg-gray-100 border border-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">AK3 {s}</span>) : null}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono text-xs">{insp.skp_expired_at ? formatDate(insp.skp_expired_at) : '—'}</td>
                                                <td className="p-4">{statObj ? <StatusBadge status={statObj.status}>{statObj.label}</StatusBadge> : '—'}</td>
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
                                                    <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer" onClick={() => alert(`Demo: file ${c.file} akan terunduh.`)}>
                                                        <Download size={14} /> <span className="text-xs">{c.file}</span>
                                                    </button>
                                                </td>
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
                                                <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer" onClick={() => alert(`Demo: file ${f.file} akan terunduh.`)}>
                                                    <Download size={14} />
                                                </button>
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
                    Hanya Admin RU & Manager yang bisa edit master data ini. Untuk menambah/edit alat baru, di produksi nanti akan ada CRUD form.
                </div>
            </div>
        </AppLayout>
    );
}
