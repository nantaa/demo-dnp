import React, { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import ErrorBoundary from '@/Components/ErrorBoundary';
import { ShieldCheck, AlertCircle, Clock } from 'lucide-react';

export default function ReminderSuketWrapper(props) {
    return (
        <ErrorBoundary>
            <ReminderSuket {...props} />
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

function StatusTag({ status, children }) {
    let cls = 'tag-slate';
    if (status === 'valid') cls = 'tag-ok';
    if (status === 'expiring_soon') cls = 'tag-warn';
    if (status === 'expired') cls = 'tag-bad';
    return <span className={`tag ${cls}`} style={{ fontSize: 10 }}>{children}</span>;
}

function ReminderSuket({ jobs = [] }) {
    const todayStr = new Date().toISOString().slice(0, 10);

    const sukets = useMemo(() => {
        const rows = [];
        jobs.forEach(j => {
            if (j.units_tracking && Array.isArray(j.units_tracking)) {
                j.units_tracking.forEach((u, i) => {
                    if (u.no_suket) {
                        rows.push({
                            key: `${j.id}-u${i}`,
                            job: j,
                            kode: j.kode,
                            klien: j.klien,
                            unit_label: u.unit_label || `Unit ${u.unit_no}`,
                            no_suket: u.no_suket,
                            tgl_suket: u.tgl_suket,
                            expired_at: u.suket_expired_at,
                            validity_months: u.suket_validity_months,
                        });
                    }
                });
            } else if (j.no_suket) {
                // Fallback for older data format
                rows.push({
                    key: j.id,
                    job: j,
                    kode: j.kode,
                    klien: j.klien,
                    unit_label: `${j.units || 1} unit (single)`,
                    no_suket: j.no_suket,
                    tgl_suket: j.tgl_suket,
                    expired_at: j.suket_expired_at,
                    validity_months: j.suket_validity_months,
                });
            }
        });
        return rows;
    }, [jobs]);

    const rowStatus = (row) => {
        const days = daysBetween(todayStr, row.expired_at);
        if (days < 0) return 'expired';
        if (days <= 90) return 'expiring_soon';
        return 'valid';
    };

    const expired = sukets.filter(r => rowStatus(r) === 'expired');
    const expiringSoon = sukets.filter(r => rowStatus(r) === 'expiring_soon');
    const valid = sukets.filter(r => rowStatus(r) === 'valid');

    const renderList = (list, label) => {
        if (list.length === 0) return null;
        return (
            <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)', fontWeight: 600, marginBottom: 8 }}>{label} · {list.length}</div>
                <div className="panel overflow-hidden">
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr 160px 160px 160px 110px', padding: '10px 16px', background: 'var(--bg-deep)', borderBottom: '1px solid var(--line)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-soft)', fontWeight: 600 }}>
                        <div>Kode-Unit</div>
                        <div>Klien</div>
                        <div>Unit / No Suket</div>
                        <div>Tgl Terbit</div>
                        <div>Berlaku Sampai</div>
                        <div>Masa Berlaku</div>
                        <div style={{ textAlign: 'center' }}>Status</div>
                    </div>
                    {list.map((row, i) => {
                        const st = rowStatus(row);
                        const days = daysBetween(todayStr, row.expired_at);
                        const validityLabel = row.validity_months >= 12 ? `${row.validity_months / 12} tahun` : `${row.validity_months} bulan`;
                        
                        return (
                            <Link key={row.key} href={route('jobs.show', row.job.id)} className="block hover:bg-gray-50 transition-colors"
                                style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr 160px 160px 160px 110px', padding: '12px 16px', borderBottom: i < list.length - 1 ? '1px solid var(--line-soft)' : 'none', alignItems: 'center', fontSize: 13, color: 'inherit', textDecoration: 'none' }}>
                                <div className="dnp-mono" style={{ fontWeight: 600, fontSize: 11, color: 'var(--ink)' }}>{row.kode}</div>
                                <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{row.klien}</div>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{row.unit_label}</div>
                                    <div className="dnp-mono" style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{row.no_suket}</div>
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'var(--ink)' }}>{formatDate(row.tgl_suket)}</div>
                                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'var(--ink)' }}>
                                    {formatDate(row.expired_at)}
                                    <div style={{ fontSize: 10, color: 'var(--ink-soft)' }}>
                                        {days < 0 ? `Expired ${Math.abs(days)} hari lalu` : `${days} hari lagi`}
                                    </div>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{validityLabel || '—'}</div>
                                <div style={{ textAlign: 'center' }}>
                                    <StatusTag status={st}>{{ expired: 'EXPIRED', expiring_soon: 'EXPIRING', valid: 'VALID' }[st]}</StatusTag>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <AppLayout>
            <Head title="Reminder Suket" />
            
            <div className="fadein" style={{ padding: '0 0 24px 0' }}>
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)', fontWeight: 600 }}>Re-Inspection Reminder</div>
                    <h1 className="dnp-serif" style={{ fontSize: 32, fontWeight: 500, margin: '4px 0 0' }}>Database Masa Berlaku Suket</h1>
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
                        Reminder otomatis per-unit: setiap Suket dilacak independen sesuai masa berlaku. Alert H-90 untuk re-inspeksi.
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                    <KPICard label="Expired" value={expired.length} sub="Perlu kontak klien" icon={AlertCircle} accent={expired.length > 0 ? 'var(--bad)' : null} />
                    <KPICard label="Akan Expire (≤90h)" value={expiringSoon.length} sub="Schedule re-inspeksi" icon={Clock} accent={expiringSoon.length > 0 ? 'var(--warn)' : null} />
                    <KPICard label="Valid" value={valid.length} sub="Suket aktif" icon={ShieldCheck} accent="var(--ok)" />
                </div>

                {sukets.length === 0 ? (
                    <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-soft)' }}>
                        <ShieldCheck size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                        <div>Belum ada Suket terbit.</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>Suket akan muncul di sini setelah Kadiv RU input No Suket dari Disnaker di Tahap 6.</div>
                    </div>
                ) : (
                    <>
                        {renderList(expired, 'Expired')}
                        {renderList(expiringSoon, 'Akan Expire (≤90 hari)')}
                        {renderList(valid, 'Valid')}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
