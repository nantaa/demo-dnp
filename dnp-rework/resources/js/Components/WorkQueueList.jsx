import React, { useState, useMemo } from 'react';
import {
    Search, Filter, User, Calendar, MapPin, Wrench, FileText, CheckCircle2,
    Clock, AlertTriangle, ChevronRight, Layers, GitFork, SlidersHorizontal, Sparkles
} from 'lucide-react';
import { filterJobsForMyWork } from '@domain/workflowEngine';

export default function WorkQueueList({
    stage,
    jobs = [],
    auth = {},
    onSelectJob,
    onOpenFamilyDrawer
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewScope, setViewScope] = useState('all'); // 'all' | 'my_work'
    const [density, setDensity] = useState('comfortable'); // 'comfortable' | 'compact'
    const [slaFilter, setSlaFilter] = useState('all'); // 'all' | 'overdue' | 'due_today' | 'on_track'

    const fmtCurrency = (n) =>
        n != null ? 'Rp ' + Number(n).toLocaleString('id-ID') : '—';

    const fmtDate = (d) =>
        d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    const getDaysElapsed = (from) => {
        if (!from) return null;
        return Math.ceil((Date.now() - new Date(from).getTime()) / 86400000);
    };

    // Filter jobs for this active stage
    const stageJobs = useMemo(() => {
        return jobs.filter(j => j.stage === stage?.id);
    }, [jobs, stage]);

    // Apply "My Work" vs "All" filter
    const scopedJobs = useMemo(() => {
        if (viewScope === 'my_work') {
            return filterJobsForMyWork(stageJobs, auth?.user);
        }
        return stageJobs;
    }, [stageJobs, viewScope, auth?.user]);

    // Apply Search and SLA filters
    const filteredJobs = useMemo(() => {
        return scopedJobs.filter(job => {
            // SLA check
            const refDate = job.tgl_pelaksanaan || job.tgl_laporan_mulai || job.tgl_submit_disnaker || job.created_at;
            const days = getDaysElapsed(refDate);

            if (slaFilter === 'overdue' && (days === null || days <= 3)) return false;
            if (slaFilter === 'due_today' && (days === null || days !== 3)) return false;
            if (slaFilter === 'on_track' && days !== null && days > 3) return false;

            // Search query check
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            const matchKode = (job.kode || '').toLowerCase().includes(q);
            const matchKlien = (job.klien || '').toLowerCase().includes(q);
            const matchPesawat = (job.pesawat || '').toLowerCase().includes(q);
            const matchLokasi = (job.lokasi || '').toLowerCase().includes(q);
            const matchPO = (job.no_po || '').toLowerCase().includes(q);
            const matchMkt = (job.owner_marketing || '').toLowerCase().includes(q);
            const matchInsp = (job.inspectors || []).some(i => (i.name || '').toLowerCase().includes(q));

            return matchKode || matchKlien || matchPesawat || matchLokasi || matchPO || matchMkt || matchInsp;
        });
    }, [scopedJobs, searchQuery, slaFilter]);

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-4">
            {/* Header: Stage Title & Subtitle */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="bg-[#0A385C] text-white text-xs px-2.5 py-0.5 rounded-full font-black">
                            Stage {stage?.displayId || stage?.id}
                        </span>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">
                            {stage?.name || 'Pekerjaan'}
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        PIC Penanggung Jawab: <strong className="text-slate-700">{stage?.roles?.join(', ') || 'Semua Role'}</strong>
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                        {filteredJobs.length} dari {stageJobs.length} Pekerjaan
                    </span>
                </div>
            </div>

            {/* Filter & Operations Action Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Cari No. Job, Klien, Alat, Lokasi, No. PO..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A8E8]"
                    />
                </div>

                {/* Scope Toggle: My Work vs All Work */}
                <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200 shrink-0">
                    <button
                        type="button"
                        onClick={() => setViewScope('all')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                            viewScope === 'all'
                                ? 'bg-[#0A385C] text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Semua Job ({stageJobs.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewScope('my_work')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                            viewScope === 'my_work'
                                ? 'bg-[#00A8E8] text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Pekerjaan Saya
                    </button>
                </div>

                {/* SLA Filter Dropdown */}
                <select
                    value={slaFilter}
                    onChange={e => setSlaFilter(e.target.value)}
                    className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00A8E8] shrink-0"
                >
                    <option value="all">Semua Status SLA</option>
                    <option value="on_track">🟢 On Track</option>
                    <option value="due_today">🟡 Due Today</option>
                    <option value="overdue">🔴 Overdue</option>
                </select>

                {/* Density Switcher */}
                <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200 shrink-0">
                    <button
                        type="button"
                        onClick={() => setDensity('comfortable')}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                            density === 'comfortable' ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Comfortable Card View"
                    >
                        Kartu
                    </button>
                    <button
                        type="button"
                        onClick={() => setDensity('compact')}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                            density === 'compact' ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Compact Table View"
                    >
                        Tabel
                    </button>
                </div>
            </div>

            {/* List Body */}
            {filteredJobs.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                        <CheckCircle2 size={24} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700">Tidak Ada Pekerjaan di Stage Ini</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {searchQuery
                            ? `Tidak ada job yang sesuai dengan filter pencarian "${searchQuery}".`
                            : 'Semua antrian pekerjaan di stage ini telah selesai atau belum ada job yang masuk.'}
                    </p>
                </div>
            ) : density === 'comfortable' ? (
                /* Comfortable Card Layout */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredJobs.map(job => {
                        const refDate = job.tgl_pelaksanaan || job.tgl_laporan_mulai || job.tgl_submit_disnaker || job.created_at;
                        const days = getDaysElapsed(refDate);
                        const isOverdue = days !== null && days > 3;

                        return (
                            <div
                                key={job.id}
                                onClick={() => onSelectJob(job)}
                                className="group relative bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-[#00A8E8]/60 rounded-xl p-4 transition-all shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between"
                            >
                                <div className="space-y-2.5">
                                    {/* Top Row: Kode & SLA */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-mono text-xs font-extrabold text-[#0A385C] bg-slate-100 px-2 py-0.5 rounded border">
                                                {job.kode}
                                            </span>
                                            {job.no_po && (
                                                <span className="text-[10px] font-mono font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border">
                                                    PO: {job.no_po}
                                                </span>
                                            )}
                                            {job.parent_job_id && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onOpenFamilyDrawer(job);
                                                    }}
                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-300"
                                                    title="Pekerjaan Hasil Split (Family Tree)"
                                                >
                                                    <GitFork size={10} /> Split
                                                </button>
                                            )}
                                        </div>

                                        {isOverdue ? (
                                            <span className="text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <AlertTriangle size={10} /> SLA {days} Hari
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Clock size={10} /> {days ? `${days} Hari` : 'Hari Ini'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Client & Device */}
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 group-hover:text-[#00A8E8] transition-colors leading-tight">
                                            {job.klien}
                                        </h3>
                                        <p className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                                            <span>{job.pesawat}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="font-bold text-slate-800">{job.units || 1} Unit</span>
                                        </p>
                                    </div>

                                    {/* Location & PIC */}
                                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-1 truncate" title={job.lokasi}>
                                            <MapPin size={12} className="text-slate-400 shrink-0" />
                                            <span className="truncate">{job.lokasi || 'Lokasi —'}</span>
                                        </div>
                                        <div className="flex items-center gap-1 truncate" title={`Marketing: ${job.owner_marketing}`}>
                                            <User size={12} className="text-slate-400 shrink-0" />
                                            <span className="truncate">{job.owner_marketing || 'MKT —'}</span>
                                        </div>
                                    </div>

                                    {/* Inspectors if assigned */}
                                    {job.inspectors && job.inspectors.length > 0 && (
                                        <div className="flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded">
                                            <Wrench size={11} className="text-[#00A8E8] shrink-0" />
                                            <span className="truncate">
                                                Inspektur: {job.inspectors.map(i => i.name).join(', ')}
                                            </span>
                                        </div>
                                    )}

                                    {/* Document Debt Warning if any */}
                                    {job.document_debt && job.document_debt.length > 0 && (
                                        <div className="bg-amber-50 border border-amber-300 text-amber-900 px-2 py-1 rounded text-[10px] font-bold">
                                            Hutang Dokumen ({job.document_debt.length})
                                        </div>
                                    )}
                                </div>

                                {/* Bottom Row Action */}
                                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <span className="text-[11px] font-bold text-slate-400">
                                        {fmtDate(job.created_at)}
                                    </span>
                                    <span className="text-xs font-bold text-[#0077A6] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                                        Buka Detail <ChevronRight size={14} />
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Compact Table Layout */
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                                <th className="p-3">Kode / PO</th>
                                <th className="p-3">Klien</th>
                                <th className="p-3">Alat & Unit</th>
                                <th className="p-3">Lokasi</th>
                                <th className="p-3">Marketing / PIC</th>
                                <th className="p-3">SLA / Umur</th>
                                <th className="p-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredJobs.map(job => {
                                const refDate = job.tgl_pelaksanaan || job.tgl_laporan_mulai || job.tgl_submit_disnaker || job.created_at;
                                const days = getDaysElapsed(refDate);
                                const isOverdue = days !== null && days > 3;

                                return (
                                    <tr
                                        key={job.id}
                                        onClick={() => onSelectJob(job)}
                                        className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                                    >
                                        <td className="p-3 font-mono font-bold text-[#0A385C]">
                                            <div>{job.kode}</div>
                                            {job.no_po && <div className="text-[10px] text-slate-400 font-normal">PO: {job.no_po}</div>}
                                        </td>
                                        <td className="p-3 font-bold text-slate-900 max-w-[180px] truncate">
                                            {job.klien}
                                        </td>
                                        <td className="p-3">
                                            <div className="font-semibold text-slate-800">{job.pesawat}</div>
                                            <div className="text-[10px] text-slate-500">{job.units || 1} Unit</div>
                                        </td>
                                        <td className="p-3 text-slate-600 max-w-[140px] truncate">
                                            {job.lokasi || '—'}
                                        </td>
                                        <td className="p-3 text-slate-700">
                                            <div>{job.owner_marketing || '—'}</div>
                                            {job.inspectors && job.inspectors.length > 0 && (
                                                <div className="text-[10px] text-[#0077A6]">
                                                    {job.inspectors.map(i => i.name).join(', ')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {isOverdue ? (
                                                <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold text-[10px]">
                                                    {days} Hari (Overdue)
                                                </span>
                                            ) : (
                                                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium text-[10px]">
                                                    {days ? `${days} Hari` : 'Hari Ini'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectJob(job);
                                                }}
                                                className="px-2.5 py-1 text-xs font-bold text-[#0077A6] bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                                            >
                                                Buka
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
