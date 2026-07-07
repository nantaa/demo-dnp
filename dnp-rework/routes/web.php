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
    Route::post('/jobs/{job}/ask-approval', [JobController::class, 'askApproval'])->name('jobs.ask-approval');
    Route::post('/jobs/{job}/approve', [JobController::class, 'approveAsManager'])->name('jobs.approve');
    Route::post('/jobs/{job}/return-to-stage1', [JobController::class, 'returnToStage1'])->name('jobs.return-to-stage1');
    Route::post('/jobs/{job}/stage4-data', [JobController::class, 'saveStage4Data'])->name('jobs.stage4-data');
    Route::post('/jobs/{job}/stage5-review', [JobController::class, 'saveStage5Review'])->name('jobs.stage5-review');
    Route::post('/jobs/{job}/stage7-data', [JobController::class, 'saveStage7Data'])->name('jobs.stage7-data');
    Route::post('/jobs/{job}/stage8-data', [JobController::class, 'saveStage8Data'])->name('jobs.stage8-data');
    Route::post('/jobs/{job}/stage9-data', [JobController::class, 'saveStage9Data'])->name('jobs.stage9-data');
    Route::post('/jobs/{job}/stage10-data', [JobController::class, 'saveStage10Data'])->name('jobs.stage10-data');
    Route::post('/jobs/{job}/documents', [JobController::class, 'uploadDocument'])->name('jobs.documents.upload');
    Route::delete('/jobs/{job}/documents/{document}', [JobController::class, 'deleteDocument'])->name('jobs.documents.delete');

    // Smart Recommendation API
    Route::get('/api/jobs/{job}/recommendations', [InspectorRecommendationController::class, 'getForJob'])->name('api.jobs.recommendations');
    Route::get('/api/master-data', [JobController::class, 'getMasterData'])->name('api.master-data');

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
    Route::post('/inventory/sertifikat/{sertifikatPjk3}', [InventoryController::class, 'updateSertifikat'])->name('inventory.sertifikat.update');
    Route::delete('/inventory/sertifikat/{sertifikatPjk3}', [InventoryController::class, 'destroySertifikat'])->name('inventory.sertifikat.destroy');

    Route::post('/inventory/regulasi', [InventoryController::class, 'storeRegulasi'])->name('inventory.regulasi.store');
    Route::post('/inventory/regulasi/{regulasiK3}', [InventoryController::class, 'updateRegulasi'])->name('inventory.regulasi.update');
    Route::delete('/inventory/regulasi/{regulasiK3}', [InventoryController::class, 'destroyRegulasi'])->name('inventory.regulasi.destroy');

    Route::post('/inventory/form-disnaker', [InventoryController::class, 'storeFormDisnaker'])->name('inventory.form-disnaker.store');
    Route::post('/inventory/form-disnaker/{formDisnaker}', [InventoryController::class, 'updateFormDisnaker'])->name('inventory.form-disnaker.update');
    Route::delete('/inventory/form-disnaker/{formDisnaker}', [InventoryController::class, 'destroyFormDisnaker'])->name('inventory.form-disnaker.destroy');
});

require __DIR__.'/auth.php'; // Keep Breeze Auth routes

Route::get('/run-migrations-dnp', function() {
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        return '<pre>Migration Output:\n' . \Illuminate\Support\Facades\Artisan::output() . '</pre>';
    } catch (\Exception $e) {
        return 'Migration failed: ' . $e->getMessage() . '\n\nTrace:\n' . $e->getTraceAsString();
    }
});

Route::get('/check-db-schema', function() {
    try {
        $columns = \Illuminate\Support\Facades\Schema::getColumnListing('job_inspectors');
        $types = [];
        foreach ($columns as $column) {
            $types[$column] = \Illuminate\Support\Facades\Schema::getColumnType('job_inspectors', $column);
        }
        return response()->json([
            'table' => 'job_inspectors',
            'columns' => $types,
            'dnp_jobs_exists' => \Illuminate\Support\Facades\Schema::hasTable('dnp_jobs'),
            'users_exists' => \Illuminate\Support\Facades\Schema::hasTable('users'),
        ]);
    } catch (\Exception $e) {
        return 'Error: ' . $e->getMessage();
    }
});
