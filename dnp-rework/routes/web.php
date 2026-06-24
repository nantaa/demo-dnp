<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\JobController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Require Authentication (provided by Laravel Breeze)
Route::middleware(['auth', 'verified'])->group(function () {
    
    // Main Kanban Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Job API actions (typically you might put this in api.php, but if we use Inertia, web.php is fine for forms)
    Route::post('/jobs', [JobController::class, 'store'])->name('jobs.store');
    Route::put('/jobs/{job}', [JobController::class, 'update'])->name('jobs.update');
    
    // Custom Stage Movement
    Route::post('/jobs/{job}/move', [JobController::class, 'updateStage'])->name('jobs.move');
    
});

require __DIR__.'/auth.php'; // Breeze auth routes
