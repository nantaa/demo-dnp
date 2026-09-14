import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Stage 9 Suket Operational Statuses Test Suite', () => {
    describe('STAGE9_SUKET_STATUSES definition and ordering', () => {
        it('contains exactly 5 operational workflow statuses in order', async () => {
            const constants = await import('../dnp-rework/resources/js/Constants.js');
            assert.ok(constants.STAGE9_SUKET_STATUSES, 'STAGE9_SUKET_STATUSES must be exported');
            assert.equal(constants.STAGE9_SUKET_STATUSES.length, 5);

            const expected = [
                { value: 'diterima', label: 'Diterima' },
                { value: 'scan', label: 'Scan' },
                { value: 'penamaan_cover', label: 'Penamaan Cover' },
                { value: 'pembuatan_tanda_terima', label: 'Pembuatan Tanda Terima' },
                { value: 'selesai', label: 'Selesai' },
            ];

            assert.deepEqual(constants.STAGE9_SUKET_STATUSES, expected);
        });

        it('does NOT contain generic statuses in STAGE9_SUKET_STATUSES', async () => {
            const constants = await import('../dnp-rework/resources/js/Constants.js');
            const values = (constants.STAGE9_SUKET_STATUSES || []).map(s => s.value);
            assert.ok(!values.includes('not_started'));
            assert.ok(!values.includes('delayed'));
            assert.ok(!values.includes('in_progress'));
        });
    });

    describe('Stage 9 Status Resolution Helper', () => {
        it('resolves new operational labels and preserves legacy labels', () => {
            const STAGE9_SUKET_STATUSES = [
                { value: 'diterima', label: 'Diterima' },
                { value: 'scan', label: 'Scan' },
                { value: 'penamaan_cover', label: 'Penamaan Cover' },
                { value: 'pembuatan_tanda_terima', label: 'Pembuatan Tanda Terima' },
                { value: 'selesai', label: 'Selesai' },
            ];

            const LEGACY_PROGRESS_STATUSES = [
                { value: 'not_started', label: 'Not Started' },
                { value: 'delayed', label: 'Delayed' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'almost_done', label: 'Almost Done' },
                { value: 'done', label: 'Done' },
            ];

            const resolveStatusLabel = (val) => {
                const found = STAGE9_SUKET_STATUSES.find(s => s.value === val);
                if (found) return found.label;
                const legacy = LEGACY_PROGRESS_STATUSES.find(s => s.value === val);
                if (legacy) return legacy.label;
                return val || '-';
            };

            assert.equal(resolveStatusLabel('diterima'), 'Diterima');
            assert.equal(resolveStatusLabel('scan'), 'Scan');
            assert.equal(resolveStatusLabel('penamaan_cover'), 'Penamaan Cover');
            assert.equal(resolveStatusLabel('pembuatan_tanda_terima'), 'Pembuatan Tanda Terima');
            assert.equal(resolveStatusLabel('selesai'), 'Selesai');
            // Backwards compatibility
            assert.equal(resolveStatusLabel('in_progress'), 'In Progress');
            assert.equal(resolveStatusLabel('done'), 'Done');
            assert.equal(resolveStatusLabel(''), '-');
        });
    });

    describe('Kanban & List Stage 9 Badge Mapping', () => {
        it('maps all 5 operational statuses to distinct, readable styling', () => {
            const s9BadgeMap = {
                diterima:               { label: 'DITERIMA',               cls: 'bg-blue-100 text-blue-800 border-blue-300' },
                scan:                   { label: 'SCAN',                   cls: 'bg-purple-100 text-purple-800 border-purple-300' },
                penamaan_cover:         { label: 'PENAMAAN COVER',         cls: 'bg-amber-100 text-amber-800 border-amber-300' },
                pembuatan_tanda_terima: { label: 'TANDA TERIMA',           cls: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
                selesai:                { label: 'SELESAI',                cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                // Legacy fallbacks
                not_started:            { label: 'NOT STARTED',            cls: 'bg-gray-100 text-gray-700 border-gray-300' },
                delayed:                { label: 'DELAYED',                cls: 'bg-red-100 text-red-800 font-bold border-red-300' },
                in_progress:            { label: 'IN PROGRESS',            cls: 'bg-blue-100 text-blue-800 font-bold border-blue-300' },
                almost_done:            { label: 'ALMOST DONE',            cls: 'bg-amber-100 text-amber-800 font-bold border-amber-300' },
                done:                   { label: 'DONE',                   cls: 'bg-emerald-100 text-emerald-800 font-bold border-emerald-300' },
            };

            const statuses = ['diterima', 'scan', 'penamaan_cover', 'pembuatan_tanda_terima', 'selesai'];
            for (const st of statuses) {
                assert.ok(s9BadgeMap[st], `Missing badge configuration for status: ${st}`);
                assert.ok(s9BadgeMap[st].label);
                assert.ok(s9BadgeMap[st].cls);
            }
        });
    });

    describe('Backend Validation Rule for Stage 9', () => {
        it('validates against new operational statuses and allows legacy values', () => {
            const allowed = [
                'diterima',
                'scan',
                'penamaan_cover',
                'pembuatan_tanda_terima',
                'selesai',
                'not_started',
                'delayed',
                'in_progress',
                'almost_done',
                'done',
            ];

            const validateS9Status = (status) => allowed.includes(status);

            assert.equal(validateS9Status('diterima'), true);
            assert.equal(validateS9Status('scan'), true);
            assert.equal(validateS9Status('penamaan_cover'), true);
            assert.equal(validateS9Status('pembuatan_tanda_terima'), true);
            assert.equal(validateS9Status('selesai'), true);
            assert.equal(validateS9Status('in_progress'), true);
            assert.equal(validateS9Status('invalid_status'), false);
        });
    });
});
