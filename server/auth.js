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

export function verifyAdminToken(token) {
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
    if (payload.exp && payload.exp < now) {
      return null; // Token hết hạn
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
// 5. KHỞI TẠO VÀ LƯU TRỮ TÀI KHOẢN ADMIN THẬT
// ----------------------------------------------------
export function loadAdmins() {
  if (fs.existsSync(ADMINS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(ADMINS_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (e) {}
  }

  // Khởi tạo tài khoản Quản trị viên mặc định
  const defaultUsername = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const defaultPassword = process.env.ADMIN_PASSWORD || 'FlameGuard@2026';
  const defaultPin = process.env.ADMIN_PIN || '1234';

  const initialAdmin = {
    id: 'admin_master_01',
    username: defaultUsername,
    name: 'Chỉ Huy Trưởng PCCC FLAMEGUARD',
    email: 'admin.pccc@flameguard.vn',
    role: 'SUPER_ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    passwordHash: hashPassword(defaultPassword),
    pinHash: hashPassword(defaultPin),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const admins = [initialAdmin];
  try {
    atomicWriteFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2), { mode: 0o600, keepBackup: true });
  } catch (e) {}
  return admins;
}

export function saveAdmins(admins) {
  try {
    atomicWriteFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2), { mode: 0o600, keepBackup: true });
    return true;
  } catch (e) {
    return false;
  }
}

// ----------------------------------------------------
// 6. XÁC THỰC ĐĂNG NHẬP (AUTHENTICATE)
// ----------------------------------------------------
export function authenticateAdmin({ username, password, pin, clientIp = '127.0.0.1' }) {
  const rateLimitKey = `${clientIp}_${username || 'pin'}`;
  const rateCheck = checkRateLimit(rateLimitKey);
  if (rateCheck.isLocked) {
    return { success: false, error: 'LOCKED', message: rateCheck.message };
  }

  const admins = loadAdmins();

  // Đăng nhập bằng mã PIN
  if (pin) {
    const cleanPin = String(pin).trim();
    const admin = admins.find(a => verifyPassword(cleanPin, a.pinHash));
    if (admin) {
      resetRateLimit(rateLimitKey);
      const token = createAdminToken(admin);
      return {
        success: true,
        token,
        user: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          avatar: admin.avatar,
          provider: 'pin'
        }
      };
    }

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
    const admin = admins.find(a => 
      a.username.toLowerCase() === cleanUsername || 
      (a.email && a.email.toLowerCase() === cleanUsername)
    );

    if (admin && verifyPassword(password, admin.passwordHash)) {
      resetRateLimit(rateLimitKey);
      const token = createAdminToken(admin);
      return {
        success: true,
        token,
        user: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          avatar: admin.avatar,
          provider: 'credentials'
        }
      };
    }

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
// 7. THAY ĐỔI MẬT KHẨU / MÃ PIN ADMIN
// ----------------------------------------------------
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

  if (newPassword && newPassword.trim().length >= 6) {
    admin.passwordHash = hashPassword(newPassword.trim());
  }

  if (newPin && newPin.trim().length >= 4) {
    admin.pinHash = hashPassword(newPin.trim());
  }

  admin.updatedAt = new Date().toISOString();
  admins[adminIndex] = admin;
  saveAdmins(admins);

  return { 
    success: true, 
    message: 'Cập nhật mật khẩu và mã PIN thành công! Vui lòng lưu trữ thông tin cẩn thận.' 
  };
}
