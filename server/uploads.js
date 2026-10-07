// server/uploads.js
// Lưu ảnh do admin tải lên thành tệp thật trong DATA_DIR/uploads (nằm trong volume dữ liệu nên được sao lưu và không mất khi deploy).
// Chỉ nhận PNG / JPEG / WEBP, kiểm tra theo nội dung thật của tệp (không tin Content-Type), KHÔNG nhận SVG (có thể chứa script).
// Zero-dependency: dùng được cả ở server/server.js lẫn máy chủ dev của Vite.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DATA_DIR, atomicWriteFileSync } from './storage.js';

export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
export const UPLOAD_MAX_BYTES = 3 * 1024 * 1024;
export const UPLOAD_URL_PREFIX = '/uploads/';

const EXT_BY_MIME = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
export const CONTENT_TYPE_BY_EXT = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };

// Tên tệp do server sinh: <13 chữ số thời gian>-<16 ký tự hex>.<đuôi>. Không cho phép gì khác (chặn path traversal).
const UPLOAD_NAME_PATTERN = /^[0-9]{13}-[a-f0-9]{16}\.(png|jpg|webp)$/;

// Nhận diện định dạng thật qua "magic bytes"
const detectImageExt = (buf) => {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
};

const fail = (status, message) => ({ ok: false, status, message });

// dataUrl dạng "data:image/jpeg;base64,...." -> lưu tệp, trả về { ok: true, url: '/uploads/xxx.jpg', bytes }
export const saveImageDataUrl = (dataUrl) => {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return fail(400, 'Thiếu dữ liệu ảnh.');
  }
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return fail(400, 'Dữ liệu ảnh không hợp lệ.');

  const header = dataUrl.slice(5, comma).toLowerCase(); // ví dụ: image/jpeg;base64
  const [mime, encoding] = header.split(';');
  if (encoding !== 'base64' || !EXT_BY_MIME[mime]) {
    return fail(415, 'Chỉ nhận ảnh PNG, JPG hoặc WEBP.');
  }

  const base64 = dataUrl.slice(comma + 1);
  // Chặn sớm theo độ dài chuỗi để không phải giải mã tệp khổng lồ
  if (base64.length > Math.ceil((UPLOAD_MAX_BYTES * 4) / 3) + 8) {
    return fail(413, `Ảnh quá lớn (tối đa ${Math.round(UPLOAD_MAX_BYTES / 1024 / 1024)}MB).`);
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return fail(400, 'Dữ liệu ảnh không hợp lệ.');
  }

  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length === 0) return fail(400, 'Ảnh rỗng.');
  if (buffer.length > UPLOAD_MAX_BYTES) {
    return fail(413, `Ảnh quá lớn (tối đa ${Math.round(UPLOAD_MAX_BYTES / 1024 / 1024)}MB).`);
  }

  const realExt = detectImageExt(buffer);
  if (!realExt) return fail(415, 'Tệp không phải ảnh PNG, JPG hoặc WEBP hợp lệ.');
  if (realExt !== EXT_BY_MIME[mime]) return fail(415, 'Nội dung tệp không khớp với định dạng ảnh khai báo.');

  const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${realExt}`;
  try {
    atomicWriteFileSync(path.join(UPLOAD_DIR, name), buffer);
  } catch (err) {
    return fail(500, `Không lưu được ảnh: ${err.message}`);
  }
  return { ok: true, url: `${UPLOAD_URL_PREFIX}${name}`, bytes: buffer.length };
};

// Trả về đường dẫn tệp thật nếu tên hợp lệ và tệp tồn tại, ngược lại null
export const resolveUploadFile = (name) => {
  if (typeof name !== 'string' || !UPLOAD_NAME_PATTERN.test(name)) return null;
  const filePath = path.join(UPLOAD_DIR, name);
  return fs.existsSync(filePath) ? filePath : null;
};

export const uploadContentType = (name) => CONTENT_TYPE_BY_EXT[name.split('.').pop()] || 'application/octet-stream';
