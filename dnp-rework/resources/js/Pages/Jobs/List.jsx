import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import JobDetailSheet from '@/Components/JobDetailSheet';
import { STAGES } from '@/Constants';
import { showWarning, showConfirm, showSuccess } from '@/swal';
import { Trash2, ArrowUpDown, ChevronUp, ChevronDown, Search, X } from 'lucide-react';

export default function JobList({ jobs, auth }) {
    const { permissions } = auth;
    const isSuperadmin = auth.user.role === 'superadmin' || permissions === 'superadmin';
    const isINS = ['inspektur', 'inspector'].includes(auth?.user?.role);
    const queryParams = new URLSearchParams(window.location.search);
    const [searchTerm, setSearchTerm] = useState(queryParams.get('search') || '');
    const [stageFilter, setStageFilter] = useState('');
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [selectedJob, setSelectedJob] = useState(null);

    const visibleJobs = useMemo(() => {
        return jobs.filter(job => {
            if (permissions === 'superadmin' || auth.user?.role === 'admin' || auth.user?.role === 'manager') return true;
            if (auth.user?.role === 'marketing') return job.owner_marketing === auth.user?.name;

            // Assigned inspector or report writer access: keep visible across all stages even when moved backwards
            if (['inspektur', 'inspector'].includes(auth.user?.role)) {
                const uId = String(auth.user?.id);
                const isAssigned = (job.inspectors || []).some(ins =>
                    String(ins.id) === uId ||
                    String(ins.user_id) === uId ||
                    String(ins.pivot?.inspector_id) === uId ||
                    String(ins.pivot?.user_id) === uId
                ) || String(job.report_writer_id) === uId;

                if (isAssigned) return true;
            }

            const perm = permissions?.[job.stage];
            return perm && (
                perm.can_view === true || perm.can_view === 1 || perm.can_view === '1' ||
                perm.is_owner === true || perm.is_owner === 1 || perm.is_owner === '1'
            );
        });
    }, [jobs, permissions, auth.user]);

    const filteredJobs = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return visibleJobs.filter(j => {
            if (stageFilter && String(j.stage) !== String(stageFilter)) {
                return false;
            }
            if (!term) return true;

            const matchKode = j.kode && j.kode.toLowerCase().includes(term);
            const matchKlien = j.klien && j.klien.toLowerCase().includes(term);
            const matchPesawat = j.pesawat && j.pesawat.toLowerCase().includes(term);
            const matchLokasi = j.lokasi && j.lokasi.toLowerCase().includes(term);
            // Search filter by Number PO (strictly guarded for non-INS users)
            const matchPo = !isINS && j.no_po && j.no_po.toLowerCase().includes(term);

            return matchKode || matchKlien || matchPesawat || matchLokasi || matchPo;
        });
    }, [visibleJobs, searchTerm, stageFilter, isINS]);

    const sortedJobs = useMemo(() => {
        return [...filteredJobs].sort((a, b) => {
            let aVal, bVal;
            if (sortField === 'no_po') {
                aVal = (!isINS && a.no_po) ? a.no_po.toLowerCase() : (a.kode || '').toLowerCase();
                bVal = (!isINS && b.no_po) ? b.no_po.toLowerCase() : (b.kode || '').toLowerCase();
            } else if (sortField === 'klien') {
                aVal = (a.klien || '').toLowerCase();
                bVal = (b.klien || '').toLowerCase();
            } else if (sortField === 'pesawat') {
                aVal = (a.pesawat || '').toLowerCase();
                bVal = (b.pesawat || '').toLowerCase();
            } else if (sortField === 'stage') {
                aVal = Number(a.stage || 0);
                bVal = Number(b.stage || 0);
            } else if (sortField === 'owner_marketing') {
                aVal = (a.owner_marketing || '').toLowerCase();
                bVal = (b.owner_marketing || '').toLowerCase();
            } else if (sortField === 'created_at') {
                aVal = new Date(a.created_at || a.created_at_ts || 0).getTime() || a.id || 0;
                bVal = new Date(b.created_at || b.created_at_ts || 0).getTime() || b.id || 0;
            } else {
                aVal = a[sortField] || '';
                bVal = b[sortField] || '';
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredJobs, sortField, sortDirection, isINS]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection(field === 'created_at' ? 'desc' : 'asc');
        }
    };

    const handleSortSelectChange = (e) => {
        const [field, dir] = e.target.value.split('_');
        setSortField(field);
        setSortDirection(dir);
    };

    const renderSortIcon = (field) => {
        if (sortField !== field) {
            return <ArrowUpDown size={12} className="inline ml-1 text-gray-400 opacity-60 group-hover:opacity-100 transition-opacity" />;
        }
        return sortDirection === 'asc'
            ? <ChevronUp size={14} className="inline ml-1 text-blue-600 font-bold" />
            : <ChevronDown size={14} className="inline ml-1 text-blue-600 font-bold" />;
    };

    const handleClearAllJobs = async () => {
        const res = await showConfirm(
            'Kosongkan Database Job',
            'Apakah Anda yakin ingin menghapus SELURUH data Job dari database? Tindakan ini tidak dapat dibatalkan!',
            'Hapus Semua Data',
            'Batal'
        );
        if (res.isConfirmed) {
            router.delete('/jobs/clear-all', {
                onSuccess: () => {
                    showSuccess('Berhasil', 'Seluruh data Job berhasil dikosongkan.');
                    setSelectedJob(null);
                }
            });
        }
    };

    const handleDeleteSingleJob = async (job, e) => {
        e.stopPropagation();
        const res = await showConfirm(
            'Hapus Job',
            `Apakah Anda yakin ingin menghapus Job ${job.no_po || job.kode} (${job.klien})?`,
            'Ya, Hapus',
            'Batal'
        );
        if (res.isConfirmed) {
            router.delete(`/jobs/${job.id}`, {
                onSuccess: () => {
                    showSuccess('Berhasil', `Job ${job.no_po || job.kode} berhasil dihapus.`);
                    if (selectedJob?.id === job.id) setSelectedJob(null);
                }
            });
        }
    };

    const handleExportCSV = () => {
        if (sortedJobs.length === 0) return showWarning('Ekspor Gagal', 'Tidak ada data untuk diexport');
        
        const headers = ['No PO', 'Kode', 'Klien', 'Pesawat', 'Unit', 'Lokasi', 'Stage', 'Marketing', 'Tgl Pelaksanaan'];
        const rows = sortedJobs.map(job => {
            const stageInfo = STAGES.find(s => s.id === job.stage);
            return [
                `"${(!isINS && job.no_po) ? job.no_po : '-'}"`,
                job.kode,
                `"${job.klien}"`,
                `"${job.pesawat}"`,
                job.units,
                `"${job.lokasi}"`,
                stageInfo?.displayId || job.stage,
                `"${job.owner_marketing}"`,
                job.tgl_pelaksanaan || ''
            ];
        });
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `jobs_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fmtDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '-';
            return d.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return '-';
        }
    };

    const getSlaBadge = (job) => {
        if (job.stage === 8 && job.s8_progress_status) {
            const sMap = {
                progress: { label: 'PROGRESS', cls: 'bg-blue-100 text-blue-800 border-blue-300' },
                stuck:    { label: 'STUCK',    cls: 'bg-red-100 text-red-800 font-bold border-red-300' },
                ready:    { label: 'READY',    cls: 'bg-emerald-100 text-emerald-800 font-bold border-emerald-300' },
            };
            const badge = sMap[job.s8_progress_status];
            if (badge) return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border ${badge.cls}`}>{badge.label}</span>;
        }

        if (job.stage === 9 && job.s9_progress_status) {
            const s9Map = {
                // New Operational Suket Workflow Statuses
                diterima:               { label: 'DITERIMA',               cls: 'bg-blue-100 text-blue-800 font-bold border-blue-300' },
                scan:                   { label: 'SCAN',                   cls: 'bg-purple-100 text-purple-800 font-bold border-purple-300' },
                penamaan_cover:         { label: 'PENAMAAN COVER',         cls: 'bg-amber-100 text-amber-800 font-bold border-amber-300' },
                pembuatan_tanda_terima: { label: 'TANDA TERIMA',           cls: 'bg-cyan-100 text-cyan-800 font-bold border-cyan-300' },
                selesai:                { label: 'SELESAI',                cls: 'bg-emerald-100 text-emerald-800 font-bold border-emerald-300' },
                // Legacy fallbacks
                not_started:            { label: 'NOT STARTED',            cls: 'bg-gray-100 text-gray-700 border-gray-300' },
                delayed:                { label: 'DELAYED',                cls: 'bg-red-100 text-red-800 font-bold border-red-300' },
                in_progress:            { label: 'IN PROGRESS',            cls: 'bg-blue-100 text-blue-800 font-bold border-blue-300' },
                almost_done:            { label: 'ALMOST DONE',            cls: 'bg-amber-100 text-amber-800 font-bold border-amber-300' },
                done:                   { label: 'DONE',                   cls: 'bg-emerald-100 text-emerald-800 font-bold border-emerald-300' },
            };
            const badge = s9Map[job.s9_progress_status];
            if (badge) return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border ${badge.cls}`}>{badge.label}</span>;
        }

        if (job.stage === 4 && job.tgl_pelaksanaan) {
            const today = new Date();
            today.setHours(0,0,0,0);
            const pelDate = new Date(job.tgl_pelaksanaan);
            pelDate.setHours(0,0,0,0);
            const diffDays = Math.round((today - pelDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold border border-blue-300">HARI H</span>;
            } else if (diffDays > 0) {
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-800 font-bold border border-red-300">OVERDUE</span>;
            } else {
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-yellow-100 text-yellow-800 font-bold border border-yellow-300">H {diffDays}</span>;
            }
        }

        const stageInfo = STAGES.find(s => s.id === job.stage);
        let slaDays = stageInfo?.sla;
        if (!slaDays) return null;
        if (job.stage === 6) slaDays *= (job.units || 1);
        const diffDays = Math.ceil(Math.abs(new Date() - new Date(job.stage_started_at || job.updated_at)) / 86400000);
        let status = 'ON TRACK', color = 'bg-green-100 text-green-800';
        if (diffDays > slaDays) { status = 'OVERDUE'; color = 'bg-red-100 text-red-800 font-bold'; }
        else if (diffDays >= slaDays - 1) { status = 'WARNING'; color = 'bg-yellow-100 text-yellow-800 font-bold'; }
        return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] ${color}`}>{status} {diffDays}/{slaDays}d</span>;
    };

    return (
        <AppLayout>
            <Head title="Daftar Job" />

            {/* Header toolbar — stacks on mobile */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 mb-4 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Daftar Job</h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Menampilkan {sortedJobs.length} dari {visibleJobs.length} pekerjaan
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                    {/* Search by No. PO / Kode / Klien */}
                    <div className="relative flex-1 sm:w-64 min-w-[200px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={isINS ? "Cari Kode / Klien..." : "Cari No. PO / Kode / Klien..."}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
                                title="Hapus pencarian"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Filter Stage */}
                    <select
                        value={stageFilter}
                        onChange={e => setStageFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-700 bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500"
                        title="Filter berdasarkan Stage"
                    >
                        <option value="">Semua Stage</option>
                        {STAGES.map(s => (
                            <option key={s.id} value={s.id}>
                                S{s.displayId || s.id}: {s.short || s.name}
                            </option>
                        ))}
                    </select>

                    {/* Sort Selector Dropdown */}
                    <select
                        value={`${sortField}_${sortDirection}`}
                        onChange={handleSortSelectChange}
                        className="border border-gray-300 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-700 bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500"
                        title="Urutkan data pekerjaan"
                    >
                        <option value="created_at_desc">Urutkan: Terbaru</option>
                        <option value="created_at_asc">Urutkan: Terlama</option>
                        <option value="no_po_asc">{isINS ? 'Urutkan: Kode (A-Z)' : 'Urutkan: No. PO (A-Z)'}</option>
                        <option value="no_po_desc">{isINS ? 'Urutkan: Kode (Z-A)' : 'Urutkan: No. PO (Z-A)'}</option>
                        <option value="klien_asc">Urutkan: Klien (A-Z)</option>
                        <option value="klien_desc">Urutkan: Klien (Z-A)</option>
                        <option value="stage_asc">Urutkan: Stage (1 → 16)</option>
                        <option value="stage_desc">Urutkan: Stage (16 → 1)</option>
                    </select>

                    {['marketing', 'manager'].includes(auth.user.role) && (
                        <Link href={route('jobs.create')} className="bg-black text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-gray-800 transition">
                            + Job Baru
                        </Link>
                    )}
                    <button onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition">
                        Export CSV
                    </button>
                    {isSuperadmin && (
                        <button
                            onClick={handleClearAllJobs}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 shadow-xs whitespace-nowrap transition"
                            title="Kosongkan SELURUH database Job (Superadmin Special)"
                        >
                            <Trash2 size={15} /> Kosongkan Database Job
                        </button>
                    )}
                </div>
            </div>

            {/* ── Mobile Card View ─────────────────────────────────── */}
            <div className="sm:hidden space-y-2">
                {sortedJobs.map(job => {
                    const stageInfo = STAGES.find(s => s.id === job.stage);
                    return (
                        <div
                            key={job.id}
                            onClick={() => setSelectedJob(job)}
                            className="bg-white border rounded-lg p-3 shadow-sm cursor-pointer active:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-1.5">
                                <span 
                                    className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-[#0A385C] border border-slate-200 truncate max-w-[180px]"
                                    title={(!isINS && job.no_po) ? `No PO / SPK: ${job.no_po} | ID Sistem: ${job.kode}` : `ID Sistem: ${job.kode}`}
                                >
                                    {(!isINS && job.no_po) ? `PO: ${job.no_po}` : job.kode}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {getSlaBadge(job)}
                                    <span className="text-xs bg-gray-100 border px-2 py-0.5 rounded font-medium">S{stageInfo?.displayId || job.stage}</span>
                                    {isSuperadmin && (
                                        <button
                                            onClick={(e) => handleDeleteSingleJob(job, e)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                            title="Hapus Job Ini"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <h3 className="font-bold text-gray-900 text-sm leading-tight">{job.klien}</h3>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{job.pesawat} • {job.lokasi}</p>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-gray-400">{stageInfo?.name} • {job.owner_marketing}</span>
                                <span className="text-xs text-gray-400 font-mono">{fmtDate(job.created_at)}</span>
                            </div>
                        </div>
                    );
                })}
                {sortedJobs.length === 0 && (
                    <div className="py-12 text-center text-gray-400 text-sm">Tidak ada data job ditemukan.</div>
                )}
            </div>

            {/* ── Desktop Table View with Sortable Columns ───────────── */}
            <div className="hidden sm:block bg-white border rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b select-none">
                        <tr>
                            <th
                                onClick={() => handleSort('no_po')}
                                className="px-4 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 group transition-colors"
                                title="Klik untuk mengurutkan No. PO / SPK"
                            >
                                <span className="flex items-center gap-1">
                                    No. PO / SPK {renderSortIcon('no_po')}
                                </span>
                            </th>
                            <th
                                onClick={() => handleSort('klien')}
                                className="px-4 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 group transition-colors"
                                title="Klik untuk mengurutkan Klien"
                            >
                                <span className="flex items-center gap-1">
                                    Klien {renderSortIcon('klien')}
                                </span>
                            </th>
                            <th
                                onClick={() => handleSort('pesawat')}
                                className="px-4 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 group transition-colors"
                                title="Klik untuk mengurutkan Pesawat"
                            >
                                <span className="flex items-center gap-1">
                                    Pesawat {renderSortIcon('pesawat')}
                                </span>
                            </th>
                            <th
                                onClick={() => handleSort('stage')}
                                className="px-4 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 group transition-colors"
                                title="Klik untuk mengurutkan Stage"
                            >
                                <span className="flex items-center gap-1">
                                    Stage {renderSortIcon('stage')}
                                </span>
                            </th>
                            <th
                                onClick={() => handleSort('owner_marketing')}
                                className="px-4 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 group transition-colors"
                                title="Klik untuk mengurutkan Marketing"
                            >
                                <span className="flex items-center gap-1">
                                    Marketing {renderSortIcon('owner_marketing')}
                                </span>
                            </th>
                            <th
                                onClick={() => handleSort('created_at')}
                                className="px-4 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 group transition-colors"
                                title="Klik untuk mengurutkan Tanggal Input (Dibuat)"
                            >
                                <span className="flex items-center gap-1">
                                    Tgl Input {renderSortIcon('created_at')}
                                </span>
                            </th>
                            {isSuperadmin && <th className="px-4 py-3 font-semibold text-gray-700 text-right">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {sortedJobs.map(job => {
                            const stageInfo = STAGES.find(s => s.id === job.stage);
                            return (
                                <tr
                                    key={job.id}
                                    onClick={() => setSelectedJob(job)}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-xs text-[#0A385C]">{(!isINS && job.no_po) ? job.no_po : job.kode}</div>
                                        {(!isINS || !job.no_po) && <div className="font-mono text-[10px] text-gray-400" title="ID Sistem Otomatis">{job.kode}</div>}
                                    </td>
                                    <td className="px-4 py-3 font-bold">{job.klien}</td>
                                    <td className="px-4 py-3 text-gray-600">{job.pesawat} ({job.units} unit)</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-100 border text-xs font-medium">
                                            <span className="text-[10px] text-gray-500">{stageInfo?.displayId || job.stage}</span>
                                            {stageInfo?.name}
                                        </span>
                                        <span className="ml-2">{getSlaBadge(job)}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{job.owner_marketing}</td>
                                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                                        {fmtDate(job.created_at)}
                                    </td>
                                    {isSuperadmin && (
                                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => handleDeleteSingleJob(job, e)}
                                                className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded text-xs font-bold transition-colors inline-flex items-center gap-1"
                                                title="Hapus Job Ini (Superadmin)"
                                            >
                                                <Trash2 size={14} /> Hapus
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                        {sortedJobs.length === 0 && (
                            <tr>
                                <td colSpan={isSuperadmin ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                                    Tidak ada data job ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedJob && (
                <JobDetailSheet
                    job={jobs.find(j => j.id === selectedJob.id) || selectedJob}
                    onClose={() => setSelectedJob(null)}
                    auth={auth}
                />
            )}
        </AppLayout>
    );
}
