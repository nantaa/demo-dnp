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
            : (object) $user->stagePermissions()->get()->keyBy('stage')->toArray();

        return [
            'auth' => [
                'user'        => $user,
                'permissions' => $stagePermissions,
            ],
            'jobs' => Job::with(['inspectors', 'documents', 'unitsTracking', 'historyLogs.user'])->orderBy('updated_at', 'desc')->get(),
            'inspectors' => \App\Models\InspectorProfile::with('user')->get(),
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
        $data['alat_uji'] = \App\Models\AlatUji::all();
        $data['sertifikat_pjk3'] = \App\Models\SertifikatPjk3::all();
        $data['regulasi_k3'] = \App\Models\RegulasiK3::all();
        $data['form_disnaker'] = \App\Models\FormDisnaker::all();
        $data['users'] = \App\Models\User::orderBy('name')->get();

        return Inertia::render('Dashboard/AlatSkp', $data);
    }
}
