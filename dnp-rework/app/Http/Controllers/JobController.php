<?php

namespace App\Http\Controllers;

use App\Models\Job;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

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
            'klien' => 'required|string|max:255',
            'pesawat' => 'required|string|max:50',
            'lokasi' => 'required|string',
            'owner_marketing' => 'required|string',
            'pic_klien' => 'nullable|string',
            'pic_klien_phone' => 'nullable|string',
            'units' => 'integer|min:1',
            'nilai' => 'numeric|min:0',
        ]);

        // Generate unique Kode (e.g. DNP/2026/0001)
        $year = date('Y');
        $count = Job::whereYear('created_at', $year)->count() + 1;
        $validated['kode'] = sprintf('DNP/%s/%04d', $year, $count);
        $validated['stage'] = 1;

        $job = Job::create($validated);

        // Create initial history log
        $job->historyLogs()->create([
            'stage' => 1,
            'action' => 'Job created (PO/SPK received)',
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
            'notes' => 'nullable|string',
        ]);

        $nextStage = $validated['next_stage'];

        // If moving to Stage 8 (Disnaker), set the 30-day EWS deadline
        if ($nextStage == 8 && $currentStage != 8) {
            $job->disnaker_deadline_at = now()->addDays(30);
        }

        $job->update([
            'stage' => $nextStage,
            'stage_started_at' => now(),
        ]);

        // Log history
        $job->historyLogs()->create([
            'stage' => $nextStage,
            'action' => 'Moved from stage ' . $currentStage . ' to ' . $nextStage,
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
            'stage' => $prevStage,
            'stage_started_at' => now(),
        ]);

        // Log history with rejection notes
        $job->historyLogs()->create([
            'stage' => $prevStage,
            'action' => 'DITOLAK (Dikembalikan dari S' . $currentStage . ' ke S' . $prevStage . '). Alasan: ' . $validated['notes'],
            'action_by_user_id' => Auth::id(),
        ]);

        return back()->with('success', 'Job berhasil dikembalikan ke Stage ' . $prevStage . '.');
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
                'user' => $user,
                'permissions' => $stagePermissions,
            ],
            'jobs' => $jobs,
        ]);
    }
}
