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
    // Stages exclusively owned by MKT (MGR cannot intercept)
    private const MKT_STAGES = [1, 11];
    // Stages exclusively owned by FIN (MGR cannot intercept)
    private const FIN_STAGES = [10, 12];

    /**
     * Check if the current user can act on a stage.
     * Managers can act on any stage except MKT and FIN stages.
     */
    private function canActOnStage(int $stage): bool
    {
        $user = Auth::user();
        if ($user->isSuperadmin()) return true;
        if ($user->role === 'manager' && !in_array($stage, array_merge(self::MKT_STAGES, self::FIN_STAGES))) {
            return true;
        }
        return $user->canOwnStage($stage);
    }

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
        if (!Auth::user()->canOwnStage(1)) {
            abort(403, 'Unauthorized to create jobs. Stage 1 is owned by Marketing.');
        }

        $validated = $request->validate([
            'klien'           => 'required|string|max:255',
            'pesawat'         => 'required|string|max:100',
            'lokasi'          => 'required|string',
            'owner_marketing' => 'required|string',
            'pic_klien'       => 'nullable|string',
            'pic_klien_phone' => 'nullable|string',
            'units'           => 'integer|min:1',
            'nilai'           => 'numeric|min:0',
            'no_po'           => 'required|string|max:255',
            'tgl_po'          => 'nullable|date',
        ]);

        if (Auth::user()->role === 'marketing') {
            $validated['owner_marketing'] = Auth::user()->name;
        }

        $year  = date('Y');
        $count = Job::whereYear('created_at', $year)->count() + 1;
        $validated['kode']  = sprintf('DNP/%s/%04d', $year, $count);
        $validated['stage'] = 1;

        $job = Job::create($validated);

        $job->historyLogs()->create([
            'stage'             => 1,
            'action'            => 'Job created (PO/SPK received)',
            'action_by_user_id' => Auth::id(),
        ]);

        return redirect()->route('dashboard')->with('success', 'Job created successfully.');
    }

    /**
     * Update job details (edit panel).
     */
    public function update(Request $request, Job $job)
    {
        if (!$this->canActOnStage($job->stage)) {
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

        if (!$this->canActOnStage($currentStage)) {
            abort(403, 'Only the designated owner of Stage ' . $currentStage . ' can move this job forward.');
        }

        $validationRules = [
            'next_stage'    => 'required|integer|min:1|max:13',
            'notes'         => 'nullable|string',
            'inspector_ids' => 'nullable|array',
            'inspector_ids.*' => 'exists:users,id',
        ];

        // Stage 1 → 2: require at least one PO/SPK-type document
        if ($currentStage == 1) {
            $acceptedTypes = ['PO/SPK', 'Surat Permohonan', 'Surat Kuasa'];
            $hasDoc = $job->documents()->where('stage', 1)->whereIn('type', $acceptedTypes)->exists();
            if (!$hasDoc) {
                return back()->withErrors([
                    'documents' => 'Minimal satu dokumen (PO/SPK, Surat Permohonan, atau Surat Kuasa) wajib diunggah sebelum melanjutkan.',
                ]);
            }
        }

        // Stage 2 → 3: require all Stage 2 docs OR Kadiv approval
        if ($currentStage == 2) {
            $stage2Docs = ['Pengesahan Gambar Kemnaker', 'Catatan Verifikasi'];
            $allDocsPresent = true;
            foreach ($stage2Docs as $docType) {
                if (!$job->documents()->where('stage', 2)->where('type', $docType)->exists()) {
                    $allDocsPresent = false;
                    break;
                }
            }
            if (!$allDocsPresent && $job->peer_review_status !== 'approved') {
                return back()->withErrors([
                    'documents' => 'Semua dokumen Stage 2 wajib ada. Atau minta persetujuan Kadiv/MGR untuk melanjutkan tanpa dokumen lengkap.',
                ]);
            }
            // Reset peer_review after moving through
            $job->update([
                'peer_review_status'       => null,
                'peer_review_submitted_at' => null,
                'peer_review_approved_at'  => null,
                'peer_review_approved_by'  => null,
            ]);
        }

        // Stage 3 → 4: scheduling validation
        if ($currentStage == 3) {
            $validationRules['tgl_pelaksanaan']   = 'required|date';
            $validationRules['jam_mulai']          = 'required|string';
            $validationRules['durasi_hari']        = 'required|integer|min:1';
            $validationRules['disnaker_tujuan']    = 'required|string';
            $validationRules['inspector_ids']      = 'required|array|min:1';
            $validationRules['alat_ids']           = 'nullable|array';
            $validationRules['cert_ids']           = 'nullable|array';
        }

        // Stage 4: unit count must match if moving to Stage 5
        if ($currentStage == 4) {
            $actualUnits = $job->actual_units;
            if ($request->input('next_stage') == 5 && $actualUnits !== null && (int)$actualUnits !== (int)$job->units) {
                return back()->withErrors([
                    'unit_count' => 'Jumlah alat yang diperiksa (' . $actualUnits . ') tidak sesuai dengan jumlah alat di Job (' . $job->units . '). Lanjutkan ke Aktualisasi Unit (MKT).',
                ]);
            }
        }

        $validated = $request->validate($validationRules);
        $nextStage = $validated['next_stage'];

        // Stage 3 specific: sync inspectors + save scheduling data
        if ($currentStage == 3) {
            $job->inspectors()->sync($validated['inspector_ids'] ?? []);
            $tgl_pelaksanaan = Carbon::parse($validated['tgl_pelaksanaan']);
            $job->update([
                'tgl_pelaksanaan'  => $tgl_pelaksanaan,
                'jam_mulai'        => $validated['jam_mulai'],
                'durasi_hari'      => $validated['durasi_hari'],
                'disnaker_tujuan'  => $validated['disnaker_tujuan'],
                'tgl_h5'           => $tgl_pelaksanaan->copy()->subDays(5),
                'alat_ids'         => json_encode($validated['alat_ids'] ?? []),
                'cert_ids'         => json_encode($validated['cert_ids'] ?? []),
            ]);
            // Disabled: Word Surat Tugas generator is not working/required
            // $this->generateSuratTugas($job);
        }

        // Stage 7 → 8: set 30-day Disnaker EWS deadline
        if ($nextStage == 8 && $currentStage != 8) {
            $job->disnaker_deadline_at = now()->addDays(30);
        }

        $job->update([
            'stage'          => $nextStage,
            'stage_started_at' => now(),
        ]);

        $job->historyLogs()->create([
            'stage'             => $nextStage,
            'action'            => 'Moved from stage ' . $currentStage . ' to ' . $nextStage,
            'action_by_user_id' => Auth::id(),
            'notes'             => $validated['notes'] ?? null,
        ]);

        return back()->with('success', 'Job moved to Stage ' . $nextStage . ' successfully.');
    }

    /**
     * Reject a job back to previous stage.
     */
    public function rejectStage(Request $request, Job $job)
    {
        $currentStage = $job->stage;

        if (!$this->canActOnStage($currentStage)) {
            abort(403, 'Only the designated owner of Stage ' . $currentStage . ' can reject this job.');
        }

        $validated = $request->validate(['notes' => 'required|string']);

        $prevStage = max(1, $currentStage - 1);

        $job->update([
            'stage'           => $prevStage,
            'stage_started_at' => now(),
        ]);

        $job->historyLogs()->create([
            'stage'                => $prevStage,
            'action'               => 'DITOLAK (Dikembalikan dari S' . $currentStage . ' ke S' . $prevStage . ')',
            'returned_from_stage'  => $currentStage,
            'action_by_user_id'    => Auth::id(),
            'notes'                => $validated['notes'],
        ]);

        return back()->with('success', 'Job berhasil dikembalikan ke Stage ' . $prevStage . '.');
    }

    /**
     * Admin/stage-owner asks Kadiv/MGR for approval (Task 6).
     */
    public function askApproval(Request $request, Job $job)
    {
        if (!Auth::user()->canOwnStage($job->stage)) {
            abort(403, 'Only the current stage owner can request approval.');
        }

        $job->update([
            'peer_review_status'       => 'requested',
            'peer_review_submitted_at' => now(),
            'peer_review_submitted_by' => Auth::user()->name,
        ]);

        $job->historyLogs()->create([
            'stage'             => $job->stage,
            'action'            => 'Meminta persetujuan Kadiv/MGR (bypass kelengkapan dokumen)',
            'action_by_user_id' => Auth::id(),
        ]);

        return back()->with('success', 'Permintaan persetujuan telah dikirim ke Kadiv/MGR.');
    }

    /**
     * Kadiv/MGR approves the document bypass (Task 6).
     */
    public function approveAsManager(Request $request, Job $job)
    {
        $user = Auth::user();
        if ($user->role !== 'manager' && !$user->isSuperadmin()) {
            abort(403, 'Only Kadiv/MGR can approve.');
        }

        $job->update([
            'peer_review_status'      => 'approved',
            'peer_review_approved_at' => now(),
            'peer_review_approved_by' => $user->name,
        ]);

        $job->historyLogs()->create([
            'stage'             => $job->stage,
            'action'            => 'Kadiv/MGR menyetujui bypass dokumen. Admin dapat melanjutkan ke stage berikutnya.',
            'action_by_user_id' => Auth::id(),
        ]);

        return back()->with('success', 'Job telah disetujui. Admin dapat melanjutkan.');
    }

    /**
     * Return job to Stage 1 (unit count mismatch — Task 11).
     */
    public function returnToStage1(Request $request, Job $job)
    {
        $validated = $request->validate(['notes' => 'required|string|min:5']);
        $fromStage = $job->stage;

        $job->update([
            'stage'           => 1,
            'stage_started_at' => now(),
        ]);

        $job->historyLogs()->create([
            'stage'               => 1,
            'action'              => 'Job dikembalikan ke Stage 1 PO dari Stage ' . $fromStage . ' (jumlah alat tidak sesuai)',
            'returned_from_stage' => $fromStage,
            'action_by_user_id'   => Auth::id(),
            'notes'               => $validated['notes'],
        ]);

        return back()->with('success', 'Job dikembalikan ke Stage 1. Marketing dapat merevisi detail job.');
    }

    /**
     * Save Stage 4 field data (actual units + photos with notes — Tasks 9, 10).
     */
    public function saveStage4Data(Request $request, Job $job)
    {
        $user = Auth::user();
        $isInspector = $job->inspectors()->where('users.id', $user->id)->exists();
        if (!$isInspector && !$user->isSuperadmin() && $user->role !== 'manager') {
            abort(403, 'Only assigned inspectors can submit Stage 4 data.');
        }

        $validated = $request->validate([
            'actual_units'     => 'required|integer|min:0',
            'unit_count_notes' => 'nullable|string',
        ]);

        $job->update($validated);

        return back()->with('success', 'Data lapangan berhasil disimpan.');
    }

    /**
     * Save Stage 5 MGR review decision (Task 14).
     */
    public function saveStage5Review(Request $request, Job $job)
    {
        $user = Auth::user();
        if ($user->role !== 'manager' && !$user->isSuperadmin()) {
            abort(403, 'Only Kadiv/MGR can submit Stage 5 review.');
        }

        $validated = $request->validate([
            's5_review_decision' => 'required|in:approved,approved_conditional,rejected',
            's5_review_notes'    => 'nullable|string',
        ]);

        $job->update([
            's5_review_decision' => $validated['s5_review_decision'],
            's5_review_notes'    => $validated['s5_review_notes'],
            's5_reviewed_by'     => $user->name,
            's5_reviewed_at'     => now(),
        ]);

        $action = match($validated['s5_review_decision']) {
            'approved'             => 'Laporan Teknis DISETUJUI oleh MGR',
            'approved_conditional' => 'Laporan Teknis DISETUJUI BERSYARAT oleh MGR',
            'rejected'             => 'Laporan Teknis DITOLAK oleh MGR',
        };

        $job->historyLogs()->create([
            'stage'             => $job->stage,
            'action'            => $action,
            'action_by_user_id' => Auth::id(),
            'notes'             => $validated['s5_review_notes'],
        ]);

        return back()->with('success', 'Keputusan review berhasil disimpan.');
    }

    /**
     * Save Stage 7 data (tgl_submit_disnaker — Task 15).
     */
    public function saveStage7Data(Request $request, Job $job)
    {
        if (!$this->canActOnStage(7)) {
            abort(403, 'Only MGR can update Stage 7 data.');
        }

        $validated = $request->validate([
            'tgl_submit_disnaker' => 'required|date',
        ]);

        $job->update($validated);

        return back()->with('success', 'Tanggal penyerahan ke Disnaker disimpan.');
    }

    /**
     * Save Stage 8 data (disnaker doc tracking + SLA — Task 16).
     */
    public function saveStage8Data(Request $request, Job $job)
    {
        if (!$this->canActOnStage(8)) {
            abort(403, 'Only Admin can update Stage 8 data.');
        }

        $validated = $request->validate([
            'tgl_doc_submitted_disnaker' => 'nullable|date',
            'tgl_doc_received_disnaker'  => 'nullable|date',
        ]);

        // Auto-calculate SLA status
        $slaStatus = null;
        if (!empty($validated['tgl_doc_submitted_disnaker'])) {
            $submitted = Carbon::parse($validated['tgl_doc_submitted_disnaker']);
            $daysElapsed = $submitted->diffInDays(now());
            if ($daysElapsed < 30) {
                $slaStatus = 'on_track';
            } elseif ($daysElapsed === 30) {
                $slaStatus = 'last_day';
            } else {
                $slaStatus = 'overdue';
            }
        }

        $job->update(array_merge($validated, ['disnaker_sla_status' => $slaStatus]));

        return back()->with('success', 'Data Disnaker berhasil diperbarui.');
    }

    /**
     * Save Stage 9 data (progress status — Task 17).
     */
    public function saveStage9Data(Request $request, Job $job)
    {
        if (!$this->canActOnStage(9)) {
            abort(403, 'Only Admin can update Stage 9 data.');
        }

        $validated = $request->validate([
            's9_progress_status' => 'required|in:not_started,delayed,in_progress,almost_done,done',
        ]);

        $job->update($validated);

        return back()->with('success', 'Status progress berhasil diperbarui.');
    }

    /**
     * Save Stage 10 data (Finance billing — Task 18).
     */
    public function saveStage10Data(Request $request, Job $job)
    {
        $user = Auth::user();
        if ($user->role !== 'finance' && !$user->isSuperadmin()) {
            abort(403, 'Only Finance can update Stage 10 data.');
        }

        $validated = $request->validate([
            'total_invoice_amount' => 'nullable|numeric|min:0',
            'tgl_invoice_issued'   => 'nullable|date',
            's10_progress_status'  => 'nullable|in:not_started,delayed,in_progress,almost_done,done',
            'tgl_submit_mkt'       => 'nullable|date',
        ]);

        $job->update($validated);

        return back()->with('success', 'Data penagihan berhasil disimpan.');
    }

    /**
     * Upload a document for a specific stage of a job.
     */
    public function uploadDocument(Request $request, Job $job)
    {
        $request->validate([
            'type'  => 'required|string|max:100',
            'stage' => 'required|integer|min:1|max:12',
            'file'  => 'required|file|max:10240|mimes:pdf,jpg,jpeg,png,zip,docx,xlsx',
            'photo_notes' => 'nullable|string|max:500',
        ]);

        // Stage 10 invoice must be PDF only
        if ((int)$request->stage === 10 && $request->type === 'Invoice (PDF)') {
            $request->validate(['file' => 'mimes:pdf']);
        }

        if ((int)$request->stage !== (int)$job->stage) {
            abort(403, 'You can only upload documents for the job\'s current stage.');
        }

        $user = Auth::user();
        $isInspector = $job->inspectors()->where('users.id', $user->id)->exists();

        $canUpload = $user->isSuperadmin()
            || $user->role === 'manager'
            || ($user->role === 'marketing' && $job->owner_marketing === $user->name && in_array($request->stage, [1, 11]))
            || ($isInspector && in_array($request->stage, [4, 5, 6]))
            || $user->canOwnStage($request->stage);

        if (!$canUpload) {
            abort(403, 'You do not have permission to upload documents for this stage.');
        }

        $uploadedFile = $request->file('file');
        $path = $uploadedFile->store("job-documents/{$job->id}", 'public');

        $doc = $job->documents()->create([
            'stage'               => $request->stage,
            'type'                => $request->type,
            'name'                => $uploadedFile->getClientOriginalName(),
            'path'                => $path,
            'uploaded_by_user_id' => $user->id,
        ]);

        // Store photo notes as a history log entry (Stage 4 photos)
        if ($request->photo_notes) {
            $job->historyLogs()->create([
                'stage'             => $job->stage,
                'action'            => "Catatan foto [{$request->type}]: {$request->photo_notes}",
                'action_by_user_id' => $user->id,
            ]);
        }

        $job->historyLogs()->create([
            'stage'             => $job->stage,
            'action'            => "Dokumen diunggah: [{$request->type}] {$uploadedFile->getClientOriginalName()}",
            'action_by_user_id' => $user->id,
        ]);

        return back(303)->with('success', 'Dokumen berhasil diunggah.');
    }

    /**
     * Delete a document from a job.
     */
    public function deleteDocument(Job $job, JobDocument $document)
    {
        if ((int)$document->stage !== (int)$job->stage) {
            abort(403, 'You can only delete documents belonging to the job\'s current stage.');
        }

        $user = Auth::user();
        $isInspector = $job->inspectors()->where('users.id', $user->id)->exists();

        $canDelete = $user->isSuperadmin()
            || $user->role === 'manager'
            || $document->uploaded_by_user_id === $user->id
            || ($isInspector && in_array($document->stage, [4, 5, 6]))
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
        $templatePath = resource_path('templates/SuratTugas.docx');
        if (!file_exists($templatePath)) {
            Log::error("Surat Tugas template not found at: " . $templatePath);
            return;
        }

        try {
            $templateProcessor = new \PhpOffice\PhpWord\TemplateProcessor($templatePath);

            if (!$job->no_surat_tugas) {
                $year  = date('Y');
                $count = Job::whereYear('created_at', $year)->count() + 1;
                $job->no_surat_tugas  = sprintf('%03d/DNP/STRU/%s', $count, $year);
                $job->tgl_surat_tugas = now();
                $job->save();
            }

            $templateProcessor->setValue('no_surat',   $job->no_surat_tugas);
            $templateProcessor->setValue('perusahaan', $job->klien);
            $templateProcessor->setValue('no_po',      $job->no_po ?? '-');
            $templateProcessor->setValue('marketing',  $job->owner_marketing);
            $templateProcessor->setValue('tgl_surat',  Carbon::parse($job->tgl_surat_tugas)->translatedFormat('d F Y'));

            $inspectors = $job->inspectors()->with('inspectorProfile')->get();
            for ($i = 1; $i <= 2; $i++) {
                if (isset($inspectors[$i - 1])) {
                    $ins = $inspectors[$i - 1];
                    $templateProcessor->setValue("nama_ins_{$i}",   $ins->name);
                    $templateProcessor->setValue("jabatan_ins_{$i}", $ins->inspectorProfile->jabatan ?? 'Ahli K3 Riksa Uji');
                } else {
                    $templateProcessor->setValue("nama_ins_{$i}",   '—');
                    $templateProcessor->setValue("jabatan_ins_{$i}", '—');
                }
            }

            $units = $job->unitsTracking()->get();
            if ($units->count() > 0) {
                $templateProcessor->cloneRow('no', $units->count());
                foreach ($units as $index => $unit) {
                    $rowNum = $index + 1;
                    $templateProcessor->setValue("no#{$rowNum}",        $rowNum . '.');
                    $templateProcessor->setValue("nama_alat#{$rowNum}", $unit->unit_label);
                    $templateProcessor->setValue("lokasi#{$rowNum}",    $job->lokasi);
                    $templateProcessor->setValue("tanggal#{$rowNum}",   Carbon::parse($job->tgl_pelaksanaan)->translatedFormat('d F Y') . ' ' . substr($job->jam_mulai, 0, 5));
                    $templateProcessor->setValue("pic#{$rowNum}",       $job->pic_klien . ' / ' . $job->pic_klien_phone);
                }
            } else {
                $templateProcessor->cloneRow('no', 1);
                $templateProcessor->setValue("no#1",        "1.");
                $templateProcessor->setValue("nama_alat#1", $job->pesawat . " ({$job->units} Unit)");
                $templateProcessor->setValue("lokasi#1",    $job->lokasi);
                $templateProcessor->setValue("tanggal#1",   Carbon::parse($job->tgl_pelaksanaan)->translatedFormat('d F Y') . ' ' . substr($job->jam_mulai, 0, 5));
                $templateProcessor->setValue("pic#1",       $job->pic_klien . ' / ' . $job->pic_klien_phone);
            }

            $outputDir = storage_path("app/public/job-documents/{$job->id}");
            if (!file_exists($outputDir)) {
                mkdir($outputDir, 0755, true);
            }

            $filename   = "Surat-Tugas-" . str_replace('/', '-', $job->no_surat_tugas) . ".docx";
            $outputPath = $outputDir . '/' . $filename;
            $templateProcessor->saveAs($outputPath);

            $job->documents()->where('type', 'Surat Tugas')->delete();
            $job->documents()->create([
                'stage'               => 4,
                'type'                => 'Surat Tugas',
                'name'                => $filename,
                'path'                => "job-documents/{$job->id}/{$filename}",
                'uploaded_by_user_id' => Auth::id(),
            ]);

            Log::info("Generated Surat Tugas for Job ID {$job->id}");
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
            'alat_uji'        => AlatUji::orderBy('nama')->get(),
            'sertifikat_pjk3' => SertifikatPjk3::orderBy('nama')->get(),
        ]);
    }
}
