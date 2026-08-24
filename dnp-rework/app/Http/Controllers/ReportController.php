<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Job;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Pelaporan/Index', [
            // Passing default dates to start the filter
            'defaultStartDate' => now()->startOfMonth()->format('Y-m-d'),
            'defaultEndDate' => now()->endOfMonth()->format('Y-m-d'),
        ]);
    }

    public function export(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = $validated['start_date'];
        $endDate = $validated['end_date'] . ' 23:59:59'; // Include the entire end day

        // Query jobs. Adjust the date field based on user's preference. 
        // We'll use tgl_pelaksanaan or created_at. The user mentioned they want "per period of time".
        // Usually, reports are based on the Tanggal Pelaksanaan or created_at. We will filter by created_at or tgl_pelaksanaan.
        // Let's filter by created_at by default to capture all jobs created in that period, 
        // or let the frontend pass a "filter_by" field. For simplicity, let's filter by tgl_pelaksanaan (execution date) if it exists, otherwise fallback.
        // Actually, filtering by `created_at` (Job entry date) is standard. We'll use created_at.
        
        $jobs = Job::with(['inspectors' => function($q) {
            $q->select('inspector_profiles.id', 'inspector_profiles.name');
        }])
        ->whereBetween('created_at', [$startDate, $endDate])
        ->orderBy('created_at', 'asc')
        ->get();

        // Format data for the frontend Excel exporter
        $formattedData = $jobs->map(function ($job, $index) {
            return [
                'No' => $index + 1,
                'Nama Client (Perusahaan)' => $job->klien,
                'Marketing' => $job->owner_marketing,
                'Client' => $job->klien,
                'Jenis Alat' => $job->pesawat,
                'Jmlh' => $job->units,
                'Lokasi Alat' => $job->lokasi,
                'Tanggal Riksa Uji' => $job->tgl_pelaksanaan ? date('d F Y', strtotime($job->tgl_pelaksanaan)) : '-',
                'Inspektur Riksa' => $job->inspectors->pluck('name')->join(', '),
                'PIC' => $job->pic_klien ?: '-',
                'Surat Tugas' => $job->no_surat_tugas ?: '-',
                'SUKET SELESAI' => $job->stage >= 10 ? ($job->stage_started_at ? date('d F Y', strtotime($job->stage_started_at)) : 'Selesai') : '-',
                'Status Pelunasan' => strtoupper($job->s14_payment_status ?: ($job->payment_status ?: 'PENDING')),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formattedData,
        ]);
    }
}
