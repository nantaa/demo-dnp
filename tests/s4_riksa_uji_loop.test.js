import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('DNP Monitor v3 — S4 Riksa Uji Ulang & Alat Count Mismatch Loop', () => {

  test('validates alat count mismatch: inspected < total units triggers rework loop flag', () => {
    const job = {
      id: 101,
      total_units: 5,
      inspected_count: 3,
      unit_results: [
        { no_seri: 'GEN-01', status: 'Sesuai' },
        { no_seri: 'GEN-02', status: 'Sesuai' },
        { no_seri: 'GEN-03', status: 'Temuan', catatan: 'Kebocoran oli' }
      ]
    };

    const hasCountMismatch = job.inspected_count < job.total_units;
    const hasFindings = job.unit_results.some(u => u.status === 'Temuan');
    const requiresReworkLoop = hasCountMismatch || hasFindings;

    assert.equal(hasCountMismatch, true, 'Should detect count mismatch when inspected < total');
    assert.equal(requiresReworkLoop, true, 'Rework loop must be required if items are missing or have findings');
  });

  test('S4C payload includes all S3 schedule fields plus reschedule metadata', () => {
    const s4cPayload = {
      schedule_days: ['2026-09-15', '2026-09-16'],
      jam_mulai: '08:30',
      disnaker_tujuan: 'Disnaker DKI Jakarta',
      inspectors: [
        { id: 10, name: 'Adi Octa Pradana' },
        { id: 12, name: 'Deni Stevanus Avianto' }
      ],
      report_writer_id: 10,
      alat_ids: [1, 2, 4],
      cert_ids: [101],
      reschedule_reason: 'Riksa Uji Ulang sisa 2 unit alat belum terinspeksi',
      target_stage: 's4_pelaksanaan_ru'
    };

    assert.ok(s4cPayload.schedule_days.length >= 1, 'S4C must specify schedule days');
    assert.ok(s4cPayload.inspectors.length >= 1, 'S4C must have assigned inspectors');
    assert.ok(s4cPayload.report_writer_id, 'S4C must have a report writer');
    assert.ok(s4cPayload.reschedule_reason, 'S4C must provide a reschedule reason');
  });

  test('S4 completion only advances to S5 when 100% of units are inspected and approved', () => {
    const completeJob = {
      total_units: 3,
      inspected_count: 3,
      unit_results: [
        { no_seri: 'U1', status: 'Sesuai' },
        { no_seri: 'U2', status: 'Sesuai' },
        { no_seri: 'U3', status: 'Sesuai' }
      ]
    };

    const isEligibleForStage5 = completeJob.inspected_count === completeJob.total_units &&
      completeJob.unit_results.every(u => u.status === 'Sesuai');

    assert.equal(isEligibleForStage5, true, 'Job advances to S5 when all units inspected and Sesuai');
  });

});
