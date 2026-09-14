import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DOC_TYPES_BY_STAGE } from '../dnp-rework/resources/js/Constants.js';

describe('S8 Disnaker & Bukti Transfer Test Suite', () => {

    // ── 1. Bukti Transfer Placement ──────────────────────────────────────────
    describe('Bukti Transfer Stage Placement', () => {
        test('Stage 10 does NOT contain Bukti Transfer', () => {
            assert.ok(!DOC_TYPES_BY_STAGE[10].includes('Bukti Transfer'), 'Stage 10 should not have Bukti Transfer');
        });

        test('Stage 14 (11b) contains Bukti Transfer', () => {
            assert.ok(
                DOC_TYPES_BY_STAGE[14].includes('Bukti Transfer') ||
                DOC_TYPES_BY_STAGE[14].includes('Bukti Transfer / Pembayaran'),
                'Stage 14 should have Bukti Transfer'
            );
        });
    });

    // ── 2. Stage 8 Disnaker Save Logic & Column Defense ──────────────────────
    describe('Stage 8 Disnaker Save Logic & Column Defense', () => {
        const prepareS8Data = (input, hasColumnInDb = true) => {
            const data = { ...input };
            if (data.s8_progress_status !== 'stuck') {
                data.s8_delay_reason = null;
            }
            if (!hasColumnInDb) {
                delete data.s8_delay_reason;
            }
            return data;
        };

        test('resets s8_delay_reason to null when s8_progress_status is progress or ready', () => {
            const res = prepareS8Data({
                s8_progress_status: 'progress',
                s8_delay_reason: 'Old error reason'
            }, true);
            assert.equal(res.s8_delay_reason, null);
        });

        test('preserves s8_delay_reason when s8_progress_status is stuck', () => {
            const res = prepareS8Data({
                s8_progress_status: 'stuck',
                s8_delay_reason: 'Pejabat dinas luar kota'
            }, true);
            assert.equal(res.s8_delay_reason, 'Pejabat dinas luar kota');
        });

        test('defensively removes s8_delay_reason if DB column does not exist', () => {
            const res = prepareS8Data({
                s8_progress_status: 'progress',
                s8_delay_reason: 'anything'
            }, false);
            assert.equal('s8_delay_reason' in res, false);
        });
    });

    // ── 3. PostgreSQL Action String Truncation Protection ─────────────────────
    describe('Audit Log Action String Truncation Protection', () => {
        const safeLimit = (str, limit = 250) => {
            if (!str) return '';
            return str.length > limit ? str.slice(0, limit - 3) + '...' : str;
        };

        test('strictly caps combined action string to 250 chars max', () => {
            const superLongAction = 'Moved from stage 7 to 8 • Dokumen diunggah: [Tanda Terima Disnaker] Tanda Terima Dokumen PT. RISTRA KLINIK INDONESIA_5 (1).pdf • Dokumen diunggah: [Revisi Dokumen Disnaker] Tanda Terima Dokumen PT. RISTRA KLINIK INDONESIA_5 (2).pdf • Dokumen diunggah: [Scan File Disnaker] Tanda Terima Dokumen PT. RISTRA KLINIK INDONESIA_5 (3).pdf';
            assert.ok(superLongAction.length > 255);
            const result = safeLimit(superLongAction, 250);
            assert.ok(result.length <= 250);
            assert.ok(result.endsWith('...'));
        });
    });

    // ── 4. Kanban Stage 8 Visibility ─────────────────────────────────────────
    describe('Kanban Stage 8 Visibility', () => {
        const getKanbanStage8Banner = (job) => {
            if (job.stage !== 8) return null;
            const sMap = {
                progress: { label: '⏳ PROSES DISNAKER', cls: 'bg-blue-50 text-blue-800' },
                stuck:    { label: '⚠️ TERKENDALA',       cls: 'bg-red-50 text-red-800' },
                ready:    { label: '✅ SELESAI DISNAKER', cls: 'bg-emerald-50 text-emerald-800' },
            };
            const badge = sMap[job.s8_progress_status] || { label: '⏳ DISNAKER (BELUM DIUPDATE)', cls: 'bg-slate-50 text-slate-600' };
            return {
                label: badge.label,
                delayReason: job.s8_progress_status === 'stuck' ? (job.s8_delay_reason || null) : null
            };
        };

        test('displays fallback when stage is 8 but status is not yet set', () => {
            const res = getKanbanStage8Banner({ stage: 8, s8_progress_status: null });
            assert.ok(res);
            assert.equal(res.label, '⏳ DISNAKER (BELUM DIUPDATE)');
        });

        test('displays PROSES DISNAKER when status is progress', () => {
            const res = getKanbanStage8Banner({ stage: 8, s8_progress_status: 'progress' });
            assert.equal(res.label, '⏳ PROSES DISNAKER');
        });

        test('displays TERKENDALA and delayReason when status is stuck', () => {
            const res = getKanbanStage8Banner({
                stage: 8,
                s8_progress_status: 'stuck',
                s8_delay_reason: 'Pejabat Disnaker sedang cuti'
            });
            assert.equal(res.label, '⚠️ TERKENDALA');
            assert.equal(res.delayReason, 'Pejabat Disnaker sedang cuti');
        });
    });
});
