import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Notification Isolation Test Suite', async (t) => {
    const notifServiceFile = path.join(rootDir, 'dnp-rework/app/Services/NotificationService.php');
    const notifCtrlFile = path.join(rootDir, 'dnp-rework/app/Http/Controllers/NotificationController.php');
    const jobCtrlFile = path.join(rootDir, 'dnp-rework/app/Http/Controllers/JobController.php');
    const dailyDigestFile = path.join(rootDir, 'dnp-rework/app/Services/DailyDigestService.php');

    assert.ok(fs.existsSync(notifServiceFile), 'NotificationService.php exists');
    assert.ok(fs.existsSync(notifCtrlFile), 'NotificationController.php exists');

    const serviceCode = fs.readFileSync(notifServiceFile, 'utf8');
    const ctrlCode = fs.readFileSync(notifCtrlFile, 'utf8');
    const jobCode = fs.readFileSync(jobCtrlFile, 'utf8');
    const digestCode = fs.readFileSync(dailyDigestFile, 'utf8');

    await t.test('1. NotificationService filters out unrelated Marketing users from stage owners', () => {
        // Must contain logic that verifies marketing stage owners against $job->owner_marketing
        assert.match(
            serviceCode,
            /\$owner->role\s*===\s*['"]marketing['"].*owner_marketing/s,
            'NotificationService must check $job->owner_marketing before adding marketing users to recipients'
        );
    });

    await t.test('2. NotificationService filters out unassigned Inspector users from stage owners', () => {
        // Must verify inspector against job->inspectors or report_writer_id
        assert.match(
            serviceCode,
            /\$owner->role\s*===\s*['"]inspektur['"].*inspectors/s,
            'NotificationService must check job inspectors before adding inspector to recipients'
        );
    });

    await t.test('3. JobController approval decision uses getRelatedUserIds instead of blind getStageOwnerUserIds', () => {
        // Line 658 should not call getStageOwnerUserIds($job->stage) directly
        assert.doesNotMatch(
            jobCode,
            /NotificationService::getStageOwnerUserIds\(\$job->stage\)/,
            'JobController should use getRelatedUserIds rather than blind getStageOwnerUserIds'
        );
    });

    await t.test('4. NotificationController purges or excludes notifications for unrelated jobs', () => {
        // NotificationController index must enforce isolation
        assert.match(
            ctrlCode,
            /owner_marketing/s,
            'NotificationController must ensure marketing personnel only view their own job notifications'
        );
    });

    await t.test('5. DailyDigestService strictly matches marketing tasks to job owner', () => {
        // Must not indiscriminately assign stage 1, 11, 13, 15 to all marketing users
        assert.doesNotMatch(
            digestCode,
            /\$isJobOwner\s*\|\|\s*in_array\(\$stage,\s*\[1,\s*11,\s*13,\s*15\]\)/,
            'DailyDigestService must not assign marketing stages to marketing users who do not own the job'
        );
    });
});
