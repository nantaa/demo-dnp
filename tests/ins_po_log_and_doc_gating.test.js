import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const detailSheetPath = path.resolve(__dirname, '../dnp-rework/resources/js/Components/JobDetailSheet.jsx');
const jobControllerPath = path.resolve(__dirname, '../dnp-rework/app/Http/Controllers/JobController.php');

describe('INS PO/SPK Total Lock in Docs & Logs Test Suite', () => {

    describe('1. Documents Tab (renderDocuments) PO/SPK Lockdown for INS', () => {
        it('renderDocuments must filter or lock PO/SPK documents when isINS is true', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');

            const renderDocsSection = detailContent.slice(
                detailContent.indexOf('const renderDocuments = () =>'),
                detailContent.indexOf('const renderHistory = () =>')
            );

            assert.ok(
                renderDocsSection.includes('isPoLockedForIns') || renderDocsSection.includes('isINS'),
                'renderDocuments must check isPoLockedForIns or isINS'
            );
        });
    });

    describe('2. Riwayat / History Log Tab (renderHistory) PO/SPK Masking for INS', () => {
        it('renderHistory must sanitize or mask PO/SPK references and revision logs for INS', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');

            const renderHistorySection = detailContent.slice(
                detailContent.indexOf('const renderHistory = () =>'),
                detailContent.indexOf('const renderEditInfo = () =>')
            );

            assert.ok(
                renderHistorySection.includes('isINS'),
                'renderHistory must check isINS to guard PO/SPK log details'
            );
        });
    });

    describe('3. Header PO Badge Masking for INS', () => {
        it('Sheet header must not display raw PO number to INS users', () => {
            const detailContent = fs.readFileSync(detailSheetPath, 'utf8');

            // Header badge showing job.no_po
            const headerSection = detailContent.slice(
                detailContent.indexOf('<div className="min-w-0 flex-1 mr-3">'),
                detailContent.indexOf('Stage {job.stage}')
            );

            assert.ok(
                headerSection.includes('isINS') || headerSection.includes('!isINS'),
                'Header PO badge must be gated by isINS'
            );
        });
    });
});
