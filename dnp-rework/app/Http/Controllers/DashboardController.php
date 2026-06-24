<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Job;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    /**
     * Render the main Kanban Dashboard via Inertia.js (React)
     */
    public function index()
    {
        $user = Auth::user();

        // Pass the user's stage permissions so the React frontend knows which columns/buttons to lock or unlock
        $stagePermissions = $user->isSuperadmin() 
            ? 'superadmin' 
            : $user->stagePermissions()->get()->keyBy('stage');

        return Inertia::render('Dashboard', [
            'auth' => [
                'user' => $user,
                'permissions' => $stagePermissions,
            ],
            // Initially load jobs, React will handle the Kanban state
            'jobs' => Job::with(['inspectors'])->orderBy('updated_at', 'desc')->get(),
        ]);
    }
}
