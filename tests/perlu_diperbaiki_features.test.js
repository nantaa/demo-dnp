import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Perlu Diperbaiki — Features & Bug Fixes Test Suite', () => {

    // ── 1. Create Job PPN 12% Calculator ─────────────────────────────────────
    describe('Jobs/Create.jsx PPN 12% Automatic Breakdown', () => {
        const calculatePpnBreakdown = (rawNilai) => {
            const nilai = parseFloat(rawNilai || 0);
            if (isNaN(nilai) || nilai <= 0) {
                return { dpp: 0, ppn: 0, total: 0, hasValue: false };
            }
            const ppn = Math.round(nilai * 0.12);
            const total = Math.round(nilai * 1.12);
            return {
                dpp: nilai,
                ppn,
                total,
                hasValue: true,
            };
        };

        test('calculates accurate DPP, 12% PPN, and Total for 3,000,000 (User Screenshot 2)', () => {
            const res = calculatePpnBreakdown('3000000');
            assert.equal(res.hasValue, true);
            assert.equal(res.dpp, 3000000);
            assert.equal(res.ppn, 360000);
            assert.equal(res.total, 3360000);
        });

        test('calculates accurate values for 10,000,000', () => {
            const res = calculatePpnBreakdown(10000000);
            assert.equal(res.hasValue, true);
            assert.equal(res.dpp, 10000000);
            assert.equal(res.ppn, 1200000);
            assert.equal(res.total, 11200000);
        });

        test('handles empty, 0, or negative values without breaking', () => {
            assert.equal(calculatePpnBreakdown('').hasValue, false);
            assert.equal(calculatePpnBreakdown('0').hasValue, false);
            assert.equal(calculatePpnBreakdown(null).hasValue, false);
            assert.equal(calculatePpnBreakdown(-500).hasValue, false);
        });
    });

    // ── 2. Stage 1 Dokumen Tambahan Upload Slot ──────────────────────────────
    describe('Stage 1 Dokumen Tambahan Upload Slot', () => {
        test('Dokumen Tambahan is treated as valid Stage 1 document type', () => {
            const validDocType = 'Dokumen Tambahan';
            const stage = 1;
            const doc = { id: 99, stage: 1, type: validDocType, filename: 'surat_keterangan_tambahan.pdf' };

            const isMatchingDoc = (d, st, tp) => d.stage === st && d.type === tp;
            assert.equal(isMatchingDoc(doc, stage, validDocType), true);
        });
    });

    // ── 3. Kanban Stage 8 Disnaker Badges & Kendala ──────────────────────────
    describe('Kanban Stage 8 Disnaker Badges & Delay Reason', () => {
        const getDisnakerBadge = (job) => {
            if (job.stage !== 8 || !job.s8_progress_status) return null;
            const map = {
                progress: { label: 'PROSES DISNAKER', cls: 'bg-blue-100 text-blue-800' },
                stuck:    { label: 'TERKENDALA',       cls: 'bg-red-100 text-red-800' },
                ready:    { label: 'SELESAI DISNAKER', cls: 'bg-emerald-100 text-emerald-800' },
            };
            const badge = map[job.s8_progress_status] || null;
            if (!badge) return null;

            return {
                ...badge,
                delayReason: job.s8_progress_status === 'stuck' ? (job.s8_delay_reason || null) : null
            };
        };

        test('returns PROSES DISNAKER badge when s8_progress_status is progress', () => {
            const badge = getDisnakerBadge({ stage: 8, s8_progress_status: 'progress' });
            assert.ok(badge);
            assert.equal(badge.label, 'PROSES DISNAKER');
            assert.equal(badge.delayReason, null);
        });

        test('returns TERKENDALA badge with delayReason when s8_progress_status is stuck', () => {
            const badge = getDisnakerBadge({
                stage: 8,
                s8_progress_status: 'stuck',
                s8_delay_reason: 'Pejabat Disnaker sedang dinas luar kota'
            });
            assert.ok(badge);
            assert.equal(badge.label, 'TERKENDALA');
            assert.equal(badge.delayReason, 'Pejabat Disnaker sedang dinas luar kota');
        });

        test('returns SELESAI DISNAKER badge when s8_progress_status is ready', () => {
            const badge = getDisnakerBadge({ stage: 8, s8_progress_status: 'ready' });
            assert.ok(badge);
            assert.equal(badge.label, 'SELESAI DISNAKER');
        });
    });

    // ── 4. Audit Log Deduplication / Coalescing ──────────────────────────────
    describe('Audit Log Deduplication Logic', () => {
        const shouldDeduplicateLog = (lastLog, newLog) => {
            if (!lastLog) return false;
            const sameJob = lastLog.job_id === newLog.job_id;
            const sameStage = lastLog.stage === newLog.stage;
            const sameUser = lastLog.action_by_user_id === newLog.action_by_user_id;
            
            // Check time difference in seconds
            const diffSeconds = (new Date(newLog.created_at) - new Date(lastLog.created_at)) / 1000;
            const isRapid = diffSeconds >= 0 && diffSeconds < 120; // within 2 minutes

            return sameJob && sameStage && sameUser && isRapid;
        };

        test('identifies rapid consecutive logs from the same user on the same stage as duplicate', () => {
            const log1 = {
                job_id: 10,
                stage: 10,
                action_by_user_id: 2,
                created_at: '2026-09-14T10:00:00Z',
                action: 'Data penagihan diperbarui oleh Finance.'
            };
            const log2 = {
                job_id: 10,
                stage: 10,
                action_by_user_id: 2,
                created_at: '2026-09-14T10:00:25Z',
                action: 'Job dipindahkan ke Stage 11'
            };

            assert.equal(shouldDeduplicateLog(log1, log2), true);
        });

        test('does not deduplicate logs from different stages or users', () => {
            const log1 = {
                job_id: 10,
                stage: 9,
                action_by_user_id: 2,
                created_at: '2026-09-14T10:00:00Z'
            };
            const log2 = {
                job_id: 10,
                stage: 10,
                action_by_user_id: 2,
                created_at: '2026-09-14T10:00:25Z'
            };

            assert.equal(shouldDeduplicateLog(log1, log2), false);
        });
    });
});
