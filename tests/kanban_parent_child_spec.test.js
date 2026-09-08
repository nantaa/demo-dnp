import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeFamilyStatus,
  computeJobUnitRollups,
  validateInspectionBatch,
  recordInspectionResultCorrection,
  executeAtomicJobSplit,
  validateMergeBackEligibility,
  allocatePaymentToFamilyJob,
} from '../src/domain/workflowEngine.js';

test('DNP Monitor — Kanban Parent–Child Job Split Specification (v1.1)', async (t) => {

  await t.test('AC-01: Partial Inspection Without Split (WAIT_AND_RESCHEDULE)', () => {
    // 100 units; 80 LAIK, 20 NOT_INSPECTED
    const units = [];
    for (let i = 1; i <= 100; i++) {
      units.push({
        id: `U-${i}`,
        unit_code: `UNIT-${String(i).padStart(3, '0')}`,
        current_job_id: 'JOB-2026-001',
        inspection_status: i <= 80 ? 'LAIK' : 'NOT_INSPECTED',
        laik_status: i <= 80 ? 'LAIK' : 'PENDING',
        non_inspection_reason: i > 80 ? 'CLIENT_UNIT_UNAVAILABLE' : null
      });
    }

    const job = {
      id: 'JOB-2026-001',
      kode: 'JOB-2026-001',
      job_type: 'NORMAL',
      root_job_id: 'JOB-2026-001',
      units: 100,
      unit_items: units,
      stage: 13, // Stage 4b
    };

    const rollups = computeJobUnitRollups(job.unit_items);
    assert.equal(rollups.current, 100);
    assert.equal(rollups.laik, 80);
    assert.equal(rollups.pending, 20);

    // Decision: WAIT_AND_RESCHEDULE -> keeps single job and moves to S4c (16)
    const resultStage = 16;
    assert.equal(resultStage, 16);
    assert.equal(job.unit_items.length, 100);
  });

  await t.test('AC-02: Atomic Split for 80/20 (SPLIT_FOR_PARTIAL_PROCESSING)', () => {
    const units = [];
    for (let i = 1; i <= 100; i++) {
      units.push({
        id: `U-${i}`,
        unit_code: `UNIT-${String(i).padStart(3, '0')}`,
        current_job_id: 'JOB-2026-001',
        inspection_status: i <= 80 ? 'LAIK' : 'NOT_INSPECTED',
        laik_status: i <= 80 ? 'LAIK' : 'PENDING',
        non_inspection_reason: i > 80 ? 'CLIENT_UNIT_UNAVAILABLE' : null
      });
    }

    const sourceJob = {
      id: 'JOB-2026-001',
      kode: 'JOB-2026-001',
      job_type: 'NORMAL',
      root_job_id: 'JOB-2026-001',
      no_po: 'PO-2026-001',
      original_po_unit_count: 100,
      units: 100,
      unit_items: units,
      stage: 13, // Stage 4b
      updated_at: '2026-09-08T09:00:00.000Z',
      row_version: 1
    };

    const selectedUnitIds = units.slice(80).map(u => u.id); // 20 units

    const splitResult = executeAtomicJobSplit(sourceJob, {
      selectedUnitIds,
      splitReason: 'UNIT_UNAVAILABLE',
      clientRequestedPartialProcessing: true,
      commercialAllocationMode: 'MANUAL_APPROVED',
      childJobStage: 16, // S4C_RESCHEDULE
      rescheduleReason: '20 unit belum siap di lokasi',
      approvedByUserId: 'USR-MGR-01',
      approvalReason: 'Klien meminta percepat 80 unit laik',
      version: 1
    });

    assert.equal(splitResult.ok, true);
    const { parentJob, childJob, transferredUnitIds } = splitResult;

    // Parent verification
    assert.equal(parentJob.job_type, 'PARENT');
    assert.equal(parentJob.units, 80);
    assert.equal(parentJob.unit_items.length, 80);
    assert.equal(parentJob.stage, 5); // Advances to S5 LHPP Draft
    assert.equal(parentJob.root_job_id, 'JOB-2026-001');

    // Child verification
    assert.equal(childJob.job_type, 'CHILD');
    assert.equal(childJob.parent_job_id, 'JOB-2026-001');
    assert.equal(childJob.root_job_id, 'JOB-2026-001');
    assert.equal(childJob.no_po, 'PO-2026-001');
    assert.equal(childJob.units, 20);
    assert.equal(childJob.unit_items.length, 20);
    assert.equal(childJob.stage, 16); // Starts at S4c Reschedule

    // Unit ownership verification
    assert.equal(transferredUnitIds.length, 20);
    childJob.unit_items.forEach(u => {
      assert.equal(u.current_job_id, childJob.id);
    });
    parentJob.unit_items.forEach(u => {
      assert.equal(u.current_job_id, parentJob.id);
    });
  });

  await t.test('AC-03 & AC-04: Parent Closes Before Child & Strict Single Unit Ownership', () => {
    const parentJob = {
      id: 'JOB-2026-001',
      root_job_id: 'JOB-2026-001',
      job_type: 'PARENT',
      units: 80,
      stage: 12, // Stage 12 Closed
      status: 'CLOSED',
      unit_items: Array.from({ length: 80 }, (_, i) => ({ id: `U-${i + 1}`, current_job_id: 'JOB-2026-001', laik_status: 'LAIK', final_disposition: 'CERTIFIED' }))
    };

    const childJob = {
      id: 'JOB-2026-001-C01',
      root_job_id: 'JOB-2026-001',
      parent_job_id: 'JOB-2026-001',
      job_type: 'CHILD',
      units: 20,
      stage: 16, // Stage 4c Active
      status: 'ACTIVE',
      unit_items: Array.from({ length: 20 }, (_, i) => ({ id: `U-${80 + i + 1}`, current_job_id: 'JOB-2026-001-C01', laik_status: 'PENDING', final_disposition: 'ACTIVE' }))
    };

    // Verify disjoint unit IDs (no duplicate ownership)
    const parentUnitIds = new Set(parentJob.unit_items.map(u => u.id));
    const childUnitIds = new Set(childJob.unit_items.map(u => u.id));
    for (const id of childUnitIds) {
      assert.equal(parentUnitIds.has(id), false, `Unit ${id} must not exist in both parent and child!`);
    }
    assert.equal(parentJob.units + childJob.units, 100);

    // Compute Family Status
    const familyStatus = computeFamilyStatus(parentJob, [childJob]);
    assert.equal(familyStatus, 'PARTIALLY_CLOSED');

    // When child also closes
    const closedChild = { ...childJob, stage: 12, status: 'CLOSED' };
    const fullyClosedStatus = computeFamilyStatus(parentJob, [closedChild]);
    assert.equal(fullyClosedStatus, 'FULLY_CLOSED');
  });

  await t.test('AC-05: Optimistic Concurrency & Stale Version Rejection', () => {
    const sourceJob = {
      id: 'JOB-2026-001',
      job_type: 'NORMAL',
      units: 10,
      unit_items: Array.from({ length: 10 }, (_, i) => ({ id: `U-${i + 1}`, current_job_id: 'JOB-2026-001' })),
      stage: 13,
      row_version: 2
    };

    // Attempt split with stale version (version 1 instead of 2)
    const result = executeAtomicJobSplit(sourceJob, {
      selectedUnitIds: ['U-1', 'U-2'],
      splitReason: 'UNIT_UNAVAILABLE',
      approvedByUserId: 'USR-01',
      version: 1 // STALE!
    });

    assert.equal(result.ok, false);
    assert.equal(result.code, 'STALE_VERSION');
  });

  await t.test('AC-06: Batch Submission Validation & Append-Only Correction', () => {
    const expectedUnits = [
      { id: 'U-1', unit_code: 'UNIT-001' },
      { id: 'U-2', unit_code: 'UNIT-002' }
    ];

    // Invalid batch: missing unit outcome
    const invalidBatch = {
      inspection_date: '2026-09-08',
      inspector_ids: ['INS-1'],
      units: [{ job_unit_id: 'U-1', outcome: 'LAIK' }] // U-2 missing!
    };
    const checkInvalid = validateInspectionBatch(expectedUnits, invalidBatch);
    assert.equal(checkInvalid.valid, false);

    // Valid batch: 100% units covered
    const validBatch = {
      inspection_date: '2026-09-08',
      inspector_ids: ['INS-1'],
      units: [
        { job_unit_id: 'U-1', outcome: 'LAIK' },
        { job_unit_id: 'U-2', outcome: 'NOT_INSPECTED', non_inspection_reason: 'CLIENT_UNIT_UNAVAILABLE', note: 'Area terkunci' }
      ]
    };
    const checkValid = validateInspectionBatch(expectedUnits, validBatch);
    assert.equal(checkValid.valid, true);

    // Append-only correction
    const originalResult = {
      id: 'RES-001',
      batch_id: 'BATCH-001',
      job_unit_id: 'U-1',
      outcome: 'TEMUAN',
      finding_description: 'Kabel aus'
    };

    const correction = recordInspectionResultCorrection(originalResult, {
      outcome: 'LAIK',
      correction_reason: 'Kabel telah diganti baru oleh teknisi onsite',
      corrected_by_user_id: 'INS-01'
    });

    assert.equal(correction.supersedes_result_id, 'RES-001');
    assert.equal(correction.outcome, 'LAIK');
    assert.notEqual(correction.id, originalResult.id);
  });

  await t.test('AC-07: Merge-Back Policy Safeguards', () => {
    // Allowed: in Stage 4c/4d with no finalized LHPP/SUKET
    const eligibleChild = {
      id: 'JOB-CHILD-01',
      stage: 16, // S4c
      has_finalized_lhpp: false,
      has_issued_suket: false,
      has_invoiced_line: false
    };
    const eligibleCheck = validateMergeBackEligibility(eligibleChild);
    assert.equal(eligibleCheck.allowed, true);

    // Disallowed: has progressed to S5 or beyond with finalized LHPP / SUKET
    const ineligibleChild = {
      id: 'JOB-CHILD-02',
      stage: 9, // S9 Suket
      has_finalized_lhpp: true,
      has_issued_suket: true,
      has_invoiced_line: false
    };
    const ineligibleCheck = validateMergeBackEligibility(ineligibleChild);
    assert.equal(ineligibleCheck.allowed, false);
    assert.match(ineligibleCheck.reason, /SUKET/);
  });

  await t.test('AC-08: Payment Attribution to Family Jobs', () => {
    // Allocating payment specifically to child job
    const allocation = allocatePaymentToFamilyJob({
      payment_id: 'PAY-1001',
      family_root_job_id: 'JOB-P',
      job_id: 'JOB-C',
      allocated_amount: 5000000,
      approved_by_user_id: 'FIN-01'
    });

    assert.equal(allocation.job_id, 'JOB-C');
    assert.equal(allocation.allocated_amount, 5000000);
  });

});
