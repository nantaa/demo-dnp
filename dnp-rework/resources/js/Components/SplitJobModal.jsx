import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { showError, showSuccess } from '@/swal';
import { Scissors, AlertCircle, CheckCircle2, ShieldCheck, X, FileText, ArrowRight } from 'lucide-react';

export default function SplitJobModal({ job, onClose, auth }) {
    if (!job) return null;

    const allUnits = job.unit_items || Array.from({ length: job.units || 1 }, (_, i) => ({
        id: `U-${i + 1}`,
        unit_code: `UNIT-${String(i + 1).padStart(2, '0')}`,
        laik_status: i < (job.inspected_count || job.units) ? 'LAIK' : 'PENDING',
        inspection_status: i < (job.inspected_count || job.units) ? 'LAIK' : 'NOT_INSPECTED',
        non_inspection_reason: i >= (job.inspected_count || job.units) ? 'CLIENT_UNIT_UNAVAILABLE' : null
    }));

    // Pre-select unresolved units for child job by default
    const defaultSelected = allUnits
        .filter(u => u.laik_status !== 'LAIK' || u.inspection_status === 'NOT_INSPECTED' || u.inspection_status === 'TEMUAN')
        .map(u => u.id);

    const [decision, setDecision] = useState('SPLIT_FOR_PARTIAL_PROCESSING');
    const [selectedUnitIds, setSelectedUnitIds] = useState(defaultSelected.length > 0 ? defaultSelected : (allUnits.length > 1 ? [allUnits[allUnits.length - 1].id] : []));
    const [commercialAllocationMode, setCommercialAllocationMode] = useState('PRO_RATA');
    const [childJobStage, setChildJobStage] = useState(16); // S4c Reschedule
    const [rescheduleReason, setRescheduleReason] = useState(job.reschedule_reason || 'Sebagian unit belum tersedia saat inspeksi lapangan');
    const [approvalReason, setApprovalReason] = useState('Klien meminta percepatan penerbitan SUKET untuk unit yang telah lolos uji laik');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleUnit = (uId) => {
        if (selectedUnitIds.includes(uId)) {
            setSelectedUnitIds(selectedUnitIds.filter(id => id !== uId));
        } else {
            setSelectedUnitIds([...selectedUnitIds, uId]);
        }
    };

    const parentUnitCount = allUnits.length - selectedUnitIds.length;
    const childUnitCount = selectedUnitIds.length;

    const handleSubmitSplit = (e) => {
        e.preventDefault();

        if (decision === 'WAIT_AND_RESCHEDULE') {
            // Move single job to Stage 4c (16)
            router.post(`/jobs/${job.id}/move`, {
                next_stage: 16,
                reschedule_reason: rescheduleReason,
                notes: `Penjadwalan ulang seluruh unit: ${rescheduleReason}`
            }, {
                onSuccess: () => {
                    showSuccess('Reschedule Berhasil', 'Job dijadwalkan ulang di Stage 4c.');
                    onClose();
                }
            });
            return;
        }

        if (selectedUnitIds.length === 0) {
            return showError('Pilih Unit', 'Pilih minimal 1 unit untuk dipindahkan ke Job Anak.');
        }

        if (selectedUnitIds.length >= allUnits.length) {
            return showError('Seleksi Tidak Valid', 'Tidak dapat memindahkan seluruh unit. Job Induk harus mempertahankan minimal 1 unit.');
        }

        if (!approvalReason.trim()) {
            return showError('Otorisasi Wajib', 'Alasan otorisasi pemecahan job wajib diisi.');
        }

        setIsSubmitting(true);
        router.post(`/api/jobs/${job.id}/splits`, {
            selectedUnitIds,
            splitReason: 'UNIT_UNAVAILABLE',
            clientRequestedPartialProcessing: true,
            commercialAllocationMode,
            childJobStage,
            rescheduleReason,
            approvalReason,
            approvedByUserId: auth?.user?.name || 'Manager',
            version: job.row_version || 1
        }, {
            onSuccess: () => {
                setIsSubmitting(false);
                showSuccess('Job Split Berhasil', `Job berhasil dipecah menjadi Induk (${parentUnitCount} Unit) & Anak (${childUnitCount} Unit).`);
                onClose();
            },
            onError: (err) => {
                setIsSubmitting(false);
                showError('Gagal Memecah Job', err?.error || err?.message || 'Terjadi kesalahan saat memecah job.');
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b bg-gradient-to-r from-[#0A385C] to-[#00A8E8] text-white flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/15 rounded-lg">
                            <Scissors size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black tracking-tight">Pemisahan Pekerjaan (Job Split Wizard)</h2>
                            <p className="text-xs text-cyan-100 opacity-90">{job.kode} • {job.klien} (Total {allUnits.length} Unit)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmitSplit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
                    
                    {/* Section 1: Ringkasan Lapangan & Diskrepansi */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                        <span className="font-extrabold text-slate-800 uppercase tracking-wider block">
                            1. Ringkasan Kondisi Lapangan & Unit:
                        </span>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-white p-2 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-400 font-bold block">TOTAL AWAL</span>
                                <span className="font-black text-slate-800 text-sm">{allUnits.length} Unit</span>
                            </div>
                            <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                                <span className="text-[10px] text-emerald-600 font-bold block">LOLOS LAIK</span>
                                <span className="font-black text-emerald-800 text-sm">
                                    {allUnits.filter(u => u.laik_status === 'LAIK').length} Unit
                                </span>
                            </div>
                            <div className="bg-amber-50 p-2 rounded-lg border border-amber-200">
                                <span className="text-[10px] text-amber-600 font-bold block">TERTUNDA / RUSAK</span>
                                <span className="font-black text-amber-800 text-sm">
                                    {allUnits.filter(u => u.laik_status !== 'LAIK').length} Unit
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Seleksi Keputusan */}
                    <div className="space-y-2">
                        <label className="font-extrabold text-slate-800 uppercase tracking-wider block">
                            2. Pilih Keputusan Tindak Lanjut:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className={`border-2 rounded-xl p-3 cursor-pointer transition-all flex flex-col justify-between ${
                                decision === 'SPLIT_FOR_PARTIAL_PROCESSING' 
                                    ? 'border-[#00A8E8] bg-sky-50/50 ring-2 ring-[#00A8E8]/20' 
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}>
                                <div className="flex items-start gap-2">
                                    <input 
                                        type="radio" 
                                        name="decision" 
                                        value="SPLIT_FOR_PARTIAL_PROCESSING" 
                                        checked={decision === 'SPLIT_FOR_PARTIAL_PROCESSING'}
                                        onChange={() => setDecision('SPLIT_FOR_PARTIAL_PROCESSING')}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <span className="font-bold text-slate-900 block">Pecah Job (Job Split)</span>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Unit lolos langsung maju ke Stage 5 (LHPP), unit tertunda dipindahkan ke Job Anak di Stage 4c.
                                        </p>
                                    </div>
                                </div>
                            </label>

                            <label className={`border-2 rounded-xl p-3 cursor-pointer transition-all flex flex-col justify-between ${
                                decision === 'WAIT_AND_RESCHEDULE' 
                                    ? 'border-[#00A8E8] bg-sky-50/50 ring-2 ring-[#00A8E8]/20' 
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}>
                                <div className="flex items-start gap-2">
                                    <input 
                                        type="radio" 
                                        name="decision" 
                                        value="WAIT_AND_RESCHEDULE" 
                                        checked={decision === 'WAIT_AND_RESCHEDULE'}
                                        onChange={() => setDecision('WAIT_AND_RESCHEDULE')}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <span className="font-bold text-slate-900 block">Tunggu & Jadwalkan Ulang Semua</span>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Tidak memecah job. Seluruh 100% unit masuk ke Stage 4c bersama-sama.
                                        </p>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {decision === 'SPLIT_FOR_PARTIAL_PROCESSING' && (
                        <>
                            {/* Section 3: Checklist Pemilihan Unit untuk Job Anak */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="font-extrabold text-slate-800 uppercase tracking-wider block">
                                        3. Pilih Unit yang Dipindahkan ke Job Anak ({selectedUnitIds.length} Unit Dipilih):
                                    </label>
                                    <span className="text-[11px] text-slate-500">
                                        Induk: {parentUnitCount} Unit | Anak: {childUnitCount} Unit
                                    </span>
                                </div>

                                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white">
                                    {allUnits.map((u, idx) => {
                                        const isChecked = selectedUnitIds.includes(u.id);
                                        const isLaik = u.laik_status === 'LAIK';
                                        return (
                                            <div 
                                                key={u.id}
                                                onClick={() => toggleUnit(u.id)}
                                                className={`p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${
                                                    isChecked ? 'bg-amber-50/60' : ''
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isChecked} 
                                                        onChange={() => {}} // Controlled by row click
                                                        className="rounded text-amber-600 focus:ring-amber-500"
                                                    />
                                                    <span className="font-mono font-bold text-slate-700">{u.unit_code || `Unit #${idx + 1}`}</span>
                                                    {u.serial_number && <span className="text-slate-400 font-mono">SN: {u.serial_number}</span>}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        isLaik 
                                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                                                    }`}>
                                                        {isLaik ? 'Laik' : (u.non_inspection_reason || 'Tertunda')}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                        isChecked ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {isChecked ? 'Pindah ke Anak' : 'Tetap di Induk'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Section 4 & 5: Konfigurasi Job Anak & Alokasi Komersial */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">
                                        4. Alasan Penjadwalan Ulang (Reschedule Reason) *
                                    </label>
                                    <input 
                                        type="text" 
                                        value={rescheduleReason} 
                                        onChange={e => setRescheduleReason(e.target.value)}
                                        className="w-full border rounded-lg px-2.5 py-1.5 text-xs"
                                        placeholder="Contoh: 20 unit belum siap di lokasi..."
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">
                                        5. Skema Alokasi Komersial (Billing Plan) *
                                    </label>
                                    <select 
                                        value={commercialAllocationMode}
                                        onChange={e => setCommercialAllocationMode(e.target.value)}
                                        className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                                    >
                                        <option value="PRO_RATA">Pro-Rata (Sesuai Jumlah Unit)</option>
                                        <option value="MANUAL_APPROVED">Manual Approved (Sesuai Persetujuan Finance)</option>
                                        <option value="BILL_PARENT_ONLY">Tagihan di Induk Saja (1 Invoice Gabungan)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Section 6: Otorisasi Kadiv / Manager */}
                            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2">
                                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                                    <ShieldCheck size={16} />
                                    <span>6. Otorisasi Kepala Divisi / Manager Teknis (Audit Log) *</span>
                                </div>
                                <textarea 
                                    rows={2}
                                    value={approvalReason}
                                    onChange={e => setApprovalReason(e.target.value)}
                                    className="w-full border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                                    placeholder="Tuliskan justifikasi persetujuan pemecahan pekerjaan ini..."
                                />
                            </div>

                            {/* Section 7: Live Confirmation Preview */}
                            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1.5">
                                <span className="font-extrabold text-slate-800 uppercase tracking-wider block">
                                    7. Pratinjau Pemecahan Job (Confirmation Preview):
                                </span>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                                        <span className="font-bold text-[#0A385C] block">JOB INDUK ({job.kode}):</span>
                                        <span className="text-slate-600 block">• Mempertahankan: <strong>{parentUnitCount} Unit</strong></span>
                                        <span className="text-emerald-700 font-bold block">• Lanjut ke: Stage 5 (Penyusunan LHPP)</span>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                                        <span className="font-bold text-amber-800 block">JOB ANAK BARU:</span>
                                        <span className="text-slate-600 block">• Menerima: <strong>{childUnitCount} Unit</strong></span>
                                        <span className="text-amber-700 font-bold block">• Mulai di: Stage 4c (Reschedule)</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm flex items-center gap-1.5"
                        >
                            {isSubmitting ? 'Memproses Split...' : (decision === 'WAIT_AND_RESCHEDULE' ? 'Jadwalkan Ulang (S4c) →' : 'Eksekusi Job Split (Atomik) →')}
                        </button>
                    </div>

                </form>

            </div>
        </div>
    );
}
