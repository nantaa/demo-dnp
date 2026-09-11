import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canReleaseSuketForBatch,
  verifyBatchPayment,
  maskSensitiveData,
} from '../src/domain/workflowEngine.js';

describe('DNP Monitor v3 — Batch Invoicing, Pro-rata Payment Verification & Document Masking', () => {

  it('allows Batch 1 SUKET dispatch when Batch 1 is verified paid, even if Batch 2 is in rework', () => {
    const job = {
      id: 'job-split-batch-1',
      termin_pembayaran: 'FULL',
      batches: [
        {
          id: 'batch-1',
          batch_sequence: 1,
          unit_ids: ['u1', 'u2'],
          current_stage: '11c',
          payment_status: 'Verified', // Paid for Batch 1
          suket_ready: true,
        },
        {
          id: 'batch-2',
          batch_sequence: 2,
          unit_ids: ['u3'],
          current_stage: '4b', // Stalled in rework
          payment_status: 'Pending',
          suket_ready: false,
        }
      ],
      units: [
        { id: 'u1', current_stage: '11c', status: 'Approved' },
        { id: 'u2', current_stage: '11c', status: 'Approved' },
        { id: 'u3', current_stage: '4b', status: 'ReworkLoop' },
      ]
    };

    const batch1Check = canReleaseSuketForBatch({ job, batchId: 'batch-1' });
    assert.equal(batch1Check.canRelease, true, 'Batch 1 should be allowed to dispatch SUKET');

    const batch2Check = canReleaseSuketForBatch({ job, batchId: 'batch-2' });
    assert.equal(batch2Check.canRelease, false, 'Batch 2 should be blocked from SUKET dispatch');
    assert.ok(batch2Check.reason.includes('belum lunas') || batch2Check.reason.includes('belum selesai'));
  });

  it('records batch-level payment verification and updates batch stage', () => {
    const job = {
      id: 'job-multi-batch',
      batches: [
        {
          id: 'batch-101',
          batch_sequence: 1,
          current_stage: 11,
          payment_status: 'Pending',
        }
      ]
    };

    const updatedJob = verifyBatchPayment({
      job,
      batchId: 'batch-101',
      status: 'Verified',
      verifiedBy: 'Finance Officer Dewi',
      amountReceived: 50000000,
    });

    const targetBatch = updatedJob.batches.find(b => b.id === 'batch-101');
    assert.equal(targetBatch.payment_status, 'Verified');
    assert.equal(targetBatch.verified_by, 'Finance Officer Dewi');
    assert.equal(targetBatch.current_stage, '11b');
    assert.equal(targetBatch.amount_received, 50000000);
  });

  it('masks sensitive documents (PO/Invoice PDFs with prices) for Admin role', () => {
    const job = {
      id: 'job-doc-security',
      nilai: 75000000,
      total_invoice_amount: 75000000,
      documents: [
        { type: 'PO/SPK', name: 'PO-Commercial.pdf', url: '/uploads/po-123.pdf', has_price: true },
        { type: 'Invoice', name: 'Invoice-Final.pdf', url: '/uploads/inv-123.pdf', has_price: true },
        { type: 'Technical Drawings', name: 'Drawing-Elevator.pdf', url: '/uploads/draw-123.pdf', has_price: false },
      ]
    };

    const masked = maskSensitiveData(job, 'admin');
    assert.equal(masked.nilai, null);
    assert.equal(masked.total_invoice_amount, null);

    // Verify document URLs with sensitive prices are masked or stripped for Admin
    const poDoc = masked.documents.find(d => d.type === 'PO/SPK');
    assert.equal(poDoc.url, null, 'Sensitive PO document URL must be null for admin');
    assert.equal(poDoc.masked, true);

    const invoiceDoc = masked.documents.find(d => d.type === 'Invoice');
    assert.equal(invoiceDoc.url, null, 'Sensitive Invoice document URL must be null for admin');
    assert.equal(invoiceDoc.masked, true);

    const drawingDoc = masked.documents.find(d => d.type === 'Technical Drawings');
    assert.equal(drawingDoc.url, '/uploads/draw-123.pdf', 'Technical drawing URL should be preserved');
  });

});
