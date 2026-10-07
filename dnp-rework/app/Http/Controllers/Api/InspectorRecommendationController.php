<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Services\InspectorRecommendationService;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Auth;

class InspectorRecommendationController extends Controller
{
    protected $recommendationService;

    public function __construct(InspectorRecommendationService $recommendationService)
    {
        $this->recommendationService = $recommendationService;
    }

    public function getForJob(Request $request, Job $job)
    {
        $customThreshold = null;
        $user = Auth::user();

        // RBAC: Only scheduling managers (superadmin, admin, manager) can customize the threshold
        if ($request->has('threshold')) {
            if ($user && in_array($user->role, ['superadmin', 'admin', 'manager'])) {
                $customThreshold = (int) $request->query('threshold');
            }
        }

        $data = $this->recommendationService->getRecommendations($job, $customThreshold);
        return response()->json($data);
    }
}
