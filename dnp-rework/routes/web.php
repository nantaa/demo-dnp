<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\Api\InspectorRecommendationController;
use Inertia\Inertia;

Route::middleware(['auth', 'verified'])->group(function () {
    // Feature 1: Role-based Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    
    // Feature 2: Visual Kanban Board
    Route::get('/kanban', [DashboardController::class, 'kanban'])->name('kanban');
    
    // Feature 3: Tabular Job List
    Route::get('/jobs', [JobController::class, 'index'])->name('jobs.index');

    // Reminder Suket & SKP
    Route::get('/reminder-suket', [DashboardController::class, 'reminderSuket'])->name('reminder.suket');
    Route::get('/inventory', [DashboardController::class, 'inventory'])->name('inventory');

    // API/Actions
    Route::get('/jobs/create', [JobController::class, 'create'])->name('jobs.create');
    Route::post('/jobs', [JobController::class, 'store'])->name('jobs.store');
    Route::put('/jobs/{job}', [JobController::class, 'update'])->name('jobs.update');
    Route::post('/jobs/{job}/move', [JobController::class, 'updateStage'])->name('jobs.move');
    Route::post('/jobs/{job}/reject', [JobController::class, 'rejectStage'])->name('jobs.reject');
    Route::post('/jobs/{job}/documents', [JobController::class, 'uploadDocument'])->name('jobs.documents.upload');
    Route::delete('/jobs/{job}/documents/{document}', [JobController::class, 'deleteDocument'])->name('jobs.documents.delete');

    // Smart Recommendation API
    Route::get('/api/jobs/{job}/recommendations', [InspectorRecommendationController::class, 'getForJob'])->name('api.jobs.recommendations');

    // Feature 4: User Management (Superadmin Only)
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::post('/users/{user}/permissions', [UserController::class, 'updatePermissions'])->name('users.permissions.update');

    // Feature 5: Inventory CRUD (Admin / Manager / Superadmin)
    Route::post('/inventory/alat', [InventoryController::class, 'storeAlat'])->name('inventory.alat.store');
    Route::put('/inventory/alat/{alatUji}', [InventoryController::class, 'updateAlat'])->name('inventory.alat.update');
    Route::delete('/inventory/alat/{alatUji}', [InventoryController::class, 'destroyAlat'])->name('inventory.alat.destroy');

    Route::post('/inventory/inspector', [InventoryController::class, 'storeInspector'])->name('inventory.inspector.store');
    Route::put('/inventory/inspector/{inspectorProfile}', [InventoryController::class, 'updateInspector'])->name('inventory.inspector.update');
    Route::delete('/inventory/inspector/{inspectorProfile}', [InventoryController::class, 'destroyInspector'])->name('inventory.inspector.destroy');

    Route::post('/inventory/sertifikat', [InventoryController::class, 'storeSertifikat'])->name('inventory.sertifikat.store');
    Route::put('/inventory/sertifikat/{sertifikatPjk3}', [InventoryController::class, 'updateSertifikat'])->name('inventory.sertifikat.update');
    Route::delete('/inventory/sertifikat/{sertifikatPjk3}', [InventoryController::class, 'destroySertifikat'])->name('inventory.sertifikat.destroy');
});

require __DIR__.'/auth.php'; // Keep Breeze Auth routes
