/**
 * Flora & Bloom - Pure Native XLSX & XML Spreadsheet Generator
 * Xuất file Excel chuẩn binary .xlsx hoặc .xml với đầy đủ màu sắc, KPI, số điện thoại không mất số 0
 * và hoàn toàn KHÔNG bị Microsoft Excel hiển thị hộp thoại cảnh báo định dạng.
 */

// Hàm tính CRC32 cho ZIP
const makeCrcTable = () => {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
};

const CRC_TABLE = makeCrcTable();

const crc32 = (uint8Array) => {
  let crc = 0 ^ (-1);
  for (let i = 0; i < uint8Array.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ uint8Array[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
};

// Simple Pure JS ZIP Builder (Store method - 100% compliant with Excel, LibreOffice, Google Sheets)
export class SimpleZip {
  constructor() {
    this.files = [];
  }

  addFile(name, content) {
    const encoder = new TextEncoder();
    const data = typeof content === 'string' ? encoder.encode(content) : content;
    this.files.push({ name, data });
  }

  generateUint8Array() {
    const localHeaders = [];
    const centralDirs = [];
    let offset = 0;

    const encoder = new TextEncoder();

    for (const file of this.files) {
      const nameBytes = encoder.encode(file.name);
      const dataBytes = file.data;
      const fileCrc = crc32(dataBytes);
      const size = dataBytes.length;

      // Local file header (30 bytes + name + data)
      const lh = new Uint8Array(30 + nameBytes.length + size);
      const view = new DataView(lh.buffer);

      view.setUint32(0, 0x04034b50, true); // Local file header signature
      view.setUint16(4, 20, true);         // Version needed to extract (2.0)
      view.setUint16(6, 0, true);          // General purpose bit flag
      view.setUint16(8, 0, true);          // Compression method (0 = Store)
      view.setUint16(10, 0, true);         // File last mod time
      view.setUint12 ? null : null;
      view.setUint16(10, 0, true);
      view.setUint16(12, 0, true);         // File last mod date
      view.setUint32(14, fileCrc, true);   // CRC-32
      view.setUint32(18, size, true);      // Compressed size
      view.setUint32(22, size, true);      // Uncompressed size
      view.setUint16(26, nameBytes.length, true); // File name length
      view.setUint16(28, 0, true);         // Extra field length

      lh.set(nameBytes, 30);
      lh.set(dataBytes, 30 + nameBytes.length);

      localHeaders.push(lh);

      // Central directory header (46 bytes + name)
      const cd = new Uint8Array(46 + nameBytes.length);
      const cdView = new DataView(cd.buffer);

      cdView.setUint32(0, 0x02014b50, true); // Central file header signature
      cdView.setUint16(4, 20, true);         // Version made by
      cdView.setUint16(6, 20, true);         // Version needed to extract
      cdView.setUint16(8, 0, true);          // General purpose bit flag
      cdView.setUint16(10, 0, true);         // Compression method (0 = Store)
      cdView.setUint16(12, 0, true);         // Last mod time
      cdView.setUint16(14, 0, true);         // Last mod date
      cdView.setUint32(16, fileCrc, true);   // CRC-32
      cdView.setUint32(20, size, true);      // Compressed size
      cdView.setUint32(24, size, true);      // Uncompressed size
      cdView.setUint16(28, nameBytes.length, true); // File name length
      cdView.setUint16(30, 0, true);         // Extra field length
      cdView.setUint16(32, 0, true);         // File comment length
      cdView.setUint16(34, 0, true);         // Disk number start
      cdView.setUint16(36, 0, true);         // Internal file attributes
      cdView.setUint32(38, 0, true);         // External file attributes
      cdView.setUint32(42, offset, true);    // Relative offset of local header

      cd.set(nameBytes, 46);
      centralDirs.push(cd);

      offset += lh.length;
    }

    const cdOffset = offset;
    let cdSize = 0;
    for (const cd of centralDirs) cdSize += cd.length;

    // End of central directory record (22 bytes)
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);

    eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
    eocdView.setUint16(4, 0, true);          // Disk number
    eocdView.setUint16(6, 0, true);          // Disk with central dir
    eocdView.setUint16(8, this.files.length, true);  // Number of entries on this disk
    eocdView.setUint16(10, this.files.length, true); // Total entries
    eocdView.setUint32(12, cdSize, true);    // Size of central dir
    eocdView.setUint32(16, cdOffset, true);  // Offset of central dir
    eocdView.setUint16(20, 0, true);         // Comment length

    // Calculate total size
    const totalSize = cdOffset + cdSize + 22;
    const finalZip = new Uint8Array(totalSize);

    let curPos = 0;
    for (const lh of localHeaders) {
      finalZip.set(lh, curPos);
      curPos += lh.length;
    }
    for (const cd of centralDirs) {
      finalZip.set(cd, curPos);
      curPos += cd.length;
    }
    finalZip.set(eocd, curPos);

    return finalZip;
  }
}

// Escape XML Special Characters
const escapeXml = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Tạo file OpenXML (.xlsx) chuẩn native 100%
 */
export const generateNativeXlsxBlob = ({
  filteredOrders,
  totalRevenueExport,
  avgOrderVal,
  approvalRatePercent,
  approvedCount,
  exportTimeStr,
  filterDesc,
  statusLabels
}) => {
  const zip = new SimpleZip();

  // 1. [Content_Types].xml
  zip.addFile('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`);

  // 2. _rels/.rels
  zip.addFile('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);

  // 3. xl/_rels/workbook.xml.rels
  zip.addFile('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  // 4. xl/workbook.xml
  zip.addFile('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Báo Cáo Doanh Thu" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`);

  // 5. xl/styles.xml (Colors, fonts, borders, number formats)
  zip.addFile('xl/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="2">
    <numFmt numFmtId="164" formatCode="#,##0"/>
    <numFmt numFmtId="165" formatCode="@"/>
  </numFmts>
  <fonts count="6">
    <font><name val="Segoe UI"/><sz val="10"/><color rgb="FF222523"/></font>
    <font><name val="Segoe UI"/><sz val="15"/><b/><color rgb="FFFFFFFF"/></font>
    <font><name val="Segoe UI"/><sz val="10.5"/><b/><color rgb="FFFFFFFF"/></font>
    <font><name val="Segoe UI"/><sz val="10"/><b/><color rgb="FF1B3B2B"/></font>
    <font><name val="Segoe UI"/><sz val="12"/><b/><color rgb="FFC4685A"/></font>
    <font><name val="Segoe UI"/><sz val="10"/><i/><color rgb="FF6B7280"/></font>
  </fonts>
  <fills count="7">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1B3B2B"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAF8"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE8F3ED"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFAF8F5"/></patternFill></fill>
  </fills>
  <borders count="3">
    <border><left/><right/><top/><bottom/></border>
    <border>
      <left style="thin"><color rgb="FFD1DFD6"/></left>
      <right style="thin"><color rgb="FFD1DFD6"/></right>
      <top style="thin"><color rgb="FFD1DFD6"/></top>
      <bottom style="thin"><color rgb="FFD1DFD6"/></bottom>
    </border>
    <border>
      <top style="thin"><color rgb="FF1B3B2B"/></top>
      <bottom style="double"><color rgb="FF1B3B2B"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="10">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyBorder="1"/>
    <xf numFmtId="164" fontId="3" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right"/></xf>
    <xf numFmtId="165" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="164" fontId="4" fillId="5" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right"/></xf>
    <xf numFmtId="0" fontId="3" fillId="5" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right"/></xf>
    <xf numFmtId="0" fontId="3" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>`);

  // 6. xl/worksheets/sheet1.xml
  let sheetRows = '';
  let rIdx = 1;

  // Row 1: Banner Header
  sheetRows += `<row r="${rIdx}" ht="40" customHeight="1">
    <c r="A${rIdx}" s="1" t="inlineStr"><is><t>🧯 FLAMEGUARD PRO - BÁO CÁO DOANH THU &amp; TIẾN ĐỘ NGHIỆM THU PCCC</t></is></c>
  </row>`;
  rIdx++;

  // Row 2: Subtitle
  sheetRows += `<row r="${rIdx}" ht="20" customHeight="1">
    <c r="A${rIdx}" s="0" t="inlineStr"><is><t>Trung Tâm Kiểm Định Thiết Bị Cứu Hỏa FLAMEGUARD PRO (TCVN 3890:2023) • Ngày xuất: ${escapeXml(exportTimeStr)} • Người lập: Kỹ Sư Trưởng</t></is></c>
  </row>`;
  rIdx++;

  // Row 3: Blank
  rIdx++;

  // Row 4: KPI Line 1
  sheetRows += `<row r="${rIdx}" ht="24" customHeight="1">
    <c r="A${rIdx}" s="9" t="inlineStr"><is><t>💰 TỔNG DOANH THU ĐÃ LỌC:</t></is></c>
    <c r="B${rIdx}" s="5"><v>${totalRevenueExport}</v></c>
    <c r="D${rIdx}" s="9" t="inlineStr"><is><t>📦 TỔNG SỐ ĐƠN HÀNG:</t></is></c>
    <c r="E${rIdx}" s="3" t="inlineStr"><is><t>${filteredOrders.length} đơn hàng</t></is></c>
  </row>`;
  rIdx++;

  // Row 5: KPI Line 2
  sheetRows += `<row r="${rIdx}" ht="24" customHeight="1">
    <c r="A${rIdx}" s="9" t="inlineStr"><is><t>💵 GIÁ TRỊ TRUNG BÌNH/ĐƠN:</t></is></c>
    <c r="B${rIdx}" s="5"><v>${avgOrderVal}</v></c>
    <c r="D${rIdx}" s="9" t="inlineStr"><is><t>📸 TỶ LỆ DUYỆT ẢNH THẬT:</t></is></c>
    <c r="E${rIdx}" s="3" t="inlineStr"><is><t>${approvalRatePercent}% (${approvedCount}/${filteredOrders.length} đơn)</t></is></c>
  </row>`;
  rIdx++;

  // Row 6: Blank
  rIdx++;

  // Row 7: Table Headers
  const colHeaders = [
    'STT', 'Mã Đơn', 'Thời Gian Đặt', 'Khách Đặt', 'SĐT Khách', 'Người Nhận', 'SĐT Nhận',
    'Địa Chỉ Giao Thiết Bị', 'Khung Giờ Hẹn', 'Thiết Bị PCCC', 'Vật Tư Kèm Theo', 'Ghi Chú Nghiệm Thu', 'Ký Tên',
    'Ẩn Danh', 'Mã Voucher', 'Tiền Giảm (đ)', 'Phí Ship (đ)', 'Tổng Tiền (đ)', 'Trạng Thái', 'Duyệt Ảnh'
  ];

  const colLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];

  sheetRows += `<row r="${rIdx}" ht="28" customHeight="1">`;
  colHeaders.forEach((h, i) => {
    sheetRows += `<c r="${colLetters[i]}${rIdx}" s="2" t="inlineStr"><is><t>${escapeXml(h)}</t></is></c>`;
  });
  sheetRows += `</row>`;
  rIdx++;

  // Data Rows
  filteredOrders.forEach((o, idx) => {
    const sStyle = idx % 2 === 0 ? 4 : 3;
    const itemsList = Array.isArray(o.items) && o.items.length > 0
      ? o.items.map(it => `${it.name} (${Number(it.price || 0).toLocaleString('vi-VN')}đ)`).join('; ')
      : (o.productName || '');

    sheetRows += `<row r="${rIdx}" ht="22" customHeight="1">
      <c r="A${rIdx}" s="${sStyle}"><v>${idx + 1}</v></c>
      <c r="B${rIdx}" s="6" t="inlineStr"><is><t>#${escapeXml(o.orderCode || o.id)}</t></is></c>
      <c r="C${rIdx}" s="6" t="inlineStr"><is><t>${escapeXml(o.createdAt || 'Hôm nay')}</t></is></c>
      <c r="D${rIdx}" s="${sStyle}" t="inlineStr"><is><t>${escapeXml(o.customerName || 'Khách vãng lai')}</t></is></c>
      <c r="E${rIdx}" s="6" t="inlineStr"><is><t>${escapeXml(o.customerPhone || '-')}</t></is></c>
      <c r="F${rIdx}" s="${sStyle}" t="inlineStr"><is><t>${escapeXml(o.receiverName || '-')}</t></is></c>
      <c r="G${rIdx}" s="6" t="inlineStr"><is><t>${escapeXml(o.receiverPhone || '-')}</t></is></c>
      <c r="H${rIdx}" s="${sStyle}" t="inlineStr"><is><t>${escapeXml(o.receiverAddress || '-')}</t></is></c>
      <c r="I${rIdx}" s="6" t="inlineStr"><is><t>${escapeXml(o.deliverySlot || 'Hỏa tốc 90 phút')}</t></is></c>
      <c r="J${rIdx}" s="${sStyle}" t="inlineStr"><is><t>${escapeXml(o.productName || 'Thiết Bị PCCC')}</t></is></c>
      <c r="K${rIdx}" s="${sStyle}" t="inlineStr"><is><t>${escapeXml(itemsList)}</t></is></c>
      <c r="L${rIdx}" s="${sStyle}" t="inlineStr"><is><t>${escapeXml(o.cardMessage || 'Không kèm thiệp')}</t></is></c>
      <c r="M${rIdx}" s="6" t="inlineStr"><is><t>${escapeXml(o.senderSign || '-')}</t></is></c>
      <c r="N${rIdx}" s="6" t="inlineStr"><is><t>${o.isAnonymous ? 'Có' : 'Không'}</t></is></c>
      <c r="O${rIdx}" s="6" t="inlineStr"><is><t>${escapeXml(o.discountCode || '-')}</t></is></c>
      <c r="P${rIdx}" s="5"><v>${Number(o.discountAmount || 0)}</v></c>
      <c r="Q${rIdx}" s="5"><v>${Number(o.shippingFee || 0)}</v></c>
      <c r="R${rIdx}" s="5"><v>${Number(o.totalAmount || 0)}</v></c>
      <c r="S${rIdx}" s="6" t="inlineStr"><is><t>${escapeXml(statusLabels[o.status] || o.status || 'Đang xử lý')}</t></is></c>
      <c r="T${rIdx}" s="6" t="inlineStr"><is><t>${o.isApproved ? 'Đã duyệt ảnh' : 'Chưa duyệt'}</t></is></c>
    </row>`;
    rIdx++;
  });

  // Footer Total Row
  const totalDiscount = filteredOrders.reduce((sum, o) => sum + Number(o.discountAmount || 0), 0);
  const totalShipping = filteredOrders.reduce((sum, o) => sum + Number(o.shippingFee || 0), 0);

  sheetRows += `<row r="${rIdx}" ht="28" customHeight="1">
    <c r="A${rIdx}" s="8" t="inlineStr"><is><t>TỔNG CỘNG (${filteredOrders.length} ĐƠN):</t></is></c>
    <c r="B${rIdx}" s="8"/>
    <c r="C${rIdx}" s="8"/>
    <c r="D${rIdx}" s="8"/>
    <c r="E${rIdx}" s="8"/>
    <c r="F${rIdx}" s="8"/>
    <c r="G${rIdx}" s="8"/>
    <c r="H${rIdx}" s="8"/>
    <c r="I${rIdx}" s="8"/>
    <c r="J${rIdx}" s="8"/>
    <c r="K${rIdx}" s="8"/>
    <c r="L${rIdx}" s="8"/>
    <c r="M${rIdx}" s="8"/>
    <c r="N${rIdx}" s="8"/>
    <c r="O${rIdx}" s="8"/>
    <c r="P${rIdx}" s="7"><v>${totalDiscount}</v></c>
    <c r="Q${rIdx}" s="7"><v>${totalShipping}</v></c>
    <c r="R${rIdx}" s="7"><v>${totalRevenueExport}</v></c>
    <c r="S${rIdx}" s="8" t="inlineStr"><is><t>HOÀN TẤT</t></is></c>
    <c r="T${rIdx}" s="8"/>
  </row>`;

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="6" customWidth="1"/>
    <col min="2" max="2" width="14" customWidth="1"/>
    <col min="3" max="3" width="14" customWidth="1"/>
    <col min="4" max="4" width="18" customWidth="1"/>
    <col min="5" max="5" width="14" customWidth="1"/>
    <col min="6" max="6" width="18" customWidth="1"/>
    <col min="7" max="7" width="14" customWidth="1"/>
    <col min="8" max="8" width="28" customWidth="1"/>
    <col min="9" max="9" width="16" customWidth="1"/>
    <col min="10" max="10" width="22" customWidth="1"/>
    <col min="11" max="11" width="24" customWidth="1"/>
    <col min="12" max="12" width="26" customWidth="1"/>
    <col min="13" max="13" width="14" customWidth="1"/>
    <col min="14" max="14" width="10" customWidth="1"/>
    <col min="15" max="15" width="12" customWidth="1"/>
    <col min="16" max="16" width="14" customWidth="1"/>
    <col min="17" max="17" width="12" customWidth="1"/>
    <col min="18" max="18" width="16" customWidth="1"/>
    <col min="19" max="19" width="14" customWidth="1"/>
    <col min="20" max="20" width="14" customWidth="1"/>
  </cols>
  <sheetData>
    ${sheetRows}
  </sheetData>
  <mergeCells count="2">
    <mergeCell ref="A1:T1"/>
    <mergeCell ref="A${rIdx}:O${rIdx}"/>
  </mergeCells>
</worksheet>`;

  zip.addFile('xl/worksheets/sheet1.xml', sheetXml);

  const uint8 = zip.generateUint8Array();
  return new Blob([uint8], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
