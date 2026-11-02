// scripts/generateManualPdf.js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const MD_PATH = path.join(ROOT_DIR, 'USER_MANUAL_COMPLETE.md');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'scripts', 'manualPrintTemplate.html');
const HTML_OUTPUT_PATH = path.join(ROOT_DIR, 'dist', 'manual_preview.html');
const PDF_OUTPUT_PATH = path.join(ROOT_DIR, 'USER_MANUAL_COMPLETE.pdf');

console.log('[BUILD] Reading USER_MANUAL_COMPLETE.md...');
const mdRaw = fs.readFileSync(MD_PATH, 'utf-8');
const templateRaw = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseMarkdown(md) {
  const lines = md.split('\n');
  const htmlOut = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines = [];
  let inTable = false;
  let tableLines = [];
  let inList = false;
  let listType = 'ul';

  function flushList() {
    if (inList) {
      htmlOut.push(`</${listType}>`);
      inList = false;
    }
  }

  function flushTable() {
    if (!inTable || tableLines.length === 0) return;
    
    // Parse table
    const cleanLines = tableLines.map(l => l.trim()).filter(l => l.startsWith('|') && l.endsWith('|'));
    if (cleanLines.length >= 2) {
      const headerRow = cleanLines[0].slice(1, -1).split('|').map(c => c.trim());
      const bodyRows = cleanLines.slice(2).map(r => r.slice(1, -1).split('|').map(c => c.trim()));
      
      let tableHtml = '<table><thead><tr>';
      for (const th of headerRow) {
        tableHtml += `<th>${inlineFormat(th)}</th>`;
      }
      tableHtml += '</tr></thead><tbody>';
      for (const row of bodyRows) {
        tableHtml += '<tr>';
        for (const cell of row) {
          tableHtml += `<td>${inlineFormat(cell)}</td>`;
        }
        tableHtml += '</tr>';
      }
      tableHtml += '</tbody></table>';
      htmlOut.push(tableHtml);
    }
    inTable = false;
    tableLines = [];
  }

  function inlineFormat(text) {
    if (!text) return '';
    // Format bold and italic
    let t = text;
    // Code spans
    t = t.replace(/`([^`]+)`/g, (m, c) => `<code>${escapeHtml(c)}</code>`);
    // Bold
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic
    t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Links
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return t;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code blocks
    if (trimmed.startsWith('```')) {
      flushList();
      flushTable();
      if (inCodeBlock) {
        const fullCode = escapeHtml(codeBlockLines.join('\n'));
        htmlOut.push(`<pre><code class="language-${codeBlockLang}">${fullCode}</code></pre>`);
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLang = '';
      } else {
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Tables
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      inTable = true;
      tableLines.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Horizontal Rule
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      flushList();
      htmlOut.push('<hr />');
      continue;
    }

    // Blockquotes
    if (trimmed.startsWith('>')) {
      flushList();
      const bqText = trimmed.replace(/^>\s*/, '');
      htmlOut.push(`<blockquote>${inlineFormat(bqText)}</blockquote>`);
      continue;
    }

    // Headers
    if (trimmed.startsWith('# ')) {
      flushList();
      const title = trimmed.replace(/^#\s+/, '');
      htmlOut.push(`<h1>${inlineFormat(title)}</h1>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      const title = trimmed.replace(/^##\s+/, '');
      htmlOut.push(`<h2>${inlineFormat(title)}</h2>`);
      continue;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      const title = trimmed.replace(/^###\s+/, '');
      htmlOut.push(`<h3>${inlineFormat(title)}</h3>`);
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      flushList();
      const title = trimmed.replace(/^####\s+/, '');
      htmlOut.push(`<h4>${inlineFormat(title)}</h4>`);
      continue;
    }

    // Unordered Lists
    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
        htmlOut.push('<ul>');
      }
      const itemContent = trimmed.replace(/^[-*]\s+/, '');
      htmlOut.push(`<li>${inlineFormat(itemContent)}</li>`);
      continue;
    }

    // Ordered Lists
    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
        htmlOut.push('<ol>');
      }
      const itemContent = trimmed.replace(/^\d+\.\s+/, '');
      htmlOut.push(`<li>${inlineFormat(itemContent)}</li>`);
      continue;
    }

    // Blank line
    if (!trimmed) {
      flushList();
      continue;
    }

    // Regular paragraph
    flushList();
    htmlOut.push(`<p>${inlineFormat(trimmed)}</p>`);
  }

  flushList();
  flushTable();

  return htmlOut.join('\n');
}

console.log('[BUILD] Converting Markdown to HTML...');
const bodyHtml = parseMarkdown(mdRaw);

// Insert custom title cover if needed
const styledBody = `
  <div class="doc-header">
    <h1>PANDUAN PENGGUNA RESMI & MANUAL OPERASIONAL</h1>
    <div class="doc-subtitle">DNP Monitor (Riksa Uji Management System) — Versi 2.4 Production</div>
    <div class="doc-meta">
      <span><strong>Penerbit:</strong> PT Delta Nusantara Persada</span>
      <span><strong>Klasifikasi:</strong> Standard Operating Procedure (SOP)</span>
      <span><strong>Tanggal Rilis:</strong> November 2026</span>
    </div>
  </div>
  ${bodyHtml}
`;

const finalHtml = templateRaw.replace('{{BODY_CONTENT}}', styledBody);

if (!fs.existsSync(path.dirname(HTML_OUTPUT_PATH))) {
  fs.mkdirSync(path.dirname(HTML_OUTPUT_PATH), { recursive: true });
}
fs.writeFileSync(HTML_OUTPUT_PATH, finalHtml, 'utf-8');
console.log(`[BUILD] Generated HTML preview at: ${HTML_OUTPUT_PATH}`);

// Compile PDF via Headless Edge
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
if (!fs.existsSync(edgePath)) {
  throw new Error(`Microsoft Edge not found at ${edgePath}`);
}

console.log('[BUILD] Compiling PDF via Headless Microsoft Edge...');
const edgeCmd = `"${edgePath}" --headless=new --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${PDF_OUTPUT_PATH}" --no-pdf-header-footer "${HTML_OUTPUT_PATH}"`;

try {
  execSync(edgeCmd, { stdio: 'inherit' });
  if (fs.existsSync(PDF_OUTPUT_PATH)) {
    const stats = fs.statSync(PDF_OUTPUT_PATH);
    console.log(`[SUCCESS] Generated USER_MANUAL_COMPLETE.pdf (${stats.size} bytes)`);
  } else {
    throw new Error('PDF output file was not created.');
  }
} catch (err) {
  console.error('[ERROR] Failed to compile PDF:', err.message);
  process.exit(1);
}
