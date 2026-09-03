import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import IndonesiaLocationSelect from '@/Components/IndonesiaLocationSelect';
import { PESAWAT_TYPES } from '@/Constants';

export default function JobCreate({ auth }) {
    const isMkt = auth?.user?.role === 'marketing';

    const { data, setData, post, processing, errors } = useForm({
        klien: '',
        pesawat: [],
        lokasi: '',
        // Auto-fill from logged-in user name for marketing; editable for others
        owner_marketing: isMkt ? (auth.user.name || '') : '',
        pic_klien: '',
        pic_klien_phone: '',
        units: 1,
        nilai: 0,
        no_po: '',
        tgl_po: '',
    });

    const handleCheckboxChange = (type) => {
        if (data.pesawat.includes(type)) {
            setData('pesawat', data.pesawat.filter(item => item !== type));
        } else {
            setData('pesawat', [...data.pesawat, type]);
        }
    };

    const handleSelectAll = () => {
        if (data.pesawat.length === PESAWAT_TYPES.length) {
            setData('pesawat', []);
        } else {
            setData('pesawat', [...PESAWAT_TYPES]);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('jobs.store'));
    };

    return (
        <AppLayout>
            <Head title="Buat Job Baru (PO / SPK / PROPOSAL)" />

            <div className="max-w-2xl mx-auto sm:mt-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Buat Job Baru</h1>
                    <p className="text-gray-500 text-sm mt-1">Stage 1: Pendaftaran PO / SPK / Proposal Baru oleh Marketing.</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <form onSubmit={submit} className="space-y-4">

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nama Klien / Perusahaan</label>
                            <input
                                type="text"
                                value={data.klien}
                                onChange={e => setData('klien', e.target.value)}
                                className="w-full px-3 py-2 border rounded"
                                required
                            />
                            {errors.klien && <div className="text-red-500 text-xs mt-1">{errors.klien}</div>}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-bold text-gray-700">
                                    Jenis Alat yang di RiksaUji <span className="text-red-500">*</span>
                                    {data.pesawat.length > 0 && (
                                        <span className="ml-2 text-xs font-normal text-blue-600">({data.pesawat.length} dipilih)</span>
                                    )}
                                </label>
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                                >
                                    {data.pesawat.length === PESAWAT_TYPES.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-lg bg-gray-50 max-h-60 overflow-y-auto">
                                {PESAWAT_TYPES.map((type) => {
                                    const isChecked = data.pesawat.includes(type);
                                    return (
                                        <label
                                            key={type}
                                            className={`flex items-start space-x-2.5 p-2 rounded-md border text-sm cursor-pointer transition-colors ${
                                                isChecked ? 'bg-blue-50 border-blue-300 text-blue-900 font-medium' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleCheckboxChange(type)}
                                                className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="leading-tight">{type}</span>
                                        </label>
                                    );
                                })}
                            </div>
                            {errors.pesawat && <div className="text-red-500 text-xs mt-1">{errors.pesawat}</div>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Jumlah Unit</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.units}
                                    onChange={e => setData('units', e.target.value)}
                                    className="w-full px-3 py-2 border rounded"
                                    required
                                />
                                {errors.units && <div className="text-red-500 text-xs mt-1">{errors.units}</div>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nilai Kontrak (Rp) <span className="font-normal text-xs text-gray-500">(belum termasuk PPN)</span></label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.nilai}
                                    onChange={e => setData('nilai', e.target.value)}
                                    className="w-full px-3 py-2 border rounded"
                                    required
                                />
                                {errors.nilai && <div className="text-red-500 text-xs mt-1">{errors.nilai}</div>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">No PO / SPK / Proposal *</label>
                                <input
                                    type="text"
                                    value={data.no_po}
                                    onChange={e => setData('no_po', e.target.value)}
                                    className="w-full px-3 py-2 border rounded placeholder-gray-400"
                                    placeholder="PO/SPK/PROPOSAL/2026/0123"
                                    required
                                />
                                {errors.no_po && <div className="text-red-500 text-xs mt-1">{errors.no_po}</div>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tanggal PO / SPK / Proposal</label>
                                <input
                                    type="date"
                                    value={data.tgl_po}
                                    onChange={e => setData('tgl_po', e.target.value)}
                                    className="w-full px-3 py-2 border rounded"
                                />
                                {errors.tgl_po && <div className="text-red-500 text-xs mt-1">{errors.tgl_po}</div>}
                            </div>
                        </div>

                        <IndonesiaLocationSelect
                            value={data.lokasi}
                            onChange={val => setData('lokasi', val)}
                            required
                            error={errors.lokasi}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">PIC Klien</label>
                                <input
                                    type="text"
                                    value={data.pic_klien}
                                    onChange={e => setData('pic_klien', e.target.value)}
                                    className="w-full px-3 py-2 border rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">No HP PIC Klien</label>
                                <input
                                    type="text"
                                    value={data.pic_klien_phone}
                                    onChange={e => setData('pic_klien_phone', e.target.value)}
                                    className="w-full px-3 py-2 border rounded"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                Marketing In-Charge
                                {isMkt && <span className="ml-2 text-xs text-gray-400 font-normal">(dari akun Anda)</span>}
                            </label>
                            <input
                                type="text"
                                value={data.owner_marketing}
                                onChange={e => !isMkt && setData('owner_marketing', e.target.value)}
                                className={`w-full px-3 py-2 border rounded ${isMkt ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                placeholder="Nama Marketing"
                                readOnly={isMkt}
                                required
                            />
                            {errors.owner_marketing && <div className="text-red-500 text-xs mt-1">{errors.owner_marketing}</div>}
                        </div>

                        <div className="pt-6 mt-6 border-t flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-black text-white px-6 py-2 rounded font-bold hover:bg-gray-800 disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'Buat Job Baru'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
