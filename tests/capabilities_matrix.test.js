import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Project Capabilities & Boundaries HTML Specification', () => {
  const htmlPath = path.resolve(process.cwd(), 'public/PROJECT_CAPABILITIES_AND_BOUNDARIES.html');

  test('HTML file exists in public directory', () => {
    assert.ok(fs.existsSync(htmlPath), 'PROJECT_CAPABILITIES_AND_BOUNDARIES.html must exist');
  });

  test('HTML documents all 16 supported stages and core capabilities', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('16-Stage') || content.includes('16 Stages'), 'Must document 16-stage architecture');
    assert.ok(content.includes('Tim RU'), 'Must document Tim RU role parity');
    assert.ok(content.includes('PPN 11%'), 'Must document PPN 11% calculation');
    assert.ok(content.includes('Daily Digest'), 'Must document Daily Digest email');
    assert.ok(content.includes('Document Preview Modal') || content.includes('Preview Modal'), 'Must document preview popup modal');
    assert.ok(content.includes('Invoice, Kwitansi & Faktur Pajak'), 'Must document Stage 10 unified invoice upload');
  });

  test('HTML explicitly documents system limitations and what is NOT included', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('v3') || content.includes('Version 3'), 'Must explain v3 exclusion');
    assert.ok(content.includes('Disnaker') && (content.includes('API') || content.includes('External')), 'Must document lack of government API integration');
    assert.ok(content.includes('Bank') || content.includes('Payment Gateway'), 'Must document manual bank reconciliation limitation');
    assert.ok(content.includes('WebSocket') || content.includes('Polling'), 'Must document polling architecture vs WebSocket');
  });

  test('HTML contains interactive search and category filtering elements', () => {
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('filterCapability'), 'Must contain filter script function');
    assert.ok(content.includes('searchInput'), 'Must contain search input element');
  });
});
