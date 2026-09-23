import React from 'react';
import IndonesiaLocationSelect from '@/Components/IndonesiaLocationSelect';
import { fmtCurrency } from '../constants';

export default function EditInfoTab({
    job,
    permissions,
    isEditing,
    setIsEditing,
    editForm,
    handleUpdateJob,
}) {
    const { canManage, canSeeNilai } = permissions;

    return (
        <div className="space-y-4">
            {isEditing ? (
                <form onSubmit={handleUpdateJob} className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-700">Klien</label>
                            <input
                                type="text"
                                value={editForm.data.klien}
                                onChange={e => editForm.setData('klien', e.target.value)}
                                className="w-full text-sm border rounded px-2 py-1.5"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-700">Jenis Alat</label>
                            <input
                                type="text"
                                value={editForm.data.pesawat}
                                onChange={e => editForm.setData('pesawat', e.target.value)}
                                className="w-full text-sm border rounded px-2 py-1.5"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-700">PIC Klien</label>
                            <input
                                type="text"
                                value={editForm.data.pic_klien}
                                onChange={e => editForm.setData('pic_klien', e.target.value)}
                                placeholder="Nama PIC"
                                className="w-full text-sm border rounded px-2 py-1.5"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-700">No. Telepon PIC</label>
                            <input
                                type="text"
                                value={editForm.data.pic_klien_phone}
                                onChange={e => editForm.setData('pic_klien_phone', e.target.value)}
                                placeholder="08xxxxxxxxxx"
                                className="w-full text-sm border rounded px-2 py-1.5"
                            />
                        </div>
                        <div className="col-span-2">
                            <IndonesiaLocationSelect
                                value={editForm.data.lokasi}
                                onChange={val => editForm.setData('lokasi', val)}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-700">Jumlah Unit</label>
                            <input
                                type="number"
                                min="1"
                                value={editForm.data.units}
                                onChange={e => editForm.setData('units', e.target.value)}
                                className="w-full text-sm border rounded px-2 py-1.5"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-700">No. PO / SPK</label>
                            <input
                                type="text"
                                value={editForm.data.no_po}
                                onChange={e => editForm.setData('no_po', e.target.value)}
                                placeholder="PO/2026/..."
                                className="w-full text-sm border rounded px-2 py-1.5"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-700">Tanggal PO</label>
                            <input
                                type="date"
                                value={editForm.data.tgl_po}
                                onChange={e => editForm.setData('tgl_po', e.target.value)}
                                className="w-full text-sm border rounded px-2 py-1.5"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-700">Termin Pembayaran</label>
                            <select
                                value={editForm.data.termin_pembayaran}
                                onChange={e => editForm.setData('termin_pembayaran', e.target.value)}
                                className="w-full text-sm border rounded px-2 py-1.5 font-medium"
                            >
                                <option value="FULL">FULL (Pelunasan 100%)</option>
                                <option value="DP">DP (Termin / Uang Muka)</option>
                            </select>
                        </div>
                        {canSeeNilai && (
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-xs font-bold text-gray-700">Nilai Kontrak (DPP Input)</label>
                                <input
                                    type="number"
                                    value={editForm.data.nilai}
                                    onChange={e => editForm.setData('nilai', e.target.value)}
                                    className="w-full text-sm border rounded px-2 py-1.5"
                                />
                                {parseFloat(editForm.data.nilai) > 0 && (
                                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                                        Ditampilkan (× 112%): <strong>{fmtCurrency(Math.round(parseFloat(editForm.data.nilai) * 1.12))}</strong>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-3 py-1.5 text-sm bg-gray-200 rounded"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={editForm.processing}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
                        >
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            ) : (
                <div className="bg-white p-4 rounded-lg border space-y-3">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-800 border-b w-full pb-2 mb-2">Informasi Pekerjaan</h4>
                        {canManage && (() => {
                            const isSameMonth = () => {
                                if (!job.created_at) return false;
                                const d = new Date(job.created_at);
                                const now = new Date();
                                return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
                            };
                            return isSameMonth() ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-xs font-medium text-blue-600 border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 ml-2 shrink-0"
                                >
                                    Edit
                                </button>
                            ) : (
                                <span
                                    className="text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded cursor-not-allowed ml-2 shrink-0"
                                    title="Revisi PO terkunci karena sudah melewati bulan pembuatan job (Tutup Buku Bulanan)"
                                >
                                    🔒 Edit Terkunci (Beda Bulan)
                                </span>
                            );
                        })()}
                    </div>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                        <div><p className="text-xs text-gray-500">Kode Job</p><p className="font-semibold">{job.kode}</p></div>
                        <div><p className="text-xs text-gray-500">Marketing</p><p className="font-medium">{job.owner_marketing}</p></div>
                        <div className="col-span-2"><p className="text-xs text-gray-500">Klien</p><p className="font-semibold text-base">{job.klien}</p></div>
                        <div className="col-span-2"><p className="text-xs text-gray-500">PIC Klien</p><p className="font-medium">{job.pic_klien || '—'} {job.pic_klien_phone ? `(${job.pic_klien_phone})` : ''}</p></div>
                        <div><p className="text-xs text-gray-500">No. PO / SPK</p><p className="font-mono font-medium text-gray-900">{job.no_po || '—'}</p></div>
                        <div><p className="text-xs text-gray-500">Tanggal PO</p><p className="font-medium">{job.tgl_po || '—'}</p></div>
                        <div><p className="text-xs text-gray-500">Termin Pembayaran</p><p className="font-semibold">{job.termin_pembayaran === 'DP' ? 'DP (Termin / Uang Muka)' : 'FULL (Pelunasan 100%)'}</p></div>
                        <div><p className="text-xs text-gray-500">Jenis Alat</p><p className="font-medium">{job.pesawat}</p></div>
                        <div><p className="text-xs text-gray-500">Jumlah Unit</p><p className="font-bold">{job.units} Unit</p></div>
                        <div className="col-span-2"><p className="text-xs text-gray-500">Lokasi</p><p>{job.lokasi}</p></div>
                        {canSeeNilai && (
                            <div className="col-span-2 bg-yellow-50 p-2.5 rounded-lg border border-yellow-200">
                                <p className="text-xs text-yellow-800 font-bold flex items-center justify-between">
                                    <span>Nilai Kontrak (Termasuk PPN 112%)</span>
                                    <span className="font-normal text-[11px] opacity-75">DPP: {fmtCurrency(job.nilai)}</span>
                                </p>
                                <p className="font-black text-xl text-yellow-950 mt-0.5">
                                    {fmtCurrency(Math.round((job.nilai || 0) * 1.12))}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
