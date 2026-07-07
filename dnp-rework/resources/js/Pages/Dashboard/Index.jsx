import React, { useState, useMemo, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { STAGES } from '@/Constants';
import JobDetailSheet from '@/Components/JobDetailSheet';
import { showSuccess } from '@/swal';
import { 
    Activity, Plus, CheckCircle2, Bell, FileCheck, Calendar, AlertTriangle, 
    Wrench, Hourglass, ClipboardList, Upload, Banknote, Package, Eye, 
    Building2, HardHat, ChevronLeft, ChevronRight, User, Shield, Briefcase
} from 'lucide-react';

const PESAWAT_TYPES = [
    { code: 'LIFT', name: 'Lift / Dumbwaiter', form: 'Form 36/38/39', validity: 12 },
    { code: 'ESC', name: 'Eskalator / Travelator', form: 'Form 52', validity: 12 },
    { code: 'PAPA', name: 'PAPA (Crane/Forklift/dll)', form: 'Form A 52', validity: 12 },
    { code: 'FIRE', name: 'Proteksi Kebakaran', form: 'Form 65 K', validity: 12 },
    { code: 'LISTRIK', name: 'Instalasi Listrik & PP', form: 'Form 55 L', validity: 12 },
    { code: 'BOILER', name: 'Pesawat Uap (Boiler)', form: 'Form 6', validity: 12 },
    { code: 'PV', name: 'Bejana Tekan', form: 'Form 45 A.1', validity: 24 },
    { code: 'PTP', name: 'PTP (Compressor/Genset)', form: 'Form 54 A', validity: 24 },
];

const LAIK_STATUS = [
    { value: 'laik', label: 'LAIK', color: 'text-green-600 bg-green-50 border-green-200', tag: 'bg-green-100 text-green-800' },
    { value: 'laik_bersyarat', label: 'LAIK BERSYARAT', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', tag: 'bg-yellow-100 text-yellow-800' },
    { value: 'tidak_laik', label: 'TIDAK LAIK', color: 'text-red-600 bg-red-50 border-red-200', tag: 'bg-red-100 text-red-800' },
];

const MARKETING_TARGETS = {
    'Kevin': 150000000,
    'Agung': 200000000,
    'Dewi': 120000000,
    'Fadel': 180000000,
    'Andini Sari': 150000000
};

// Date math and helpers
const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};
const today = () => new Date().toISOString().split('T')[0];
const daysBetween = (d1, d2) => {
    const t1 = new Date(d1).getTime();
    const t2 = new Date(d2).getTime();
    return Math.floor((t2 - t1) / (1000 * 60 * 60 * 24));
};

function jobStatus(job) {
    if (job.stage === 12) return 'completed';
    const stageInfo = STAGES.find(s => s.id === job.stage);
    if (!stageInfo?.sla) return 'on_track';
    let sla = stageInfo.sla;
    if (job.stage === 6) sla = sla * (job.units || 1); // Stage 6 is Penyusunan LHPP in Rework
    const days = daysBetween(job.stage_started_at || job.updated_at, today());
    if (days > sla) return 'overdue';
    if (days >= sla - 1) return 'warning';
    return 'on_track';
}

export default function DashboardIndex({ jobs = [], inspectors = [], auth = {} }) {
    const { user } = auth;
    const [filterMine, setFilterMine] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);

    const isMKT = user.role === 'marketing';
    const isADM = user.role === 'admin';
    const isINS = user.role === 'inspektur';
    const isFIN = user.role === 'finance';
    const isMGR = user.role === 'manager';
    const isSuper = user.role === 'superadmin';
    const isPersonal = isMKT || isINS;

    // Filtered jobs list based on personal scope / toggle
    const personalFiltered = useMemo(() => {
        if (!filterMine && !isMKT) return jobs;
        if (isMKT) return jobs.filter(j => j.owner_marketing === user.name);
        if (isINS) return jobs.filter(j => (j.inspectors || []).some(ins => ins.id === user.id));
        return jobs;
    }, [jobs, filterMine, isMKT, isINS, user.name, user.id]);

    const stats = useMemo(() => {
        const active = personalFiltered.filter(j => j.stage < 12);
        const completed = personalFiltered.filter(j => j.stage === 12);
        const thisMonth = completed.filter(j => {
            const d = new Date(j.updated_at);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const overdue = personalFiltered.filter(j => jobStatus(j) === 'overdue');
        const pipeline = active.reduce((sum, j) => sum + Number(j.nilai || 0), 0);
        const monthRevenue = thisMonth.reduce((sum, j) => sum + Number(j.nilai || 0), 0);
        const byStage = STAGES.map(s => ({
            stage: s.id, name: s.name, count: personalFiltered.filter(j => j.stage === s.id).length
        }));

        // INS-specific
        const lhppJobs = isINS ? personalFiltered.filter(j => j.stage === 6 && (j.peer_review_status === 'draft' || !j.peer_review_status || j.peer_review_status === 'revision'))
            .map(j => {
                const deadlineDays = (j.units || 1) * 3;
                const elapsedDays = daysBetween(j.stage_started_at || j.updated_at, today());
                const remainingDays = deadlineDays - elapsedDays;
                return { ...j, deadlineDays, elapsedDays, remainingDays };
            }).sort((a, b) => a.remainingDays - b.remainingDays) : [];

        const stage4Mine = isINS ? personalFiltered.filter(j => j.stage === 4) : [];

        // MGR-specific
        const lhppNeedReview = jobs.filter(j => j.stage === 5 && j.peer_review_status === 'submitted');
        const suketDisnaker = jobs.filter(j => j.stage === 8);
        const tidakLaikUnits = [];
        jobs.forEach(j => {
            (j.evaluations || []).forEach(u => {
                if (u.status === 'tidak_laik' || u.status === 'laik_bersyarat') {
                    tidakLaikUnits.push({
                        job: j, unit: u, status: u.status,
                        kode: `${j.kode}${u.unit_no ? '-U' + u.unit_no : ''}`,
                        recommendation: u.recommendation || u.findings || '',
                    });
                }
            });
            (j.units_tracking || []).forEach(u => {
                if (u.laik_status === 'laik_bersyarat' || u.laik_status === 'tidak_laik') {
                    const exists = tidakLaikUnits.some(x => x.job.id === j.id && x.unit.unit_no === u.unit_no);
                    if (!exists) {
                        tidakLaikUnits.push({
                            job: j, unit: u, status: u.laik_status,
                            kode: `${j.kode}-U${u.unit_no}`,
                            recommendation: u.notes || '',
                        });
                    }
                }
            });
        });

        const workloadByInspektur = isMGR || isSuper ? (inspectors || []).map(insp => {
            const activeInspJobs = jobs.filter(j =>
                j.stage >= 4 && j.stage <= 6 &&
                (j.inspectors || []).some(x => x.id === insp.user_id)
            );
            const lapanganCount = activeInspJobs.filter(j => j.stage === 4).length;
            const lhppCount = activeInspJobs.filter(j => j.stage === 6).length;
            const overdueCount = activeInspJobs.filter(j => jobStatus(j) === 'overdue').length;

            return {
                id: insp.id,
                nama: insp.user?.name || 'Inspektur',
                spesialisasi: insp.spesialisasi || [],
                domisili: insp.domisili || '',
                totalActive: activeInspJobs.length,
                lapanganCount,
                lhppCount,
                overdueCount
            };
        }).sort((a, b) => b.totalActive - a.totalActive) : [];

        // MKT-specific
        const mktTarget = MARKETING_TARGETS[user.name] || 150000000;
        const mktRealisasi = thisMonth.reduce((sum, j) => sum + Number(j.nilai || 0), 0);
        const achievement = mktTarget > 0 ? Math.round((mktRealisasi / mktTarget) * 100) : 0;
        const expiringSukets = [];
        jobs.forEach(j => {
            (j.units_tracking || []).forEach(u => {
                if (u.suket_expired_at) {
                    const days = daysBetween(today(), u.suket_expired_at);
                    if (days <= 90) {
                        expiringSukets.push({ job: j, unit: u, days, kode: `${j.kode}-U${u.unit_no}` });
                    }
                }
            });
        });

        // Funnel calculation
        const funnel = [
            { label: 'Penawaran / Stage 1', stage: 1, count: personalFiltered.filter(j => j.stage === 1).length, total: personalFiltered.filter(j => j.stage === 1).reduce((s, j) => s + Number(j.nilai || 0), 0) },
            { label: 'Verifikasi Dokumen', stage: 2, count: personalFiltered.filter(j => j.stage === 2).length, total: personalFiltered.filter(j => j.stage === 2).reduce((s, j) => s + Number(j.nilai || 0), 0) },
            { label: 'Penjadwalan', stage: 3, count: personalFiltered.filter(j => j.stage === 3).length, total: personalFiltered.filter(j => j.stage === 3).reduce((s, j) => s + Number(j.nilai || 0), 0) },
            { label: 'Pelaksanaan + LHPP', stage: [4, 5, 6], count: personalFiltered.filter(j => [4, 5, 6].includes(j.stage)).length, total: personalFiltered.filter(j => [4, 5, 6].includes(j.stage)).reduce((s, j) => s + Number(j.nilai || 0), 0) },
            { label: 'Disnaker + Penagihan', stage: [7, 8, 9, 10, 11], count: personalFiltered.filter(j => [7, 8, 9, 10, 11].includes(j.stage)).length, total: personalFiltered.filter(j => [7, 8, 9, 10, 11].includes(j.stage)).reduce((s, j) => s + Number(j.nilai || 0), 0) }
        ];

        // ADM-specific
        const antrianVerifikasi = jobs.filter(j => j.stage === 2);
        const butuhJadwal = jobs.filter(j => j.stage === 3 && !j.no_surat_tugas);
        const h5Pending = jobs.filter(j => j.stage === 3 && j.no_surat_tugas && !j.h5_confirmed);
        const logistikPending = jobs.filter(j => j.stage === 3 && !j.no_surat_tugas);

        // FIN-specific
        const siapTagih = jobs.filter(j => j.stage === 10 && !j.invoice_no);
        const piutangBerjalan = jobs.filter(j => j.stage === 10 && j.invoice_no && j.payment_status !== 'paid');
        const piutangOverdue = piutangBerjalan.filter(j => {
            if (!j.payment_due_date) return false;
            return daysBetween(j.payment_due_date, today()) > 0;
        });
        const totalPiutang = piutangBerjalan.reduce((sum, j) => sum + Number(j.nilai || 0), 0);
        const totalOverdue = piutangOverdue.reduce((sum, j) => sum + Number(j.nilai || 0), 0);
        const arBuckets = {
            '0-30': [], '31-60': [], '61-90': [], '>90': []
        };
        piutangBerjalan.forEach(j => {
            if (!j.invoice_date) return;
            const age = daysBetween(j.invoice_date, today());
            if (age <= 30) arBuckets['0-30'].push(j);
            else if (age <= 60) arBuckets['31-60'].push(j);
            else if (age <= 90) arBuckets['61-90'].push(j);
            else arBuckets['>90'].push(j);
        });
        const tandaTerimaPending = jobs.filter(j => j.stage === 11 && !j.tanda_terima_kembali);

        return {
            active, completed, thisMonth, overdue, pipeline, monthRevenue, byStage,
            lhppJobs, stage4Mine, lhppNeedReview, suketDisnaker, tidakLaikUnits, workloadByInspektur,
            mktTarget, mktRealisasi, achievement, expiringSukets, funnel,
            antrianVerifikasi, butuhJadwal, h5Pending, logistikPending,
            siapTagih, piutangBerjalan, piutangOverdue, totalPiutang, totalOverdue, arBuckets, tandaTerimaPending
        };
    }, [personalFiltered, jobs, inspectors, isINS, isMGR, isSuper, isMKT, user.name, user.id]);

    const titlePrefix = isPersonal && filterMine ? `Personal - ${user.name}` : `Overview`;
    const titleRole = isMKT ? 'Dashboard Marketing' :
                      isINS ? 'Tugas Lapangan Saya' :
                      isADM ? 'Dashboard Admin' :
                      isFIN ? 'Dashboard Keuangan' :
                      isMGR ? 'Dashboard Manajerial' :
                      isSuper ? 'Dashboard Superadmin' : 'Dashboard';

    return (
        <AppLayout>
            <Head title="Dashboard" />

            <div className="flex flex-col md:flex-row md:justify-between md:items-baseline mb-6 gap-4">
                <div>
                    <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                        {titlePrefix}
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
                        {titleRole}
                    </h1>
                </div>
                <div className="flex items-center gap-4 self-end md:self-auto">
                    {isPersonal && (
                        <div className="flex rounded-md border border-gray-300 shadow-sm overflow-hidden bg-white">
                            <button onClick={() => setFilterMine(true)}
                                className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-colors ${
                                    filterMine ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'
                                }`}>
                                <User size={14} /> {isINS ? 'Tugas Saya' : 'Pekerjaan Saya'}
                            </button>
                            <button onClick={() => setFilterMine(false)}
                                className={`px-4 py-2 text-xs font-semibold transition-colors ${
                                    !filterMine ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-50'
                                }`}>
                                Semua Job
                            </button>
                        </div>
                    )}
                    <div className="text-sm font-mono text-gray-500 bg-gray-100 px-3 py-1.5 rounded border border-gray-200">
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Role-Specific Components */}
            {isMKT && <MktDashboard stats={stats} onSelectJob={setSelectedJob} />}
            {isADM && <AdmDashboard stats={stats} onSelectJob={setSelectedJob} jobs={jobs} />}
            {isINS && <InsDashboard stats={stats} user={user} onSelectJob={setSelectedJob} />}
            {isMGR && <MgrDashboard stats={stats} onSelectJob={setSelectedJob} />}
            {isFIN && <FinDashboard stats={stats} onSelectJob={setSelectedJob} />}
            {isSuper && (
                <div className="space-y-6">
                    {/* Superadmin combines Manager & Admin statistics */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 mb-4">
                        <div className="flex items-center gap-2 text-purple-900 font-bold text-lg mb-2">
                            <Shield size={20} />
                            <span>Monitoring Superadmin</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 shadow-sm border rounded">
                                <div className="text-xs text-gray-500 font-medium">Total Pipeline</div>
                                <div className="text-2xl font-bold text-purple-700 mt-1">{formatRp(stats.pipeline)}</div>
                            </div>
                            <div className="bg-white p-4 shadow-sm border rounded">
                                <div className="text-xs text-gray-500 font-medium">Job Aktif (Global)</div>
                                <div className="text-2xl font-bold text-gray-900 mt-1">{stats.active.length}</div>
                            </div>
                            <div className="bg-white p-4 shadow-sm border rounded">
                                <div className="text-xs text-gray-500 font-medium">Laporan Selesai (Bulan Ini)</div>
                                <div className="text-2xl font-bold text-green-600 mt-1">{stats.thisMonth.length}</div>
                            </div>
                        </div>
                    </div>
                    <MgrDashboard stats={stats} onSelectJob={setSelectedJob} />
                </div>
            )}

            {/* Common: Recent Activity */}
            <div className="bg-white border rounded-xl shadow-sm p-6 mt-6">
                <div className="mb-4">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Aktivitas Terbaru</div>
                    <h3 className="text-lg font-bold text-gray-800 mt-0.5">Recent Activity</h3>
                </div>
                {(() => {
                    const all = [];
                    personalFiltered.forEach(j => (j.historyLogs || []).slice(-2).forEach(h => all.push({ ...h, job: j })));
                    all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    const list = all.slice(0, 8);
                    if (list.length === 0) return <div className="text-sm text-gray-500 text-center py-6">Belum ada aktivitas baru.</div>;
                    return (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                                        <th className="p-3">Kode</th>
                                        <th className="p-3">Stage</th>
                                        <th className="p-3">Aktivitas</th>
                                        <th className="p-3 text-right">Waktu</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {list.map((h, i) => (
                                        <tr key={i} onClick={() => setSelectedJob(h.job)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                            <td className="p-3 font-mono font-bold text-gray-800">{h.job.kode}</td>
                                            <td className="p-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-800 border">
                                                    S{h.stage}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-600">{h.action}</td>
                                            <td className="p-3 text-right font-mono text-xs text-gray-400">{formatDate(h.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })()}
            </div>

            {selectedJob && (
                <JobDetailSheet 
                    job={selectedJob} 
                    onClose={() => setSelectedJob(null)} 
                    auth={auth} 
                    canManage={true} 
                />
            )}
        </AppLayout>
    );
}

// ============================================================
// KPI CARD COMPONENT
// ============================================================
function KPICard({ label, value, sub, icon: Icon, accentClass, bgClass = 'bg-white', onClick }) {
    return (
        <div onClick={onClick} className={`${bgClass} p-5 border rounded-xl shadow-sm transition-all hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}>
            <div className="flex justify-between items-start">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
                {Icon && <Icon className={`h-5 w-5 ${accentClass || 'text-gray-400'}`} />}
            </div>
            <div className={`text-3xl font-extrabold tracking-tight mt-3 text-gray-900`}>{value}</div>
            <div className="text-xs text-gray-500 mt-2 font-medium">{sub}</div>
        </div>
    );
}

// ============================================================
// MARKETING DASHBOARD
// ============================================================
function MktDashboard({ stats, onSelectJob }) {
    const { mktTarget, mktRealisasi, achievement, funnel = [], expiringSukets = [] } = stats;
    const maxFunnel = Math.max(...(funnel || []).map(f => f.count), 1);

    return (
        <div className="space-y-6">
            {/* KPI Strip */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard label="Job Saya Aktif" value={stats.active.length} sub={`pipeline ${formatRp(stats.pipeline)}`} icon={Activity} />
                <KPICard label="Job Baru (Tahap 1)" value={stats.byStage[0]?.count || 0} sub="negosiasi / penawaran" icon={Plus} />
                <KPICard label="Selesai Bulan Ini" value={stats.thisMonth.length} sub={formatRp(stats.monthRevenue)} icon={CheckCircle2} accentClass="text-green-600" />
                <KPICard label="Suket ≤90h (Leads)"
                    value={expiringSukets.filter(s => s.days >= 0).length}
                    sub={expiringSukets.filter(s => s.days < 0).length > 0 ? `+${expiringSukets.filter(s => s.days < 0).length} expired` : 're-inspeksi'}
                    icon={Bell}
                    accentClass={expiringSukets.length > 0 ? 'text-amber-500' : 'text-gray-400'}
                    bgClass={expiringSukets.length > 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-white'} />
            </div>

            {/* Target vs Realisasi */}
            <div className="bg-white border rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-baseline mb-4">
                    <div>
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Target Omzet Bulan Ini</div>
                        <h3 className="text-lg font-bold text-gray-800 mt-0.5">Pencapaian Personal</h3>
                    </div>
                    <div className="text-right">
                        <div className={`text-4xl font-extrabold ${achievement >= 100 ? 'text-green-600' : achievement >= 75 ? 'text-gray-900' : achievement >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {achievement}%
                        </div>
                        <div className="text-xs text-gray-500 font-medium mt-1">
                            {achievement >= 100 ? '🎯 Target tercapai' : `${100 - achievement}% lagi ke target`}
                        </div>
                    </div>
                </div>
                <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-gray-700">{formatRp(mktRealisasi)} realisasi</span>
                    <span className="text-gray-400 font-medium">target {formatRp(mktTarget)}</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden border">
                    <div style={{ width: `${Math.min(100, achievement)}%` }}
                        className={`h-full transition-all duration-500 rounded-full ${
                            achievement >= 100 ? 'bg-green-600' : 'bg-orange-500'
                        }`} />
                </div>
            </div>

            {/* Sales Funnel */}
            <div className="bg-white border rounded-xl shadow-sm p-6">
                <div className="mb-4">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Sales Funnel</div>
                    <h3 className="text-lg font-bold text-gray-800 mt-0.5">Pipeline Per Tahap Pekerjaan</h3>
                </div>
                <div className="space-y-3">
                    {funnel.map((f, i) => {
                        const widthPct = Math.max(10, (f.count / maxFunnel) * 100);
                        const colors = ['bg-orange-600', 'bg-amber-600', 'bg-yellow-600', 'bg-green-600', 'bg-teal-600'];
                        return (
                            <div key={i} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <div className="md:w-48 text-sm font-semibold text-gray-700">{f.label}</div>
                                <div className="flex-1 h-8 bg-gray-50 rounded border overflow-hidden relative">
                                    <div style={{ width: `${widthPct}%` }}
                                        className={`${colors[i] || 'bg-gray-500'} h-full flex items-center pl-3 text-white text-xs font-bold transition-all duration-500`}>
                                        {f.count} job
                                    </div>
                                </div>
                                <div className="md:w-36 text-sm font-mono font-bold text-right text-gray-500">
                                    {formatRp(f.total)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Klien Prioritas - Suket akan expire */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                    <div>
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Klien Prioritas</div>
                        <h3 className="text-lg font-bold text-gray-800 mt-0.5">Suket Akan Expire — Kirim Penawaran Baru</h3>
                    </div>
                    <Link href="/reminder-suket" className="text-xs font-bold text-orange-600 hover:underline">
                        Lihat Semua &rarr;
                    </Link>
                </div>
                {expiringSukets.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        Belum ada Suket klien Anda yang mendekati expired (≤90 hari).
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                                    <th className="p-4">Kode</th>
                                    <th className="p-4">Klien</th>
                                    <th className="p-4">Unit</th>
                                    <th className="p-4">Expire</th>
                                    <th className="p-4 text-right">Sisa Hari</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {expiringSukets.slice(0, 10).map(s => {
                                    const isExp = s.days < 0;
                                    const isUrg = s.days <= 30 && s.days >= 0;
                                    return (
                                        <tr key={s.kode} onClick={() => onSelectJob(s.job)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                            <td className="p-4 font-mono font-bold text-gray-800">{s.job.kode}</td>
                                            <td className="p-4 font-semibold text-gray-700">{s.job.klien}</td>
                                            <td className="p-4 text-gray-500">{s.unit?.unit_label || '—'}</td>
                                            <td className="p-4 font-mono text-gray-400">{formatDate(s.unit?.suket_expired_at)}</td>
                                            <td className="p-4 text-right">
                                                <span className={`font-mono font-bold text-sm ${
                                                    isExp ? 'text-red-600' : isUrg ? 'text-amber-500' : 'text-gray-900'
                                                }`}>
                                                    {isExp ? `+${Math.abs(s.days)}h LATE` : `${s.days} hari`}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
function AdmDashboard({ stats, onSelectJob, jobs }) {
    const { antrianVerifikasi, butuhJadwal, h5Pending, logistikPending } = stats;

    return (
        <div className="space-y-6">
            {/* KPI Strip */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard label="Antrean Verifikasi" value={antrianVerifikasi.length} sub="Tahap 02 menunggu cek" icon={FileCheck} accentClass="text-amber-500" />
                <KPICard label="Butuh Jadwal" value={butuhJadwal.length} sub="Tahap 03 ST belum terbit" icon={Calendar} accentClass="text-blue-500" />
                <H5BlinkKPI count={h5Pending.length} />
                <KPICard label="Logistik Pending" value={logistikPending.length} sub="ST/alat belum dialokasi" icon={Wrench} accentClass="text-red-500" />
            </div>

            {/* Calendar */}
            <AdmCalendar jobs={jobs} onSelectJob={onSelectJob} />

            {/* Tabel Status Logistik */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b bg-gray-50/50">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tabel Status Logistik</div>
                    <h3 className="text-lg font-bold text-gray-800 mt-0.5">Surat Tugas & Alat Belum Dialokasi</h3>
                </div>
                {logistikPending.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        ✓ Semua job Tahap 3 sudah punya Surat Tugas & alat terassign.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                                    <th className="p-4">Kode</th>
                                    <th className="p-4">Klien</th>
                                    <th className="p-4">Pelaksanaan</th>
                                    <th className="p-4">Surat Tugas</th>
                                    <th className="p-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {logistikPending.map(j => {
                                    const stExists = !!j.no_surat_tugas;
                                    return (
                                        <tr key={j.id} onClick={() => onSelectJob(j)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                            <td className="p-4 font-mono font-bold text-gray-800">{j.kode}</td>
                                            <td className="p-4 font-semibold text-gray-700">{j.klien}</td>
                                            <td className="p-4 font-mono text-gray-500">{j.tgl_pelaksanaan ? formatDate(j.tgl_pelaksanaan) : 'Belum dijadwal'}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                                                    stExists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {stExists ? '✓ Terbit' : '× Belum'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right text-xs font-bold text-blue-600 hover:underline">
                                                Atur &rarr;
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function H5BlinkKPI({ count }) {
    const active = count > 0;
    return (
        <div className={`p-5 border rounded-xl shadow-sm transition-all ${
            active ? 'border-red-500 bg-red-50/50 animate-pulse' : 'bg-white'
        }`}>
            <div className="flex justify-between items-start">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Peringatan H-5 Disnaker</div>
                <AlertTriangle className={`h-5 w-5 ${active ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div className={`text-3xl font-extrabold tracking-tight mt-3 ${active ? 'text-red-700' : 'text-gray-900'}`}>{count}</div>
            <div className={`text-xs mt-2 font-bold ${active ? 'text-red-600' : 'text-gray-500'}`}>
                {active ? '⚠ BELUM LAPOR Teman K3!' : 'Semua lapor terkirim'}
            </div>
        </div>
    );
}

function AdmCalendar({ jobs, onSelectJob }) {
    const [refDate, setRefDate] = useState(new Date());

    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay(); // 0=Sunday
    const daysInMonth = lastDay.getDate();

    // Map inspections by date
    const jobsByDate = useMemo(() => {
        const map = {};
        jobs.forEach(j => {
            if (j.tgl_pelaksanaan && (j.stage === 4 || j.stage === 3)) {
                // Format YYYY-MM-DD
                const d = typeof j.tgl_pelaksanaan === 'string' ? j.tgl_pelaksanaan.split('T')[0] : new Date(j.tgl_pelaksanaan).toISOString().split('T')[0];
                if (!map[d]) map[d] = [];
                map[d].push(j);
            }
        });
        return map;
    }, [jobs]);

    const goPrev = () => setRefDate(new Date(year, month - 1, 1));
    const goNext = () => setRefDate(new Date(year, month + 1, 1));

    // Calendar generation
    const cells = [];
    for (let i = 0; i < startWeekday; i++) {
        cells.push(<div key={`empty-${i}`} className="h-20 bg-gray-50/50 border border-gray-100" />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const cellDate = new Date(year, month, day);
        const yyyy = cellDate.getFullYear();
        const mm = String(cellDate.getMonth() + 1).padStart(2, '0');
        const dd = String(cellDate.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const dayJobs = jobsByDate[dateStr] || [];

        const isToday = cellDate.toDateString() === new Date().toDateString();

        cells.push(
            <div key={`day-${day}`} className={`h-24 p-2 border border-gray-100 relative flex flex-col justify-between ${
                isToday ? 'bg-orange-50 border-orange-200' : 'bg-white'
            }`}>
                <span className={`text-xs font-bold ${isToday ? 'text-orange-600' : 'text-gray-400'}`}>
                    {day} {isToday && '· Hari Ini'}
                </span>
                <div className="flex flex-col gap-1 overflow-y-auto max-h-16">
                    {dayJobs.map(j => (
                        <div key={j.id} onClick={() => onSelectJob(j)}
                            className="text-[10px] font-bold truncate rounded bg-blue-100 text-blue-800 px-1 py-0.5 border border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors">
                            {j.kode} ({j.klien})
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                <div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Kalender Inspeksi Lapangan</div>
                    <h3 className="text-xl font-bold text-gray-800 mt-0.5">
                        {refDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                    </h3>
                </div>
                <div className="flex gap-2">
                    <button onClick={goPrev} className="p-2 border rounded-md bg-white hover:bg-gray-50 transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => setRefDate(new Date())} className="px-3 py-1 text-xs font-bold border rounded-md bg-white hover:bg-gray-50 transition-colors">
                        Hari Ini
                    </button>
                    <button onClick={goNext} className="p-2 border rounded-md bg-white hover:bg-gray-50 transition-colors">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 border-b text-center font-bold text-xs uppercase tracking-wider text-gray-500 py-2 bg-gray-50">
                <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
            </div>
            <div className="grid grid-cols-7 border-collapse">
                {cells}
            </div>
        </div>
    );
}

// ============================================================
// INSPEKTUR DASHBOARD
// ============================================================
function InsDashboard({ stats, user, onSelectJob }) {
    const { lhppJobs, stage4Mine } = stats;
    const fileRef = useRef(null);
    const activeJob = stage4Mine[0] || lhppJobs[0];

    const handleFileChange = () => {
        if (!activeJob) return;
        showSuccess('Shortcut Aktif', 'Shortcut HP Upload berhasil dipicu. Silakan upload file pada detail sheet di tab Lapangan.');
        onSelectJob(activeJob);
    };

    return (
        <div className="space-y-6">
            {/* KPI Strip */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard label="Jadwal Lapangan" value={stage4Mine.length} sub="Tahap 4 aktif" icon={HardHat} />
                <KPICard label="Draf LHPP Pending" value={lhppJobs.length} sub="Tahap 6 menunggu submit" icon={ClipboardList} />
                <KPICard label="SLA Timer Kritis"
                    value={lhppJobs.filter(j => j.remainingDays <= 1).length}
                    sub={lhppJobs.some(j => j.remainingDays < 0) ? 'Ada yang TERLAMBAT!' : '≤1 hari tersisa'}
                    icon={Hourglass}
                    accentClass={lhppJobs.some(j => j.remainingDays < 0) ? 'text-red-600' : 'text-amber-500'}
                    bgClass={lhppJobs.some(j => j.remainingDays < 0) ? 'bg-red-50/50 border-red-200 animate-pulse' : 'bg-white'} />
                <KPICard label="Selesai Bulan Ini" value={stats.thisMonth.length} sub="kontribusi tim" icon={CheckCircle2} accentClass="text-green-600" />
            </div>

            {/* Quick Upload Widget */}
            <div className="bg-orange-50/30 border-2 border-dashed border-orange-500/50 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                    <div className="text-xs text-orange-600 font-extrabold uppercase tracking-wider">⚡ QUICK UPLOAD WIDGET</div>
                    <h3 className="text-lg font-bold text-gray-800 mt-0.5">Upload Cepat dari HP</h3>
                </div>
                {!activeJob ? (
                    <div className="text-center text-sm text-gray-500 py-8 bg-white/50 border border-gray-200 rounded-lg">
                        Tidak ada job aktif di lapangan atau LHPP. Buka Kanban Board untuk memilih.
                    </div>
                ) : (
                    <div>
                        <div className="text-sm text-gray-500 mb-3">Foto/BAP akan otomatis tertaut ke job aktif:</div>
                        <div onClick={() => onSelectJob(activeJob)} 
                            className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:justify-between md:items-center cursor-pointer hover:border-orange-500 transition-colors mb-4 gap-2">
                            <div>
                                <span className="font-mono font-bold text-sm text-gray-800">{activeJob.kode}</span>
                                <h4 className="font-bold text-gray-800 mt-0.5">{activeJob.klien}</h4>
                                <p className="text-xs text-gray-400 mt-1">{activeJob.lokasi} · {PESAWAT_TYPES.find(p => p.code === activeJob.pesawat)?.name} × {activeJob.units}</p>
                            </div>
                            <span className="inline-flex self-start md:self-auto px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                                S{activeJob.stage} - {STAGES.find(s => s.id === activeJob.stage)?.name}
                            </span>
                        </div>

                        {/* Drag and drop / click box */}
                        <div onClick={() => fileRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); }}
                            onDrop={e => { e.preventDefault(); handleFileChange(); }}
                            className="bg-white border-2 border-dashed border-orange-400 rounded-xl p-8 text-center cursor-pointer hover:bg-orange-50/50 transition-colors">
                            <Upload className="mx-auto h-8 w-8 text-orange-500 opacity-60 mb-2" />
                            <div className="text-sm font-bold text-gray-700">Drag & drop foto / BAP di sini</div>
                            <div className="text-xs text-gray-400 mt-1">atau klik untuk pilih file · max 10MB/file</div>
                            <input ref={fileRef} type="file" multiple className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                        </div>
                        <div className="text-[10px] text-gray-400 mt-3 leading-relaxed">
                            💡 Widget ini shortcut. Setelah diklik/file dipilih, detail job akan terbuka untuk mengarahkan Anda ke tab Lapangan dan melengkapi dokumen.
                        </div>
                    </div>
                )}
            </div>

            {/* Countdown LHPP */}
            {lhppJobs.length > 0 && (
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b flex flex-col md:flex-row md:justify-between md:items-center bg-gray-50/50 gap-2">
                        <div className="flex items-center gap-2">
                            <Hourglass className="h-5 w-5 text-orange-500" />
                            <h3 className="text-lg font-bold text-gray-800">Countdown Penyusunan LHPP</h3>
                            <span className="bg-orange-100 text-orange-800 text-xs font-extrabold px-2 py-0.5 rounded">
                                {lhppJobs.length} TUGAS
                            </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-400">SOP: 3 hari kerja per unit</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                                    <th className="p-4">Kode</th>
                                    <th className="p-4">Klien & Pesawat</th>
                                    <th className="p-4">Periode</th>
                                    <th className="p-4 text-center">Sisa Hari</th>
                                    <th className="p-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {lhppJobs.map(j => {
                                    const isLate = j.remainingDays < 0;
                                    const isUrgent = j.remainingDays >= 0 && j.remainingDays <= 1;
                                    return (
                                        <tr key={j.id} onClick={() => onSelectJob(j)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                            <td className="p-4 font-mono font-bold text-gray-800">{j.kode}</td>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800">{j.klien}</div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {PESAWAT_TYPES.find(p => p.code === j.pesawat)?.name} · {j.units} unit · target {j.deadlineDays}h
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-500">
                                                Mulai {formatDate(j.stage_started_at || j.updated_at)}<br />
                                                <span className="text-xs font-mono">Hari ke-{j.elapsedDays}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className={`text-2xl font-extrabold ${isLate ? 'text-red-600' : isUrgent ? 'text-amber-500' : 'text-green-600'}`}>
                                                    {isLate ? `+${Math.abs(j.remainingDays)}` : j.remainingDays}
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-0.5">
                                                    {isLate ? 'hari TERLAMBAT' : j.remainingDays === 0 ? 'HARI INI' : 'hari tersisa'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${
                                                    isLate ? 'bg-red-100 text-red-800 border-red-200' : isUrgent ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-green-100 text-green-800 border-green-200'
                                                }`}>
                                                    {isLate ? 'OVERDUE' : isUrgent ? 'WARNING' : 'ON TRACK'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tugas Lapangan */}
            {stage4Mine.length > 0 && (
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b bg-gray-50/50">
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tugas Lapangan Saya</div>
                        <h3 className="text-lg font-bold text-gray-800 mt-0.5">Job Lapangan Saya</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                                    <th className="p-4">Kode</th>
                                    <th className="p-4">Klien</th>
                                    <th className="p-4">Lokasi & PIC</th>
                                    <th className="p-4">Pesawat</th>
                                    <th className="p-4">Jadwal</th>
                                    <th className="p-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {stage4Mine.map(j => (
                                    <tr key={j.id} onClick={() => onSelectJob(j)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                        <td className="p-4 font-mono font-bold text-gray-800">{j.kode}</td>
                                        <td className="p-4 font-bold text-gray-700">{j.klien}</td>
                                        <td className="p-4">
                                            <div className="text-gray-600">{j.lokasi}</div>
                                            {j.pic_klien && <div className="text-xs text-gray-400 mt-1">PIC: {j.pic_klien} · {j.pic_klien_phone}</div>}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-gray-700">
                                                {PESAWAT_TYPES.find(p => p.code === j.pesawat)?.name}
                                            </div>
                                            <div className="text-xs text-gray-400">{j.units} unit</div>
                                        </td>
                                        <td className="p-4 font-mono text-gray-500">
                                            {formatDate(j.tgl_pelaksanaan)}
                                        </td>
                                        <td className="p-4 text-right text-xs font-bold text-orange-600 hover:underline">
                                            Lapangan &rarr;
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// MANAGER DASHBOARD
// ============================================================
function MgrDashboard({ stats, onSelectJob }) {
    const { lhppNeedReview, suketDisnaker, tidakLaikUnits, workloadByInspektur } = stats;

    return (
        <div className="space-y-6">
            {/* KPI Strip */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard label="Total Pipeline" value={formatRp(stats.pipeline)} sub={`${stats.active.length} job aktif`} icon={Banknote} />
                <KPICard label="Total Overdue" value={stats.overdue.length} sub="job lewat SLA" icon={AlertTriangle} accentClass={stats.overdue.length > 0 ? 'text-red-600' : 'text-gray-400'} bgClass={stats.overdue.length > 0 ? 'bg-red-50/50 border-red-200' : 'bg-white'} />
                <KPICard label="LHPP Butuh Review" value={lhppNeedReview.length} sub="menunggu peer review" icon={Eye} accentClass={lhppNeedReview.length > 0 ? 'text-orange-500' : 'text-gray-400'} bgClass={lhppNeedReview.length > 0 ? 'bg-orange-50/50 border-orange-200' : 'bg-white'} />
                <KPICard label="Suket Berproses" value={suketDisnaker.length} sub="di Disnaker (Stage 8)" icon={Building2} />
            </div>

            {/* Workload Per Stage */}
            <div className="bg-white border rounded-xl shadow-sm p-6">
                <div className="mb-4">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Bottleneck Locator</div>
                    <h3 className="text-lg font-bold text-gray-800 mt-0.5">Beban Kerja Lintas Tahapan</h3>
                </div>
                {(() => {
                    const max = Math.max(...stats.byStage.map(x => x.count), 1);
                    return (
                        <div className="space-y-3">
                            {stats.byStage.map(s => {
                                const widthPct = (s.count / max) * 100;
                                const isBottleneck = s.count >= 3 && s.count === max;
                                return (
                                    <div key={s.stage} className="flex flex-col md:flex-row md:items-center gap-2">
                                        <div className="w-8 font-mono text-xs text-gray-400">S{String(s.stage).padStart(2, '0')}</div>
                                        <div className="w-48 text-sm font-semibold text-gray-700">{s.name}</div>
                                        <div className="flex-1 h-6 bg-gray-50 border rounded overflow-hidden relative">
                                            <div style={{ width: `${widthPct}%` }}
                                                className={`h-full flex items-center justify-end pr-3 text-white text-[10px] font-bold transition-all duration-500 ${
                                                    isBottleneck ? 'bg-red-600' : 'bg-black'
                                                }`}>
                                                {s.count > 0 ? `${s.count} job` : ''}
                                            </div>
                                        </div>
                                        {isBottleneck && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                                🚨 BOTTLENECK
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>

            {/* Workload Tim Inspektur */}
            {workloadByInspektur.length > 0 && (
                <div className="bg-white border rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <HardHat className="h-5 w-5 text-gray-500" />
                        <div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Beban Kerja Tim Inspektur</div>
                            <h3 className="text-lg font-bold text-gray-800 mt-0.5">Stage 4 - 6 Aktif</h3>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {workloadByInspektur.map(insp => {
                            const max = Math.max(...workloadByInspektur.map(x => x.totalActive), 1);
                            const widthPct = (insp.totalActive / max) * 100;
                            const isOverloaded = insp.totalActive >= 3;
                            const isIdle = insp.totalActive === 0;

                            return (
                                <div key={insp.id} className={`p-4 border rounded-xl bg-white shadow-sm flex flex-col justify-between hover:border-gray-400 transition-colors ${
                                    isOverloaded ? 'border-red-200 bg-red-50/10' : 'border-gray-200'
                                }`}>
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-sm">{insp.nama}</h4>
                                                <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">
                                                    AK3 {insp.spesialisasi.join(', ') || 'Umum'} · {insp.domisili}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-2xl font-black ${
                                                    isOverloaded ? 'text-red-600' : isIdle ? 'text-gray-300' : 'text-gray-900'
                                                }`}>
                                                    {insp.totalActive}
                                                </span>
                                                <span className="block text-[8px] text-gray-400 uppercase font-bold">Aktif</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden border mt-3">
                                            <div style={{ width: `${widthPct}%` }}
                                                className={`h-full rounded-full ${isOverloaded ? 'bg-red-600' : 'bg-black'}`} />
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-3 text-xs font-semibold">
                                        {insp.lapanganCount > 0 && <span className="text-gray-500">🏗 {insp.lapanganCount} Lap</span>}
                                        {insp.lhppCount > 0 && <span className="text-gray-500">📝 {insp.lhppCount} LHPP</span>}
                                        {insp.overdueCount > 0 && <span className="text-red-600 font-extrabold">⚠ {insp.overdueCount} OVERDUE</span>}
                                        {isIdle && <span className="text-green-600 italic">✓ Tersedia</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Temuan Kendala Lapangan */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b bg-gray-50/50">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Temuan Kendala Lapangan</div>
                    <h3 className="text-lg font-bold text-gray-800 mt-0.5">Unit "TIDAK LAIK" / "LAIK BERSYARAT" — Perlu Rekomendasi</h3>
                </div>
                {tidakLaikUnits.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        ✓ Tidak ada unit dengan kategori TIDAK LAIK / LAIK BERSYARAT saat ini.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                                    <th className="p-4">Kode-Unit</th>
                                    <th className="p-4">Klien</th>
                                    <th className="p-4">Unit</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Catatan / Rekomendasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {tidakLaikUnits.map((t, i) => {
                                    const opt = LAIK_STATUS.find(o => o.value === t.status);
                                    return (
                                        <tr key={i} onClick={() => onSelectJob(t.job)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                            <td className="p-4 font-mono font-bold text-gray-800">{t.kode}</td>
                                            <td className="p-4 font-bold text-gray-700">{t.job.klien}</td>
                                            <td className="p-4 text-gray-500">{t.unit.unit_label || `Unit ${t.unit.unit_no}`}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                                                    opt ? opt.tag : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {opt ? opt.label : t.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600 italic">{t.recommendation || '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================
// FINANCE DASHBOARD
// ============================================================
function FinDashboard({ stats, onSelectJob }) {
    const { siapTagih, piutangBerjalan, piutangOverdue, totalPiutang, totalOverdue, arBuckets, tandaTerimaPending } = stats;

    return (
        <div className="space-y-6">
            {/* KPI Strip */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard label="Suket Siap Tagih" value={siapTagih.length} sub="Tahap 10 belum invoice" icon={FileCheck} accentClass="text-orange-500" />
                <KPICard label="Piutang Berjalan" value={formatRp(totalPiutang)} sub={`${piutangBerjalan.length} invoice unpaid`} icon={Banknote} />
                <KPICard label="Overdue AR" value={formatRp(totalOverdue)} sub={`${piutangOverdue.length} invoice lewat TOP`} icon={AlertTriangle} accentClass={piutangOverdue.length > 0 ? 'text-red-600' : 'text-gray-400'} bgClass={piutangOverdue.length > 0 ? 'bg-red-50/50 border-red-200 animate-pulse' : 'bg-white'} />
                <KPICard label="Tanda Terima Pending" value={tandaTerimaPending.length} sub="dokumen kurir belum kembali" icon={Package} accentClass={tandaTerimaPending.length > 0 ? 'text-amber-500' : 'text-gray-400'} />
            </div>

            {/* AR Aging Chart */}
            <div className="bg-white border rounded-xl shadow-sm p-6">
                <div className="mb-4">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">AR Aging Chart</div>
                    <h3 className="text-lg font-bold text-gray-800 mt-0.5">Invoice Aging Distribution</h3>
                </div>
                {(() => {
                    const buckets = [
                        { label: '0-30 hari', items: arBuckets['0-30'], color: 'bg-green-600', desc: 'Dalam TOP' },
                        { label: '31-60 hari', items: arBuckets['31-60'], color: 'bg-yellow-600', desc: 'Reminder' },
                        { label: '61-90 hari', items: arBuckets['61-90'], color: 'bg-orange-500', desc: 'Penagihan aktif' },
                        { label: '>90 hari', items: arBuckets['>90'], color: 'bg-red-600', desc: 'Macet — eskalasi' },
                    ];
                    const maxTotal = Math.max(...buckets.map(b => b.items.reduce((s, j) => s + Number(j.nilai || 0), 0)), 1);
                    return (
                        <div className="space-y-4">
                            {buckets.map((b, i) => {
                                const total = b.items.reduce((s, j) => s + Number(j.nilai || 0), 0);
                                const widthPct = (total / maxTotal) * 100;
                                return (
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between items-baseline text-sm">
                                            <span className="font-bold text-gray-700">{b.label}</span>
                                            <span className="text-xs text-gray-400 mr-auto ml-2 font-medium">· {b.desc}</span>
                                            <span className="font-mono font-bold text-gray-800">
                                                {formatRp(total)} <span className="text-xs text-gray-400 font-medium">({b.items.length} invoice)</span>
                                            </span>
                                        </div>
                                        <div className="h-5 bg-gray-100 rounded border overflow-hidden">
                                            <div style={{ width: `${widthPct}%` }}
                                                className={`${b.color} h-full transition-all duration-500`} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>

            {/* Courier Delivery Tracking */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b bg-gray-50/50">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pelacakan Dokumen Kurir</div>
                    <h3 className="text-lg font-bold text-gray-800 mt-0.5">Suket & Invoice — Tanda Terima Belum Kembali</h3>
                </div>
                {tandaTerimaPending.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        ✓ Semua dokumen kurir sudah kembali tanda terima.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                                    <th className="p-4">Kode</th>
                                    <th className="p-4">Klien</th>
                                    <th className="p-4">No Invoice</th>
                                    <th className="p-4">Nilai</th>
                                    <th className="p-4">Tgl Invoice</th>
                                    <th className="p-4 text-right">Hari Lalu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {tandaTerimaPending.map(j => {
                                    const daysSince = j.invoice_date ? daysBetween(j.invoice_date, today()) : 0;
                                    return (
                                        <tr key={j.id} onClick={() => onSelectJob(j)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                            <td className="p-4 font-mono font-bold text-gray-800">{j.kode}</td>
                                            <td className="p-4 font-semibold text-gray-700">{j.klien}</td>
                                            <td className="p-4 font-mono text-gray-500">{j.invoice_no || '—'}</td>
                                            <td className="p-4 font-mono font-bold text-gray-700">{formatRp(j.nilai)}</td>
                                            <td className="p-4 font-mono text-gray-400">{formatDate(j.invoice_date)}</td>
                                            <td className="p-4 text-right">
                                                <span className={`font-mono font-bold text-xs ${
                                                    daysSince > 14 ? 'text-red-600' : daysSince > 7 ? 'text-amber-500' : 'text-gray-900'
                                                }`}>
                                                    {daysSince} hari lalu
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Overdue AR detail */}
            {piutangOverdue.length > 0 && (
                <div className="bg-red-50/50 border-2 border-red-500 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-red-100 bg-red-100/30">
                        <div className="text-xs text-red-600 font-extrabold uppercase tracking-wider">🔴 PIUTANG JATUH TEMPO</div>
                        <h3 className="text-lg font-bold text-red-900 mt-0.5">Overdue Accounts Receivable</h3>
                    </div>
                    <div className="overflow-x-auto bg-white">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                                    <th className="p-4">Kode</th>
                                    <th className="p-4">Klien</th>
                                    <th className="p-4">Invoice</th>
                                    <th className="p-4">Nilai</th>
                                    <th className="p-4">Jatuh Tempo</th>
                                    <th className="p-4 text-right">Lewat TOP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {piutangOverdue.map(j => {
                                    const lewat = j.payment_due_date ? daysBetween(j.payment_due_date, today()) : 0;
                                    return (
                                        <tr key={j.id} onClick={() => onSelectJob(j)} className="hover:bg-red-50/20 cursor-pointer transition-colors bg-red-50/5">
                                            <td className="p-4 font-mono font-bold text-gray-800">{j.kode}</td>
                                            <td className="p-4 font-semibold text-gray-700">{j.klien}</td>
                                            <td className="p-4 font-mono text-gray-500">{j.invoice_no}</td>
                                            <td className="p-4 font-mono font-bold text-gray-700">{formatRp(j.nilai)}</td>
                                            <td className="p-4 font-mono text-gray-400">{formatDate(j.payment_due_date)}</td>
                                            <td className="p-4 text-right">
                                                <span className="font-mono font-bold text-sm text-red-600">
                                                    +{lewat} hari
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
