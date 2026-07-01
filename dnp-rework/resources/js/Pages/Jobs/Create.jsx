import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function JobCreate() {
    const { data, setData, post, processing, errors } = useForm({
        klien: '',
        pesawat: 'Boiler',
        lokasi: '',
        owner_marketing: '',
        pic_klien: '',
        pic_klien_phone: '',
        units: 1,
        nilai: 0,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('jobs.store'));
    };

    return (
        <AppLayout>
            <Head title="Buat Job Baru (PO/SPK)" />

            <div className="max-w-2xl mx-auto mt-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Buat Job Baru</h1>
                    <p className="text-gray-500 text-sm mt-1">Stage 1: Pendaftaran PO/SPK Baru oleh Marketing.</p>
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

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Jenis Pesawat</label>
                                <select
                                    value={data.pesawat}
                                    onChange={e => setData('pesawat', e.target.value)}
                                    className="w-full px-3 py-2 border rounded"
                                    required
                                >
                                    <option value="Boiler">Boiler</option>
                                    <option value="Bejana Tekan (PV)">Bejana Tekan (PV)</option>
                                    <option value="Instalasi Listrik">Instalasi Listrik</option>
                                    <option value="Instalasi Petir">Instalasi Petir</option>
                                    <option value="Lift / Escalator">Lift / Escalator</option>
                                    <option value="Pesawat Angkat Angkut">Pesawat Angkat Angkut</option>
                                    <option value="Proteksi Kebakaran">Proteksi Kebakaran</option>
                                </select>
                                {errors.pesawat && <div className="text-red-500 text-xs mt-1">{errors.pesawat}</div>}
                            </div>
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
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Lokasi Pemeriksaan</label>
                            <input
                                type="text"
                                value={data.lokasi}
                                onChange={e => setData('lokasi', e.target.value)}
                                className="w-full px-3 py-2 border rounded"
                                placeholder="Kota / Wilayah"
                                required
                            />
                            {errors.lokasi && <div className="text-red-500 text-xs mt-1">{errors.lokasi}</div>}
                        </div>

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

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Marketing In-Charge</label>
                                <input
                                    type="text"
                                    value={data.owner_marketing}
                                    onChange={e => setData('owner_marketing', e.target.value)}
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder="Nama Marketing"
                                    required
                                />
                                {errors.owner_marketing && <div className="text-red-500 text-xs mt-1">{errors.owner_marketing}</div>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nilai PO / SPK (Rp)</label>
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
