import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Job Purging Scope & clearAll Bugfix Test Suite', () => {
    const controllerPath = path.resolve('dnp-rework/app/Http/Controllers/JobController.php');
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');

    it('1. JobController::clearAll does NOT query non-existent table "job_alat_uji"', () => {
        assert.doesNotMatch(
            controllerContent,
            /DB::table\(['"]job_alat_uji['"]\)/,
            'JobController::clearAll must not reference nonexistent job_alat_uji table'
        );
    });

    it('2. JobController::clearAll does NOT touch master data table "alat_ujis"', () => {
        assert.doesNotMatch(
            controllerContent,
            /(DB::table\(['"]alat_ujis['"]\)->delete|AlatUji::(query\(\)->)?delete|AlatUji::truncate)/,
            'JobController::clearAll must NEVER delete or truncate master table alat_ujis'
        );
    });

    it('3. JobController::clearAll does NOT touch master users or permissions', () => {
        assert.doesNotMatch(
            controllerContent,
            /(DB::table\(['"]users['"]\)->delete|User::(query\(\)->)?delete|user_stage_permissions)/,
            'JobController::clearAll must NEVER delete users or stage permissions'
        );
    });

    it('4. JobController::clearAll purges job-scoped child records and files', () => {
        // Must contain clearAll method with Superadmin authorization check
        assert.match(controllerContent, /public function clearAll\(/, 'clearAll method must exist');
        assert.match(controllerContent, /isSuperadmin/, 'clearAll must require Superadmin privilege');
        // Must delete Job records
        assert.match(controllerContent, /Job::query\(\)->delete\(\)/, 'Must delete Job records');
        // Must clean up documents / files
        assert.match(controllerContent, /JobDocument/, 'Must handle JobDocument cleanup');
    });
});
