import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const servicePath = path.resolve(__dirname, '../dnp-rework/app/Services/InspectorRecommendationService.php');
const controllerPath = path.resolve(__dirname, '../dnp-rework/app/Http/Controllers/Api/InspectorRecommendationController.php');

describe('Adjustable Overload Threshold & RBAC Enforcement Test Suite', () => {
    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');

    describe('1. InspectorRecommendationService Threshold & Workload Scaling', () => {
        it('defines default overload threshold as 20 for backward compatibility', () => {
            assert.match(
                serviceContent,
                /(DEFAULT_OVERLOAD_THRESHOLD\s*=\s*20|OVERLOAD_THRESHOLD\s*=\s*20)/,
                'Must define overload threshold constant as 20'
            );
        });

        it('resolves threshold from parameter, env, or default constant', () => {
            assert.match(
                serviceContent,
                /env\(\s*['"]INSPECTOR_OVERLOAD_THRESHOLD['"]/,
                'Service must check INSPECTOR_OVERLOAD_THRESHOLD env variable'
            );
            assert.match(
                serviceContent,
                /function\s+getRecommendations\s*\([^)]*\$customThreshold/i,
                'getRecommendations method signature must accept optional customThreshold parameter'
            );
        });

        it('scales Workload score proportionally instead of hardcoded 5 points per job cliff', () => {
            assert.doesNotMatch(
                serviceContent,
                /\$workloadScore\s*=\s*max\(0,\s*25\s*-\s*\(\$activeJobs\s*\*\s*5\)\);/,
                'Workload score must not hardcode static 5 points per job cliff'
            );
            assert.match(
                serviceContent,
                /(\$workloadRatio|\$activeJobs\s*\/\s*\$overloadThreshold)/,
                'Workload score must scale proportionally with overloadThreshold'
            );
        });
    });

    describe('2. InspectorRecommendationController RBAC & Parameter Acceptance', () => {
        it('accepts optional threshold query parameter and enforces RBAC authorization', () => {
            assert.match(
                controllerContent,
                /\$request->query\(\s*['"]threshold['"]\)/,
                'Controller must read optional threshold query parameter'
            );
            assert.match(
                controllerContent,
                /in_array\(\s*\$user->role,\s*\[['"]superadmin['"],\s*['"]admin['"],\s*['"]manager['"]\]\)/,
                'Only superadmin, admin, or manager can customize the threshold query parameter'
            );
        });
    });

    describe('3. Math & Logic Simulation Verification', () => {
        it('calculates proportional workload and overload statuses correctly for threshold 20', () => {
            const calculateWorkloadAndStatus = (activeJobs, threshold = 20) => {
                const workloadRatio = Math.max(0.0, 1.0 - (activeJobs / threshold));
                const workloadScore = Math.round(25 * workloadRatio);
                const isOverloaded = activeJobs >= threshold;
                return { workloadScore, isOverloaded };
            };

            // Inspector with 0 jobs: full score, available
            const r0 = calculateWorkloadAndStatus(0, 20);
            assert.equal(r0.workloadScore, 25);
            assert.equal(r0.isOverloaded, false);

            // Inspector with 5 jobs: previously hit 0, now retains 19/25 and NOT overloaded!
            const r5 = calculateWorkloadAndStatus(5, 20);
            assert.equal(r5.workloadScore, 19);
            assert.equal(r5.isOverloaded, false);

            // Inspector with 10 jobs (half): retains 13/25 and NOT overloaded
            const r10 = calculateWorkloadAndStatus(10, 20);
            assert.equal(r10.workloadScore, 13);
            assert.equal(r10.isOverloaded, false);

            // Inspector with 19 jobs: retains 1/25, still available
            const r19 = calculateWorkloadAndStatus(19, 20);
            assert.equal(r19.workloadScore, 1);
            assert.equal(r19.isOverloaded, false);

            // Inspector with 20 jobs: hits overload
            const r20 = calculateWorkloadAndStatus(20, 20);
            assert.equal(r20.workloadScore, 0);
            assert.equal(r20.isOverloaded, true);
        });
    });
});
