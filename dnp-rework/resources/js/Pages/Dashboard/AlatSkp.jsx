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

function KPICard({ label, value, sub, icon: Icon, accent }) {
    return (
        <div className="panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-soft)', fontWeight: 600 }}>
                    {label}
                </div>
                <Icon size={18} style={{ color: accent || 'var(--ink-faint)' }} />
            </div>
            <div className="dnp-serif" style={{ fontSize: 36, fontWeight: 400, marginTop: 12, color: accent || 'var(--ink)' }}>
                {value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 8 }}>
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

function AlatSkp({ inspectors = [], alat_uji = [], sertifikat_pjk3 = [], regulasi_k3 = [], form_disnaker = [], auth = {} }) {
    const [tab, setTab] = useState('alat');
    const todayStr = new Date().toISOString().slice(0, 10);

    const renderAlatStatus = (a) => {
        const days = daysBetween(todayStr, a.kalibrasi_expired);
        if (days < 0) return { tag: 'tag-bad', label: `EXPIRED ${Math.abs(days)}h lalu`, color: 'var(--bad)' };
        if (days < 30) return { tag: 'tag-warn', label: `${days} hari lagi`, color: 'var(--warn)' };
        return { tag: 'tag-ok', label: `Valid (${days} hari)`, color: 'var(--ok)' };
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
            
            <div className="fadein" style={{ padding: '0 0 24px 0' }}>
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)', fontWeight: 600 }}>Master Data</div>
                    <h1 className="dnp-serif" style={{ fontSize: 32, fontWeight: 500, margin: '4px 0 0' }}>Inventaris Alat & Sertifikat</h1>
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
                        Database alat uji terkalibrasi, SKP Ahli K3, dan Sertifikat PJK3 perusahaan
                    </div>
                </div>

                {/* KPI strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                    <KPICard label="Total Alat" value={alat_uji.length} sub="di inventaris" icon={Wrench} />
                    <KPICard label="Kal. Expired" value={alatStats.expired.length} sub={alatStats.expired.length > 0 ? 'Tidak boleh dipakai' : 'Semua valid'} icon={AlertCircle} accent={alatStats.expired.length > 0 ? 'var(--bad)' : 'var(--ok)'} />
                    <KPICard label="Kal. Akan Expire" value={alatStats.expiring.length} sub="<30 hari, jadwalkan re-kalibrasi" icon={Clock} accent={alatStats.expiring.length > 0 ? 'var(--warn)' : null} />
                    <KPICard label="SKP Akan Expire" value={inspekturStats.expiring.length} sub="<180 hari, perpanjangan" icon={User} accent={inspekturStats.expiring.length > 0 ? 'var(--warn)' : null} />
                </div>

                {/* Tabs */}
                <div className="panel" style={{ marginBottom: 16 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', background: 'var(--bg-deep)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
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
                                    style={{
                                        padding: '8px 14px', border: 'none',
                                        background: active ? 'var(--ink)' : 'transparent',
                                        color: active ? 'var(--bg-card)' : 'var(--ink)',
                                        fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
                                        display: 'flex', alignItems: 'center', gap: 6, borderRadius: 4
                                    }}>
                                    <Icon size={14} /> {t.label} <span className="dnp-mono" style={{ opacity: 0.6, fontSize: 11 }}>({t.count})</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Alat Tab */}
                    {tab === 'alat' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 150px 1fr 130px 140px 110px', padding: '10px 16px', borderBottom: '1px solid var(--line)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', fontWeight: 600 }}>
                                <div>Kode</div>
                                <div>Nama Alat / Merk</div>
                                <div>Serial</div>
                                <div>Kategori</div>
                                <div>Lab Kalibrasi</div>
                                <div>Kal. Expired</div>
                                <div style={{ textAlign: 'center' }}>Status Kal.</div>
                                <div style={{ textAlign: 'center' }}>Ketersediaan</div>
                            </div>
                            {alat_uji.map((a, i) => {
                                const stat = renderAlatStatus(a);
                                return (
                                    <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 150px 1fr 130px 140px 110px', padding: '12px 16px', borderBottom: i < alat_uji.length - 1 ? '1px solid var(--line-soft)' : 'none', alignItems: 'center', fontSize: 12 }}>
                                        <div className="dnp-mono" style={{ fontWeight: 600 }}>{a.kode_alat}</div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{a.nama}</div>
                                            <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{a.merk}</div>
                                        </div>
                                        <div className="dnp-mono" style={{ fontSize: 11 }}>{a.serial}</div>
                                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                            {a.kategori && typeof a.kategori === 'string' ? JSON.parse(a.kategori).map(k => <span key={k} className="tag tag-slate" style={{ fontSize: 9 }}>{k}</span>) : null}
                                            {a.kategori && Array.isArray(a.kategori) ? a.kategori.map(k => <span key={k} className="tag tag-slate" style={{ fontSize: 9 }}>{k}</span>) : null}
                                        </div>
                                        <div className="dnp-mono" style={{ fontSize: 11 }}>{a.lab}</div>
                                        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11 }}>{formatDate(a.kalibrasi_expired)}</div>
                                        <div style={{ textAlign: 'center' }}><span className={`tag ${stat.tag}`} style={{ fontSize: 10 }}>{stat.label}</span></div>
                                        <div style={{ textAlign: 'center' }}>
                                            <span className={`tag ${a.status === 'tersedia' ? 'tag-ok' : 'tag-warn'}`} style={{ fontSize: 10 }}>
                                                {a.status === 'tersedia' ? 'TERSEDIA' : 'DIPAKAI'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div style={{ padding: '12px 16px', background: 'var(--bg-deep)', fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                                💡 Data alat tersinkron dengan Surat Tugas. Alat dengan kalibrasi expired tidak akan ter-list di "Disarankan" saat Admin RU pilih alat untuk job.
                            </div>
                        </div>
                    )}

                    {/* Inspektur Tab */}
                    {tab === 'inspektur' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 130px 130px', padding: '10px 16px', borderBottom: '1px solid var(--line)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', fontWeight: 600 }}>
                                <div>ID</div>
                                <div>Nama</div>
                                <div>No. SKP</div>
                                <div>Spesialisasi</div>
                                <div>Berlaku sd</div>
                                <div>Status</div>
                            </div>
                            {inspectors.map((insp, i) => {
                                const days = insp.skp_expired_at ? daysBetween(todayStr, insp.skp_expired_at) : null;
                                const stat = days === null ? null : days < 0 ? { tag: 'tag-bad', label: 'EXPIRED' } : days < 180 ? { tag: 'tag-warn', label: `${days} hari lagi` } : { tag: 'tag-ok', label: 'Valid' };
                                
                                return (
                                    <div key={insp.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 130px 130px', padding: '12px 16px', borderBottom: i < inspectors.length - 1 ? '1px solid var(--line-soft)' : 'none', alignItems: 'center', fontSize: 12 }}>
                                        <div className="dnp-mono" style={{ fontWeight: 600 }}>{insp.id}</div>
                                        <div style={{ fontWeight: 600 }}>{insp.user?.name || 'Unknown'}</div>
                                        <div className="dnp-mono" style={{ fontSize: 11 }}>{insp.skp || '—'}</div>
                                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                            {insp.spesialisasi && Array.isArray(insp.spesialisasi) ? insp.spesialisasi.map(s => <span key={s} className="tag tag-slate" style={{ fontSize: 9 }}>AK3 {s}</span>) : null}
                                        </div>
                                        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11 }}>{insp.skp_expired_at ? formatDate(insp.skp_expired_at) : '—'}</div>
                                        <div>{stat ? <span className={`tag ${stat.tag}`} style={{ fontSize: 10 }}>{stat.label}</span> : '—'}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* PJK3 Certs Tab */}
                    {tab === 'cert' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 200px 130px 130px 130px 100px', padding: '10px 16px', borderBottom: '1px solid var(--line)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', fontWeight: 600 }}>
                                <div>Kode</div>
                                <div>Nama Sertifikat</div>
                                <div>No. SK</div>
                                <div>Terbit</div>
                                <div>Berlaku sd</div>
                                <div>Status</div>
                                <div>File</div>
                            </div>
                            {sertifikat_pjk3.map((c, i) => {
                                const days = daysBetween(todayStr, c.expired);
                                const stat = days < 0 ? { tag: 'tag-bad', label: 'EXPIRED' } : days < 90 ? { tag: 'tag-warn', label: `${days} hari` } : { tag: 'tag-ok', label: 'Valid' };
                                return (
                                    <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 200px 130px 130px 130px 100px', padding: '12px 16px', borderBottom: i < sertifikat_pjk3.length - 1 ? '1px solid var(--line-soft)' : 'none', alignItems: 'center', fontSize: 12 }}>
                                        <div className="dnp-mono" style={{ fontWeight: 600 }}>{c.kode_cert}</div>
                                        <div style={{ fontWeight: 600 }}>{c.nama}</div>
                                        <div className="dnp-mono" style={{ fontSize: 11 }}>{c.no_sk}</div>
                                        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11 }}>{formatDate(c.terbit)}</div>
                                        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11 }}>{formatDate(c.expired)}</div>
                                        <div><span className={`tag ${stat.tag}`} style={{ fontSize: 10 }}>{stat.label}</span></div>
                                        <div>
                                            <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer" onClick={() => alert(`Demo: file ${c.file} akan terunduh.`)}>
                                                <Download size={14} /> <span style={{ fontSize: 11 }}>{c.file}</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Regulasi Tab */}
                    {tab === 'regulasi' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '60px 110px 200px 1fr 110px 130px 110px', padding: '10px 16px', borderBottom: '1px solid var(--line)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', fontWeight: 600 }}>
                                <div>Kode</div>
                                <div>Kategori</div>
                                <div>Regulasi</div>
                                <div>Tentang</div>
                                <div>Terbit</div>
                                <div>Revisi Terakhir</div>
                                <div style={{ textAlign: 'center' }}>Status</div>
                            </div>
                            {regulasi_k3.map((r, i) => (
                                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '60px 110px 200px 1fr 110px 130px 110px', padding: '12px 16px', borderBottom: i < regulasi_k3.length - 1 ? '1px solid var(--line-soft)' : 'none', alignItems: 'center', fontSize: 12 }}>
                                    <div className="dnp-mono" style={{ fontWeight: 600 }}>{r.kode_reg}</div>
                                    <div><span className="tag tag-slate" style={{ fontSize: 9 }}>{r.kategori}</span></div>
                                    <div style={{ fontWeight: 600 }}>{r.nama}</div>
                                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{r.tentang}</div>
                                    <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11 }}>{formatDate(r.terbit)}</div>
                                    <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{r.revisi_terakhir}</div>
                                    <div style={{ textAlign: 'center' }}><span className={`tag ${r.status === 'aktif' ? 'tag-ok' : 'tag-warn'}`} style={{ fontSize: 10 }}>{r.status.toUpperCase()}</span></div>
                                </div>
                            ))}
                            <div style={{ padding: '12px 16px', background: 'var(--bg-deep)', fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                                💡 Daftar regulasi K3 yang berlaku. Kadiv RU bertanggung jawab memperbarui daftar ini saat ada revisi/penggantian aturan dari Kemnaker RI. Sumber: kemnaker.go.id
                            </div>
                        </div>
                    )}

                    {/* Form Checklist Tab */}
                    {tab === 'form' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '60px 100px 1fr 140px 130px 130px 100px', padding: '10px 16px', borderBottom: '1px solid var(--line)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', fontWeight: 600 }}>
                                <div>Kode</div>
                                <div>Form No</div>
                                <div>Nama Form</div>
                                <div>Untuk Pesawat</div>
                                <div>Revisi</div>
                                <div>Last Updated</div>
                                <div>File</div>
                            </div>
                            {form_disnaker.map((f, i) => {
                                return (
                                    <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '60px 100px 1fr 140px 130px 130px 100px', padding: '12px 16px', borderBottom: i < form_disnaker.length - 1 ? '1px solid var(--line-soft)' : 'none', alignItems: 'center', fontSize: 12 }}>
                                        <div className="dnp-mono" style={{ fontWeight: 600 }}>{f.kode_form}</div>
                                        <div className="dnp-mono" style={{ fontWeight: 600, color: 'var(--accent)' }}>{f.kode_disnaker}</div>
                                        <div style={{ fontSize: 12 }}>{f.nama}</div>
                                        <div style={{ fontSize: 11 }}>{f.pesawat}</div>
                                        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11 }}>{f.revisi}</div>
                                        <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11 }}>{formatDate(f.last_updated)}</div>
                                        <div>
                                            <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer" onClick={() => alert(`Demo: file ${f.file} akan terunduh.`)}>
                                                <Download size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            <div style={{ padding: '12px 16px', background: 'var(--bg-deep)', fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                                💡 Form checklist standar Disnaker yang diserahkan ke klien di Tahap 2. Kadiv RU memastikan setiap form selalu mengacu pada revisi terbaru sesuai standar Kemnaker.
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ fontSize: 11, color: 'var(--ink-faint)', lineHeight: 1.6 }}>
                    Hanya Admin RU & Manager yang bisa edit master data ini. Untuk menambah/edit alat baru, di produksi nanti akan ada CRUD form.
                </div>
            </div>
        </AppLayout>
    );
}
