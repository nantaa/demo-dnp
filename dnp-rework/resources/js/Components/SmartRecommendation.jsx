import React, { useState, useEffect } from 'react';
import { ShieldAlert, Award, Calendar, CheckSquare, XSquare } from 'lucide-react';

export default function SmartRecommendation({ job, onSelectInspector }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ recommended: [], eliminated: [] });

    useEffect(() => {
        // Fetch recommendations from API
        fetch(`/api/jobs/${job.id}/recommendations`)
            .then(res => res.json())
            .then(json => {
                setData(json);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch recommendations", err);
                setLoading(false);
            });
    }, [job.id]);

    if (loading) {
        return <div className="p-4 text-center text-sm text-gray-500">Menganalisis Inspektur terbaik...</div>;
    }

    return (
        <div className="bg-[#F2EFE8] p-4 rounded-lg border border-[#E8E4DA] text-sm text-gray-800 font-sans">
            <div className="bg-white p-4 mb-4 border border-gray-200 shadow-sm">
                <h3 className="font-bold text-lg mb-1">Smart Recommendation — Inspector Matching Algorithm</h3>
                <p className="text-xs text-gray-500 mb-3">Algoritma transparan 100 poin yang membantu Admin RU pilih inspektur tepat</p>
                <div className="text-sm">
                    <strong>Target Job: {job.kode} · {job.klien}</strong>
                    <div className="text-gray-600 mt-1">Pesawat: {job.pesawat} ({job.units} unit) · Lokasi: {job.lokasi}</div>
                </div>
            </div>

            <div className="bg-teal-700 text-white p-2.5 flex justify-between items-center mb-3 text-xs font-medium">
                <div className="flex items-center gap-2">
                    <CheckSquare size={16} /> REKOMENDASI SISTEM — Saran Inspektur Berdasarkan Skor
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
                                <div className="font-bold text-base">{rec.user.name}</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">{(rec.profile.spesialisasi || []).join(', ')}</div>
                                <div className="text-[10px] text-gray-500 flex gap-1 mt-0.5">
                                    <span className="border px-1">Domisili {rec.profile.domisili}</span>
                                    <span className="border px-1">Senior Lvl {rec.profile.senior_level}</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className={`text-3xl font-bold ${idx === 0 ? 'text-green-600' : idx === 1 ? 'text-amber-500' : 'text-teal-600'}`}>
                                    {rec.score}
                                </div>
                                <div className="text-[10px] uppercase tracking-wider text-gray-400">Skor</div>
                            </div>
                        </div>

                        <div className="space-y-1.5 text-[10px] mb-4">
                            {Object.entries(rec.details).map(([key, val]) => (
                                <div key={key} className="flex justify-between items-center">
                                    <div className="text-gray-600 w-24">{key}</div>
                                    <div className="flex-1 mx-2 h-1.5 bg-gray-100 rounded overflow-hidden">
                                        <div className={`h-full ${idx === 0 ? 'bg-green-600' : idx === 1 ? 'bg-amber-500' : 'bg-teal-600'}`} style={{width: `${(parseInt(val) / parseInt(val.split('/')[1])) * 100}%`}}></div>
                                    </div>
                                    <div className="font-bold w-10 text-right">{val}</div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-green-50 p-2 text-[10px] rounded mb-3">
                            <div className="text-gray-600">Klien: {rec.klien_exp}x · Pesawat: {rec.pesawat_exp}x</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {rec.bonuses.map((b, i) => (
                                    <span key={i} className={`px-1 py-0.5 rounded text-[9px] font-bold ${b.startsWith('-') ? 'bg-red-100 text-red-700' : 'bg-green-200 text-green-800'}`}>
                                        {b}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={() => onSelectInspector(rec.user)}
                            className="w-full py-1.5 border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 flex justify-center items-center gap-1"
                        >
                            <CheckSquare size={14} /> Pilih {idx === 0 ? 'Terbaik' : `Top ${idx + 1}`}
                        </button>
                    </div>
                ))}
            </div>

            {data.eliminated.length > 0 && (
                <>
                    <div className="bg-white border border-gray-200 p-4 mb-4">
                        <div className="flex items-center gap-2 font-bold text-gray-700 mb-1 text-sm">
                            <XSquare size={16} /> INSPEKTUR YANG DIELIMINASI (Hard Filter)
                        </div>
                        <div className="text-xs text-gray-500 mb-3">Transparan: Admin RU dapat lihat KENAPA inspektur tertentu tidak masuk rekomendasi</div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {data.eliminated.map((el, i) => (
                                <div key={i} className="bg-red-50 p-3 border border-red-100 rounded">
                                    <div className="font-bold text-sm text-gray-800">{el.user.name}</div>
                                    <div className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
                                        <XSquare size={12} /> {el.reason}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <div className="border border-teal-600 p-4 bg-white text-xs text-gray-600">
                <div className="font-bold text-teal-800 mb-1">FORMULA SKOR (Max 100 poin)</div>
                <div className="font-bold mb-1">Score = Spesialisasi (30) + Workload (25) + Pengalaman Klien (15) + Pengalaman Pesawat (15) + Availability (15)</div>
                <div className="mb-1">Bonuses: +5 SKP ≥1 thn · +5 Domisili match · +10 Senior untuk pesawat critical (BOILER, PV) · -10 Overload (≥4 job) · -5 Junior untuk critical</div>
                <div>Hard Filter: Inactive / SKP expired / Spesialisasi tidak match / Bentrok jadwal → skor -1, masuk eliminasi</div>
            </div>
        </div>
    );
}
