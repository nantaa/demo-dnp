import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import parser from '@babel/parser';
import traversePkg from '@babel/traverse';
const traverse = traversePkg.default || traversePkg;

describe('Frontend AST Integrity and Reference Safety Test Suite', () => {
    const jsDir = path.resolve('dnp-rework/resources/js');

    function getFiles(dir, exts = ['.js', '.jsx']) {
        let files = [];
        for (const f of fs.readdirSync(dir)) {
            const full = path.join(dir, f);
            if (fs.statSync(full).isDirectory()) {
                files = files.concat(getFiles(full, exts));
            } else if (exts.includes(path.extname(full))) {
                files.push(full);
            }
        }
        return files;
    }

    it('1. All JS and JSX files in resources/js must have zero undeclared variable references', () => {
        const jsFiles = getFiles(jsDir);
        const globals = new Set([
            'window', 'document', 'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
            'fetch', 'FormData', 'URL', 'URLSearchParams', 'Blob', 'File', 'Math', 'Date', 'JSON',
            'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent',
            'Array', 'Object', 'String', 'Number', 'Boolean', 'RegExp', 'Error', 'Promise', 'Set', 'Map',
            'localStorage', 'sessionStorage', 'navigator', 'location', 'history', 'alert', 'confirm', 'prompt',
            'React', 'process', 'global', 'Intl', 'sessionStorage', 'route'
        ]);

        const violations = [];
        for (const file of jsFiles) {
            const code = fs.readFileSync(file, 'utf8');
            try {
                const ast = parser.parse(code, {
                    sourceType: 'module',
                    plugins: ['jsx', 'classProperties', 'objectRestSpread', 'optionalChaining', 'nullishCoalescingOperator']
                });
                
                traverse(ast, {
                    Program(progPath) {
                        progPath.traverse({
                            Identifier(idPath) {
                                if (idPath.isReferencedIdentifier()) {
                                    const name = idPath.node.name;
                                    if (!globals.has(name) && !idPath.scope.hasBinding(name)) {
                                        violations.push({
                                            file: path.relative(jsDir, file),
                                            line: idPath.node.loc.start.line,
                                            name
                                        });
                                    }
                                }
                            }
                        });
                    }
                });
            } catch (e) {
                violations.push({ file: path.relative(jsDir, file), line: 0, name: `Parse error: ${e.message}` });
            }
        }

        assert.deepEqual(violations, [], `Found undeclared identifiers: ${JSON.stringify(violations, null, 2)}`);
    });

    it('2. JobDetailSheet.jsx safely defines both getDocumentUrl and getDocDownloadUrl', () => {
        const sheetPath = path.join(jsDir, 'Components/JobDetailSheet.jsx');
        const code = fs.readFileSync(sheetPath, 'utf8');
        assert.match(code, /const getDocumentUrl\s*=/);
        assert.match(code, /const getDocDownloadUrl\s*=/);
    });

    it('3. All relative imports in resources/js must resolve to existing files', () => {
        const jsFiles = getFiles(jsDir);
        const brokenImports = [];

        for (const file of jsFiles) {
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
                    if (!exists) {
                        brokenImports.push({ file: path.relative(jsDir, file), line: idx + 1, importPath });
                    }
                }
            });
        }

        assert.deepEqual(brokenImports, [], `Found broken imports: ${JSON.stringify(brokenImports, null, 2)}`);
    });
});
