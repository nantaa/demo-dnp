import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateStage11cPaymentVerification,
  canDeliverSuketBatch,
  computeAggregateJobStatus,
} from '../src/domain/workflowEngine.js';

describe('DNP Monitor v5-2-2 — Stage 11c Payment Verification & Gateway Loopback', () => {
  it('Finance sets status to Partial/Pending -> job loops back to Stage 11 and increments retry_count', () => {
    const job = {
      id: 'job-101',
      kode: 'DNP/2026/0101',
      stage: '11c',
      payment_retry_count: 0,
      total_invoice_amount: 50000000,
    };

    const verificationPayload = {
      status: 'Partial',
      amount_received: 25000000,
      bank_reference: 'MTR-BCA-123456',
      notes: 'Pembayaran baru DP 50%, sisa belum diterima',
      verified_by: 'Finance User 1',
    };

    const result = evaluateStage11cPaymentVerification(job, verificationPayload);

    assert.equal(result.nextStage, '11', 'Job must loop back to Stage 11 for Marketing re-collection');
    assert.equal(result.payment_retry_count, 1, 'Retry count must be incremented by 1');
    assert.equal(result.is_unlocked_for_suket, false, 'SUKET delivery must remain locked');
    assert.ok(result.notes.includes('DP 50%'));
  });

  it('Finance sets status to Verified (Lunas) -> enables Stage 11b SUKET delivery', () => {
    const job = {
      id: 'job-102',
      kode: 'DNP/2026/0102',
      stage: '11c',
      payment_retry_count: 1,
      total_invoice_amount: 50000000,
    };

    const verificationPayload = {
      status: 'Verified',
      amount_received: 50000000,
      bank_reference: 'MTR-BCA-789012',
      notes: 'Pelunasan 100% cocok dengan mutasi bank',
      verified_by: 'Finance User 1',
    };

    const result = evaluateStage11cPaymentVerification(job, verificationPayload);

    assert.equal(result.nextStage, '11b', 'Job must advance to Stage 11b on Lunas');
    assert.equal(result.payment_retry_count, 1, 'Retry count does not increment on success');
    assert.equal(result.is_unlocked_for_suket, true, 'SUKET delivery must be unlocked');
  });

  it('blocks Stage 11b SUKET delivery if payment verification is not Verified', () => {
    const jobWithPendingPayment = {
      id: 'job-103',
      latest_payment_verification: {
        status: 'Pending',
      },
    };

    const check = canDeliverSuketBatch(jobWithPendingPayment);
    assert.equal(check.allowed, false);
    assert.ok(check.message.includes('belum diverifikasi') || check.message.includes('Verified') || check.message.includes('Lunas'));
  });
});
