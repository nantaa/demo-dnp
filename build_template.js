const fs = require('fs');
const path = require('path');

const docXmlPath = path.join(__dirname, 'scratch_docx', 'word', 'document.xml');
let xml = fs.readFileSync(docXmlPath, 'utf8');

// 1. Replace empty inspector 1 name cell (paraId="507ECD2F")
xml = xml.replace(
    /(<w:p[^>]*w14:paraId="507ECD2F"[^>]*><w:pPr>.*?<\/w:pPr>)(<\/w:p>)/s,
    `$1<w:r><w:rPr><w:rFonts w:ascii="Montserrat" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Montserrat" w:cstheme="minorBidi"/><w:b/><w:bCs/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="id-ID" w:eastAsia="id-ID"/></w:rPr><w:t>\${nama_ins_1}</w:t></w:r>$2`
);

// 2. Replace empty inspector 1 position cell (paraId="29DBE3AA")
xml = xml.replace(
    /(<w:p[^>]*w14:paraId="29DBE3AA"[^>]*><w:pPr>.*?<\/w:pPr>)(<\/w:p>)/s,
    `$1<w:r><w:rPr><w:rFonts w:ascii="Montserrat" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Montserrat" w:cstheme="minorBidi"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="id-ID" w:eastAsia="id-ID"/></w:rPr><w:t>\${jabatan_ins_1}</w:t></w:r>$2`
);

// 3. Replace empty inspector 2 name cell (paraId="35C14DBE")
xml = xml.replace(
    /(<w:p[^>]*w14:paraId="35C14DBE"[^>]*><w:pPr>.*?<\/w:pPr>)(<\/w:p>)/s,
    `$1<w:r><w:rPr><w:rFonts w:ascii="Montserrat" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Montserrat" w:cstheme="minorBidi"/><w:b/><w:bCs/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="id-ID" w:eastAsia="id-ID"/></w:rPr><w:t>\${nama_ins_2}</w:t></w:r>$2`
);

// 4. Replace empty inspector 2 position cell (paraId="78AAB293")
xml = xml.replace(
    /(<w:p[^>]*w14:paraId="78AAB293"[^>]*><w:pPr>.*?<\/w:pPr>)(<\/w:p>)/s,
    `$1<w:r><w:rPr><w:rFonts w:ascii="Montserrat" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Montserrat" w:cstheme="minorBidi"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="id-ID" w:eastAsia="id-ID"/></w:rPr><w:t>\${jabatan_ins_2}</w:t></w:r>$2`
);

// 5. Replace Perusahaan value (paraId="29CB3EC9")
xml = xml.replace(
    /(<w:p[^>]*w14:paraId="29CB3EC9"[^>]*>.*?<w:t[^>]*>:  <\/w:t><\/w:r>)(<\/w:p>)/s,
    `$1<w:r><w:rPr><w:rFonts w:ascii="Montserrat" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Montserrat"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="id-ID" w:eastAsia="id-ID"/></w:rPr><w:t>\${perusahaan}</w:t></w:r>$2`
);

// 6. Replace No. Surat / PO value (paraId="753469F3")
xml = xml.replace(
    /(<w:p[^>]*w14:paraId="753469F3"[^>]*>.*?<w:t[^>]*>:  -<\/w:t><\/w:r>)(<\/w:p>)/s,
    `$1<w:r><w:rPr><w:rFonts w:ascii="Montserrat" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Montserrat"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="id-ID" w:eastAsia="id-ID"/></w:rPr><w:t>\${no_po}</w:t></w:r>$2`
);

// 7. Replace Marketing value (paraId="2910EAB7")
xml = xml.replace(
    /(<w:p[^>]*w14:paraId="2910EAB7"[^>]*>.*?<w:t[^>]*>:  <\/w:t><\/w:r>)(<\/w:p>)/s,
    `$1<w:r><w:rPr><w:rFonts w:ascii="Montserrat" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Montserrat" w:cstheme="minorBidi"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="id-ID" w:eastAsia="id-ID"/></w:rPr><w:t>\${marketing}</w:t></w:r>$2`
);

// 8. Replace Bekasi, ... ........ 202.... (paraId="41CFB2C7")
xml = xml.replace(
    /(<w:p[^>]*w14:paraId="41CFB2C7"[^>]*>.*?<w:t[^>]*>Bekasi, <\/w:t><\/w:r>).*?(<\/w:p>)/s,
    `$1<w:r><w:rPr><w:rFonts w:ascii="Montserrat" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Montserrat" w:cstheme="minorBidi"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="id-ID" w:eastAsia="id-ID"/></w:rPr><w:t>\${tgl_surat}</w:t></w:r>$2`
);

// 9. Replace Table Row for units (w:tr containing w14:paraId="3CB94A46")
// We will replace the entire row XML with our simplified XML containing ${no}, ${nama_alat}, ${lokasi}, ${tanggal}, ${pic}
const targetRowPattern = /<w:tr[^>]*w14:paraId="3CB94A46".*?<\/w:tr>/s;
const replacementRow = `<w:tr w:rsidR="000B3FF9" w:rsidRPr="00690AD8" w14:paraId="3CB94A46" w14:textId="77777777" w:rsidTr="000B3FF9">
  <w:trPr><w:trHeight w:val="851"/></w:trPr>
  <w:tc>
    <w:tcPr><w:tcW w:w="523" w:type="dxa"/></w:tcPr>
    <w:p w14:paraId="33E7FA4F" w14:textId="77777777" w:rsidR="000B3FF9" w:rsidRPr="00690AD8" w:rsidRDefault="000B3FF9" w:rsidP="008300BB">
      <w:pPr><w:pStyle w:val="TableParagraph"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Montserrat" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Montserrat" w:cstheme="minorBidi"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="id-ID" w:eastAsia="id-ID"/></w:rPr></w:pPr>
      <w:r w:rsidRPr="00690AD8">
        <w:rPr><w:rFonts w:ascii="Montserrat" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Montserrat" w:cstheme="minorBidi"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="id-ID" w:eastAsia="id-ID"/></w:rPr>
        <w:t>\${no}</w:t>
      </w:r>
    </w:p>
  </w:tc>
  <w:tc>
    <w:tcPr><w:tcW w:w="1573" w:type="dxa"/></w:tcPr>
    <w:p w14:paraId="657A8981" w14:textId="1D2542AC" w:rsidR="000B3FF9" w:rsidRPr="00690AD8" w:rsidRDefault="006324DC" w:rsidP="000B3FF9">
      <w:pPr><w:pStyle w:val="TableParagraph"/><w:spacing w:line="268" w:lineRule="exact"/><w:ind w:left="151"/><w:rPr><w:rFonts w:ascii="Montserrat" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Montserrat" w:cstheme="minorBidi"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="id-ID" w:eastAsia="id-ID"/></w:rPr></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Montserrat" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Montserrat" w:cstheme="minorBidi"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="id-ID" w:eastAsia="id-ID"/></w:rPr>
        <w:t>\${nama_alat}</w:t>
      </w:r>
    </w:p>
  </w:tc>
  <w:tc>
    <w:tcPr><w:tcW w:w="3696" w:type="dxa"/></w:tcPr>
    <w:p w14:paraId="37C67262" w14:textId="060C2464" w:rsidR="000B3FF9" w:rsidRPr="006324DC" w:rsidRDefault="006324DC" w:rsidP="00690AD8">
      <w:pPr><w:spacing w:after="0"/><w:ind w:left="140" w:right="148"/><w:jc w:val="both"/><w:rPr><w:rFonts w:ascii="Montserrat" w:hAnsi="Montserrat" w:cs="Calibri"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="id-ID"/></w:rPr></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Montserrat" w:hAnsi="Montserrat"/><w:color w:val="1F1F1F"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/><w:lang w:val="id-ID"/></w:rPr>
        <w:t>\${lokasi}</w:t>
      </w:r>
    </w:p>
  </w:tc>
  <w:tc>
    <w:tcPr><w:tcW w:w="1701" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>
    <w:p w14:paraId="1F1D5EC6" w14:textId="0F58CDB3" w:rsidR="000B3FF9" w:rsidRPr="00690AD8" w:rsidRDefault="006324DC" w:rsidP="008300BB">
      <w:pPr><w:pStyle w:val="TableParagraph"/><w:spacing w:line="268" w:lineRule="exact"/><w:ind w:right="5"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Montserrat" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Montserrat" w:cstheme="minorBidi"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="id-ID" w:eastAsia="id-ID"/></w:rPr></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Montserrat" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Montserrat" w:cstheme="minorBidi"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="id-ID" w:eastAsia="id-ID"/></w:rPr>
        <w:t>\${tanggal}</w:t>
      </w:r>
    </w:p>
  </w:tc>
  <w:tc>
    <w:tcPr><w:tcW w:w="1701" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>
    <w:p w14:paraId="1C0EBBF0" w14:textId="11D2C551" w:rsidR="000B3FF9" w:rsidRDefault="006324DC" w:rsidP="008300BB">
      <w:pPr><w:pStyle w:val="TableParagraph"/><w:spacing w:line="247" w:lineRule="exact"/><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Montserrat" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Montserrat" w:cstheme="minorBidi"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="id-ID" w:eastAsia="id-ID"/></w:rPr></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Montserrat" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Montserrat" w:cstheme="minorBidi"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:lang w:val="id-ID" w:eastAsia="id-ID"/></w:rPr>
        <w:t>\${pic}</w:t>
      </w:r>
    </w:p>
  </w:tc>
</w:tr>`;

xml = xml.replace(targetRowPattern, replacementRow);

fs.writeFileSync(docXmlPath, xml, 'utf8');
console.log('Successfully updated document.xml with placeholders.');
