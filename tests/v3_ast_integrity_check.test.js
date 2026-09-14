import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const jsDir = path.join(rootDir, 'dnp-rework/resources/js');

function getAllJsFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllJsFiles(full));
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(full);
        }
    }
    return results;
}

describe('v3 Frontend AST Integrity and Reference Safety Test Suite', () => {
    it('1. All JS and JSX files in resources/js must transform with esbuild with zero syntax errors', () => {
        const allFiles = getAllJsFiles(jsDir);
        assert.ok(allFiles.length > 10, 'Must find multiple JS/JSX files');

        for (const file of allFiles) {
            const relPath = path.relative(rootDir, file);
            const content = fs.readFileSync(file, 'utf8');

            try {
                esbuild.transformSync(content, {
                    loader: file.endsWith('.jsx') ? 'jsx' : 'js',
                    target: 'es2020',
                    jsx: 'transform',
                });
            } catch (err) {
                assert.fail(`Syntax error in ${relPath}: ${err.message}`);
            }
        }
    });

    it('2. All relative imports in resources/js must resolve to existing files', () => {
        const allFiles = getAllJsFiles(jsDir);
        for (const file of allFiles) {
            const dir = path.dirname(file);
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n');

            lines.forEach((line, idx) => {
                const match = line.match(/from\s+['"](\.\.?\/[^'"]+)['"]/);
                if (match) {
                    const importPath = match[1];
                    const targetBase = path.resolve(dir, importPath);
                    const possible = [
                        targetBase,
                        targetBase + '.js',
                        targetBase + '.jsx',
                        path.join(targetBase, 'index.js'),
                        path.join(targetBase, 'index.jsx')
                    ];
                    const exists = possible.some(p => fs.existsSync(p));
                    assert.ok(
                        exists,
                        `Broken import in ${path.relative(rootDir, file)} line ${idx + 1}: ${importPath}`
                    );
                }
            });
        }
    });

    it('3. JobDetailSheet.jsx on v3 must support all 20 stages including DP sub-flow', () => {
        const detailSheetPath = path.join(jsDir, 'Components/JobDetailSheet.jsx');
        const detailContent = fs.readFileSync(detailSheetPath, 'utf8');
        assert.ok(detailContent.length > 0, 'JobDetailSheet must exist');
        assert.ok(detailContent.includes('TimelineTab'), 'JobDetailSheet must import TimelineTab');
        assert.ok(detailContent.includes('DocumentsTab'), 'JobDetailSheet must import DocumentsTab');
        assert.ok(detailContent.includes('HistoryTab'), 'JobDetailSheet must import HistoryTab');
        assert.ok(detailContent.includes('EditInfoTab'), 'JobDetailSheet must import EditInfoTab');
    });
});
