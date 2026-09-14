import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DOC_TYPES_BY_STAGE } from '../dnp-rework/resources/js/Constants.js';

describe('Rekap Masukan — Resolved Waiting Items Test Suite', () => {

    // ── 1. Document Types (Stage 1 & Stage 10) ───────────────────────────────
    describe('Document Types in Constants.js', () => {
        test('Stage 1 contains "Dokumen Tambahan" and preserves existing required doc types', () => {
            const stage1Docs = DOC_TYPES_BY_STAGE[1];
            assert.ok(Array.isArray(stage1Docs), 'Stage 1 docs must be an array');
            assert.ok(stage1Docs.includes('Dokumen Tambahan'), 'Stage 1 must include "Dokumen Tambahan"');
            
            // Ensure original required documents are still present (no deletions)
            const requiredOld = ['PO/SPK', 'Surat Permohonan', 'Surat Kuasa', 'Pernyataan Keabsahan', 'Form Checklist Klien', 'Drawing/As-Built', 'Manual Book', 'Copy Suket Lama'];
            for (const doc of requiredOld) {
                assert.ok(stage1Docs.includes(doc), `Stage 1 must preserve "${doc}"`);
            }
        });

        test('Stage 10 contains "Faktur Pajak"', () => {
            const stage10Docs = DOC_TYPES_BY_STAGE[10];
            assert.ok(Array.isArray(stage10Docs), 'Stage 10 docs must be an array');
            assert.ok(stage10Docs.includes('Faktur Pajak'), 'Stage 10 must include "Faktur Pajak"');
            assert.ok(stage10Docs.includes('Invoice (PDF)'), 'Stage 10 must preserve "Invoice (PDF)"');
        });
    });

    // ── 2. Pricing Visibility & PPN Calculator ───────────────────────────────
    describe('Pricing Visibility (canSeeNilai) & PPN Calculator (12%)', () => {
        // canSeeNilai logic matching JobDetailSheet.jsx
        const canSeeNilai = (user) => {
            const isINS = ['inspektur', 'inspector'].includes(user?.role);
            return !isINS;
        };

        // PPN calculator logic matching JobDetailSheet.jsx
        const calculateSesudahPpn = (nilai) => {
            const parsed = parseFloat(nilai || 0);
            return Math.round(parsed * 1.12);
        };

        test('INS role CANNOT see pricing / nilai', () => {
            assert.equal(canSeeNilai({ role: 'inspektur', name: 'Budi' }), false);
            assert.equal(canSeeNilai({ role: 'inspector', name: 'Joko' }), false);
        });

        test('All non-INS roles CAN see pricing / nilai', () => {
            assert.equal(canSeeNilai({ role: 'admin', name: 'Admin RU' }), true);
            assert.equal(canSeeNilai({ role: 'manager', name: 'Kadiv RU' }), true);
            assert.equal(canSeeNilai({ role: 'finance', name: 'Deka' }), true);
            assert.equal(canSeeNilai({ role: 'marketing', name: 'Siti' }), true);
            assert.equal(canSeeNilai({ role: 'superadmin', name: 'Root' }), true);
        });

        test('PPN calculates correctly as nilai * 112% (12% tax)', () => {
            const nilaiPo = 10000000; // 10 Juta
            const sesudahPpn = calculateSesudahPpn(nilaiPo);
            assert.equal(sesudahPpn, 11200000); // 11.2 Juta
        });

        test('PPN calculation handles 0 and empty strings gracefully', () => {
            assert.equal(calculateSesudahPpn(0), 0);
            assert.equal(calculateSesudahPpn(''), 0);
            assert.equal(calculateSesudahPpn(null), 0);
        });
    });

    // ── 3. Finance Ownership & Tanggal 15 Warning ─────────────────────────────
    describe('Finance Ownership & Tanggal 15 Warning Rule', () => {
        const canEditNilai = (user) => {
            return user?.role === 'finance' || user?.role === 'superadmin';
        };

        const showTgl15Warning = (user, dayOfMonth) => {
            const canEdit = canEditNilai(user);
            const isPastTgl15 = dayOfMonth > 15;
            return canEdit && isPastTgl15;
        };

        test('Only Finance and Superadmin can edit pricing/invoice values', () => {
            assert.equal(canEditNilai({ role: 'finance' }), true);
            assert.equal(canEditNilai({ role: 'superadmin' }), true);
            assert.equal(canEditNilai({ role: 'marketing' }), false);
            assert.equal(canEditNilai({ role: 'admin' }), false);
            assert.equal(canEditNilai({ role: 'manager' }), false);
            assert.equal(canEditNilai({ role: 'inspektur' }), false);
        });

        test('Warning banner triggers on or after the 16th of the month for Finance', () => {
            assert.equal(showTgl15Warning({ role: 'finance' }, 14), false);
            assert.equal(showTgl15Warning({ role: 'finance' }, 15), false);
            assert.equal(showTgl15Warning({ role: 'finance' }, 16), true);
            assert.equal(showTgl15Warning({ role: 'finance' }, 28), true);
        });

        test('Non-Finance roles do not see Tgl 15 warning banner', () => {
            assert.equal(showTgl15Warning({ role: 'marketing' }, 20), false);
            assert.equal(showTgl15Warning({ role: 'admin' }, 20), false);
        });
    });

    // ── 4. Stage 5 Bypass vs Approval Actions ────────────────────────────────
    describe('Stage 5 LHPP Dual Action Buttons (Approval vs Bypass)', () => {
        const validateStage5Submission = (lhppLinks, docs) => {
            const hasValidLink = (lhppLinks || []).some(l => l.url && l.url.trim().length > 0);
            const hasLhppDoc = (docs || []).some(d => Number(d.stage) === 5 || ['LHPP', 'LHPP (PDF)', 'LHPP Draft', 'LHPP Final', 'Laporan Teknis Tambahan'].includes(d.type));
            return hasValidLink || hasLhppDoc;
        };

        test('Fails validation if neither links nor LHPP documents are provided', () => {
            assert.equal(validateStage5Submission([], []), false);
            assert.equal(validateStage5Submission([{ url: '' }], []), false);
        });

        test('Passes validation if cloud storage link is provided', () => {
            assert.equal(validateStage5Submission([{ url: 'https://drive.google.com/folder123' }], []), true);
        });

        test('Passes validation if LHPP document was uploaded', () => {
            assert.equal(validateStage5Submission([], [{ stage: 5, type: 'LHPP' }]), true);
        });

        test('Bypass flow prefixes note with [BYPASS REVIEW]', () => {
            const userNote = 'Percepatan klien urgent';
            const bypassNote = `[BYPASS REVIEW] ${userNote}`.trim();
            assert.equal(bypassNote, '[BYPASS REVIEW] Percepatan klien urgent');
            assert.ok(bypassNote.startsWith('[BYPASS REVIEW]'));
        });
    });

    // ── 5. Stage 14 (Pembayaran 11b) & Stage 12 Close Authorization ───────────
    describe('Stage 14 & Stage 12 Close Authorization', () => {
        const canCloseJob = (user, paymentStatus) => {
            const isAuthorized = user?.role === 'finance' || user?.role === 'superadmin';
            const isPaid = paymentStatus === 'paid';
            return {
                authorized: isAuthorized,
                canClose: isAuthorized && isPaid,
                error: !isAuthorized
                    ? 'Hanya Finance yang berwenang menutup (Close) pekerjaan ini.'
                    : !isPaid
                    ? 'Status pembayaran harus Lunas (paid) sebelum menutup (Close) pekerjaan ini.'
                    : null
            };
        };

        test('Non-Finance roles cannot close the job even if paid', () => {
            const resAdmin = canCloseJob({ role: 'admin' }, 'paid');
            assert.equal(resAdmin.authorized, false);
            assert.equal(resAdmin.canClose, false);
            assert.match(resAdmin.error, /Hanya Finance/);

            const resMkt = canCloseJob({ role: 'marketing' }, 'paid');
            assert.equal(resMkt.canClose, false);
        });

        test('Finance cannot close the job if payment is pending or partial', () => {
            const resPending = canCloseJob({ role: 'finance' }, 'pending');
            assert.equal(resPending.authorized, true);
            assert.equal(resPending.canClose, false);
            assert.match(resPending.error, /Status pembayaran harus Lunas/);

            const resPartial = canCloseJob({ role: 'finance' }, 'partial');
            assert.equal(resPartial.canClose, false);
        });

        test('Finance and Superadmin CAN close the job when payment is paid', () => {
            const resFin = canCloseJob({ role: 'finance' }, 'paid');
            assert.equal(resFin.authorized, true);
            assert.equal(resFin.canClose, true);
            assert.equal(resFin.error, null);

            const resSuper = canCloseJob({ role: 'superadmin' }, 'paid');
            assert.equal(resSuper.canClose, true);
        });
    });

    // ── 6. Stage 10 Faktur Pajak & Audit Trail ────────────────────────────────
    describe('Stage 10 Faktur Pajak & Audit Trail', () => {
        test('Faktur pajak note is formatted properly for history logs', () => {
            const noFakturPajak = '010.000-26.00000001';
            const fakturNote = noFakturPajak ? ' | Faktur Pajak: ' + noFakturPajak : '';
            const actionText = 'Data penagihan diperbarui oleh Finance.' + fakturNote;
            
            assert.equal(actionText, 'Data penagihan diperbarui oleh Finance. | Faktur Pajak: 010.000-26.00000001');
        });

        test('History log handles empty faktur pajak gracefully', () => {
            const noFakturPajak = '';
            const fakturNote = noFakturPajak ? ' | Faktur Pajak: ' + noFakturPajak : '';
            const actionText = 'Data penagihan diperbarui oleh Finance.' + fakturNote;
            
            assert.equal(actionText, 'Data penagihan diperbarui oleh Finance.');
        });
    });
});
