// server/storage.js
// Lớp lưu trữ file JSON an toàn: ghi atomic (.tmp -> rename), giữ bản .bak, không bao giờ
// trả về dữ liệu rỗng khi file hỏng (tránh ghi đè mất sạch dữ liệu thật).

// LƯU Ý: file này (và monitoringBot.js, auth.js) chỉ được import module có sẵn của Node.
// Watchdog và reset-admin chạy trực tiếp trên VPS, nơi KHÔNG có node_modules (ứng dụng chạy trong Docker).
// tests/zero-dependency-test.js kiểm tra điều này.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Đọc một biến từ file .env (thư mục gốc repo hoặc thư mục hiện hành) mà không cần thư viện dotenv.
const readDotenvValue = (name) => {
  const candidates = [path.join(__dirname, '..', '.env'), path.join(process.cwd(), '.env')];
  for (const file of candidates) {
    try {
      for (const line of fs.readFileSync(file, 'utf-8').split(/\r?\n/)) {
        const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (match && match[1] === name) {
          return match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
        }
      }
    } catch {
      // không có .env ở vị trí này
    }
  }
  return '';
};

// Dữ liệu mẫu nằm trong git, chỉ đọc. Dữ liệu chạy thật nằm ở DATA_DIR (nên ở NGOÀI thư mục repo).
export const SEED_DIR = path.join(__dirname, 'seed');
const configuredDataDir = process.env.DATA_DIR || readDotenvValue('DATA_DIR');
export const DATA_DIR = configuredDataDir
  ? path.resolve(configuredDataDir)
  : path.join(__dirname, 'data');

export class StorageCorruptError extends Error {
  constructor(fileName, cause) {
    super(`Tệp dữ liệu ${fileName} bị hỏng và không có bản sao lưu hợp lệ: ${cause?.message || cause}`);
    this.name = 'StorageCorruptError';
    this.fileName = fileName;
  }
}

export const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const isValidJsonFile = (filePath) => {
  try {
    JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return true;
  } catch {
    return false;
  }
};

// Ghi atomic: ghi ra tệp tạm cùng thư mục, fsync, rồi đổi tên đè lên tệp đích.
// Nếu tiến trình bị kill giữa chừng thì tệp đích vẫn nguyên vẹn (bản cũ hoặc bản mới, không bao giờ cụt).
export const atomicWriteFileSync = (filePath, content, { mode = 0o644, keepBackup = false } = {}) => {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  let fd;
  try {
    fd = fs.openSync(tmpPath, 'w', mode);
    fs.writeSync(fd, content);
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;

    // Chỉ sao lưu khi bản hiện tại còn hợp lệ, để không đè bản .bak tốt bằng bản đã hỏng.
    if (keepBackup && fs.existsSync(filePath) && isValidJsonFile(filePath)) {
      try {
        fs.copyFileSync(filePath, `${filePath}.bak`);
      } catch (bakErr) {
        console.warn(`[storage] Không tạo được bản .bak cho ${path.basename(filePath)}:`, bakErr.message);
      }
    }

    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch { /* bỏ qua */ }
    }
    try { fs.unlinkSync(tmpPath); } catch { /* bỏ qua */ }
    throw err;
  }
};

const parseJsonFile = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// Thứ tự đọc: DATA_DIR/<file> -> (nếu hỏng) DATA_DIR/<file>.bak -> (nếu CHƯA TỪNG có) SEED_DIR/<file> -> fallback.
// File tồn tại nhưng hỏng và không có .bak hợp lệ => ném lỗi, tuyệt đối không trả về dữ liệu rỗng.
export const readJsonFileSync = (fileName, fallback) => {
  const filePath = path.join(DATA_DIR, fileName);

  if (fs.existsSync(filePath)) {
    try {
      return parseJsonFile(filePath);
    } catch (err) {
      const bakPath = `${filePath}.bak`;
      if (fs.existsSync(bakPath)) {
        try {
          const recovered = parseJsonFile(bakPath);
          console.error(`[storage] ${fileName} bị hỏng (${err.message}). Đang dùng bản sao lưu ${fileName}.bak`);
          return recovered;
        } catch { /* rơi xuống lỗi bên dưới */ }
      }
      throw new StorageCorruptError(fileName, err);
    }
  }

  const seedPath = path.join(SEED_DIR, fileName);
  if (fs.existsSync(seedPath)) {
    if (DATA_DIR !== path.join(__dirname, 'data')) {
      console.warn(`[storage] ${fileName} chưa có trong DATA_DIR (${DATA_DIR}); dùng dữ liệu mẫu. Nếu đây không phải lần chạy đầu tiên, hãy kiểm tra volume dữ liệu.`);
    }
    try {
      return parseJsonFile(seedPath);
    } catch (err) {
      throw new StorageCorruptError(`seed/${fileName}`, err);
    }
  }

  return fallback;
};

export const writeJsonFileSync = (fileName, data) => {
  const filePath = path.join(DATA_DIR, fileName);
  atomicWriteFileSync(filePath, JSON.stringify(data, null, 2), { keepBackup: true });
};
