import React, { useState, useEffect } from 'react';
import { CheckSquare } from 'lucide-react';
import { INS_SUBROLES } from '@/Constants';

export default function SmartRecommendation({ job, onSelectInspector, selectedInspectorIds = [] }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ recommended: [], eliminated: [] });

    useEffect(() => {
        fetch(`/api/jobs/${job.id}/recommendations`)
            .then(res => res.json())
            .then(json => { setData(json); setLoading(false); })
            .catch(err => { console.error('Failed to fetch recommendations', err); setLoading(false); });
    }, [job.id]);

    if (loading) {
        return <div className="p-4 text-center text-sm text-gray-500 animate-pulse">Menganalisis Inspektur terbaik…</div>;
    }

    // Merge recommended + eliminated into one flat list for the selector grid
    // Eliminated inspectors are shown with neutral styling (no red badge)
    const allInspectors = [
        ...data.recommended.map(r => ({ ...r, isEliminated: false })),
        ...data.eliminated.map(e => ({ user: e.user, profile: e.profile || {}, score: null, details: {}, bonuses: [], klien_exp: 0, pesawat_exp: 0, isEliminated: true, eliminatedReason: e.reason })),
    ];

    const SubroleBadge = ({ profile }) => {
        if (!profile?.subrole) return null;
        const label = INS_SUBROLES[profile.subrole] || profile.subrole;
        const cls = profile.subrole === 'tenaga_ahli'
            ? 'bg-indigo-100 text-indigo-700'
            : 'bg-sky-100 text-sky-700';
        return (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${cls}`}>{label}</span>
        );
    };

    return (
        <div className="bg-[#F2EFE8] p-4 rounded-lg border border-[#E8E4DA] text-sm text-gray-800 font-sans">
            {/* Header */}
            <div className="bg-white p-4 mb-4 border border-gray-200 shadow-sm">
                <h3 className="font-bold text-lg mb-1">Smart Recommendation — Inspector Matching Algorithm</h3>
                <p className="text-xs text-gray-500 mb-3">Algoritma transparan 100 poin yang membantu Admin RU pilih inspektur tepat</p>
                <div className="text-sm">
                    <strong>Target Job: {job.kode} · {job.klien}</strong>
                    <div className="text-gray-600 mt-1">Pesawat: {job.pesawat} ({job.units} unit) · Lokasi: {job.lokasi}</div>
                </div>
            </div>

            {/* Top 3 scorecards (recommended only) */}
            {data.recommended.length > 0 && (
                <>
                    <div className="bg-teal-700 text-white p-2.5 flex justify-between items-center mb-3 text-xs font-medium">
                        <div className="flex items-center gap-2">
                            <CheckSquare size={16} /> REKOMENDASI SISTEM — Top {Math.min(3, data.recommended.length)} Terbaik
                        </div>
                        <div className="opacity-80">Bobot: Spesialisasi · Workload · Pengalaman · Availability · Bonus</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {data.recommended.slice(0, 3).map((rec, idx) => (
                            <div key={rec.user.id} className={`bg-white border-2 p-4 relative ${idx === 0 ? 'border-green-600 shadow-md' : idx === 1 ? 'border-amber-500' : 'border-teal-600'}`}>
                                <div className={`absolute -top-3 left-4 px-2 py-0.5 text-[10px] font-bold text-white uppercase ${idx === 0 ? 'bg-green-600' : idx === 1 ? 'bg-amber-500' : 'bg-teal-600'}`}>
                                    Top {idx + 1}
                                </div>
                                <div className="flex justify-between items-start mb-3 mt-1">
                                    <div>
                                        <div className="font-bold text-base flex items-center gap-1.5">
                                            {rec.user.name}
                                            <SubroleBadge profile={rec.profile} />
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">{(rec.profile.spesialisasi || []).join(', ')}</div>
                                        <div className="text-[10px] text-gray-500 flex gap-1 mt-0.5">
                                            <span className="border px-1">Domisili {rec.profile.domisili}</span>
                                            <span className="border px-1">Senior Lvl {rec.profile.senior_level}</span>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-3xl font-bold ${idx === 0 ? 'text-green-600' : idx === 1 ? 'text-amber-500' : 'text-teal-600'}`}>{rec.score}</div>
                                        <div className="text-[10px] uppercase tracking-wider text-gray-400">Skor</div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 text-[10px] mb-4">
                                    {Object.entries(rec.details).map(([key, val]) => (
                                        <div key={key} className="flex justify-between items-center">
                                            <div className="text-gray-600 w-24">{key}</div>
                                            <div className="flex-1 mx-2 h-1.5 bg-gray-100 rounded overflow-hidden">
                                                <div className={`h-full ${idx === 0 ? 'bg-green-600' : idx === 1 ? 'bg-amber-500' : 'bg-teal-600'}`}
                                                    style={{ width: `${(parseInt(val) / parseInt((val+'').split('/')[1] || 30)) * 100}%` }}></div>
                                            </div>
                                            <div className="font-bold w-10 text-right">{val}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-green-50 p-2 text-[10px] rounded mb-3">
                                    <div className="text-gray-600">Klien: {rec.klien_exp}x · Pesawat: {rec.pesawat_exp}x</div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {rec.bonuses.map((b, i) => (
                                            <span key={i} className={`px-1 py-0.5 rounded text-[9px] font-bold ${b.startsWith('-') ? 'bg-red-100 text-red-700' : 'bg-green-200 text-green-800'}`}>{b}</span>
                                        ))}
                                    </div>
                                </div>

                                <button onClick={() => onSelectInspector(rec.user)}
                                    className={`w-full py-1.5 border text-xs font-bold flex justify-center items-center gap-1 ${
                                        selectedInspectorIds.includes(rec.user.id)
                                            ? 'bg-green-600 border-green-600 text-white hover:bg-green-700'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}>
                                    <CheckSquare size={14} /> {selectedInspectorIds.includes(rec.user.id) ? 'Terpilih ✓' : `Pilih Top ${idx + 1}`}
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* All Inspectors Grid (recommended + eliminated, no red badge for eliminated) */}
            <div className="border border-gray-200 bg-white p-4 mb-4">
                <div className="font-bold text-gray-700 text-sm mb-3">Semua Inspektur ({allInspectors.length} orang)</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {allInspectors.map(ins => {
                        const isSelected = selectedInspectorIds.includes(ins.user.id);
                        return (
                            <button key={ins.user.id}
                                onClick={() => onSelectInspector(ins.user)}
                                className={`text-left p-2.5 border rounded-lg text-xs transition-all ${
                                    isSelected
                                        ? 'bg-green-50 border-green-500 shadow-sm'
                                        : ins.isEliminated
                                            ? 'bg-gray-50 border-gray-200 text-gray-500'
                                            : 'bg-white border-gray-200 hover:border-teal-400 hover:bg-teal-50'
                                }`}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`font-bold truncate ${isSelected ? 'text-green-700' : ins.isEliminated ? 'text-gray-500' : 'text-gray-800'}`}>
                                        {ins.user.name}
                                    </span>
                                    {isSelected && <span className="text-green-600 text-[10px] font-black ml-1">✓</span>}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                    <SubroleBadge profile={ins.profile} />
                                    {ins.score != null && (
                                        <span className="text-[9px] bg-teal-100 text-teal-700 px-1.5 rounded font-bold">Skor: {ins.score}</span>
                                    )}
                                </div>
                                {ins.isEliminated && ins.eliminatedReason && (
                                    <div className="text-[9px] text-gray-400 mt-1 italic truncate" title={ins.eliminatedReason}>
                                        ℹ {ins.eliminatedReason}
                                    </div>
                                )}
                                {ins.profile?.domisili && (
                                    <div className="text-[9px] text-gray-400 mt-0.5">{ins.profile.domisili}</div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Formula reference */}
            <div className="border border-teal-600 p-4 bg-white text-xs text-gray-600">
                <div className="font-bold text-teal-800 mb-1">FORMULA SKOR (Max 100 poin)</div>
                <div className="font-bold mb-1">Score = Spesialisasi (30) + Workload (25) + Pengalaman Klien (15) + Pengalaman Pesawat (15) + Availability (15)</div>
                <div>Bonuses: +5 SKP ≥1 thn · +5 Domisili match · +10 Senior untuk critical · -10 Overload (≥4 job) · -5 Junior untuk critical</div>
                <div className="mt-1 text-gray-400 italic">Inspektur di luar top 3 tetap dapat dipilih manual dari grid di atas.</div>
            </div>
        </div>
    );
}
