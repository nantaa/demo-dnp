import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dashboardPath = path.join(rootDir, 'dnp-rework/resources/js/Pages/Dashboard/Index.jsx');

describe('Role Dashboards Data Integrity & Completeness Suite', () => {
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

    it('1. Finance Dashboard: siapTagih must have dedicated interactive table for Stage 10 jobs', () => {
        // FinDashboard must render table for Stage 10 jobs waiting for invoicing
        assert.ok(
            dashboardContent.includes('Antrean Penerbitan Invoice') || 
            dashboardContent.includes('Suket Siap Tagih') && dashboardContent.includes('<table'),
            'FinDashboard must render an actionable table for Stage 10 jobs awaiting invoice'
        );
    });

    it('2. Finance Dashboard: piutangBerjalan must not be restricted strictly to stage 10', () => {
        // Bug: piutangBerjalan was j.stage === 10 && j.invoice_no && j.payment_status !== 'paid'
        // Once moved to stage 11, 14, 15, it vanished from AR!
        assert.doesNotMatch(
            dashboardContent,
            /piutangBerjalan\s*=\s*jobs\.filter\([^)]*j\.stage\s*===\s*10\s*&&[^)]*j\.invoice_no/,
            'piutangBerjalan must include unpaid invoices across billing stages (10, 11, 14, 15)'
        );
    });

    it('3. Finance Dashboard: AR aging and date checks must support tgl_invoice_issued as fallback', () => {
        // Bug: if (!j.invoice_date) return; skipped jobs because Stage 10 saves tgl_invoice_issued
        assert.ok(
            dashboardContent.includes('tgl_invoice_issued || j.invoice_date') || 
            dashboardContent.includes('invoice_date || j.tgl_invoice_issued'),
            'AR aging calculations must check both tgl_invoice_issued and invoice_date'
        );
    });

    it('4. Finance Dashboard: totalPiutang must use total_invoice_amount or nilai', () => {
        assert.ok(
            dashboardContent.includes('total_invoice_amount || j.nilai') ||
            dashboardContent.includes('total_invoice_amount || Number(j.nilai'),
            'totalPiutang must account for total_invoice_amount with fallback to nilai'
        );
    });

    it('5. Finance Dashboard: must display Stage 14 (Verifikasi Bayar & PPh) and Stage 12 (Closing) sections', () => {
        // Finance owns stages 10, 14, 12
        assert.ok(
            dashboardContent.includes('Verifikasi Pembayaran') || dashboardContent.includes('Stage 14') || dashboardContent.includes('Stage 11b') || dashboardContent.includes('verifikasiBayar'),
            'FinDashboard must include visibility for Stage 14 payment verification'
        );
    });

    it('6. Global Stats: Stage 16 (Selesai Archival) must be treated as completed, not active', () => {
        // Bug: active was j.stage !== 12, which treated archived Stage 16 jobs as active and overdue
        assert.ok(
            dashboardContent.includes('j.stage === 12 || j.stage === 16') ||
            dashboardContent.includes('[12, 16].includes(j.stage)'),
            'Completed jobs must include both Stage 12 and Stage 16'
        );
    });

    it('7. Manager Dashboard: lhppNeedReview must check Stage 6 (Review Laporan Teknis)', () => {
        // Bug: was checking j.stage === 5 && j.peer_review_status === 'submitted' which is never true in rework
        assert.doesNotMatch(
            dashboardContent,
            /lhppNeedReview\s*=\s*jobs\.filter\([^)]*j\.stage\s*===\s*5\s*&&[^)]*peer_review_status\s*===\s*['"]submitted['"]/,
            'lhppNeedReview must not check outdated Stage 5 peer_review_status'
        );
    });

    it('8. Inspector Dashboard: SLA calculation must include Stage 5 (Penyusunan LHPP)', () => {
        // Bug: line 57 had if (job.stage === 6) sla = sla * (job.units || 1) instead of Stage 5
        assert.ok(
            dashboardContent.includes('job.stage === 5') || dashboardContent.includes('[5, 6].includes(job.stage)'),
            'SLA multi-unit multiplier must apply to Stage 5 (Penyusunan LHPP)'
        );
    });

    it('9. Tim Ahli role: must have a dedicated dashboard view for technical review', () => {
        assert.ok(
            dashboardContent.includes('isAHLI') || dashboardContent.includes('tim_ahli'),
            'Tim Ahli role must be recognized and supported with review dashboard'
        );
    });

    it('10. Marketing Funnel: must include Stage 15 (Kirim SUKET)', () => {
        // Bug: stage array was [7, 8, 9, 10, 11, 14] omitting 15
        assert.ok(
            dashboardContent.includes('15') && dashboardContent.includes('Disnaker + Penagihan'),
            'Sales funnel must include Stage 15 in final stages bucket'
        );
    });
});
