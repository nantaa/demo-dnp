<?php

namespace App\Http\Controllers;

use App\Models\Job;
use App\Models\JobDocument;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

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

        $validated = $request->validate([
            'next_stage' => 'required|integer|min:1|max:12',
            'notes'      => 'nullable|string',
        ]);

        $nextStage = $validated['next_stage'];

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
        $user = Auth::user();

        // Permission: superadmin, stage owner, stage viewer, or marketing owner of this job
        $canUpload = $user->isSuperadmin()
            || ($user->role === 'marketing' && $job->owner_marketing === $user->name)
            || $user->stagePermissions()->where('stage', $job->stage)->exists();

        if (!$canUpload) {
            abort(403, 'You do not have permission to upload documents for this job.');
        }

        $request->validate([
            'type'  => 'required|string|max:100',
            'stage' => 'required|integer|min:1|max:12',
            'file'  => 'required|file|max:2048|mimes:pdf,jpg,jpeg,png,zip,docx,xlsx',
        ]);

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
     * Permission: uploader, stage owner, or superadmin.
     */
    public function deleteDocument(Job $job, JobDocument $document)
    {
        $user = Auth::user();

        $canDelete = $user->isSuperadmin()
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
            : $user->stagePermissions()->get()->keyBy('stage');

        $jobs = Job::with(['inspectors', 'documents', 'unitsTracking'])
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
}
