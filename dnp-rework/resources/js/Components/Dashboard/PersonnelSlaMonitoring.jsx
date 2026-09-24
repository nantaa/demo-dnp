import React, { useState, useMemo } from 'react';
import { calculatePersonnelScorecards, getStageSlaStatus } from '@/Utils/performanceSla';
import { STAGES, getStageDisplayId } from '@/Constants';
import { Award, AlertOctagon, Clock, RotateCcw, CheckCircle2, AlertTriangle, Users, Filter, ChevronRight } from 'lucide-react';

export default function PersonnelSlaMonitoring({ jobs = [], onSelectJob }) {
    const [selectedRole, setSelectedRole] = useState('all');
    const [showOnlyOverdue, setShowOnlyOverdue] = useState(false);

    // Compute scorecards using SLA calculation engine
    const scorecards = useMemo(() => {
        return calculatePersonnelScorecards(jobs);
    }, [jobs]);

    // Active overdue jobs list for bottleneck diagnosis
    const activeOverdues = useMemo(() => {
        const list = [];
        (jobs || []).forEach(j => {
            if (j.stage === 12 || j.stage === 16) return;
            const slaStatus = getStageSlaStatus(j);
            if (slaStatus.isOverdue) {
                list.push({
                    job: j,
                    slaStatus,
                });
            }
        });
        return list.sort((a, b) => b.slaStatus.elapsedWorkingDays - a.slaStatus.elapsedWorkingDays);
    }, [jobs]);

    // Global summary metrics
    const summary = useMemo(() => {
        const totalPeople = scorecards.length;
        if (totalPeople === 0) {
            return { avgOnTimeRate: 100, totalOverdues: 0, avgTat: 0, totalReworks: 0 };
        }
        const avgOnTime = Math.round(
            scorecards.reduce((sum, s) => sum + s.onTimeRate, 0) / totalPeople
        );
        const totalOverdues = scorecards.reduce((sum, s) => sum + s.overdueCount, 0);
        const avgTat = (
            scorecards.reduce((sum, s) => sum + s.avgTurnaroundDays, 0) / totalPeople
        ).toFixed(1);
        const totalReworks = scorecards.reduce((sum, s) => sum + s.reworkCount, 0);

        return {
            avgOnTimeRate: avgOnTime,
            totalOverdues,
            avgTat,
            totalReworks,
        };
    }, [scorecards]);

    // Filtered scorecards based on role tabs & overdue toggle
    const filteredScorecards = useMemo(() => {
        return scorecards.filter(s => {
            if (selectedRole !== 'all' && s.role !== selectedRole) return false;
            if (showOnlyOverdue && s.overdueCount === 0) return false;
            return true;
        });
    }, [scorecards, selectedRole, showOnlyOverdue]);

    const roleOptions = [
        { id: 'all', label: 'Semua Peran' },
        { id: 'marketing', label: 'Marketing' },
        { id: 'admin', label: 'Admin' },
        { id: 'inspektur', label: 'Inspektur & Drafting' },
        { id: 'tim_ahli', label: 'Tim Ahli / MGR' },
        { id: 'finance', label: 'Finance' },
    ];

    const getRoleBadge = (role) => {
        switch (role) {
            case 'marketing':
                return { label: 'Marketing', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
            case 'admin':
                return { label: 'Admin', color: 'bg-blue-100 text-blue-800 border-blue-200' };
            case 'inspektur':
                return { label: 'Inspektur', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
            case 'tim_ahli':
                return { label: 'Tim Ahli / MGR', color: 'bg-purple-100 text-purple-800 border-purple-200' };
            case 'finance':
                return { label: 'Finance', color: 'bg-amber-100 text-amber-800 border-amber-200' };
            default:
                return { label: role, color: 'bg-gray-100 text-gray-800 border-gray-200' };
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden mt-6">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-[#0A385C] text-[#00A8E8] rounded-lg">
                                <Award size={18} />
                            </span>
                            <div className="text-xs text-[#0A385C] font-extrabold uppercase tracking-wider">
                                Monitoring Kinerja Personel & SLA
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mt-1">
                            Personnel SLA Scorecard & Bottleneck Engine
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                            Mengukur ketepatan waktu dalam <strong>hari kerja internal</strong> (Senin–Jumat). Tahapan eksternal (Stage 8 Disnaker & Stage 11 TOP Pembayaran Klien) dikecualikan secara objektif dari penalti keterlambatan.
                        </p>
                    </div>

                    {/* Quick Filter */}
                    <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                            {roleOptions.map(r => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => setSelectedRole(r.id)}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${
                                        selectedRole === r.id
                                            ? 'bg-white text-[#0A385C] shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowOnlyOverdue(!showOnlyOverdue)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                                showOnlyOverdue
                                    ? 'bg-red-50 text-red-700 border-red-300'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            <AlertOctagon size={14} className={showOnlyOverdue ? 'text-red-600' : 'text-slate-400'} />
                            <span>Hanya yang Overdue</span>
                        </button>
                    </div>
                </div>

                {/* Top Metrics Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                            <span>On-Time SLA Global</span>
                            <CheckCircle2 size={16} className="text-emerald-500" />
                        </div>
                        <div className={`text-2xl font-black mt-1 ${
                            summary.avgOnTimeRate >= 85 ? 'text-emerald-600' : summary.avgOnTimeRate >= 70 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                            {summary.avgOnTimeRate}%
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Rata-rata kepatuhan SLA tim</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                            <span>Active Overdue</span>
                            <AlertOctagon size={16} className={summary.totalOverdues > 0 ? 'text-red-500' : 'text-slate-400'} />
                        </div>
                        <div className={`text-2xl font-black mt-1 ${summary.totalOverdues > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                            {summary.totalOverdues} <span className="text-xs font-bold text-slate-400">tugas</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Lewat batas hari kerja internal</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                            <span>Rata-Rata Turnaround</span>
                            <Clock size={16} className="text-blue-500" />
                        </div>
                        <div className="text-2xl font-black text-slate-900 mt-1">
                            {summary.avgTat} <span className="text-xs font-bold text-slate-400">hari kerja</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Kecepatan penyelesaian per stage</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                            <span>Rework / Return</span>
                            <RotateCcw size={16} className={summary.totalReworks > 0 ? 'text-amber-500' : 'text-slate-400'} />
                        </div>
                        <div className="text-2xl font-black text-slate-900 mt-1">
                            {summary.totalReworks} <span className="text-xs font-bold text-slate-400">revisi</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Pengembalian stage dari review</div>
                    </div>
                </div>
            </div>

            {/* Scorecards Grid */}
            <div className="p-6">
                {filteredScorecards.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                        <Users size={32} className="mx-auto text-slate-300 mb-2" />
                        Tidak ada personel yang cocok dengan kriteria filter saat ini.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredScorecards.map((person) => {
                            const badge = getRoleBadge(person.role);
                            const hasOverdue = person.overdueCount > 0;
                            const hasRework = person.reworkCount > 0;

                            return (
                                <div
                                    key={person.personId}
                                    className={`p-4 rounded-xl border transition-all ${
                                        hasOverdue
                                            ? 'border-red-200 bg-red-50/20 hover:border-red-300'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                    } shadow-2xs flex flex-col justify-between`}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="font-extrabold text-slate-900 text-sm">{person.personName}</h4>
                                                <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${badge.color}`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-xl font-black ${
                                                    person.onTimeRate >= 85 ? 'text-emerald-600' : person.onTimeRate >= 70 ? 'text-amber-600' : 'text-red-600'
                                                }`}>
                                                    {person.onTimeRate}%
                                                </div>
                                                <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                                                    On-Time
                                                </div>
                                            </div>
                                        </div>

                                        {/* Performance Bar */}
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3 border border-slate-100">
                                            <div
                                                style={{ width: `${Math.min(100, person.onTimeRate)}%` }}
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    person.onTimeRate >= 85 ? 'bg-emerald-500' : person.onTimeRate >= 70 ? 'bg-amber-500' : 'bg-red-500'
                                                }`}
                                            />
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                <span className="text-[10px] text-slate-400 block font-bold">Tugas Aktif</span>
                                                <span className="font-extrabold text-slate-800">{person.activeTasksCount} job</span>
                                            </div>
                                            <div className={`p-2 rounded-lg border ${
                                                hasOverdue ? 'bg-red-100/50 border-red-200 text-red-900' : 'bg-slate-50 border-slate-100 text-slate-800'
                                            }`}>
                                                <span className="text-[10px] text-slate-400 block font-bold">Overdue SLA</span>
                                                <span className={`font-black ${hasOverdue ? 'text-red-600' : 'text-slate-800'}`}>
                                                    {person.overdueCount} tugas
                                                </span>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                <span className="text-[10px] text-slate-400 block font-bold">Avg. Turnaround</span>
                                                <span className="font-extrabold text-slate-800">{person.avgTurnaroundDays} hari kerja</span>
                                            </div>
                                            <div className={`p-2 rounded-lg border ${
                                                hasRework ? 'bg-amber-100/50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-100 text-slate-800'
                                            }`}>
                                                <span className="text-[10px] text-slate-400 block font-bold">Rework/Kembali</span>
                                                <span className={`font-extrabold ${hasRework ? 'text-amber-700' : 'text-slate-800'}`}>
                                                    {person.reworkCount} kali
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action indicator */}
                                    {hasOverdue && (
                                        <div className="mt-3 text-[10px] font-bold text-red-700 bg-red-100/60 border border-red-200 rounded px-2 py-1 flex items-center justify-between">
                                            <span>Perlu koordinasi & eskalasi</span>
                                            <AlertTriangle size={12} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Active Overdue Bottleneck Drawer */}
            {activeOverdues.length > 0 && (
                <div className="border-t border-slate-200 bg-slate-50/70 p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <AlertOctagon size={18} className="text-red-600" />
                            <h4 className="text-sm font-extrabold text-slate-900">
                                Antrean Pekerjaan Melewati Batas SLA ({activeOverdues.length} Job)
                            </h4>
                        </div>
                        <span className="text-[11px] text-slate-500 font-semibold">Klik baris untuk membuka sheet pekerjaan</span>
                    </div>

                    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                    <th className="p-3">Job / PO</th>
                                    <th className="p-3">Klien</th>
                                    <th className="p-3">Stage Aktif</th>
                                    <th className="p-3 text-center">Hari Kerja</th>
                                    <th className="p-3 text-center">Batas SLA</th>
                                    <th className="p-3 text-right">Status Keterlambatan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activeOverdues.map(({ job, slaStatus }) => {
                                    const stage = STAGES.find(s => s.id === job.stage);
                                    return (
                                        <tr
                                            key={job.id}
                                            onClick={() => onSelectJob && onSelectJob(job)}
                                            className="hover:bg-red-50/40 cursor-pointer transition-colors"
                                        >
                                            <td className="p-3 font-mono font-bold text-slate-900">
                                                {job.no_po || job.kode}
                                            </td>
                                            <td className="p-3 font-semibold text-slate-800">
                                                {job.klien}
                                            </td>
                                            <td className="p-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                                    S{getStageDisplayId(job.stage)}: {stage?.name || 'Stage ' + job.stage}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center font-bold text-slate-700">
                                                {slaStatus.elapsedWorkingDays} hari
                                            </td>
                                            <td className="p-3 text-center font-semibold text-slate-500">
                                                {slaStatus.slaTarget} hari kerja
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded text-[11px] border border-red-200">
                                                    +{slaStatus.daysOverdue} hari lewat
                                                    <ChevronRight size={12} />
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
