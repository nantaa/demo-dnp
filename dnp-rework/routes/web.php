<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\JobController;
use Inertia\Inertia;

Route::middleware(['auth', 'verified'])->group(function () {
    // Feature 1: Role-based Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    
    // Feature 2: Visual Kanban Board
    Route::get('/kanban', [DashboardController::class, 'kanban'])->name('kanban');
    
    // Feature 3: Tabular Job List
    Route::get('/jobs', [JobController::class, 'index'])->name('jobs.index');
    
    // API/Actions
    Route::post('/jobs', [JobController::class, 'store'])->name('jobs.store');
    Route::put('/jobs/{job}', [JobController::class, 'update'])->name('jobs.update');
    Route::post('/jobs/{job}/move', [JobController::class, 'updateStage'])->name('jobs.move');
});

require __DIR__.'/auth.php'; // Keep Breeze Auth routes
