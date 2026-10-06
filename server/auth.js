// server/auth.js
// Dịch vụ Xác thực & Bảo mật Cổng Quản trị FLAMEGUARD PRO
// Sử dụng thư viện crypto tiêu chuẩn của Node.js (Zero-dependency, Timing-safe, Salted Scrypt Hash)

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { DATA_DIR, ensureDir, atomicWriteFileSync } from './storage.js';

try {
  ensureDir(DATA_DIR);
} catch (e) {
  console.error('[auth] Không tạo được thư mục dữ liệu', DATA_DIR, e.message);
  throw e;
}

const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');
const SECRET_FILE = path.join(DATA_DIR, '.auth_secret');

// ----------------------------------------------------
// 1. QUẢN LÝ KHÓA KÝ SESSION TOKEN (HMAC SECRET)
// ----------------------------------------------------
export function getSessionSecret() {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16) {
    return process.env.SESSION_SECRET.trim();
  }

  if (fs.existsSync(SECRET_FILE)) {
    try {
      const savedSecret = fs.readFileSync(SECRET_FILE, 'utf-8').trim();
      if (savedSecret.length >= 32) return savedSecret;
    } catch (e) {}
  }

  // Tự động sinh khóa ngẫu nhiên 256-bit an toàn cao nếu chưa có
  const generatedSecret = crypto.randomBytes(32).toString('hex');
  try {
    atomicWriteFileSync(SECRET_FILE, generatedSecret, { mode: 0o600 });
  } catch (e) {
    console.error('[auth] Không lưu được khóa phiên .auth_secret (phiên đăng nhập sẽ mất khi khởi động lại):', e.message);
  }
  return generatedSecret;
}

// ----------------------------------------------------
// 2. BĂM VÀ KIỂM TRA MẬT KHẨU (SALTED SCRYPT HASH)
// ----------------------------------------------------
export function hashPassword(plainText, salt = crypto.randomBytes(16).toString('hex')) {
  if (!plainText || typeof plainText !== 'string') {
    throw new Error('Mật khẩu không hợp lệ');
  }
  const derivedKey = crypto.scryptSync(plainText, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(plainText, storedHash) {
  if (!plainText || !storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
    return false;
  }
  try {
    const [salt, keyHex] = storedHash.split(':');
    const keyBuffer = Buffer.from(keyHex, 'hex');
    const derivedKey = crypto.scryptSync(plainText, salt, 64);
    if (keyBuffer.length !== derivedKey.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (e) {
    return false;
  }
}

// ----------------------------------------------------
// 3. TẠO VÀ XÁC THỰC SESSION TOKEN (HMAC-SHA256 JWT)
// ----------------------------------------------------
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

export function createAdminToken(user, expiresInSeconds = 7 * 24 * 3600) {
  const secret = getSessionSecret();
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id,
    username: user.username,
    name: user.name,
    role: user.role || 'SUPER_ADMIN',
    avatar: user.avatar || '',
    tv: user.tokenVersion || 0,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${dataToSign}.${signature}`;
}

// Chỉ kiểm tra chữ ký + hạn dùng. verifyAdminToken (bên dưới) kiểm tra thêm tài khoản và phiên bản token.
function verifyTokenPayload(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const secret = getSessionSecret();
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp < now) {
      return null; // Token hết hạn hoặc thiếu hạn dùng
    }
    return payload;
  } catch (e) {
    return null;
  }
}

// ----------------------------------------------------
// 4. BẢO VỆ CHỐNG TẤN CÔNG BRUTE-FORCE (RATE LIMITING)
// ----------------------------------------------------
const loginAttempts = new Map(); // ip/key -> { count, lockedUntil }

export function checkRateLimit(key, maxAttempts = 5, lockDurationMs = 15 * 60 * 1000) {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) {
    return { isLocked: false, remainingAttempts: maxAttempts };
  }

  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { 
      isLocked: true, 
      remainingSeconds,
      message: `Tài khoản tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${Math.ceil(remainingSeconds / 60)} phút.` 
    };
  }

  // Đã hết thời gian khóa -> reset
  if (record.lockedUntil && record.lockedUntil <= now) {
    loginAttempts.delete(key);
    return { isLocked: false, remainingAttempts: maxAttempts };
  }

  return { isLocked: false, remainingAttempts: Math.max(0, maxAttempts - record.count) };
}

export function recordFailedAttempt(key, maxAttempts = 5, lockDurationMs = 15 * 60 * 1000) {
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, lockedUntil: 0 };
  record.count += 1;

  if (record.count >= maxAttempts) {
    record.lockedUntil = now + lockDurationMs;
    loginAttempts.set(key, record);
    return {
      isLocked: true,
      remainingSeconds: Math.ceil(lockDurationMs / 1000),
      message: `Tài khoản bị tạm khóa 15 phút do nhập sai quá ${maxAttempts} lần.`
    };
  }

  loginAttempts.set(key, record);
  return {
    isLocked: false,
    remainingAttempts: maxAttempts - record.count
  };
}

export function resetRateLimit(key) {
  loginAttempts.delete(key);
}

// ----------------------------------------------------
// 5. TÀI KHOẢN ADMIN: LƯU TRỮ, KHỞI TẠO, KIỂM TRA ĐỘ MẠNH
// ----------------------------------------------------
// Mật khẩu/PIN dưới đây từng nằm công khai trong repo => bị CHẶN đăng nhập và không còn là giá trị khởi tạo.
export const DEFAULT_ADMIN_PASSWORD = 'FlameGuard@2026';
export const DEFAULT_ADMIN_PIN = '1234';
const WEAK_PINS = new Set(['0000', '1111', '1234', '4321', '123456', '654321', '000000', '111111', '123123', '121212', '12345678']);

export function validateNewPassword(password) {
  if (typeof password !== 'string' || password.trim().length < 10) {
    return 'Mật khẩu phải có ít nhất 10 ký tự.';
  }
  if (password.trim() === DEFAULT_ADMIN_PASSWORD) {
    return 'Không được dùng mật khẩu mặc định đã bị công khai.';
  }
  return null;
}

export function validateNewPin(pin) {
  const clean = typeof pin === 'string' ? pin.trim() : '';
  if (!/^\d{6,10}$/.test(clean)) {
    return 'Mã PIN phải gồm 6 - 10 chữ số.';
  }
  if (WEAK_PINS.has(clean) || /^(\d)\1+$/.test(clean)) {
    return 'Mã PIN quá dễ đoán (ví dụ 123456, 000000).';
  }
  return null;
}

// Đọc admins.json. File tồn tại nhưng hỏng => dùng .bak, nếu không có thì BÁO LỖI.
// Tuyệt đối không tự tạo lại tài khoản mặc định khi file hỏng.
function readAdminsFile() {
  if (!fs.existsSync(ADMINS_FILE)) return null;

  const parseAdmins = (file) => {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('admins.json phải là mảng không rỗng');
    }
    return data;
  };

  try {
    return parseAdmins(ADMINS_FILE);
  } catch (err) {
    const bakPath = `${ADMINS_FILE}.bak`;
    if (fs.existsSync(bakPath)) {
      try {
        const recovered = parseAdmins(bakPath);
        console.error(`[auth] admins.json bị hỏng (${err.message}). Đang dùng admins.json.bak`);
        return recovered;
      } catch { /* rơi xuống lỗi bên dưới */ }
    }
    throw new Error(`admins.json bị hỏng và không có bản sao lưu hợp lệ: ${err.message}`);
  }
}

export function loadAdmins() {
  const existing = readAdminsFile();
  if (existing) return existing;

  // Chưa có tài khoản nào: bắt buộc cung cấp ADMIN_PASSWORD và ADMIN_PIN hợp lệ qua biến môi trường.
  const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const pin = process.env.ADMIN_PIN;
  const problems = [validateNewPassword(password), validateNewPin(pin)].filter(Boolean);
  if (problems.length > 0) {
    throw new Error(`Chưa có tài khoản admin. Hãy đặt ADMIN_PASSWORD và ADMIN_PIN hợp lệ trong biến môi trường: ${problems.join(' ')}`);
  }

  const now = new Date().toISOString();
  const initialAdmin = {
    id: 'admin_master_01',
    username,
    name: 'Quản trị viên',
    email: '',
    role: 'SUPER_ADMIN',
    avatar: '',
    passwordHash: hashPassword(password.trim()),
    pinHash: hashPassword(pin.trim()),
    tokenVersion: 0,
    createdAt: now,
    updatedAt: now
  };

  const admins = [initialAdmin];
  if (!saveAdmins(admins)) {
    throw new Error('Không ghi được admins.json vào DATA_DIR');
  }
  return admins;
}

export function saveAdmins(admins) {
  try {
    atomicWriteFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2), { mode: 0o600, keepBackup: true });
    return true;
  } catch (e) {
    console.error('[auth] Không ghi được admins.json:', e.message);
    return false;
  }
}

// Gọi lúc khởi động để máy chủ báo lỗi rõ ràng thay vì chạy với cấu hình xác thực thiếu.
// Trả về danh sách tài khoản vẫn đang giữ mật khẩu/PIN mặc định công khai (đã bị chặn đăng nhập).
export function findDefaultCredentialAdmins() {
  return loadAdmins()
    .filter(a => verifyPassword(DEFAULT_ADMIN_PASSWORD, a.passwordHash) || verifyPassword(DEFAULT_ADMIN_PIN, a.pinHash))
    .map(a => a.username);
}

// Xác thực token đầy đủ: chữ ký + hạn dùng + tài khoản còn tồn tại + phiên bản token khớp
// (đổi mật khẩu/PIN hoặc reset sẽ tăng tokenVersion và vô hiệu hóa mọi phiên cũ).
export function verifyAdminToken(token) {
  const payload = verifyTokenPayload(token);
  if (!payload) return null;
  try {
    const admin = loadAdmins().find(a => a.id === payload.sub);
    if (!admin) return null;
    if ((payload.tv || 0) !== (admin.tokenVersion || 0)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ----------------------------------------------------
// 6. XÁC THỰC ĐĂNG NHẬP (AUTHENTICATE)
// ----------------------------------------------------
const PIN_GLOBAL_KEY = '__pin_global__';
const PIN_GLOBAL_MAX = 20;
const USER_MAX = 10;

const DEFAULT_DISABLED_MESSAGE =
  'Mật khẩu/PIN mặc định đã bị vô hiệu hóa vì từng được công khai. Quản trị máy chủ hãy đặt lại bằng: node scripts/reset-admin.js';

function buildSession(admin, provider) {
  return {
    success: true,
    token: createAdminToken(admin),
    user: {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
      provider
    }
  };
}

export function authenticateAdmin({ username, password, pin, clientIp = '127.0.0.1' }) {
  const rateLimitKey = `${clientIp}_${username || 'pin'}`;
  const rateCheck = checkRateLimit(rateLimitKey);
  if (rateCheck.isLocked) {
    return { success: false, error: 'LOCKED', message: rateCheck.message };
  }

  let admins;
  try {
    admins = loadAdmins();
  } catch (err) {
    console.error('[auth] Không tải được danh sách admin:', err.message);
    return { success: false, error: 'AUTH_UNAVAILABLE', message: 'Hệ thống xác thực chưa sẵn sàng. Vui lòng liên hệ quản trị máy chủ.' };
  }

  // Đăng nhập bằng mã PIN (yếu hơn mật khẩu nên có thêm giới hạn toàn cục, không phụ thuộc IP)
  if (pin) {
    const globalCheck = checkRateLimit(PIN_GLOBAL_KEY, PIN_GLOBAL_MAX);
    if (globalCheck.isLocked) {
      return { success: false, error: 'LOCKED', message: 'Đăng nhập bằng PIN tạm khóa do có quá nhiều lần thử sai. Hãy dùng tài khoản và mật khẩu, hoặc thử lại sau.' };
    }

    const cleanPin = String(pin).trim();
    if (cleanPin === DEFAULT_ADMIN_PIN) {
      recordFailedAttempt(PIN_GLOBAL_KEY, PIN_GLOBAL_MAX);
      recordFailedAttempt(rateLimitKey);
      return { success: false, error: 'DEFAULT_CREDENTIALS_DISABLED', message: DEFAULT_DISABLED_MESSAGE };
    }

    const admin = admins.find(a => verifyPassword(cleanPin, a.pinHash));
    if (admin) {
      resetRateLimit(rateLimitKey);
      return buildSession(admin, 'pin');
    }

    recordFailedAttempt(PIN_GLOBAL_KEY, PIN_GLOBAL_MAX);
    const failed = recordFailedAttempt(rateLimitKey);
    return {
      success: false,
      error: 'INVALID_CREDENTIALS',
      message: failed.isLocked ? failed.message : `Mã PIN không chính xác. Còn lại ${failed.remainingAttempts} lần thử.`
    };
  }

  // Đăng nhập bằng Username / Email & Mật khẩu
  if (username && password) {
    const cleanUsername = String(username).trim().toLowerCase();
    const userKey = `user_${cleanUsername}`;
    const userCheck = checkRateLimit(userKey, USER_MAX);
    if (userCheck.isLocked) {
      return { success: false, error: 'LOCKED', message: userCheck.message };
    }

    if (String(password) === DEFAULT_ADMIN_PASSWORD) {
      recordFailedAttempt(userKey, USER_MAX);
      recordFailedAttempt(rateLimitKey);
      return { success: false, error: 'DEFAULT_CREDENTIALS_DISABLED', message: DEFAULT_DISABLED_MESSAGE };
    }

    const admin = admins.find(a =>
      a.username.toLowerCase() === cleanUsername ||
      (a.email && a.email.toLowerCase() === cleanUsername)
    );

    if (admin && verifyPassword(password, admin.passwordHash)) {
      resetRateLimit(rateLimitKey);
      resetRateLimit(userKey);
      return buildSession(admin, 'credentials');
    }

    recordFailedAttempt(userKey, USER_MAX);
    const failed = recordFailedAttempt(rateLimitKey);
    return {
      success: false,
      error: 'INVALID_CREDENTIALS',
      message: failed.isLocked ? failed.message : `Sai tên đăng nhập hoặc mật khẩu. Còn lại ${failed.remainingAttempts} lần thử.`
    };
  }

  return { success: false, error: 'BAD_REQUEST', message: 'Vui lòng cung cấp tài khoản/mật khẩu hoặc mã PIN.' };
}

// ----------------------------------------------------
// 7. THAY ĐỔI / ĐẶT LẠI MẬT KHẨU & MÃ PIN ADMIN
// ----------------------------------------------------
function applyNewCredentials(admin, { newPassword, newPin }) {
  const problems = [];
  if (newPassword) {
    const err = validateNewPassword(newPassword);
    if (err) problems.push(err);
  }
  if (newPin) {
    const err = validateNewPin(newPin);
    if (err) problems.push(err);
  }
  if (!newPassword && !newPin) {
    problems.push('Vui lòng nhập mật khẩu mới hoặc mã PIN mới.');
  }
  if (problems.length > 0) {
    return { ok: false, message: problems.join(' ') };
  }

  if (newPassword) admin.passwordHash = hashPassword(newPassword.trim());
  if (newPin) admin.pinHash = hashPassword(newPin.trim());
  admin.tokenVersion = (admin.tokenVersion || 0) + 1; // vô hiệu hóa mọi phiên đăng nhập cũ
  admin.updatedAt = new Date().toISOString();
  return { ok: true };
}

export function changeAdminPassword(adminId, { currentPassword, newPassword, newPin }) {
  const admins = loadAdmins();
  const adminIndex = admins.findIndex(a => a.id === adminId);
  if (adminIndex === -1) {
    return { success: false, error: 'NOT_FOUND', message: 'Không tìm thấy tài khoản quản trị.' };
  }

  const admin = admins[adminIndex];
  if (!verifyPassword(currentPassword, admin.passwordHash)) {
    return { success: false, error: 'INVALID_PASSWORD', message: 'Mật khẩu hiện tại không chính xác.' };
  }

  const applied = applyNewCredentials(admin, { newPassword, newPin });
  if (!applied.ok) {
    return { success: false, error: 'WEAK_CREDENTIALS', message: applied.message };
  }

  admins[adminIndex] = admin;
  if (!saveAdmins(admins)) {
    return { success: false, error: 'SAVE_FAILED', message: 'Không lưu được thay đổi. Vui lòng thử lại.' };
  }

  return {
    success: true,
    // Token mới để phiên hiện tại tiếp tục hoạt động; mọi phiên khác bị đăng xuất.
    token: createAdminToken(admin),
    message: 'Cập nhật mật khẩu và mã PIN thành công! Các thiết bị khác đã bị đăng xuất.'
  };
}

// Dùng cho scripts/reset-admin.js (chạy trên máy chủ): đặt lại mà không cần mật khẩu cũ.
export function resetAdminCredentials({ username, newPassword, newPin }) {
  const admins = loadAdmins();
  const cleanUsername = (username || '').trim().toLowerCase();
  const admin = cleanUsername
    ? admins.find(a => a.username.toLowerCase() === cleanUsername)
    : admins[0];
  if (!admin) {
    return { success: false, error: 'NOT_FOUND', message: 'Không tìm thấy tài khoản quản trị.' };
  }

  const applied = applyNewCredentials(admin, { newPassword, newPin });
  if (!applied.ok) {
    return { success: false, error: 'WEAK_CREDENTIALS', message: applied.message };
  }
  if (!saveAdmins(admins)) {
    return { success: false, error: 'SAVE_FAILED', message: 'Không lưu được admins.json.' };
  }
  return { success: true, username: admin.username };
}
