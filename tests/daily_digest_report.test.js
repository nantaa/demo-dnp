import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Daily Digest Email Reports Test Suite', () => {
    const servicePath = path.join(rootDir, 'dnp-rework/app/Services/DailyDigestService.php');
    const mailPath = path.join(rootDir, 'dnp-rework/app/Mail/DailyDigestMail.php');
    const bladeHtmlPath = path.join(rootDir, 'dnp-rework/resources/views/emails/daily_digest.blade.php');
    const bladePlainPath = path.join(rootDir, 'dnp-rework/resources/views/emails/daily_digest_plain.blade.php');
    const commandPath = path.join(rootDir, 'dnp-rework/app/Console/Commands/SendDailyDigestCommand.php');
    const consoleRoutesPath = path.join(rootDir, 'dnp-rework/routes/console.php');
    const guidePath = path.join(rootDir, 'EMAIL_SETUP_GUIDE.md');

    test('1. DailyDigestService.php exists and defines role-tailored task extraction', () => {
        assert.ok(fs.existsSync(servicePath), 'DailyDigestService.php must exist');
        const content = fs.readFileSync(servicePath, 'utf8');

        // Check required methods
        assert.match(content, /class\s+DailyDigestService/, 'Must define DailyDigestService class');
        assert.match(content, /function\s+getUserTasks/, 'Must define getUserTasks method');
        assert.match(content, /function\s+buildDigestPayload/, 'Must define buildDigestPayload method');

        // Role-based filtering checks
        assert.match(content, /inspektur|inspector/, 'Must handle inspector tasks');
        assert.match(content, /tim_ahli|ahli/, 'Must handle tim_ahli tasks for Stage 6');
        assert.match(content, /finance/, 'Must handle finance tasks for stages 10, 14, 12');
        assert.match(content, /marketing/, 'Must handle marketing tasks for stages 1, 11, 13, 15');
        assert.match(content, /manager|superadmin/, 'Must handle manager/superadmin overview tasks');

        // SLA overdue detection
        assert.match(content, /is_overdue|overdue/i, 'Must compute SLA overdue status');
    });

    test('2. DailyDigestMail.php exists and supports multipart HTML and Plain text', () => {
        assert.ok(fs.existsSync(mailPath), 'DailyDigestMail.php must exist');
        const content = fs.readFileSync(mailPath, 'utf8');

        assert.match(content, /class\s+DailyDigestMail\s+extends\s+Mailable/, 'Must extend Laravel Mailable');
        assert.match(content, /emails\.daily_digest/, 'Must reference daily_digest blade view');
        assert.match(content, /emails\.daily_digest_plain|text\(/, 'Must support plain text alternative');
        assert.match(content, /\[DNP Monitor\]/, 'Must include [DNP Monitor] tag in subject line');
    });

    test('3. Email templates exist with table-based structure and plain-text alternative', () => {
        assert.ok(fs.existsSync(bladeHtmlPath), 'daily_digest.blade.php must exist');
        assert.ok(fs.existsSync(bladePlainPath), 'daily_digest_plain.blade.php must exist');

        const htmlContent = fs.readFileSync(bladeHtmlPath, 'utf8');
        // Must use HTML tables for Outlook/Gmail compatibility
        assert.match(htmlContent, /<table/i, 'HTML email must use table-based layout');
        assert.match(htmlContent, /#0A385C|#00A8E8/i, 'Must use DNP corporate brand colors');
        assert.match(htmlContent, /PT Delta Nusantara Persada/i, 'Must include corporate company name');

        const plainContent = fs.readFileSync(bladePlainPath, 'utf8');
        assert.ok(plainContent.length > 50, 'Plain text template must not be empty');
        assert.match(plainContent, /DNP Monitor/i, 'Plain text template must reference DNP Monitor');
    });

    test('4. SendDailyDigestCommand.php supports --time, --dry-run, and idempotency cache lock', () => {
        assert.ok(fs.existsSync(commandPath), 'SendDailyDigestCommand.php must exist');
        const content = fs.readFileSync(commandPath, 'utf8');

        assert.match(content, /report:daily-digest/, 'Signature must define report:daily-digest');
        assert.match(content, /--time=/, 'Signature must support --time option');
        assert.match(content, /--dry-run/, 'Signature must support --dry-run option');
        assert.match(content, /--user=/, 'Signature must support --user option');

        // Idempotency check with Cache
        assert.match(content, /Cache::/, 'Command must use Cache for idempotency check');
    });

    test('5. routes/console.php registers morning and afternoon digest on weekdays', () => {
        const content = fs.readFileSync(consoleRoutesPath, 'utf8');

        assert.match(content, /report:daily-digest\s+--time=morning/, 'Must register morning daily digest');
        assert.match(content, /report:daily-digest\s+--time=afternoon/, 'Must register afternoon daily digest');
        assert.match(content, /weekdays\(\)/, 'Must restrict daily digest to weekdays');
    });

    test('6. EMAIL_SETUP_GUIDE.md provides clear Google Workspace setup instructions', () => {
        assert.ok(fs.existsSync(guidePath), 'EMAIL_SETUP_GUIDE.md must exist');
        const content = fs.readFileSync(guidePath, 'utf8');

        assert.match(content, /App Password|Sandi Aplikasi/i, 'Must explain Google App Password');
        assert.match(content, /MAIL_HOST=smtp\.gmail\.com/, 'Must specify smtp.gmail.com host');
        assert.match(content, /MAIL_PORT=587/, 'Must specify port 587');
        assert.match(content, /report:daily-digest.*--dry-run/, 'Must include dry-run command instruction');
    });
});
