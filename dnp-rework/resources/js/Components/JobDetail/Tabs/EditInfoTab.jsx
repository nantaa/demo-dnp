import React from 'react';
import IndonesiaLocationSelect from '../Common/IndonesiaLocationSelectWrapper';
import { formatDate } from '../helpers';

export default function EditInfoTab({
    job,
    isEditing,
    setIsEditing,
    editForm,
    handleUpdateJob,
    canManage,
    canSeeNilai,
    showTgl15Warning,
    isINS
}) {
    return (
        <div className="space-y-4">
            {isEditing ? (
                <form onSubmit={handleUpdateJob} className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">No. PO / SPK / Proposal *</label>
                            <input
                                type="text"
                                value={editForm.data.no_po}
                                onChange={e => editForm.setData('no_po', e.target.value)}
                                className="w-full text-sm border rounded px-2 py-1.5"
                                placeholder="PO/SPK/PROPOSAL/2026/0123"
                                required
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal PO / SPK / Proposal</label>
                            <input
                                type="date"
                                value={editForm.data.tgl_po || ''}
                                onChange={e => editForm.setData('tgl_po', e.target.value)}
                                className="w-full text-sm border rounded px-2 py-1.5"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Klien</label>
                            <input type="text" value={editForm.data.klien} onChange={e => editForm.setData('klien', e.target.value)} className="w-full text-sm border rounded px-2 py-1.5" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Alat</label>
                            <input type="text" value={editForm.data.pesawat} onChange={e => editForm.setData('pesawat', e.target.value)} className="w-full text-sm border rounded px-2 py-1.5" />
                        </div>
                        <div className="col-span-2">
                            <IndonesiaLocationSelect
                                value={editForm.data.lokasi}
                                onChange={val => editForm.setData('lokasi', val)}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Jumlah Unit</label>
                            <input type="number" min="1" value={editForm.data.units} onChange={e => editForm.setData('units', e.target.value)} className="w-full text-sm border rounded px-2 py-1.5" />
                        </div>
                        {canSeeNilai && (
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Nilai Kontrak (Total Sesudah PPN 12%)</label>
                                {showTgl15Warning && (
                                    <p className="text-[11px] text-red-600 mb-1 font-medium">
                                        Perhatian: Sudah lewat tanggal 15 bulan ini (Closing Pajak). Perubahan data keuangan berisiko terhadap pelaporan pajak.
                                    </p>
                                )}
                                <input type="number" value={editForm.data.nilai} onChange={e => editForm.setData('nilai', e.target.value)} className="w-full text-sm border rounded px-2 py-1.5" />
                                {editForm.data.nilai && parseFloat(editForm.data.nilai) > 0 && (() => {
                                    const total = parseFloat(editForm.data.nilai);
                                    const dpp = Math.round(total / 1.12);
                                    const ppn = total - dpp;
                                    return (
                                        <div className="mt-1.5 p-2 bg-amber-50/80 border border-amber-200 rounded text-[11px] space-y-0.5">
                                            <div className="flex justify-between text-gray-600">
                                                <span>DPP:</span>
                                                <span className="font-semibold text-gray-800">Rp {Number(dpp).toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="flex justify-between text-amber-800">
                                                <span>PPN (12%):</span>
                                                <span className="font-semibold">Rp {Number(ppn).toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="flex justify-between text-amber-950 font-bold border-t border-amber-200/60 pt-0.5">
                                                <span>Total:</span>
                                                <span>Rp {Number(total).toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm bg-gray-200 rounded">Batal</button>
                        <button type="submit" disabled={editForm.processing} className="px-3 py-1.5 text-sm bg-blue-600 text-white font-bold rounded hover:bg-blue-700">
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            ) : (
                <div className="bg-white p-4 rounded-lg border space-y-3">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-800 border-b w-full pb-2 mb-2">Informasi Pekerjaan</h4>
                        {canManage && (
                            <button type="button" onClick={() => setIsEditing(true)} className="text-xs font-medium text-blue-600 border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 ml-2">
                                Edit
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="text-gray-500">{isINS ? 'Kode Pekerjaan:' : 'No. PO/SPK:'}</div>
                        <div className="font-medium text-gray-800">{isINS ? (job.kode || '[Terkunci]') : (job.no_po || '-')}</div>

                        <div className="text-gray-500">Tanggal PO:</div>
                        <div className="font-medium text-gray-800">{formatDate(job.tgl_po)}</div>

                        <div className="text-gray-500">Klien:</div>
                        <div className="font-medium text-gray-800">{job.client_nama || job.klien || '-'}</div>

                        <div className="text-gray-500">Alat (Pesawat):</div>
                        <div className="font-medium text-gray-800">{job.pesawat || '-'}</div>

                        <div className="text-gray-500">Lokasi:</div>
                        <div className="font-medium text-gray-800">{job.lokasi || '-'}</div>

                        <div className="text-gray-500">Jumlah Unit:</div>
                        <div className="font-medium text-gray-800">{job.units || '-'}</div>

                        {canSeeNilai && (
                            <>
                                <div className="text-gray-500">Nilai Kontrak:</div>
                                <div className="font-bold text-gray-900">
                                    Rp {Number(job.nilai || 0).toLocaleString('id-ID')}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
