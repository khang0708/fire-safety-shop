// server/authCookie.js
// Phiên đăng nhập admin lưu trong cookie HttpOnly (JavaScript trên trang không đọc được, nên XSS không lấy được token).
// Dùng chung cho server/server.js và máy chủ dev của Vite. Không phụ thuộc thư viện nào.

export const SESSION_COOKIE = 'fg_admin';
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 3600;
// Yêu cầu có cookie và thay đổi dữ liệu phải kèm header này. Trình duyệt không cho trang khác origin tự thêm header tùy biến
// nếu không qua CORS preflight (đã giới hạn origin), nên đây là lớp chống CSRF bổ sung cho SameSite=Strict.
export const CSRF_HEADER = 'x-requested-with';
export const CSRF_VALUE = 'fetch';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const parseCookies = (header) => {
  const out = {};
  if (typeof header !== 'string') return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    const name = part.slice(0, i).trim();
    if (!name || name in out) continue;
    try {
      out[name] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      /* cookie sai định dạng -> bỏ qua */
    }
  }
  return out;
};

// Lấy token admin từ request: header Authorization / x-admin-token (script, test) hoặc cookie phiên (trình duyệt).
export const getAdminTokenFromRequest = (req) => {
  const headers = req.headers || {};
  const authHeader = headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.slice(7).trim();
  if (headers['x-admin-token']) return String(headers['x-admin-token']);

  const cookieToken = parseCookies(headers['cookie'])[SESSION_COOKIE];
  if (!cookieToken) return null;
  const method = String(req.method || 'GET').toUpperCase();
  if (!SAFE_METHODS.has(method) && headers[CSRF_HEADER] !== CSRF_VALUE) return null;
  return cookieToken;
};

const baseAttrs = (secure) => `Path=/; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`;

export const buildSessionCookie = (token, secure) =>
  `${SESSION_COOKIE}=${encodeURIComponent(token)}; ${baseAttrs(secure)}; Max-Age=${SESSION_MAX_AGE_SECONDS}`;

export const buildClearCookie = (secure) =>
  `${SESSION_COOKIE}=; ${baseAttrs(secure)}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
