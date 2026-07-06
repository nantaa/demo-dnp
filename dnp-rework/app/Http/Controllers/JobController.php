<?php

namespace App\Http\Controllers;

use App\Models\Job;
use App\Models\JobDocument;
use App\Models\AlatUji;
use App\Models\SertifikatPjk3;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class JobController extends Controller
{
    /**
     * Show the form for creating a new job.
     */
    public function create()
    {
        if (!Auth::user()->canOwnStage(1)) {
            abort(403, 'Unauthorized to create jobs. Stage 1 is owned by Marketing.');
        }

        return Inertia::render('Jobs/Create', [
            'auth' => [
                'user' => Auth::user(),
            ]
        ]);
    }

    /**
     * Store a newly created job.
     */
    public function store(Request $request)
    {
        // Only Marketing or Superadmin can create PO/SPK (Stage 1)
        if (!Auth::user()->canOwnStage(1)) {
            abort(403, 'Unauthorized to create jobs. Stage 1 is owned by Marketing.');
        }

        $validated = $request->validate([
            'klien'            => 'required|string|max:255',
            'pesawat'          => 'required|string|max:50',
            'lokasi'           => 'required|string',
            'owner_marketing'  => 'required|string',
            'pic_klien'        => 'nullable|string',
            'pic_klien_phone'  => 'nullable|string',
            'units'            => 'integer|min:1',
            'nilai'            => 'numeric|min:0',
        ]);

        // Always use the real logged-in user's name for marketing role
        // to guarantee owner_marketing matches auth.user.name on the frontend
        if (Auth::user()->role === 'marketing') {
            $validated['owner_marketing'] = Auth::user()->name;
        }

        // Generate unique Kode (e.g. DNP/2026/0001)
        $year  = date('Y');
        $count = Job::whereYear('created_at', $year)->count() + 1;
        $validated['kode']  = sprintf('DNP/%s/%04d', $year, $count);
        $validated['stage'] = 1;

        $job = Job::create($validated);

        // Create initial history log
        $job->historyLogs()->create([
            'stage'             => 1,
            'action'            => 'Job created (PO/SPK received)',
            'action_by_user_id' => Auth::id(),
        ]);

        return redirect()->route('dashboard')->with('success', 'Job created successfully.');
    }

    /**
     * Update the specified job.
     */
    public function update(Request $request, Job $job)
    {
        // Enforce strict lock: User must be Superadmin or owner of the current stage
        if (!Auth::user()->canOwnStage($job->stage)) {
            abort(403, 'You do not have permission to edit this job at its current stage.');
        }

        $job->update($request->all());

        return back()->with('success', 'Job updated successfully.');
    }

    /**
     * Move a job to the next stage.
     */
    public function updateStage(Request $request, Job $job)
    {
        $currentStage = $job->stage;

        // Enforce strict lock
        if (!Auth::user()->canOwnStage($currentStage)) {
            abort(403, 'Only the designated owner of Stage ' . $currentStage . ' can move this job forward.');
        }

        $validationRules = [
            'next_stage'    => 'required|integer|min:1|max:12',
            'notes'         => 'nullable|string',
            'inspector_ids' => 'nullable|array',
            'inspector_ids.*' => 'exists:users,id',
        ];

        // If transitioning from Stage 3, enforce scheduling details validation
        if ($currentStage == 3) {
            $validationRules['tgl_pelaksanaan'] = 'required|date';
            $validationRules['jam_mulai'] = 'required|string';
            $validationRules['durasi_hari'] = 'required|integer|min:1';
            $validationRules['disnaker_tujuan'] = 'required|string';
            $validationRules['inspector_ids'] = 'required|array|min:1';
            $validationRules['alat_ids'] = 'nullable|array';
            $validationRules['cert_ids'] = 'nullable|array';
        }

        $validated = $request->validate($validationRules);

        $nextStage = $validated['next_stage'];

        // If moving from Stage 3 to Stage 4, sync the selected inspectors and save scheduling details
        if ($currentStage == 3) {
            $job->inspectors()->sync($validated['inspector_ids'] ?? []);
            
            $tgl_pelaksanaan = Carbon::parse($validated['tgl_pelaksanaan']);
            $tgl_h5 = $tgl_pelaksanaan->copy()->subDays(5);

            $job->update([
                'tgl_pelaksanaan' => $tgl_pelaksanaan,
                'jam_mulai' => $validated['jam_mulai'],
                'durasi_hari' => $validated['durasi_hari'],
                'disnaker_tujuan' => $validated['disnaker_tujuan'],
                'tgl_h5' => $tgl_h5,
                'alat_ids' => json_encode($validated['alat_ids'] ?? []),
                'cert_ids' => json_encode($validated['cert_ids'] ?? []),
            ]);

            // Automatically generate the Surat Tugas document
            $this->generateSuratTugas($job);
        }

        // If moving to Stage 8 (Disnaker), set the 30-day EWS deadline
        if ($nextStage == 8 && $currentStage != 8) {
            $job->disnaker_deadline_at = now()->addDays(30);
        }

        $job->update([
            'stage'          => $nextStage,
            'stage_started_at' => now(),
        ]);

        // Log history
        $job->historyLogs()->create([
            'stage'             => $nextStage,
            'action'            => 'Moved from stage ' . $currentStage . ' to ' . $nextStage,
            'action_by_user_id' => Auth::id(),
        ]);

        return back()->with('success', 'Job moved to Stage ' . $nextStage . ' successfully.');
    }

    /**
     * Reject a job and send it back to the previous stage.
     */
    public function rejectStage(Request $request, Job $job)
    {
        $currentStage = $job->stage;

        if (!Auth::user()->canOwnStage($currentStage)) {
            abort(403, 'Only the designated owner of Stage ' . $currentStage . ' can reject this job.');
        }

        $validated = $request->validate([
            'notes' => 'required|string',
        ]);

        $prevStage = $currentStage - 1;
        if ($prevStage < 1) $prevStage = 1;

        $job->update([
            'stage'           => $prevStage,
            'stage_started_at' => now(),
        ]);

        // Log history with rejection notes
        $job->historyLogs()->create([
            'stage'             => $prevStage,
            'action'            => 'DITOLAK (Dikembalikan dari S' . $currentStage . ' ke S' . $prevStage . '). Alasan: ' . $validated['notes'],
            'action_by_user_id' => Auth::id(),
        ]);

        return back()->with('success', 'Job berhasil dikembalikan ke Stage ' . $prevStage . '.');
    }

    /**
     * Upload a document for a specific stage of a job.
     * Permission: any user with can_view on the stage, or marketing owner of the job.
     */
    public function uploadDocument(Request $request, Job $job)
    {
        $request->validate([
            'type'  => 'required|string|max:100',
            'stage' => 'required|integer|min:1|max:12',
            'file'  => 'required|file|max:2048|mimes:pdf,jpg,jpeg,png,zip,docx,xlsx',
        ]);

        if ((int)$request->stage !== (int)$job->stage) {
            abort(403, 'You can only upload documents for the job\'s current stage.');
        }

        $user = Auth::user();

        // Permission: superadmin, manager, stage owner, or marketing owner of this job for stage 1/11
        $canUpload = $user->isSuperadmin()
            || $user->role === 'manager'
            || ($user->role === 'marketing' && $job->owner_marketing === $user->name && in_array($request->stage, [1, 11]))
            || $user->canOwnStage($request->stage);

        if (!$canUpload) {
            abort(403, 'You do not have permission to upload documents for this stage.');
        }

        $uploadedFile = $request->file('file');
        $path = $uploadedFile->store("job-documents/{$job->id}", 'public');

        $job->documents()->create([
            'stage'              => $request->stage,
            'type'               => $request->type,
            'name'               => $uploadedFile->getClientOriginalName(),
            'path'               => $path,
            'uploaded_by_user_id' => $user->id,
        ]);

        $job->historyLogs()->create([
            'stage'             => $job->stage,
            'action'            => "Dokumen diunggah: [{$request->type}] {$uploadedFile->getClientOriginalName()} (Stage {$request->stage})",
            'action_by_user_id' => $user->id,
        ]);

        return back(303)->with('success', 'Dokumen berhasil diunggah.');
    }

    /**
     * Delete a document from a job.
     * Permission: uploader, stage owner, manager, or superadmin.
     */
    public function deleteDocument(Job $job, JobDocument $document)
    {
        if ((int)$document->stage !== (int)$job->stage) {
            abort(403, 'You can only delete documents belonging to the job\'s current stage.');
        }

        $user = Auth::user();

        $canDelete = $user->isSuperadmin()
            || $user->role === 'manager'
            || $document->uploaded_by_user_id === $user->id
            || $user->canOwnStage($document->stage);

        if (!$canDelete) {
            abort(403, 'You do not have permission to delete this document.');
        }

        Storage::disk('public')->delete($document->path);
        $document->delete();

        return back(303)->with('success', 'Dokumen berhasil dihapus.');
    }

    /**
     * Fetch all jobs for the list view.
     */
    public function index()
    {
        $user = Auth::user();
        $stagePermissions = $user->isSuperadmin()
            ? 'superadmin'
            : (object) $user->stagePermissions()->get()->keyBy('stage')->toArray();

        $jobs = Job::with(['inspectors', 'documents', 'unitsTracking', 'historyLogs.user'])
                   ->orderBy('created_at', 'desc')
                   ->get();

        return Inertia::render('Jobs/List', [
            'auth' => [
                'user'        => $user,
                'permissions' => $stagePermissions,
            ],
            'jobs' => $jobs,
        ]);
    }

    /**
     * Generate Surat Tugas from template and save it as a JobDocument.
     */
    private function generateSuratTugas(Job $job)
    {
        // Path to the template
        $templatePath = resource_path('templates/SuratTugas.docx');
        if (!file_exists($templatePath)) {
            Log::error("Surat Tugas template not found at: " . $templatePath);
            return;
        }

        try {
            $templateProcessor = new \PhpOffice\PhpWord\TemplateProcessor($templatePath);

            // Generate No Surat Tugas if not set
            if (!$job->no_surat_tugas) {
                $year = date('Y');
                $count = Job::whereYear('created_at', $year)->count() + 1;
                $job->no_surat_tugas = sprintf('%03d/DNP/STRU/%s', $count, $year);
                $job->tgl_surat_tugas = now();
                $job->save();
            }

            // Set variables
            $templateProcessor->setValue('no_surat', $job->no_surat_tugas);
            $templateProcessor->setValue('perusahaan', $job->klien);
            $templateProcessor->setValue('no_po', $job->no_po ?? '-');
            $templateProcessor->setValue('marketing', $job->owner_marketing);
            $templateProcessor->setValue('tgl_surat', Carbon::parse($job->tgl_surat_tugas)->translatedFormat('d F Y'));

            // Inspectors
            $inspectors = $job->inspectors()->with('inspectorProfile')->get();
            
            for ($i = 1; $i <= 2; $i++) {
                if (isset($inspectors[$i - 1])) {
                    $ins = $inspectors[$i - 1];
                    $templateProcessor->setValue("nama_ins_{$i}", $ins->name);
                    $templateProcessor->setValue("jabatan_ins_{$i}", $ins->inspectorProfile->jabatan ?? 'Ahli K3 Riksa Uji');
                } else {
                    $templateProcessor->setValue("nama_ins_{$i}", '—');
                    $templateProcessor->setValue("jabatan_ins_{$i}", '—');
                }
            }

            // Table row for units (Detail Pekerjaan Table)
            // Table columns: No, Nama Alat / Unit, Lokasi, Tanggal Pemeriksaan, PIC / HP
            $units = $job->unitsTracking()->get();
            if ($units->count() > 0) {
                $templateProcessor->cloneRow('no', $units->count());
                foreach ($units as $index => $unit) {
                    $rowNum = $index + 1;
                    $templateProcessor->setValue("no#{$rowNum}", $rowNum . '.');
                    $templateProcessor->setValue("nama_alat#{$rowNum}", $unit->unit_label);
                    $templateProcessor->setValue("lokasi#{$rowNum}", $job->lokasi);
                    $templateProcessor->setValue("tanggal#{$rowNum}", Carbon::parse($job->tgl_pelaksanaan)->translatedFormat('d F Y') . ' ' . substr($job->jam_mulai, 0, 5));
                    $templateProcessor->setValue("pic#{$rowNum}", $job->pic_klien . ' / ' . $job->pic_klien_phone);
                }
            } else {
                $templateProcessor->cloneRow('no', 1);
                $templateProcessor->setValue("no#1", "1.");
                $templateProcessor->setValue("nama_alat#1", $job->pesawat . " ({$job->units} Unit)");
                $templateProcessor->setValue("lokasi#1", $job->lokasi);
                $templateProcessor->setValue("tanggal#1", Carbon::parse($job->tgl_pelaksanaan)->translatedFormat('d F Y') . ' ' . substr($job->jam_mulai, 0, 5));
                $templateProcessor->setValue("pic#1", $job->pic_klien . ' / ' . $job->pic_klien_phone);
            }

            // Create folder in storage/app/public/job-documents/{job_id}
            $outputDir = storage_path("app/public/job-documents/{$job->id}");
            if (!file_exists($outputDir)) {
                mkdir($outputDir, 0755, true);
            }

            $filename = "Surat-Tugas-" . str_replace('/', '-', $job->no_surat_tugas) . ".docx";
            $outputPath = $outputDir . '/' . $filename;
            
            $templateProcessor->saveAs($outputPath);

            // Register document in job_documents table
            // Delete previous Surat Tugas if it exists
            $job->documents()->where('type', 'Surat Tugas')->delete();

            $job->documents()->create([
                'stage' => 4,
                'type' => 'Surat Tugas',
                'name' => $filename,
                'path' => "job-documents/{$job->id}/{$filename}",
                'uploaded_by_user_id' => Auth::id()
            ]);

            Log::info("Generated Surat Tugas successfully for Job ID {$job->id} at path {$outputPath}");
        } catch (\Exception $e) {
            Log::error("Error generating Surat Tugas for Job {$job->id}: " . $e->getMessage());
        }
    }

    /**
     * Get master data (Alat Uji & Sertifikat PJK3) for scheduling selections.
     */
    public function getMasterData()
    {
        return response()->json([
            'alat_uji' => AlatUji::orderBy('nama')->get(),
            'sertifikat_pjk3' => SertifikatPjk3::orderBy('nama')->get(),
        ]);
    }
}
