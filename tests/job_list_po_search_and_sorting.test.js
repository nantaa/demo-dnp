import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Daftar Job (Jobs/List.jsx) PO Search & Sorting Test Suite', () => {
    const listPath = path.resolve('dnp-rework/resources/js/Pages/Jobs/List.jsx');
    const content = fs.readFileSync(listPath, 'utf8');

    describe('1. Search Filter by Number PO', () => {
        test('search filter matches job.no_po alongside kode and klien', () => {
            // Must check j.no_po or job.no_po in search filtering
            assert.match(
                content,
                /no_po.*includes\((?:searchTerm|term)\)|(?:searchTerm|term).*includes\(.*no_po\)/i,
                'Jobs/List.jsx must include no_po in the search filter'
            );
        });

        test('search input placeholder mentions No. PO', () => {
            assert.match(
                content,
                /placeholder=.*No\.\s*PO/i,
                'Search input placeholder must indicate searching by No. PO'
            );
        });

        test('search filter respects isINS privacy for PO numbers', () => {
            // Must guard no_po search with !isINS so inspectors cannot search locked POs
            assert.match(
                content,
                /!isINS\s*&&.*no_po|no_po.*&&.*!isINS/,
                'PO search must be guarded by !isINS to maintain inspector privacy rules'
            );
        });
    });

    describe('2. Sorting Functionality', () => {
        test('List.jsx maintains sort state (sortField and sortDirection)', () => {
            assert.match(content, /sortField/, 'Must declare sortField state or variable');
            assert.match(content, /sortDirection/, 'Must declare sortDirection state or variable');
        });

        test('List.jsx implements sort comparison logic covering no_po, klien, stage, and created_at', () => {
            assert.match(content, /sort\(/, 'Must invoke array sort method');
            assert.match(content, /['"]no_po['"]/, 'Must support sorting by no_po');
            assert.match(content, /['"]klien['"]/, 'Must support sorting by klien');
            assert.match(content, /['"]stage['"]/, 'Must support sorting by stage');
        });

        test('Table headers in desktop view are clickable for sorting', () => {
            assert.match(content, /onClick=\{.*handleSort|onSort/i, 'Table header must have sort click handler');
        });

        test('Toolbar includes a sorting dropdown for quick sorting', () => {
            assert.match(
                content,
                /<select[\s\S]*?(?:sort|Urutkan)[\s\S]*?<\/select>/i,
                'Toolbar must include a sort dropdown selector'
            );
        });

        test('Supports sorting by date of input (created_at) in table and selector', () => {
            assert.match(content, /handleSort\(['"]created_at['"]\)/, 'Must have created_at sort handler on header');
            assert.match(content, /created_at_desc|created_at_asc/, 'Must have created_at sort options in selector');
            assert.match(content, /Tgl Input|Tanggal Input|Tgl Dibuat/i, 'Must display Tgl Input / Dibuat column label');
        });
    });

    describe('3. Inspector RBAC Preservation', () => {
        test('Preserves existing !isINS && job.no_po check for raw PO display', () => {
            assert.ok(
                content.includes('!isINS && job.no_po') || content.includes('(!isINS && job.no_po)'),
                'Must preserve !isINS && job.no_po condition for table/card PO display'
            );
        });
    });
});
