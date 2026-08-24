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
use App\Services\NotificationService;
use App\Models\UserStagePermission;
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
    private function canActOnStage(int $stage, Job $job = null): bool
    {
        $user = Auth::user();
        if ($user->isSuperadmin()) return true;
        if ($user->role === 'manager' && !in_array($stage, array_merge(self::MKT_STAGES, self::FIN_STAGES))) {
            return true;
        }

        if ($user->role === 'marketing') {
            if (in_array($stage, [1, 11, 13])) {
                if ($job && !empty($job->owner_marketing) && $job->owner_marketing === $user->name) {
                    return true;
                }
                return $user->canOwnStage($stage);
            }
            return false;
        }

        // If it's an inspector role, check if user is assigned to the specific job for inspector stages (4 or 6)
        if ($user->role === 'inspektur') {
            if ($job && ($stage === 4 || $stage === 6)) {
                return $job->inspectors()->where('users.id', $user->id)->exists();
            }
            return false;
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
        if (!$this->canActOnStage($job->stage, $job)) {
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

        if (!$this->canActOnStage($currentStage, $job)) {
            abort(403, 'Only the designated owner of Stage ' . $currentStage . ' can move this job forward.');
        }

        $validationRules = [
            'next_stage'    => 'required|integer|min:1|max:14',
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

        // Stage 2 → 3: require mandatory Stage 2 docs OR Kadiv approval
        if ($currentStage == 2) {
            // Only PO/SPK, Surat Permohonan, and Surat Kuasa are required — the rest are optional
            $stage2Docs = ['PO/SPK', 'Surat Permohonan', 'Surat Kuasa'];
            $allDocsPresent = true;
            foreach ($stage2Docs as $docType) {
                if (!$job->documents()->whereIn('stage', [1, 2])->where('type', $docType)->exists()) {
                    $allDocsPresent = false;
                    break;
                }
            }
            if (!$allDocsPresent && $job->peer_review_status !== 'approved') {
                return back()->withErrors([
                    'documents' => 'Dokumen wajib (PO/SPK, Surat Permohonan, Surat Kuasa) harus ada sebelum melanjutkan, atau minta persetujuan Kadiv/MGR.',
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
            $validationRules['report_writer_id']   = 'nullable|exists:users,id';
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

        // Stage 5 → 6: require MGR review decision (approved or approved_conditional)
        if ($currentStage == 5) {
            if (empty($job->s5_review_decision) || $job->s5_review_decision === 'rejected') {
                return back()->withErrors([
                    'review' => 'Keputusan review MGR wajib diisi dan disetujui (Approved / Approved Conditional) sebelum melanjutkan ke Stage 6.',
                ]);
            }
        }

        // Stage 6 → 7: require LHPP + BAP uploaded
        if ($currentStage == 6) {
            $hasLhpp = $job->documents()->whereIn('type', ['LHPP', 'LHPP (PDF)', 'LHPP Draft', 'LHPP Final', 'Laporan Teknis Tambahan'])->exists();
            $hasBap  = $job->documents()->whereIn('type', ['BAP', 'BAP (PDF)', 'BAP Final'])->exists();
            if (!$hasLhpp || !$hasBap) {
                return back()->withErrors([
                    'documents' => 'LHPP dan BAP wajib diunggah sebelum melanjutkan ke Stage 7 (Penyerahan ke Dinas).',
                ]);
            }
        }

        // Stage 7 → 8: tgl_submit_disnaker must be filled
        if ($currentStage == 7) {
            if (empty($job->tgl_submit_disnaker)) {
                return back()->withErrors([
                    'tgl_submit_disnaker' => 'Tanggal penyerahan ke Disnaker wajib diisi sebelum melanjutkan ke Stage 8.',
                ]);
            }
        }

        // Stage 10 → 11: require Invoice details + Invoice (PDF) document
        if ($currentStage == 10) {
            if (empty($job->invoice_no)) {
                return back()->withErrors([
                    'invoice_no' => 'Nomor Invoice wajib diisi sebelum melanjutkan ke Stage 11.',
                ]);
            }
            if (empty($job->total_invoice_amount) || $job->total_invoice_amount <= 0) {
                return back()->withErrors([
                    'total_invoice_amount' => 'Jumlah Tagihan (Nilai Invoice) wajib diisi dengan benar.',
                ]);
            }
            if (empty($job->tgl_invoice_issued)) {
                return back()->withErrors([
                    'tgl_invoice_issued' => 'Tanggal Invoice Diterbitkan wajib diisi.',
                ]);
            }
            $hasInvoiceDoc = $job->documents()->where('stage', 10)->where('type', 'Invoice (PDF)')->exists();
            if (!$hasInvoiceDoc) {
                return back()->withErrors([
                    'documents' => 'Dokumen "Invoice (PDF)" wajib diunggah sebelum melanjutkan ke Stage 11.',
                ]);
            }
        }

        // Stage 11 → 14: require delivery date + Tanda Terima Suket document
        if ($currentStage == 11) {
            if (empty($job->tgl_submit_mkt)) {
                return back()->withErrors([
                    'tgl_submit_mkt' => 'Tanggal Pengiriman Suket (tgl_submit_mkt) wajib diisi.',
                ]);
            }
            $hasTandaTerima = $job->documents()->where('stage', 11)->where('type', 'Tanda Terima Suket')->exists();
            if (!$hasTandaTerima) {
                return back()->withErrors([
                    'documents' => 'Dokumen "Tanda Terima Suket" wajib diunggah sebelum melanjutkan ke Stage 11b (Pembayaran).',
                ]);
            }
        }

        // Stage 14 → 12: require paid status
        if ($currentStage == 14) {
            if (!$job->paid && $job->payment_status !== 'paid') {
                return back()->withErrors([
                    'payment_status' => 'Status pembayaran harus Lunas (paid) sebelum menutup (Close) pekerjaan ini.',
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
                'report_writer_id' => $validated['report_writer_id'] ?? null,
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

        // Send notifications to next stage owners & assigned inspectors
        $nextOwners = NotificationService::getStageOwnerUserIds($nextStage);
        if ($nextStage === 4 || $nextStage === 6) {
            $inspectorUserIds = $job->inspectors()->pluck('users.id')->toArray();
            $nextOwners = array_unique(array_merge($nextOwners, $inspectorUserIds));
            if ($job->report_writer_id) {
                $nextOwners[] = $job->report_writer_id;
            }
        }
        NotificationService::send(
            $nextOwners,
            'stage_moved',
            "Job {$job->kode} masuk ke Stage {$nextStage}",
            "{$job->klien} — {$job->pesawat} telah dilanjutkan ke Stage {$nextStage} oleh " . Auth::user()->name,
            $job->id
        );

        return back()->with('success', 'Job moved to Stage ' . $nextStage . ' successfully.');
    }

    /**
     * Reject a job back to previous stage.
     */
    public function rejectStage(Request $request, Job $job)
    {
        $currentStage = $job->stage;

        if (!$this->canActOnStage($currentStage, $job)) {
            abort(403, 'Only the designated owner of Stage ' . $currentStage . ' can reject this job.');
        }

        $validated = $request->validate([
            'notes'        => 'required|string',
            'target_stage' => 'nullable|integer',
        ]);

        $prevStage = max(1, $currentStage - 1);
        if (!empty($validated['target_stage'])) {
            $prevStage = max(1, (int)$validated['target_stage']);
        }

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

        // Send notification to previous stage owner(s)
        $prevOwners = NotificationService::getStageOwnerUserIds($prevStage);
        NotificationService::send(
            $prevOwners,
            'rejected',
            "⚠️ Job {$job->kode} dikembalikan ke Stage {$prevStage}",
            "Catatan penolakan: {$validated['notes']} (oleh " . Auth::user()->name . ")",
            $job->id
        );

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

        // Notify managers
        $managers = NotificationService::getManagerUserIds();
        NotificationService::send(
            $managers,
            'ask_approval',
            "🔔 Permintaan Persetujuan Kadiv/MGR: {$job->kode}",
            "Admin " . Auth::user()->name . " meminta persetujuan bypass kelengkapan dokumen pada {$job->klien}.",
            $job->id
        );

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

        // Notify stage owner
        $owners = NotificationService::getStageOwnerUserIds($job->stage);
        NotificationService::send(
            $owners,
            'approved',
            "✅ Job {$job->kode} Disetujui oleh Kadiv/MGR",
            "Kadiv/MGR {$user->name} menyetujui bypass dokumen. Anda dapat melanjutkan job.",
            $job->id
        );

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
     * Save Stage 4 field data (actual units, field checklist, photo notes — Tasks 9, 10).
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
            's4_checklist'     => 'nullable|array',  // {nameplate,visual,dimensi,...}: {status,catatan}
        ]);

        $job->update($validated);

        return back()->with('success', 'Data lapangan berhasil disimpan.');
    }

    /**
     * Save or update a per-unit evaluation entry (Stage 5 — Penyusunan LHPP).
     */
    public function saveEvaluation(Request $request, Job $job)
    {
        $user = Auth::user();
        // Admin (stage 5 owner), Inspector (stage 6 owner), or Manager can save
        $isInspector = $job->inspectors()->where('users.id', $user->id)->exists();
        if (!$this->canActOnStage(5, $job) && !$isInspector && !$user->isSuperadmin() && $user->role !== 'manager') {
            abort(403, 'Only the LHPP stage owner can submit unit evaluations.');
        }

        $validated = $request->validate([
            'unit_no'        => 'required|integer|min:1',
            'unit_label'     => 'required|string|max:255',
            'status'         => 'required|in:laik,laik_bersyarat,tidak_laik',
            'findings'       => 'nullable|string',
            'recommendation' => 'nullable|string',
        ]);

        $job->evaluations()->updateOrCreate(
            ['unit_no' => $validated['unit_no']],
            $validated
        );

        return back()->with('success', 'Evaluasi unit berhasil disimpan.');
    }

    /**
     * Delete a per-unit evaluation.
     */
    public function deleteEvaluation(Job $job, \App\Models\JobEvaluation $evaluation)
    {
        if ($evaluation->job_id !== $job->id) {
            abort(403, 'Evaluation does not belong to this job.');
        }
        if (!$this->canActOnStage($job->stage, $job) && Auth::user()->role !== 'manager' && !Auth::user()->isSuperadmin()) {
            abort(403, 'Unauthorized.');
        }
        $evaluation->delete();
        return back()->with('success', 'Evaluasi unit dihapus.');
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
     * Save Stage 7 data (tgl_submit_disnaker + s7_bundel_checklist — Task 15).
     */
    public function saveStage7Data(Request $request, Job $job)
    {
        if (!$this->canActOnStage(7, $job)) {
            abort(403, 'Only MGR can update Stage 7 data.');
        }

        $validated = $request->validate([
            'tgl_submit_disnaker'  => 'required|date',
            's7_bundel_checklist'  => 'nullable|array',  // {grupA:[...],grupB:[...],grupC:[...]}
        ]);

        $job->update($validated);

        return back()->with('success', 'Data penyerahan ke Disnaker disimpan.');
    }

    /**
     * Save Stage 8 data (disnaker doc tracking + SLA — Task 16).
     */
    public function saveStage8Data(Request $request, Job $job)
    {
        if (!$this->canActOnStage(8, $job)) {
            abort(403, 'Only Admin can update Stage 8 data.');
        }

        $validated = $request->validate([
            'tgl_doc_submitted_disnaker' => 'nullable|date',
            'tgl_doc_received_disnaker'  => 'nullable|date',
            's8_progress_status'         => 'nullable|in:progress,stuck,ready',
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
     * Add a Disnaker follow-up log entry (Stage 8 — every 7 days).
     */
    public function saveDisnakerFollowup(Request $request, Job $job)
    {
        if (!$this->canActOnStage(8, $job)) {
            abort(403, 'Only Admin can add Disnaker follow-up entries.');
        }

        $validated = $request->validate([
            'status' => 'required|in:progress,stuck,ready',
            'notes'  => 'required|string|max:2000',
        ]);

        $job->disnakerFollowups()->create([
            'status'            => $validated['status'],
            'notes'             => $validated['notes'],
            'action_by_user_id' => Auth::id(),
        ]);

        $job->historyLogs()->create([
            'stage'             => $job->stage,
            'action'            => 'Follow-up Disnaker dicatat: [' . strtoupper($validated['status']) . '] ' . $validated['notes'],
            'action_by_user_id' => Auth::id(),
        ]);

        return back()->with('success', 'Follow-up Disnaker berhasil dicatat.');
    }

    /**
     * Save Stage 9 data (progress status — Task 17).
     */
    public function saveStage9Data(Request $request, Job $job)
    {
        if (!$this->canActOnStage(9, $job)) {
            abort(403, 'Only Admin can update Stage 9 data.');
        }

        $validated = $request->validate([
            's9_progress_status' => 'required|in:not_started,delayed,in_progress,almost_done,done',
        ]);

        $job->update($validated);

        return back()->with('success', 'Status progress berhasil diperbarui.');
    }

    /**
     * Save or update per-unit Suket tracking data (Stage 9).
     * Auto-advances job to Stage 10 when ALL units reach `issued` status.
     */
    public function saveUnitTracking(Request $request, Job $job)
    {
        if (!$this->canActOnStage(9, $job)) {
            abort(403, 'Only Admin can update unit tracking data.');
        }

        $validated = $request->validate([
            'unit_no'               => 'required|integer|min:1',
            'unit_label'            => 'required|string|max:255',
            'laik_status'           => 'required|in:laik,laik_bersyarat,tidak_laik',
            'no_suket'              => 'nullable|string|max:255',
            'tgl_suket'             => 'nullable|date',
            'suket_validity_months' => 'nullable|integer|min:1|max:120',
            'status'                => 'required|in:pending,issued,submitted,progress,rejected',
            'notes'                 => 'nullable|string|max:1000',
        ]);

        // Auto-calculate expiry date
        $validated['suket_expired_at'] = null;
        if (!empty($validated['tgl_suket']) && !empty($validated['suket_validity_months'])) {
            $validated['suket_expired_at'] = Carbon::parse($validated['tgl_suket'])
                ->addMonths((int) $validated['suket_validity_months'])
                ->toDateString();
        }

        $job->unitsTracking()->updateOrCreate(
            ['unit_no' => $validated['unit_no']],
            $validated
        );

        // Auto-advance to Stage 10 if every contracted unit is now `issued`
        $totalExpected = (int) $job->units;
        $issuedCount   = $job->unitsTracking()->where('status', 'issued')->count();
        $totalTracked  = $job->unitsTracking()->count();

        if ($totalTracked >= $totalExpected && $issuedCount >= $totalExpected) {
            $job->update(['stage' => 10, 'stage_started_at' => now()]);
            $job->historyLogs()->create([
                'stage'             => 10,
                'action'            => 'Auto-advanced ke Stage 10: Semua ' . $totalExpected . ' unit Suket berstatus Issued.',
                'action_by_user_id' => Auth::id(),
            ]);
            return back()->with('success', 'Data Suket disimpan. Semua unit issued — job otomatis maju ke Stage 10 (Penagihan).');
        }

        return back()->with('success', 'Data Suket unit berhasil disimpan.');
    }

    /**
     * Save Stage 10 data (Finance billing — Task 18).
     * Saves all invoice fields: amount, no, date, top, payment_status, progress.
     */
    public function saveStage10Data(Request $request, Job $job)
    {
        $user = Auth::user();
        if ($user->role !== 'finance' && !$user->isSuperadmin()) {
            abort(403, 'Only Finance can update Stage 10 data.');
        }

        $validated = $request->validate([
            'total_invoice_amount' => 'nullable|numeric|min:0',
            'invoice_no'           => 'nullable|string|max:255',
            'invoice_date'         => 'nullable|date',
            'tgl_invoice_issued'   => 'nullable|date',
            'top_days'             => 'nullable|integer|min:1|max:365',
            'payment_status'       => 'nullable|in:pending,sent,paid',
            's10_progress_status'  => 'nullable|in:not_started,delayed,in_progress,almost_done,done',
            'tgl_submit_mkt'       => 'nullable|date',
        ]);

        // Auto-calculate payment due date
        $invDate = $validated['invoice_date'] ?? $validated['tgl_invoice_issued'] ?? null;
        if (!empty($invDate) && !empty($validated['top_days'])) {
            $validated['payment_due_date'] = Carbon::parse($invDate)
                ->addDays((int) $validated['top_days'])
                ->toDateString();
        }

        $job->update($validated);

        return back()->with('success', 'Data penagihan berhasil disimpan.');
    }

    /**
     * Save Stage 11 data — Marketing records delivery of Suket to client.
     */
    public function saveStage11Data(Request $request, Job $job)
    {
        $user = Auth::user();
        if ($user->role !== 'marketing' && !$user->isSuperadmin()) {
            abort(403, 'Only Marketing can update Stage 11 data.');
        }

        $validated = $request->validate([
            'tgl_submit_mkt' => 'required|date',
        ]);

        $job->update($validated);

        $job->historyLogs()->create([
            'stage'             => $job->stage,
            'action'            => 'Suket diserahkan ke klien pada ' . Carbon::parse($validated['tgl_submit_mkt'])->format('d M Y'),
            'action_by_user_id' => Auth::id(),
        ]);

        return back()->with('success', 'Tanggal penyerahan Suket ke klien berhasil disimpan.');
    }

    /**
     * Save Stage 14 (11b) data — Finance confirms payment / settlement status.
     */
    public function saveStage14Data(Request $request, Job $job)
    {
        $user = Auth::user();
        if ($user->role !== 'finance' && !$user->isSuperadmin()) {
            abort(403, 'Only Finance can update payment status.');
        }

        $validated = $request->validate([
            's14_payment_status' => 'required|in:pending,partial,paid',
            's14_payment_notes'  => 'nullable|string',
        ]);

        $job->update([
            's14_payment_status' => $validated['s14_payment_status'],
            's14_payment_notes'  => $validated['s14_payment_notes'] ?? null,
            'paid'               => $validated['s14_payment_status'] === 'paid',
        ]);

        $job->historyLogs()->create([
            'stage'             => $job->stage,
            'action'            => 'Status Pembayaran (11b) diperbarui: ' . strtoupper($validated['s14_payment_status']),
            'action_by_user_id' => Auth::id(),
            'notes'             => $validated['s14_payment_notes'] ?? null,
        ]);

        return back()->with('success', 'Status pembayaran berhasil disimpan.');
    }

    /**
     * Save Stage 12 data — Finance confirms full payment received and closes job.
     */
    public function saveStage12Data(Request $request, Job $job)
    {
        $user = Auth::user();
        if ($user->role !== 'finance' && !$user->isSuperadmin()) {
            abort(403, 'Only Finance can close a job.');
        }

        $validated = $request->validate([
            'paid'                    => 'required|boolean',
            'payment_amount_received' => 'required|numeric|min:0',
            'payment_paid_at'         => 'required|date',
            'payment_status'          => 'required|in:pending,sent,paid',
            'tanda_terima_kembali'    => 'nullable|boolean',
        ]);

        $job->update($validated);

        $action = $validated['paid']
            ? 'Job DITUTUP — Pembayaran LUNAS dikonfirmasi Finance. Jumlah: Rp ' . number_format($validated['payment_amount_received'], 0, ',', '.')
            : 'Data pembayaran Stage 12 diperbarui oleh Finance.';

        $job->historyLogs()->create([
            'stage'             => $job->stage,
            'action'            => $action,
            'action_by_user_id' => Auth::id(),
        ]);

        return back()->with('success', $validated['paid'] ? 'Job berhasil ditutup sebagai LUNAS.' : 'Data pembayaran berhasil disimpan.');
    }

    /**
     * Upload a document for a specific stage of a job.
     */
    public function uploadDocument(Request $request, Job $job)
    {
        $request->validate([
            'type'  => 'required|string|max:100',
            'stage' => 'required|integer|min:1|max:14',
            'file'  => 'required|file|max:25600',
            'photo_notes' => 'nullable|string|max:500',
        ]);

        if ((int)$request->stage !== (int)$job->stage) {
            abort(403, 'You can only upload documents for the job\'s current stage.');
        }

        $user = Auth::user();
        $isInspector = $job->inspectors()->where('users.id', $user->id)->exists();

        $canUpload = $user->isSuperadmin()
            || $user->role === 'manager'
            || ($user->role === 'marketing' && $job->owner_marketing === $user->name && in_array($request->stage, [1, 11]))
            || ($isInspector && in_array($request->stage, [4, 5, 6]))
            || ($user->role !== 'inspektur' && $user->canOwnStage($request->stage));

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
            || ($user->role !== 'inspektur' && $user->canOwnStage($document->stage));

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

        $jobs = Job::with(['inspectors', 'reportWriter', 'documents', 'unitsTracking', 'historyLogs.user'])
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

    /**
     * Save Stage 2 per-item verification checklist status (json).
     */
    public function saveS2Verify(Request $request, Job $job)
    {
        $validated = $request->validate([
            's2_verify_data' => 'required|array',
        ]);

        $job->update([
            's2_verify_data' => $validated['s2_verify_data'],
        ]);

        return back()->with('success', 'Status verifikasi berhasil disimpan.');
    }
}
