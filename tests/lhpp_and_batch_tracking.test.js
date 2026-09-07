import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLHPPLeadTimes,
  calculateBatchSuketDuration,
  canAssignUnitToBatch,
} from '../src/domain/workflowEngine.js';

describe('DNP Monitor v5-2-2 — LHPP 3-Date Milestone & Batch SUKET Duration Tracking', () => {
  it('computes LHPP sub-phase lead times from 3 tracking dates', () => {
    const lhppData = {
      tanggal_data_teknis_diserahkan: '2026-08-01',
      tanggal_mulai_pengerjaan: '2026-08-05',
      tanggal_selesai: '2026-08-10',
    };

    const leadTimes = calculateLHPPLeadTimes(lhppData);

    assert.equal(leadTimes.queue_days, 4, 'Antrian/Queue lead time must be 4 days (1 Aug to 5 Aug)');
    assert.equal(leadTimes.drafting_days, 5, 'Pengerjaan/Drafting lead time must be 5 days (5 Aug to 10 Aug)');
    assert.equal(leadTimes.total_days, 9, 'Total LHPP turnaround time must be 9 days');
  });

  it('computes Batch SUKET processing duration as terbit - input', () => {
    const batch = {
      id: 'batch-01',
      tanggal_input_suket: '2026-08-15',
      tanggal_terbit_suket: '2026-08-25',
    };

    const duration = calculateBatchSuketDuration(batch);
    assert.equal(duration, 10, 'SUKET process duration must be 10 calendar days');
  });

  it('validates unit eligibility for batching: only Approved LHPP can be batched', () => {
    const unitWithDraftLhpp = {
      id: 'u-1',
      nama_alat: 'Overhead Crane 10T',
      final_lhpp: { status: 'Draft' },
      batch_id: null,
    };

    const unitWithApprovedLhpp = {
      id: 'u-2',
      nama_alat: 'Forklift 3T',
      final_lhpp: { status: 'Approved' },
      batch_id: null,
    };

    const checkDraft = canAssignUnitToBatch(unitWithDraftLhpp);
    assert.equal(checkDraft.allowed, false);

    const checkApproved = canAssignUnitToBatch(unitWithApprovedLhpp);
    assert.equal(checkApproved.allowed, true);
  });
});
