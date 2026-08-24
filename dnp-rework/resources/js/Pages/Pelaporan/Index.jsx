import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { Download, FileSpreadsheet, FileText, Loader2, Calendar } from 'lucide-react';
import { showError, showSuccess } from '@/swal';
import axios from 'axios';
import * as XLSX from 'xlsx';

export default function Index({ defaultStartDate, defaultEndDate }) {
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState([]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const res = await axios.post('/pelaporan/export', {
                start_date: startDate,
                end_date: endDate,
            });
            if (res.data.success) {
                setPreviewData(res.data.data);
                if (res.data.data.length === 0) {
                    showError('Kosong', 'Tidak ada data pekerjaan pada periode tersebut.');
                }
                return res.data.data;
            }
        } catch (error) {
            console.error(error);
            showError('Gagal', 'Gagal menarik data laporan.');
        } finally {
            setLoading(false);
        }
        return null;
    };

    const handlePreview = async () => {
        await fetchReportData();
    };

    const exportToExcel = async () => {
        const data = await fetchReportData();
        if (!data || data.length === 0) return;

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(data);

        // Customize header styles (basic width auto-fit)
        const colWidths = [
            { wch: 5 },  // No
            { wch: 30 }, // Nama Client (Perusahaan)
            { wch: 15 }, // Marketing
            { wch: 30 }, // Client
            { wch: 25 }, // Jenis Alat
            { wch: 8 },  // Jmlh
            { wch: 35 }, // Lokasi Alat
            { wch: 20 }, // Tanggal Riksa Uji
            { wch: 25 }, // Inspektur Riksa
            { wch: 20 }, // PIC
            { wch: 25 }, // Surat Tugas
            { wch: 20 }, // SUKET SELESAI
            { wch: 20 }, // Status Pelunasan
        ];
        ws['!cols'] = colWidths;

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Pekerjaan");

        // Generate and download file
        const fileName = `Laporan_Riksa_Uji_${startDate}_sd_${endDate}.xlsx`;
        XLSX.writeFile(wb, fileName);
        showSuccess('Berhasil', 'File Excel berhasil diunduh.');
    };

    const exportToCSV = async () => {
        const data = previewData.length > 0 ? previewData : await fetchReportData();
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvRows = [];
        
        // Add headers
        csvRows.push(headers.join(','));

        // Add rows
        for (const row of data) {
            const values = headers.map(header => {
                const val = row[header];
                // Escape quotes and wrap in quotes if contains comma
                const escaped = ('' + (val || '')).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Laporan_Riksa_Uji_${startDate}_sd_${endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccess('Berhasil', 'File CSV berhasil diunduh.');
    };

    return (
        <AppLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Pelaporan & Export</h2>}>
            <Head title="Pelaporan" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header & Filters */}
                    <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Filter Laporan (Berdasarkan Tanggal Dibuat)</h3>
                                <p className="text-sm text-gray-500">Pilih rentang tanggal untuk melihat dan mengunduh laporan pekerjaan.</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="w-full md:w-64">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Dari Tanggal</label>
                                <input 
                                    type="date" 
                                    className="w-full rounded border-gray-300 shadow-sm text-sm"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="w-full md:w-64">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Sampai Tanggal</label>
                                <input 
                                    type="date" 
                                    className="w-full rounded border-gray-300 shadow-sm text-sm"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto pt-2 md:pt-0">
                                <button 
                                    onClick={handlePreview}
                                    disabled={loading}
                                    className="flex-1 md:flex-none px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-md shadow-sm border border-gray-200 text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : 'Lihat Data'}
                                </button>
                                <button 
                                    onClick={exportToExcel}
                                    disabled={loading}
                                    className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-md shadow-sm text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <FileSpreadsheet size={16} />
                                    Export Excel (.xlsx)
                                </button>
                                <button 
                                    onClick={exportToCSV}
                                    disabled={loading}
                                    className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-md shadow-sm text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <FileText size={16} />
                                    Export CSV
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview Table */}
                    {previewData.length > 0 && (
                        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden flex flex-col">
                            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                <h4 className="font-bold text-gray-700">Preview Data ({previewData.length} Pekerjaan)</h4>
                            </div>
                            <div className="overflow-x-auto max-h-[600px]">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-blue-900 sticky top-0 z-10">
                                        <tr>
                                            {Object.keys(previewData[0]).map(header => (
                                                <th key={header} className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {previewData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                                {Object.values(row).map((val, cellIdx) => (
                                                    <td key={cellIdx} className="px-4 py-2 whitespace-nowrap text-gray-700">
                                                        {val}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
