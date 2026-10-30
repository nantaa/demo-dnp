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

        $isIns = $user && in_array($user->role, ['inspektur', 'inspector', 'tim_ru']);
        $query = Job::with([
            'inspectors',
            'reportWriter',
            'documents' => function($q) use ($isIns) {
                if ($isIns) {
                    $q->where('type', 'NOT LIKE', '%PO%')
                      ->where('type', 'NOT LIKE', '%SPK%')
                      ->where('name', 'NOT LIKE', '%PO%')
                      ->where('name', 'NOT LIKE', '%SPK%');
                }
            },
            'unitsTracking',
            'historyLogs' => function($q) {
                $q->select(['id', 'job_id', 'stage', 'action', 'action_by_user_id', 'notes', 'created_at'])
                  ->with('user:id,name,role');
            }
        ])->orderBy('updated_at', 'desc');

        if ($user->role === 'marketing' && !$user->isSuperadmin()) {
            $query->where('owner_marketing', $user->name);
        }

        return [
            'auth' => [
                'user'        => $user,
                'permissions' => $stagePermissions,
            ],
            'jobs' => fn () => $query->get(),
            'inspectors' => fn () => \App\Models\InspectorProfile::whereHas('user', function($q) {
                $q->where('name', 'NOT LIKE', '%Diba Aini%');
            })->with('user')->get(),
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
        $data['inspectors']      = fn () => \App\Models\InspectorProfile::with('user')->get();
        $data['alat_uji']        = fn () => \App\Models\AlatUji::all();
        $data['sertifikat_pjk3'] = fn () => \App\Models\SertifikatPjk3::all();
        $data['regulasi_k3']     = fn () => \App\Models\RegulasiK3::all();
        $data['form_disnaker']   = fn () => \App\Models\FormDisnaker::all();
        $data['users']           = fn () => \App\Models\User::orderBy('name')->get();

        return Inertia::render('Dashboard/AlatSkp', $data);
    }
}
