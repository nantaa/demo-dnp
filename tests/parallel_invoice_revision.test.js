import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Parallel Invoice Revision Test Suite', () => {
    it('1. JobController.php reviseInvoice accepts invoice_file and faktur_file uploads', () => {
        const controllerPath = path.resolve('dnp-rework/app/Http/Controllers/JobController.php');
        const content = fs.readFileSync(controllerPath, 'utf8');
        assert.match(content, /'invoice_file'\s*=>\s*'nullable\|file/);
        assert.match(content, /'faktur_file'\s*=>\s*'nullable\|file/);
    });

    it('2. JobController.php reviseInvoice does NOT touch $job->stage', () => {
        const controllerPath = path.resolve('dnp-rework/app/Http/Controllers/JobController.php');
        const content = fs.readFileSync(controllerPath, 'utf8');
        const methodMatch = content.match(/public function reviseInvoice[\s\S]*?return back/);
        assert.ok(methodMatch);
        assert.doesNotMatch(methodMatch[0], /\$job->update\(\[[^\]]*['"]stage['"]/);
    });

    it('3. JobDetailSheet.jsx revision modal supports file uploads and FormData submission', () => {
        const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');
        const reviseInvoiceModalPath = path.resolve('dnp-rework/resources/js/Components/JobDetail/Modals/ReviseInvoiceModal.jsx');
        let content = fs.readFileSync(sheetPath, 'utf8');
        if (fs.existsSync(reviseInvoiceModalPath)) {
            content += '\n' + fs.readFileSync(reviseInvoiceModalPath, 'utf8');
        }
        assert.match(content, /id="revise-invoice-file"/);
        assert.match(content, /id="revise-faktur-file"/);
    });

    it('4. JobDetailSheet.jsx exposes both Revisi PO and Revisi Invoice buttons to Finance in header', () => {
        const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');
        const content = fs.readFileSync(sheetPath, 'utf8');
        assert.match(content, /Revisi PO/);
        assert.match(content, /Revisi Invoice/);
        assert.match(content, /onClick=\{?\(\)?\s*=>\s*setShowReviseInvoiceModal\(true\)\}?/);
    });

    it('5. JobDetailSheet.jsx calculates backward DPP and PPN 12% in revision modal without multiplying twice', () => {
        const sheetPath = path.resolve('dnp-rework/resources/js/Components/JobDetailSheet.jsx');
        const revisePoModalPath = path.resolve('dnp-rework/resources/js/Components/JobDetail/Modals/RevisePoModal.jsx');
        let content = fs.readFileSync(sheetPath, 'utf8');
        if (fs.existsSync(revisePoModalPath)) {
            content += '\n' + fs.readFileSync(revisePoModalPath, 'utf8');
        }
        assert.match(content, /total\s*\/\s*1\.12/);
        assert.match(content, /DPP \(Sebelum PPN\):/);
    });
});
