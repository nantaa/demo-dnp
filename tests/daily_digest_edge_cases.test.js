import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Daily Digest Deep Audit & Edge Cases Test Suite', () => {
    const servicePath = path.join(rootDir, 'dnp-rework/app/Services/DailyDigestService.php');
    const bladeHtmlPath = path.join(rootDir, 'dnp-rework/resources/views/emails/daily_digest.blade.php');
    const bladePlainPath = path.join(rootDir, 'dnp-rework/resources/views/emails/daily_digest_plain.blade.php');
    const commandPath = path.join(rootDir, 'dnp-rework/app/Console/Commands/SendDailyDigestCommand.php');

    test('1. Blade HTML template has balanced tags and no dangerous unescaped output', () => {
        const html = fs.readFileSync(bladeHtmlPath, 'utf8');

        // Balanced @if / @endif
        const ifCount = (html.match(/@if\b/g) || []).length;
        const endifCount = (html.match(/@endif\b/g) || []).length;
        assert.equal(ifCount, endifCount, `Blade @if (${ifCount}) and @endif (${endifCount}) must be balanced`);

        // Balanced @foreach / @endforeach
        const foreachCount = (html.match(/@foreach\b/g) || []).length;
        const endforeachCount = (html.match(/@endforeach\b/g) || []).length;
        assert.equal(foreachCount, endforeachCount, `Blade @foreach (${foreachCount}) and @endforeach (${endforeachCount}) must be balanced`);

        // No unescaped raw echo {!! !!} that could introduce XSS
        assert.ok(!html.includes('{!!'), 'HTML email template must not use unescaped raw {!! !!} syntax');

        // Check HTML table tag balance
        const openTable = (html.match(/<table\b/gi) || []).length;
        const closeTable = (html.match(/<\/table>/gi) || []).length;
        assert.equal(openTable, closeTable, `HTML <table (${openTable}) and </table> (${closeTable}) must be balanced`);
    });

    test('2. Plain text template has balanced loops and includes required metadata', () => {
        const plain = fs.readFileSync(bladePlainPath, 'utf8');

        const foreachCount = (plain.match(/@foreach\b/g) || []).length;
        const endforeachCount = (plain.match(/@endforeach\b/g) || []).length;
        assert.equal(foreachCount, endforeachCount, 'Plain text @foreach and @endforeach must be balanced');

        assert.ok(plain.includes('{{ $edition_title }}'), 'Plain text must include edition title');
        assert.ok(plain.includes('{{ $total_tasks }}'), 'Plain text must include total tasks');
        assert.ok(plain.includes('{{ $overdue_count }}'), 'Plain text must include overdue count');
    });

    test('3. DailyDigestService handles null fields and Stage 8 Disnaker SLA correctly', () => {
        const content = fs.readFileSync(servicePath, 'utf8');

        // Check null fallback for job_no and client_name
        assert.match(content, /job_no\s*\?\?/, 'Must have null fallback for job_no');
        assert.match(content, /client_name\s*\?\?/, 'Must have null fallback for client_name');

        // Must strictly exclude stage >= 16 (Archived/Selesai)
        assert.match(content, /where\('stage',\s*'<',\s*16\)/, 'Must filter out completed jobs stage >= 16');

        // Must calculate Stage 8 SLA from tgl_doc_submitted_disnaker
        assert.match(content, /tgl_doc_submitted_disnaker/, 'Must calculate Stage 8 SLA from tgl_doc_submitted_disnaker');

        // Must recognize both inspectors relationship and report_writer_id
        assert.match(content, /report_writer_id/, 'Must check report_writer_id for inspector tasks');
    });

    test('4. SendDailyDigestCommand isolates per-user failures and enforces safety throttle', () => {
        const content = fs.readFileSync(commandPath, 'utf8');

        // Try / Catch inside foreach
        assert.match(
            content,
            /try\s*\{[\s\S]*?Mail::to[\s\S]*?\}\s*catch\s*\(\s*\\?Throwable/,
            'Command must wrap Mail::to inside try-catch to prevent a single bad address from aborting the entire batch'
        );

        // 250ms throttle delay
        assert.match(content, /usleep\(250000\)/, 'Must enforce 250ms throttle delay');

        // Idempotency cache key must include edition ($time)
        assert.match(
            content,
            /daily_digest_.*\{\$time\}/,
            'Cache key must differentiate morning and afternoon editions'
        );
    });
});
