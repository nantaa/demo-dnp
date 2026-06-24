<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Services\InspectorRecommendationService;
use Illuminate\Http\Request;

class InspectorRecommendationController extends Controller
{
    protected $recommendationService;

    public function __construct(InspectorRecommendationService $recommendationService)
    {
        $this->recommendationService = $recommendationService;
    }

    public function getForJob(Job $job)
    {
        $data = $this->recommendationService->getRecommendations($job);
        return response()->json($data);
    }
}
