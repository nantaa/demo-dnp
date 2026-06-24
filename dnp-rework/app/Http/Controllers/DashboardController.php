<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Job;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    private function getSharedData()
    {
        $user = Auth::user();
        $stagePermissions = $user->isSuperadmin() 
            ? 'superadmin' 
            : $user->stagePermissions()->get()->keyBy('stage');

        return [
            'auth' => [
                'user' => $user,
                'permissions' => $stagePermissions,
            ],
            'jobs' => Job::orderBy('updated_at', 'desc')->get(),
        ];
    }

    /**
     * Render the role-specific Metrics Dashboard
     */
    public function index()
    {
        return Inertia::render('Dashboard/Index', $this->getSharedData());
    }

    /**
     * Render the 11-Stage Kanban Board
     */
    public function kanban()
    {
        return Inertia::render('Kanban/Index', $this->getSharedData());
    }

    public function reminderSuket()
    {
        $data = $this->getSharedData();
        return Inertia::render('Dashboard/ReminderSuket', $data);
    }

    public function inventory()
    {
        $data = $this->getSharedData();
        $data['inspectors'] = \App\Models\InspectorProfile::with('user')->get();
        return Inertia::render('Dashboard/AlatSkp', $data);
    }
}
