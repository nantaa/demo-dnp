import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Visible Fail Notifications & Silent Error Elimination Test Suite', () => {
    const loginPath = path.join(rootDir, 'dnp-rework/resources/js/Pages/Auth/Login.jsx');
    const appPath = path.join(rootDir, 'src/App.jsx');
    const appLayoutPath = path.join(rootDir, 'dnp-rework/resources/js/Layouts/AppLayout.jsx');
    const jobDetailPath = path.join(rootDir, 'dnp-rework/resources/js/Components/JobDetailSheet.jsx');

    test('1. Login.jsx must have top-level alert banner and onError toast', () => {
        const content = fs.readFileSync(loginPath, 'utf8');
        
        // Must import showError from swal
        assert.match(content, /showError/, 'Login.jsx must import and utilize showError');
        
        // Must have top-level visible banner for email or password or error
        assert.match(
            content,
            /errors\.(email|password|error)/,
            'Login.jsx must check for email, password, or general error in top-level notification'
        );

        // Must display prominent error alert container
        assert.ok(
            content.includes('errors.email || errors.password || errors.error') ||
            content.includes('(errors.email || errors.password'),
            'Login.jsx must display prominent alert card when auth fails'
        );

        // Must have onError callback on post(route('login'))
        assert.match(
            content,
            /onError:\s*\(/,
            'Login.jsx submit method must implement onError callback to visibly notify user'
        );
    });

    test('2. src/App.jsx must not silently swallow invalid HTTP responses (419, 500, etc)', () => {
        const content = fs.readFileSync(appPath, 'utf8');
        
        // Check router.on('invalid')
        assert.ok(
            content.includes("router.on('invalid'"),
            "src/App.jsx must register router.on('invalid')"
        );

        // Must NOT have empty silent preventDefault with nothing else
        const emptySwallowRegex = /router\.on\('invalid',\s*\(event\)\s*=>\s*\{\s*event\.preventDefault\(\);\s*\}\);/;
        assert.ok(
            !emptySwallowRegex.test(content),
            "src/App.jsx must NOT silently swallow invalid events with empty event.preventDefault()"
        );

        // Must notify user about 419 (session expired) or 500 server error
        assert.match(content, /419/, "src/App.jsx must specifically handle HTTP 419 CSRF/Session expired");
    });

    test('3. AppLayout.jsx must listen to Laravel session flash errors and success', () => {
        const content = fs.readFileSync(appLayoutPath, 'utf8');
        
        // Must extract flash from props
        assert.match(content, /flash/, "AppLayout.jsx must access props.flash");

        // Must trigger showError on flash.error and showSuccess on flash.success
        assert.match(content, /flash\??\.(error|success)/, "AppLayout.jsx must inspect flash.error or flash.success");
        assert.match(content, /showError\([^)]*flash\??\.error/, "AppLayout.jsx must display showError for flash.error");
    });

    test('4. JobDetailSheet.jsx must not have silent onError handlers on move stage', () => {
        const content = fs.readFileSync(jobDetailPath, 'utf8');
        
        // Should not have silent onError: () => setIsMoving(false)
        const silentMoveRegex = /onError:\s*\(\)\s*=>\s*setIsMoving\(false\)/;
        assert.ok(
            !silentMoveRegex.test(content),
            "JobDetailSheet.jsx must not contain silent 'onError: () => setIsMoving(false)'"
        );
    });

    test('5. JobDetailSheet.jsx must not have silent onError handlers on document uploads', () => {
        const content = fs.readFileSync(jobDetailPath, 'utf8');
        
        // Should not have silent onError: () => setIsUploading(false)
        const silentUploadRegex = /onError:\s*\(\)\s*=>\s*setIsUploading\(false\)/;
        assert.ok(
            !silentUploadRegex.test(content),
            "JobDetailSheet.jsx must not contain silent 'onError: () => setIsUploading(false)'"
        );
    });

    test('6. JobDetailSheet.jsx must handle onError on deleteDoc and stage data saves', () => {
        const content = fs.readFileSync(jobDetailPath, 'utf8');
        
        // deleteDoc must handle onError
        assert.match(
            content,
            /router\.delete\(`\/jobs\/\$\{job\.id\}\/documents\/\$\{docId\}`,\s*\{[\s\S]*?onError/,
            "deleteDoc must handle onError"
        );

        // Stage saves (handleSaveS4, handleSaveS8, etc) must handle onError
        assert.match(
            content,
            /handleSaveS4\s*=\s*\(\)\s*=>\s*router\.post\(`\/jobs\/\$\{job\.id\}\/stage4-data`,[\s\S]*?onError/,
            "handleSaveS4 must provide onError handler"
        );
        assert.match(
            content,
            /handleSaveS8\s*=\s*\(\)\s*=>\s*router\.post\(`\/jobs\/\$\{job\.id\}\/stage8-data`,[\s\S]*?onError/,
            "handleSaveS8 must provide onError handler"
        );
    });
});
