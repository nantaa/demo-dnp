import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sheetPath = path.join(rootDir, 'dnp-rework/resources/js/Components/JobDetailSheet.jsx');
const kanbanPath = path.join(rootDir, 'dnp-rework/resources/js/Pages/Kanban/Index.jsx');

describe('Upload & Kanban Mutation Lifecycle Test Suite', () => {
    const sheetContent = fs.readFileSync(sheetPath, 'utf8');
    const kanbanContent = fs.readFileSync(kanbanPath, 'utf8');

    it('1. onFileChange, uploadFileDirectly, and uploadPhoto must implement onFinish resetting isUploading', () => {
        // onFileChange
        const onFileChangeMatch = sheetContent.match(/const onFileChange = [\s\S]*?router\.post\([\s\S]*?documents[\s\S]*?\}\);/);
        assert.ok(onFileChangeMatch, 'onFileChange router.post must exist');
        assert.ok(onFileChangeMatch[0].includes('onFinish:'), 'onFileChange must have onFinish callback');
        assert.ok(onFileChangeMatch[0].includes('setIsUploading(false)'), 'onFileChange onFinish must call setIsUploading(false)');

        // uploadFileDirectly
        const uploadDirectMatch = sheetContent.match(/const uploadFileDirectly = [\s\S]*?router\.post\([\s\S]*?documents[\s\S]*?\}\);/);
        assert.ok(uploadDirectMatch, 'uploadFileDirectly router.post must exist');
        assert.ok(uploadDirectMatch[0].includes('onFinish:'), 'uploadFileDirectly must have onFinish callback');
        assert.ok(uploadDirectMatch[0].includes('setIsUploading(false)'), 'uploadFileDirectly onFinish must call setIsUploading(false)');

        // uploadPhoto
        const uploadPhotoMatch = sheetContent.match(/const uploadPhoto = [\s\S]*?router\.post\([\s\S]*?documents[\s\S]*?\}\);/);
        assert.ok(uploadPhotoMatch, 'uploadPhoto router.post must exist');
        assert.ok(uploadPhotoMatch[0].includes('setIsUploading(true)'), 'uploadPhoto must set setIsUploading(true)');
        assert.ok(uploadPhotoMatch[0].includes('onFinish:'), 'uploadPhoto must have onFinish callback');
        assert.ok(uploadPhotoMatch[0].includes('setIsUploading(false)'), 'uploadPhoto onFinish must call setIsUploading(false)');
    });

    it('2. useEffect([job]) must defensively reset isUploading and isMoving when fresh server props arrive', () => {
        const jobEffectMatch = sheetContent.match(/\/\/ Keep local form states synchronized when job prop updates[\s\S]*?useEffect\(\(\) => \{([\s\S]*?)\}, \[(?:job|job\.id)\]\);/);
        assert.ok(jobEffectMatch, 'useEffect([job]) must exist');
        const effectBody = jobEffectMatch[1];
        assert.ok(effectBody.includes('setIsUploading(false)'), 'useEffect([job]) must reset isUploading(false)');
        assert.ok(effectBody.includes('setIsMoving(false)'), 'useEffect([job]) must reset isMoving(false)');
    });

    it('3. Loader overlay must include watchdog timer, dismiss action, and data-dnp-busy attribute', () => {
        assert.ok(sheetContent.includes('data-dnp-busy="true"'), 'Loader overlay must have data-dnp-busy="true" attribute');
        assert.ok(sheetContent.includes('showStuckDismiss') || sheetContent.includes('dismissTimer'), 'Component must track stuck loading state for watchdog/dismiss');
        assert.ok(sheetContent.includes('Proses terlalu lama?') || sheetContent.includes('Tutup loading'), 'Must render dismiss option when loading is stuck');
    });

    it('4. Kanban/Index.jsx background polling must skip reload if data-dnp-busy is active', () => {
        const pollEffectMatch = kanbanContent.match(/const syncInterval = setInterval\(\(\) => \{([\s\S]*?)\}, 10000\);/);
        assert.ok(pollEffectMatch, 'Background polling setInterval must exist');
        const pollBody = pollEffectMatch[1];
        assert.ok(pollBody.includes('data-dnp-busy'), 'Polling must check data-dnp-busy before triggering router.reload');
    });

    it('5. Stage moves in JobDetailSheet must not use broken useForm post with data override', () => {
        // Assert no calls of form post(`/jobs/${job.id}/move`, { data: ... })
        const brokenPostMatches = sheetContent.match(/post\(`\/jobs\/\$\{job\.id\}\/move`,\s*\{\s*data:/g);
        assert.strictEqual(brokenPostMatches, null, 'Must NOT use post(`/jobs/${job.id}/move`, { data: ... }) because Inertia useForm ignores options.data');

        // All router.post move calls must have onFinish resetting isMoving
        const handleMoveMatch = sheetContent.match(/const handleMoveStage = [\s\S]*?const handleBypassStage5/);
        assert.ok(handleMoveMatch, 'handleMoveStage block must exist');
        assert.ok(handleMoveMatch[0].includes('setIsMoving(false)'), 'handleMoveStage must reset isMoving in onFinish');
    });

    it('6. Duplicate hidden file input must be eliminated from JobDetailSheet.jsx', () => {
        const fileInputMatches = sheetContent.match(/<input type="file" ref=\{fileInputRef\}/g);
        assert.strictEqual(fileInputMatches?.length, 1, 'There must be exactly ONE <input type="file" ref={fileInputRef}> in JobDetailSheet.jsx');
    });

    it('7. Stage save handlers and document delete must specify preserveScroll and preserveState', () => {
        const deleteDocMatch = sheetContent.match(/const deleteDoc = async[\s\S]*?router\.delete\([\s\S]*?documents[\s\S]*?\}\);/);
        assert.ok(deleteDocMatch, 'deleteDoc must exist');
        assert.ok(deleteDocMatch[0].includes('preserveState: true'), 'deleteDoc must include preserveState: true');

        // Check handleSaveS4 through handleSaveS15
        ['handleSaveS4', 'handleSaveS5', 'handleSaveS7', 'handleSaveS8', 'handleSaveS9', 'handleSaveS10', 'handleSaveS11', 'handleSaveS14', 'handleSaveS15'].forEach(fn => {
            const regex = new RegExp(`const ${fn}\\s*=\\s*\\([\\s\\S]*?router\\.post\\([^,]+,[^,]+,\\s*\\{([\\s\\S]*?)\\}\\);?`);
            const match = sheetContent.match(regex);
            assert.ok(match, `${fn} must exist as router.post`);
            assert.ok(match[1].includes('preserveScroll: true'), `${fn} must include preserveScroll: true`);
            assert.ok(match[1].includes('preserveState: true'), `${fn} must include preserveState: true`);
        });
    });
});
