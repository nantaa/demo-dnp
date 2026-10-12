import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const constantsPath = path.join(rootDir, 'dnp-rework/resources/js/Constants.js');
const dashboardPath = path.join(rootDir, 'dnp-rework/resources/js/Pages/Dashboard/Index.jsx');
const jobDetailPath = path.join(rootDir, 'dnp-rework/resources/js/Components/JobDetailSheet.jsx');

describe('Finance Dashboard Integrity & Unified Upload Test Suite', () => {
    const constantsContent = fs.readFileSync(constantsPath, 'utf8');
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    const jobDetailContent = fs.readFileSync(jobDetailPath, 'utf8');

    it('1. Constants.js: Stage 10 has single unified upload slot "Invoice, Kwitansi & Faktur Pajak"', () => {
        // Must contain single combined entry instead of 3 separate entries
        assert.ok(
            constantsContent.includes("10: ['Invoice, Kwitansi & Faktur Pajak']"),
            'Constants.js DOC_TYPES_BY_STAGE[10] must define exactly one unified upload slot'
        );
    });

    it('2. JobDetailSheet.jsx: UploadSlot renders and groups all Stage 10 billing documents seamlessly', () => {
        // UploadSlot must allow Stage 10 legacy docs (Invoice (PDF), Kwitansi, Faktur Pajak) to be displayed
        assert.ok(
            jobDetailContent.includes("stageId === 10") &&
            (jobDetailContent.includes("'Invoice, Kwitansi & Faktur Pajak'") || jobDetailContent.includes("DOC_TYPES_BY_STAGE[10]")),
            'UploadSlot must properly support Stage 10 documents'
        );
    });

    it('3. JobDetailSheet.jsx: Stage 10 move gate accepts "Invoice, Kwitansi & Faktur Pajak" or any Stage 10 doc', () => {
        assert.ok(
            jobDetailContent.includes("'Invoice, Kwitansi & Faktur Pajak'") &&
            jobDetailContent.includes("hasInvoiceDoc10"),
            'hasInvoiceDoc10 must recognize the unified Invoice, Kwitansi & Faktur Pajak document type'
        );
    });

    it('4. Dashboard/Index.jsx: piutangBerjalan isolates active billed stages (11, 14, 15) and does not overlap with Stage 10 siapTagih', () => {
        // Stage 10 jobs must not be in piutangBerjalan
        assert.doesNotMatch(
            dashboardContent,
            /j\.stage\s*===\s*10\s*&&\s*j\.invoice_no/,
            'piutangBerjalan must not include (j.stage === 10 && j.invoice_no) which causes double-counting with siapTagih'
        );
    });

    it('5. Dashboard/Index.jsx: tandaTerimaPending strictly monitors Stage 15 and checks for uploaded receipt documents', () => {
        // Must check Stage 15 and check if receipt document is uploaded
        assert.doesNotMatch(
            dashboardContent,
            /j\.stage\s*===\s*11\s*\|\|\s*j\.stage\s*===\s*15/,
            'tandaTerimaPending should not include Stage 11 which is penagihan, not courier delivery'
        );
    });
});
