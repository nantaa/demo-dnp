<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Job;

class ReportController extends Controller
{
    private function checkAccess()
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user || !in_array($user->role, ['superadmin', 'manager'])) {
            abort(403, 'Akses Ditolak. Menu pelaporan hanya dapat diakses oleh Superadmin dan Manager.');
        }
    }

    public function index(Request $request)
    {
        $this->checkAccess();
        $user = \Illuminate\Support\Facades\Auth::user();
        return Inertia::render('Pelaporan/Index', [
            'auth' => [
                'user' => $user,
                'permissions' => $user ? ($user->isSuperadmin() ? 'superadmin' : (object) $user->stagePermissions()->get()->keyBy('stage')->toArray()) : null,
            ],
            'defaultStartDate' => now()->startOfMonth()->format('Y-m-d'),
            'defaultEndDate'   => now()->endOfMonth()->format('Y-m-d'),
        ]);
    }

    public function export(Request $request)
    {
        $this->checkAccess();
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
            'filter_by'  => 'nullable|in:created_at,tgl_pelaksanaan',
        ]);

        $startDate = $validated['start_date'];
        $endDate   = $validated['end_date'] . ' 23:59:59';
        $filterBy  = $validated['filter_by'] ?? 'created_at';

        $query = Job::with(['inspectors']);

        if ($filterBy === 'tgl_pelaksanaan') {
            $query->whereBetween('tgl_pelaksanaan', [$startDate, substr($endDate, 0, 10)]);
        } else {
            $query->whereBetween('created_at', [$startDate, $endDate]);
        }

        $jobs = $query->orderBy($filterBy, 'asc')->get();

        // Format data for the Excel export (excluding no_seri)
        $formattedData = $jobs->map(function ($job, $index) {
            $inspectorsList = $job->inspectors ? $job->inspectors->pluck('name')->filter()->join(', ') : '-';
            
            return [
                'NO'                   => $index + 1,
                'Nama Owner'           => $job->klien ?: '-',
                'Marketing'            => $job->owner_marketing ?: '-',
                'Client'               => $job->klien ?: '-',
                'Jenis Alat'           => $job->pesawat ?: '-',
                'Jmlh'                 => $job->units ?: 1,
                'Lokasi Alat'          => $job->lokasi ?: '-',
                'Tanggal Riksa Uji'    => $job->tgl_pelaksanaan ? date('d F Y', strtotime($job->tgl_pelaksanaan)) : '-',
                'Yang Jalan Riksa Uji' => $inspectorsList ?: '-',
                'PIC'                  => $job->pic_klien ?: '-',
                'Surat Tugas'          => $job->no_surat_tugas ?: '-',
                'SUKET SELESAI'        => $job->stage >= 10 ? ($job->stage_started_at ? date('d F Y', strtotime($job->stage_started_at)) : 'Selesai') : '-',
                'Status Pelunasan'     => strtoupper($job->s14_payment_status ?: ($job->payment_status ?: 'PENDING')),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $formattedData,
        ]);
    }
}
