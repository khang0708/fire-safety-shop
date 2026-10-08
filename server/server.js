import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
dotenv.config();
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true });
}
import { neon } from '@neondatabase/serverless';
import { 
  authenticateAdmin, 
  verifyAdminToken, 
  changeAdminPassword, 
  findDefaultCredentialAdmins 
} from './auth.js';
import {
  notifyServerError,
  notifyServerStartup, 
  notifyServerWarning, 
  testDeveloperServerAlert
} from './monitoringBot.js';
import { DATA_DIR, ensureDir, readJsonFileSync, writeJsonFileSync } from './storage.js';
import { createRateLimiter } from './rateLimit.js';
import {
  sanitizeCategoryInput,
  generateCategoryId,
  sortCategories,
  resolveProductCategoryId,
  planCategoryDeletion
} from './categories.js';
import { saveImageDataUrl, resolveUploadFile, uploadContentType } from './uploads.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bắt lỗi toàn cục tiến trình Node.js (Uncaught Exception & Unhandled Rejection)
process.on('uncaughtException', async (err) => {
  console.error('💥 [CRITICAL] Uncaught Exception:', err);
  const forceExit = setTimeout(() => process.exit(1), 5000);
  try {
    await notifyServerError(err, { source: 'uncaughtException', fatal: true });
  } catch (notifyErr) {
    console.error('Lỗi khi gửi cảnh báo Telegram cho uncaughtException:', notifyErr.message);
  }
  clearTimeout(forceExit);
  // Trạng thái tiến trình không còn đáng tin: thoát để Docker (restart: always) / PM2 khởi động lại.
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  console.error('⚠️ [WARNING] Unhandled Promise Rejection:', reason);
  try {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    await notifyServerError(err, { source: 'unhandledRejection', fatal: false });
  } catch (notifyErr) {
    console.error('Lỗi khi gửi cảnh báo Telegram cho unhandledRejection:', notifyErr.message);
  }
});

const app = express();
const PORT = process.env.PORT || 3001;

// Chạy sau Nginx: tin địa chỉ do Nginx ghi vào X-Forwarded-For (phần tử cuối), KHÔNG tin giá trị client tự đặt.
// Đặt TRUST_PROXY_HOPS=0 nếu chạy trực tiếp không qua proxy.
const TRUST_PROXY_HOPS = Number.parseInt(process.env.TRUST_PROXY_HOPS ?? '1', 10);
app.set('trust proxy', Number.isNaN(TRUST_PROXY_HOPS) ? 1 : TRUST_PROXY_HOPS);

// ----------------------------------------------------
// TIMEOUT HELPERS
// Tránh việc function bị treo tới giới hạn tối đa của Vercel (300s)
// khi DB hoặc API bên thứ 3 không phản hồi.
// ----------------------------------------------------
const DEFAULT_TIMEOUT_MS = 12000;

const withTimeout = (promise, ms = DEFAULT_TIMEOUT_MS, label = 'operation') => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const fetchWithTimeout = (url, options = {}, ms = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
};

// Middleware
app.use(cors());

// Giữ nguyên body gốc cho webhook Facebook để kiểm tra chữ ký HMAC
const captureRawBody = (req, res, buf) => {
  if (req.originalUrl && req.originalUrl.startsWith('/api/facebook/webhook')) {
    req.rawBody = buf;
  }
};
const jsonParserAdmin = express.json({ limit: '25mb', verify: captureRawBody });
const jsonParserPublic = express.json({ limit: '2mb', verify: captureRawBody });
app.use((req, res, next) => (getRequestAdmin(req) ? jsonParserAdmin : jsonParserPublic)(req, res, next));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ----------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// ----------------------------------------------------
// Lấy admin từ header (Authorization: Bearer ... hoặc x-admin-token). Không nhận token qua query string
// vì URL bị ghi vào log truy cập.
export function getRequestAdmin(req) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.slice(7).trim()
    : req.headers['x-admin-token'];
  return token ? verifyAdminToken(token) : null;
}

export const requireAdminAuth = (req, res, next) => {
  const user = getRequestAdmin(req);
  if (user) {
    req.adminUser = user;
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'UNAUTHORIZED',
    message: 'Yêu cầu phiên đăng nhập quản trị viên hợp lệ (Token không hợp lệ hoặc đã hết hạn)'
  });
};

// Giới hạn tần suất cho các route công khai có ghi dữ liệu / dễ bị dò quét
const orderCreateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: 'Bạn đã gửi quá nhiều đơn hàng trong thời gian ngắn. Vui lòng thử lại sau hoặc gọi hotline.'
});
const reviewCreateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: 'Bạn đã gửi quá nhiều đánh giá. Vui lòng thử lại sau.'
});
const uploadLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: 'Bạn tải ảnh lên quá nhiều lần. Vui lòng thử lại sau ít phút.'
});
const orderTrackLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: 'Bạn tra cứu quá nhiều lần. Vui lòng thử lại sau ít phút.'
});

// Vé dùng một lần, sống 30 giây, để mở luồng SSE (EventSource không gửi được header Authorization).
const sseTickets = new Map(); // ticket -> { sub, expiresAt }
const issueSseTicket = (adminUser) => {
  const ticket = crypto.randomBytes(24).toString('hex');
  sseTickets.set(ticket, { sub: adminUser.sub, expiresAt: Date.now() + 30 * 1000 });
  return ticket;
};
const consumeSseTicket = (ticket) => {
  const entry = sseTickets.get(ticket);
  sseTickets.delete(ticket);
  return entry && entry.expiresAt > Date.now() ? entry : null;
};
setInterval(() => {
  const now = Date.now();
  for (const [ticket, entry] of sseTickets) {
    if (entry.expiresAt <= now) sseTickets.delete(ticket);
  }
}, 60 * 1000).unref?.();

// DATA_DIR lấy từ storage.js (dữ liệu chạy thật nằm ngoài repo khi đặt biến môi trường DATA_DIR).
try {
  ensureDir(DATA_DIR);
} catch (err) {
  console.error('[storage] Không tạo được thư mục dữ liệu', DATA_DIR, err.message);
  throw err;
}

// ----------------------------------------------------
// SHARED PERSISTENT STORAGE (Neon Database & In-Memory Fallback)
// Giải quyết dứt điểm vấn đề mất dữ liệu giữa các Vercel container
// ----------------------------------------------------
let sql = null;
if (process.env.DATABASE_URL) {
  try {
    sql = neon(process.env.DATABASE_URL);
  } catch (e) {
    console.warn('Neon client initialization note:', e.message);
  }
}

let isTableInitialized = false;
const ensureTable = async () => {
  if (!sql || isTableInitialized) return;
  try {
    await withTimeout(sql`
      CREATE TABLE IF NOT EXISTS flameguard_store (
        key VARCHAR(50) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `, DEFAULT_TIMEOUT_MS, 'Neon ensureTable');
    isTableInitialized = true;
  } catch (err) {
    console.warn('ensureTable note:', err.message);
  }
};

// In-memory cache for fast access within warm container instances
const memoryDb = new Map();

// Helpers for JSON Database persistence
const readJson = async (fileName) => {
  const key = fileName.replace('.json', '');

  // 1. Neon Database (Lưu trữ dùng chung giữa tất cả container Vercel & mọi thiết bị)
  if (sql) {
    try {
      await ensureTable();
      const rows = await withTimeout(sql`SELECT data FROM flameguard_store WHERE key = ${key}`, DEFAULT_TIMEOUT_MS, `Neon read ${key}`);
      if (rows && rows.length > 0 && rows[0].data !== undefined) {
        const data = rows[0].data;
        memoryDb.set(fileName, data);
        return data;
      }
    } catch (dbErr) {
      console.warn(`[Neon DB] Lỗi đọc ${key}:`, dbErr.message);
    }
  }

  // 2. In-memory cache
  if (memoryDb.has(fileName)) {
    return memoryDb.get(fileName);
  }

  // 3. File trong DATA_DIR (ghi atomic, có .bak). File hỏng KHÔNG còn bị coi là dữ liệu rỗng:
  //    readJsonFileSync ném lỗi để lần ghi sau không ghi đè mất dữ liệu thật.
  const data = readJsonFileSync(fileName, fileName.includes('settings') ? {} : []);
  memoryDb.set(fileName, data);
  return data;
};

const writeJson = async (fileName, data) => {
  const key = fileName.replace('.json', '');

  // 1. Lưu vào Neon Database (Đồng bộ tức thì lên đám mây cho mọi container)
  if (sql) {
    try {
      await ensureTable();
      const jsonStr = JSON.stringify(data);
      await withTimeout(sql`
        INSERT INTO flameguard_store (key, data, updated_at)
        VALUES (${key}, ${jsonStr}, NOW())
        ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `, DEFAULT_TIMEOUT_MS, `Neon write ${key}`);
    } catch (dbErr) {
      console.error(`[Neon DB] Lỗi ghi ${key}:`, dbErr.message);
    }
  }

  // 2. Ghi file atomic vào DATA_DIR. Thất bại => ném lỗi để API trả 500 thay vì báo thành công giả.
  try {
    writeJsonFileSync(fileName, data);
    memoryDb.set(fileName, data);
  } catch (err) {
    // Không để cache giữ dữ liệu chưa được lưu
    memoryDb.delete(fileName);
    if (!sql) throw err;
    console.warn(`[storage] Không ghi được file ${fileName}:`, err.message);
  }
};

// ----------------------------------------------------
// REAL-TIME SERVER-SENT EVENTS (SSE) FOR ADMINS
// ----------------------------------------------------
const sseClients = new Set();

export const broadcastAdminEvent = (eventPayload) => {
  const message = `data: ${JSON.stringify(eventPayload)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(message);
    } catch (e) {
      sseClients.delete(client);
    }
  });
};

// GET /api/admin/events?ticket=... (SSE Stream, chỉ admin).
// Luồng này phát cả đơn hàng mới (có SĐT/địa chỉ khách) nên bắt buộc phải có vé do admin đã đăng nhập cấp.
app.get('/api/admin/events', (req, res) => {
  const ticket = consumeSseTicket(String(req.query.ticket || ''));
  if (!ticket) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Cần vé kết nối hợp lệ (lấy bằng POST /api/auth/sse-ticket sau khi đăng nhập admin).'
    });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Nginx không được gom đệm luồng sự kiện
  res.flushHeaders?.();

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Admin Stream Active' })}\n\n`);
  sseClients.add(res);

  // Giữ kết nối sống qua proxy_read_timeout và phát hiện client đã ngắt
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      cleanup();
    }
  }, 25 * 1000);

  function cleanup() {
    clearInterval(heartbeat);
    sseClients.delete(res);
  }
  req.on('close', cleanup);
});

// ----------------------------------------------------
// 0. AUTHENTICATION REST API (Xác Thực Quản Trị Viên)
// ----------------------------------------------------

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const clientIp = req.ip || req.socket?.remoteAddress || '127.0.0.1';
  const { username, password, pin } = req.body || {};
  const result = authenticateAdmin({ username, password, pin, clientIp });

  if (result.success) {
    return res.json(result);
  }
  const statusCode = result.error === 'LOCKED' ? 429 : 401;
  return res.status(statusCode).json(result);
});

// GET /api/auth/me (Kiểm tra token còn hợp lệ không)
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const hasToken = Boolean((authHeader && authHeader.startsWith('Bearer ')) || req.headers['x-admin-token']);
  if (!hasToken) {
    return res.status(401).json({ success: false, error: 'NO_TOKEN', message: 'Chưa cung cấp token xác thực' });
  }

  const user = getRequestAdmin(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'INVALID_TOKEN', message: 'Phiên làm việc đã hết hạn hoặc không hợp lệ' });
  }

  return res.json({ success: true, user });
});

// POST /api/auth/change-password (Đổi mật khẩu / PIN admin)
app.post('/api/auth/change-password', requireAdminAuth, (req, res) => {
  const result = changeAdminPassword(req.adminUser.sub, req.body || {});
  if (result.success) {
    return res.json(result);
  }
  return res.status(400).json(result);
});

// POST /api/auth/sse-ticket (admin xin vé mở luồng sự kiện thời gian thực)
app.post('/api/auth/sse-ticket', requireAdminAuth, (req, res) => {
  res.json({ success: true, ticket: issueSseTicket(req.adminUser) });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Đã đăng xuất phiên làm việc' });
});

// ----------------------------------------------------
// 1. PRODUCTS REST API (Quản Lý Sản Phẩm Mẫu Hoa)
// ----------------------------------------------------

// GET /api/products
app.get('/api/products', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const products = await readJson('products.json');
    res.json({ success: true, data: products, total: products.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/products (Thêm mẫu hoa mới)
app.post('/api/products', requireAdminAuth, async (req, res) => {
  try {
    const products = (await readJson('products.json')) || [];
    const productName = req.body.name || 'Thiết Bị PCCC';
    const productSlug = req.body.slug ? slugifyVietnamese(req.body.slug) : slugifyVietnamese(productName);
    const categories = await loadCategories();
    const categoryError = checkProductCategory(req.body.category, categories);
    if (categoryError) return res.status(400).json({ success: false, message: categoryError });
    const newProduct = {
      id: req.body.id || `fire-${Date.now()}`,
      slug: productSlug,
      category: resolveProductCategoryId(req.body, categories),
      name: productName,
      subtitle: req.body.subtitle || '',
      price: Number(req.body.price) || 500000,
      originalPrice: Number(req.body.originalPrice) || Number(req.body.price) || 600000,
      occasion: req.body.occasion || 'home',
      colorTone: req.body.colorTone || 'powder',
      image: req.body.image || '/images/abc-powder-4kg.jpg',
      tags: req.body.tags || ['Tem BCA'],
      meaning: req.body.meaning || 'Thiết bị PCCC đạt chuẩn.',
      flowerTypes: req.body.flowerTypes || ['Bộ thiết bị'],
      rating: 5.0,
      reviewsCount: 0,
      freshDays: Number(req.body.freshDays) || 365,
      isAvailable: true,
      createdAt: req.body.createdAt || new Date().toISOString(),
      updatedAt: req.body.updatedAt || new Date().toISOString()
    };

    products.unshift(newProduct);
    await writeJson('products.json', products);

    broadcastAdminEvent({ type: 'PRODUCT_ADDED', product: newProduct });
    broadcastAdminEvent({ type: 'PRODUCT_UPDATED', product: newProduct });
    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/products/:id (Cập nhật mẫu hoa / thiết bị)
app.put('/api/products/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const categoryError = checkProductCategory(req.body.category, await loadCategories());
    if (categoryError) return res.status(400).json({ success: false, message: categoryError });
    let products = (await readJson('products.json')) || [];
    let index = products.findIndex(p => p.id === id);

    const fallbackSlug = req.body.name ? slugifyVietnamese(req.body.name) : (index !== -1 ? (products[index].slug || slugifyVietnamese(products[index].name)) : id);
    const cleanSlug = req.body.slug ? slugifyVietnamese(req.body.slug) : fallbackSlug;

    if (index === -1) {
      // Nếu sản phẩm chưa có trong file products.json nhưng được sửa
      const newEntry = {
        id,
        slug: cleanSlug,
        name: req.body.name || 'Thiết Bị PCCC',
        subtitle: req.body.subtitle || '',
        price: Number(req.body.price) || 500000,
        originalPrice: Number(req.body.originalPrice) || Number(req.body.price) || 500000,
        occasion: req.body.occasion || 'home',
        colorTone: req.body.colorTone || 'powder',
        image: req.body.image || '',
        tags: req.body.tags || ['Tem BCA'],
        meaning: req.body.meaning || '',
        flowerTypes: req.body.flowerTypes || [],
        rating: 5.0,
        reviewsCount: 0,
        freshDays: Number(req.body.freshDays) || 365,
        isAvailable: req.body.isAvailable !== undefined ? Boolean(req.body.isAvailable) : true,
        ...req.body,
        updatedAt: req.body.updatedAt || new Date().toISOString()
      };
      products.push(newEntry);
      index = products.length - 1;
    } else {
      products[index] = {
        ...products[index],
        ...req.body,
        slug: cleanSlug,
        price: req.body.price ? Number(req.body.price) : products[index].price,
        originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : products[index].originalPrice,
        isAvailable: req.body.isAvailable !== undefined ? Boolean(req.body.isAvailable) : products[index].isAvailable,
        updatedAt: req.body.updatedAt || new Date().toISOString()
      };
    }

    await writeJson('products.json', products);
    broadcastAdminEvent({ type: 'PRODUCT_UPDATED', product: products[index] });
    res.json({ success: true, data: products[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/products/:id/toggle (Bật/Tắt hiển thị)
app.patch('/api/products/:id/toggle', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let products = (await readJson('products.json')) || [];
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mẫu hoa' });
    }

    products[index].isAvailable = products[index].isAvailable === false ? true : false;
    products[index].updatedAt = new Date().toISOString();
    await writeJson('products.json', products);

    broadcastAdminEvent({ type: 'PRODUCT_UPDATED', product: products[index] });
    res.json({ success: true, data: products[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/:id (Xóa mẫu hoa)
app.delete('/api/products/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let products = (await readJson('products.json')) || [];
    const filtered = products.filter(p => p.id !== id);

    if (filtered.length === products.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mẫu hoa' });
    }

    await writeJson('products.json', filtered);
    broadcastAdminEvent({ type: 'PRODUCT_DELETED', productId: id });
    res.json({ success: true, message: 'Đã xóa mẫu hoa thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ----------------------------------------------------
// 1a. ẢNH ADMIN TẢI LÊN (lưu thành tệp trong DATA_DIR/uploads)
// ----------------------------------------------------
// POST /api/uploads/image  body: { dataUrl: "data:image/jpeg;base64,..." }  =>  { url: "/uploads/<tên>.jpg" }
app.post('/api/uploads/image', requireAdminAuth, uploadLimiter, (req, res) => {
  const result = saveImageDataUrl(req.body && req.body.dataUrl);
  if (!result.ok) return res.status(result.status).json({ success: false, message: result.message });
  res.status(201).json({ success: true, url: result.url, bytes: result.bytes });
});

// GET /uploads/<tên>: tên do server sinh nên bất biến => cache dài hạn. nosniff để trình duyệt không đoán kiểu nội dung.
app.get('/uploads/:name', (req, res) => {
  const filePath = resolveUploadFile(req.params.name);
  if (!filePath) return res.status(404).type('text/plain').send('Not found');
  res.setHeader('Content-Type', uploadContentType(req.params.name));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(filePath);
});

// ----------------------------------------------------
// 1b. DANH MỤC SẢN PHẨM CHÍNH (thêm / sửa / xóa / sắp xếp)
// ----------------------------------------------------
const loadCategories = async () => sortCategories((await readJson('categories.json')) || []);

// Trả về thông báo lỗi nếu sản phẩm gán vào danh mục không tồn tại; rỗng/không gửi = để server tự suy ra
const checkProductCategory = (categoryId, categories) => {
  if (categoryId === undefined || categoryId === null || categoryId === '') return null;
  return categories.some(c => c.id === categoryId) ? null : 'Danh mục không tồn tại. Hãy tải lại trang và chọn danh mục khác.';
};

const CATEGORY_FIELDS = ['shortName', 'label', 'icon', 'badge', 'tagline', 'showcaseImg', 'showcaseBadge', 'showcaseTitle', 'showcaseDesc'];
const pickCategoryFields = (source) => Object.fromEntries(CATEGORY_FIELDS.filter(k => source[k] !== undefined).map(k => [k, source[k]]));

// GET /api/categories (công khai: menu, banner, bộ lọc)
app.get('/api/categories', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({ success: true, data: await loadCategories() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/categories (thêm danh mục mới)
app.post('/api/categories', requireAdminAuth, async (req, res) => {
  try {
    const { value, errors } = sanitizeCategoryInput(req.body, { partial: false });
    if (errors.length > 0) return res.status(400).json({ success: false, message: errors.join(' ') });

    const categories = await loadCategories();
    const created = {
      id: generateCategoryId(value.shortName, categories.map(c => c.id), slugifyVietnamese),
      ...pickCategoryFields(value),
      order: categories.length > 0 ? Math.max(...categories.map(c => Number(c.order) || 0)) + 1 : 0
    };
    await writeJson('categories.json', [...categories, created]);
    broadcastAdminEvent({ type: 'CATEGORIES_CHANGED' });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/categories/order (sắp xếp lại: body { ids: [...] } phải gồm đủ mọi danh mục, mỗi mục đúng một lần)
app.put('/api/categories/order', requireAdminAuth, async (req, res) => {
  try {
    const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids.map(String) : [];
    const categories = await loadCategories();
    const sameSet = ids.length === categories.length && new Set(ids).size === ids.length && ids.every(id => categories.some(c => c.id === id));
    if (!sameSet) {
      return res.status(400).json({ success: false, message: 'Danh sách sắp xếp phải gồm đủ tất cả danh mục, mỗi danh mục đúng một lần.' });
    }
    const reordered = ids.map((id, index) => ({ ...categories.find(c => c.id === id), order: index }));
    await writeJson('categories.json', reordered);
    broadcastAdminEvent({ type: 'CATEGORIES_CHANGED' });
    res.json({ success: true, data: reordered });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/categories/:id (sửa nội dung; id không đổi để sản phẩm vẫn gắn đúng danh mục)
app.put('/api/categories/:id', requireAdminAuth, async (req, res) => {
  try {
    const { value, errors } = sanitizeCategoryInput(req.body, { partial: true });
    if (errors.length > 0) return res.status(400).json({ success: false, message: errors.join(' ') });

    const categories = await loadCategories();
    const index = categories.findIndex(c => c.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục.' });

    const updated = { ...categories[index], ...pickCategoryFields(value) };
    const next = categories.map((c, i) => (i === index ? updated : c));
    await writeJson('categories.json', next);
    broadcastAdminEvent({ type: 'CATEGORIES_CHANGED' });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/categories/:id?reassignTo=<id khác>
// Danh mục đang có sản phẩm chỉ xóa được khi chỉ định danh mục thay thế; sản phẩm được chuyển trước rồi mới xóa danh mục.
app.delete('/api/categories/:id', requireAdminAuth, async (req, res) => {
  try {
    const categories = await loadCategories();
    const products = (await readJson('products.json')) || [];
    const plan = planCategoryDeletion({ categories, products, id: req.params.id, reassignTo: req.query.reassignTo });
    if (!plan.ok) {
      return res.status(plan.status).json({ success: false, error: plan.error, message: plan.message, productCount: plan.productCount });
    }

    if (plan.affected.length > 0) {
      const now = new Date().toISOString();
      const moved = new Set(plan.affected);
      await writeJson('products.json', products.map(p => (moved.has(p) ? { ...p, category: plan.reassignTo, updatedAt: now } : p)));
    }
    const remaining = categories.filter(c => c.id !== req.params.id).map((c, index) => ({ ...c, order: index }));
    await writeJson('categories.json', remaining);

    broadcastAdminEvent({ type: 'CATEGORIES_CHANGED' });
    res.json({ success: true, movedProducts: plan.affected.length, reassignedTo: plan.reassignTo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 2. ORDERS REST API (Quản Lý Đơn Hàng & Vận Hành Florist)
// ----------------------------------------------------

const normalizePhone = (value) => String(value || '').replace(/\D/g, '');

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// GET /api/orders/track?code=...&phone=... (khách tự tra cứu đơn của mình: phải khớp cả mã đơn lẫn SĐT)
app.get('/api/orders/track', orderTrackLimiter, async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const code = String(req.query.code || '').trim().toUpperCase();
    const phone = normalizePhone(req.query.phone);
    if (!code || phone.length < 8) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã đơn hàng và số điện thoại đặt hàng.' });
    }

    const orders = (await readJson('orders.json')) || [];
    const order = orders.find(o => String(o.orderCode || o.id || '').toUpperCase() === code);
    const knownPhones = order ? [normalizePhone(order.customerPhone), normalizePhone(order.receiverPhone)] : [];
    if (!order || !knownPhones.includes(phone)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng khớp mã và số điện thoại.' });
    }
    return res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders (danh sách đầy đủ kèm SĐT/địa chỉ khách: chỉ admin)
app.get('/api/orders', requireAdminAuth, async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const orders = await readJson('orders.json');
    res.json({ success: true, data: orders, total: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Clean helper for Telegram tokens
const cleanTelegramToken = (token) => {
  if (!token) return '';
  return token.trim().replace(/^bot/i, '');
};

const cleanTelegramChatId = (chatId) => {
  if (!chatId) return '';
  return String(chatId).trim();
};

const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const sendTelegramNotificationForOrder = async (order, customToken = null, customChatId = null) => {
  try {
    const settings = (await readJson('settings.json')) || {};
    const botToken = customToken || settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = customChatId || settings.telegramChatId || process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) return false;

    const token = cleanTelegramToken(botToken);
    const targetChatId = cleanTelegramChatId(chatId);
    if (!token || !targetChatId) return false;

    let itemsListText = '';
    if (Array.isArray(order.items) && order.items.length > 0) {
      itemsListText = '\n📋 <b>Chi tiết thiết bị:</b>\n' +
        order.items.map((it, idx) => `  ${idx + 1}. ${escapeHtml(it.name)} (<b>${Number(it.price || 0).toLocaleString('vi-VN')}đ</b>)`).join('\n') + '\n';
    }

    const anonymousNotice = order.isAnonymous ? ' <i>(🕵️ Đơn gửi ẩn danh)</i>' : '';

    const htmlMessage = `🧯 <b>CÓ ĐƠN ĐẶT THIẾT BỊ PCCC MỚI!</b> (#${escapeHtml(order.orderCode || order.id)})\n\n` +
      `🏢 <b>Cơ sở / Người đặt:</b> ${escapeHtml(order.customerName || 'Khách hàng')}${anonymousNotice}\n` +
      `📞 <b>Hotline / SĐT:</b> ${escapeHtml(order.customerPhone || 'Chưa cung cấp')}\n` +
      `🧯 <b>Thiết bị chính:</b> ${escapeHtml(order.productName || 'Thiết bị PCCC kiểm định')}\n` +
      itemsListText +
      `💰 <b>Tổng thanh toán:</b> <b>${Number(order.totalAmount || 0).toLocaleString('vi-VN')}đ</b>\n` +
      `⏱️ <b>Phương thức giao:</b> ${escapeHtml(order.deliverySlot || 'Hỏa tốc 60-90 phút')}\n` +
      `📍 <b>Người nhận:</b> ${escapeHtml(order.receiverName || '')} (${escapeHtml(order.receiverPhone || '')})\n` +
      `🏠 <b>Địa chỉ:</b> ${escapeHtml(order.receiverAddress || 'Chưa cung cấp')}\n\n` +
      `👉 <i>FLAMEGUARD PRO: Sẵn sàng kiểm định và xuất kho!</i>`;

    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const tgRes = await fetchWithTimeout(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: htmlMessage,
        parse_mode: 'HTML'
      })
    });
    const tgData = await tgRes.json();
    return Boolean(tgData?.ok);
  } catch (err) {
    console.warn('[Telegram Order Notify Note]:', err.message);
    return false;
  }
};

// POST /api/orders
const clampText = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const ORDER_CODE_PATTERN = /^[A-Z]{2,4}-\d{4,10}$/;
const generateOrderCode = (orders) => {
  const used = new Set(orders.map(o => String(o.orderCode || o.id || '').toUpperCase()));
  for (let i = 0; i < 20; i++) {
    const code = 'FB-' + Math.floor(10000 + Math.random() * 90000);
    if (!used.has(code)) return code;
  }
  return 'FB-' + Date.now().toString().slice(-8);
};

app.post('/api/orders', orderCreateLimiter, async (req, res) => {
  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    const currentTime = `${timeStr} (${dateStr})`;
    const orders = (await readJson('orders.json')) || [];
    // Mã đơn do client gửi chỉ được dùng nếu đúng định dạng và chưa tồn tại (tránh ghi trùng/giả mạo đơn khác)
    const requestedCode = String(req.body.orderCode || req.body.id || '').trim().toUpperCase();
    const codeIsUsable = ORDER_CODE_PATTERN.test(requestedCode) && !orders.some(o => String(o.orderCode || o.id || '').toUpperCase() === requestedCode);
    const newOrderCode = codeIsUsable ? requestedCode : generateOrderCode(orders);
    const newOrder = {
      id: newOrderCode,
      orderCode: newOrderCode,
      customerName: clampText(req.body.customerName || req.body.senderName, 120) || 'Khách hàng',
      customerPhone: clampText(req.body.customerPhone || req.body.senderPhone, 30) || '0901 234 567',
      receiverName: clampText(req.body.receiverName, 120) || 'Người nhận hoa',
      receiverPhone: clampText(req.body.receiverPhone, 30) || '0988 765 432',
      receiverAddress: clampText(req.body.receiverAddress, 300) || 'Quận 1, TP.HCM',
      isAnonymous: Boolean(req.body.isAnonymous),
      productName: clampText(req.body.productName, 200) || 'Bó hoa tươi nghệ thuật',
      cardMessage: clampText(req.body.cardMessage, 500) || 'Gửi gắm yêu thương!',
      senderSign: clampText(req.body.senderSign || req.body.senderName, 120) || 'Người gửi',
      deliverySlot: clampText(req.body.deliverySlot, 120) || 'Hỏa tốc 90 phút',
      totalAmount: Number(req.body.totalAmount) || 850000,
      status: 'ARRANGING',
      florist: 'Thợ cắm hoa Minh Thư (Studio A)',
      floristAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      proofPhotoUrl: null, // chỉ admin được gắn ảnh nghiệm thu qua PATCH
      isApproved: false,
      createdAt: currentTime,
      items: Array.isArray(req.body.items) ? req.body.items.slice(0, 50) : []
    };

    orders.unshift(newOrder);
    await writeJson('orders.json', orders);

    broadcastAdminEvent({
      type: 'NEW_ORDER',
      order: newOrder,
      timestamp: new Date().toISOString()
    });

    // Gửi thông báo Telegram tự động từ Server
    // Token/Chat ID chỉ lấy từ cài đặt của shop hoặc biến môi trường, KHÔNG nhận từ client
    const telegramSent = await sendTelegramNotificationForOrder(newOrder);

    res.status(201).json({ success: true, data: newOrder, telegramSent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/orders/:id/status
app.patch('/api/orders/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let orders = (await readJson('orders.json')) || [];
    const index = orders.findIndex(o => o.id === id || o.orderCode === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    orders[index] = {
      ...orders[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    await writeJson('orders.json', orders);

    broadcastAdminEvent({
      type: 'ORDER_STATUS_CHANGED',
      order: orders[index]
    });

    res.json({ success: true, data: orders[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. TELEGRAM BOT NOTIFICATION WEBHOOK & AUTO-DETECT CHAT ID
// ----------------------------------------------------

// Endpoint tự động tìm Chat ID từ Bot Token 1-Chạm!
app.post('/api/notifications/telegram-get-chat-id', requireAdminAuth, async (req, res) => {
  try {
    const rawToken = req.body.botToken;
    if (!rawToken) {
      return res.status(400).json({ success: false, message: 'Vui lòng dán chuỗi Bot Token vào ô trên trước khi bấm dò tìm' });
    }

    const token = cleanTelegramToken(rawToken);
    const updatesUrl = `https://api.telegram.org/bot${token}/getUpdates`;
    const tgRes = await fetchWithTimeout(updatesUrl);
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      let friendlyError = tgData.description;
      if (tgData.error_code === 401 || tgData.description?.includes('Unauthorized')) {
        friendlyError = 'Bot Token không đúng hoặc đã bị xóa. Hãy kiểm tra lại chuỗi Token từ @BotFather.';
      }
      return res.status(400).json({ 
        success: false, 
        message: `Lỗi kết nối Bot: ${friendlyError}` 
      });
    }

    const updates = tgData.result || [];
    if (updates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chưa nhận được tin nhắn nào! Bạn hãy mở Telegram, tìm bot của bạn, bấm nút START (hoặc gửi chữ "Hi") rồi bấm lại nút này nhé.'
      });
    }

    // Lấy tin nhắn mới nhất
    const lastUpdate = updates[updates.length - 1];
    const message = lastUpdate.message || lastUpdate.channel_post || lastUpdate.callback_query?.message;

    if (!message || !message.chat) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ID cuộc trò chuyện. Hãy gửi 1 tin nhắn bất kỳ đến bot.'
      });
    }

    const chatId = message.chat.id;
    const name = message.from?.first_name || message.chat?.first_name || message.chat?.title || 'Bạn';

    res.json({
      success: true,
      chatId: String(chatId),
      senderName: name,
      message: `Đã tìm thấy Chat ID của ${name}: ${chatId}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint test gửi thông báo đơn hàng qua Telegram
app.post('/api/notifications/telegram-test', requireAdminAuth, async (req, res) => {
  try {
    const { botToken, chatId, testOrder } = req.body;
    if (!botToken || !chatId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ cả Bot Token và Chat ID' });
    }

    const token = cleanTelegramToken(botToken);
    const targetChatId = cleanTelegramChatId(chatId);

    const order = testOrder || {
      orderCode: 'FB-TEST-2026',
      customerName: 'Anh Hoàng Nam',
      productName: 'Bó Hoa Juliet Nắng Ban Mai',
      totalAmount: 850000,
      deliverySlot: '14:00 - 16:00 Hôm nay',
      receiverAddress: 'Bitexco, Q.1'
    };

    // Dùng định dạng HTML an toàn 100%, không bị lỗi ký tự Markdown
    const htmlMessage = `🌸 <b>CÓ ĐƠN ĐẶT HOA MỚI!</b> (#${order.orderCode})\n\n` +
      `👤 <b>Khách đặt:</b> ${order.customerName}\n` +
      `💐 <b>Mẫu hoa:</b> ${order.productName}\n` +
      `💰 <b>Tổng tiền:</b> ${Number(order.totalAmount).toLocaleString('vi-VN')}đ\n` +
      `⏱️ <b>Khung giờ:</b> ${order.deliverySlot}\n` +
      `📍 <b>Giao tới:</b> ${order.receiverAddress}\n\n` +
      `👉 <i>Hãy mở Bảng Điều Hành Admin Flora & Bloom để duyệt ảnh và cắm hoa nhé!</i>`;

    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const tgRes = await fetchWithTimeout(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: htmlMessage,
        parse_mode: 'HTML'
      })
    });

    const tgData = await tgRes.json();
    if (!tgData.ok) {
      let explanation = tgData.description;
      if (tgData.description?.includes('bot was blocked by the user') || tgData.description?.includes('chat not found')) {
        explanation = 'LƯU Ý QUAN TRỌNG: Bạn chưa bấm START vào bot! Hãy mở ứng dụng Telegram, tìm đúng tên bot của bạn và bấm nút START để cho phép bot gửi tin nhắn nhé.';
      } else if (tgData.description?.includes('Unauthorized')) {
        explanation = 'Chuỗi Bot Token không chính xác. Hãy kiểm tra lại token được cấp bởi @BotFather.';
      }
      return res.status(400).json({ success: false, message: `Lỗi từ Telegram: ${explanation}` });
    }

    res.json({ success: true, message: '🎉 Thành công! Bot vừa gửi tin nhắn thông báo đến Telegram của bạn!', data: tgData.result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/notifications/telegram-server-alert-test
// Endpoint kiểm tra Bot Giám Sát Developer (BOT 2)
app.post('/api/notifications/telegram-server-alert-test', requireAdminAuth, async (req, res) => {
  try {
    const { botToken, chatId } = req.body || {};
    const result = await testDeveloperServerAlert(botToken, chatId);
    if (result.success) {
      res.json({ 
        success: true, 
        message: '🎉 Thành công! Đã gửi tin nhắn kiểm tra tới Bot Giám Sát Developer.', 
        data: result 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: result.error || 'Gửi tin nhắn kiểm tra Bot Developer thất bại' 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 4. INVENTORY API
// ----------------------------------------------------
app.get('/api/inventory', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const inventory = await readJson('inventory.json');
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/inventory', requireAdminAuth, async (req, res) => {
  try {
    const newInventory = req.body;
    await writeJson('inventory.json', newInventory);
    res.json({ success: true, data: newInventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 5. DISCOUNTS & REVIEWS API
// ----------------------------------------------------
app.get('/api/discounts', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const discounts = await readJson('discounts.json');
    res.json({ success: true, data: discounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/reviews', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const reviews = await readJson('reviews.json');
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const isSafeImageRef = (value) =>
  typeof value === 'string' && value.length <= 1500000 &&
  (/^https?:\/\//i.test(value) || value.startsWith('/images/') || /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value));

app.post('/api/reviews', reviewCreateLimiter, async (req, res) => {
  try {
    const reviews = (await readJson('reviews.json')) || [];
    const body = req.body || {};
    const comment = clampText(body.comment, 1500);
    if (!comment) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung đánh giá.' });
    }

    const requestedId = typeof body.id === 'string' ? body.id.trim() : '';
    const idIsUsable = /^REV-[A-Za-z0-9-]{3,40}$/.test(requestedId) && !reviews.some(r => r.id === requestedId);
    const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating)) || 5));

    const newReview = {
      id: idIsUsable ? requestedId : `REV-${Date.now()}`,
      customerName: clampText(body.customerName, 80) || 'Khách hàng PCCC',
      customerAvatar: /^https?:\/\//i.test(body.customerAvatar || '') ? String(body.customerAvatar).slice(0, 500) : '',
      productName: clampText(body.productName, 160),
      rating,
      occasion: clampText(body.occasion, 80),
      comment,
      proofImage: isSafeImageRef(body.proofImage) ? body.proofImage : null,
      verified: false, // chỉ hệ thống/admin mới đánh dấu xác thực
      createdAt: new Date().toISOString().split('T')[0],
      likes: 0,
      isVisible: true
    };
    reviews.unshift(newReview);
    await writeJson('reviews.json', reviews);
    res.status(201).json({ success: true, data: newReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 6. AI FIRE SAFETY VISION & HAZARD INSPECTION API
// ----------------------------------------------------
app.post('/api/ai/analyze-flower', async (req, res) => {
  try {
    const analysisPayload = {
      detectedFlowers: [
        'Nguy cơ chập nguồn điện & quá tải ổ cắm (Class E)',
        'Vật liệu cháy lan rèm vải & bàn ghế gỗ (Class A)',
        'Lối thoát hiểm và hành lang ban công'
      ],
      colorPalette: ['#DC2626', '#EA580C', '#0F172A', '#F8FAFC'],
      colorNames: ['Đỏ PCCC', 'Cam Cứu Hỏa', 'Đen Thép Chống Cháy', 'Trắng Bạc Phản Quang'],
      style: 'Tiêu Chuẩn TCVN 3890:2023 (Trang Bị Phương Tiện PCCC & Cứu Nạn)',
      difficulty: 'Thẩm định kỹ thuật: Mức độ cần trang bị cấp bách',
      priceRange: {
        min: 890000,
        max: 1390000
      },
      floristAdvice: 'Nên bố trí bình chữa cháy bột ABC 4kg cạnh cửa ra vào hoặc bếp nấu, đồng thời trang bị mặt nạ lọc độc TZL30 tại phòng ngủ để kịp thời thoát hiểm khi có khói độc.',
      summaryVietnamese: 'Khu vực tiềm ẩn rủi ro cháy chập điện gia dụng. Đề xuất trang bị bình cứu hỏa bột ABC đạt tem kiểm định Bộ Công An và mặt nạ chống khói khẩn cấp.',
      analyzedAt: new Date().toISOString(),
      aiModel: 'Gemini-2.5-Flash Multimodal Vision Engine (PCCC TCVN 3890 Inspector)'
    };

    res.json({ success: true, data: analysisPayload });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi thẩm định AI: ' + error.message });
  }
});

// ----------------------------------------------------
// 7. ZALO ZNS & NOTIFICATION API
// ----------------------------------------------------
app.post('/api/zalo/send-zns', requireAdminAuth, async (req, res) => {
  try {
    const { phone, customerName, orderCode, photoUrl, accessToken } = req.body;

    const payload = {
      phone: phone ? phone.replace(/\D/g, '') : '0901234567',
      template_id: '318492',
      template_data: {
        customer_name: customerName || 'Quý khách',
        order_code: orderCode || 'FB-89241',
        photo_url: photoUrl || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
        status: 'Đã cắm hoa hoàn tất - Chờ duyệt ảnh',
        time: new Date().toLocaleTimeString('vi-VN')
      },
      tracking_id: `zns_${orderCode}_${Date.now()}`
    };

    if (accessToken) {
      try {
        const response = await fetchWithTimeout('https://business.openapi.zalo.me/message/template', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': accessToken
          },
          body: JSON.stringify(payload)
        });
        const liveData = await response.json();
        return res.json({ success: true, isLiveApi: true, data: liveData });
      } catch (err) {
        console.warn('Zalo API sandbox fallback:', err.message);
      }
    }

    res.json({
      success: true,
      isLiveApi: false,
      message: `Đã gửi thành công thông báo ZNS đến SĐT ${payload.phone}`,
      data: payload
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 8. SETTINGS API
// ----------------------------------------------------
const maskSecret = (val) => {
  if (!val || typeof val !== 'string') return '';
  if (val.length <= 8) return '********';
  return `${val.slice(0, 6)}...${val.slice(-4)}`;
};

// Khóa nào trông giống bí mật thì KHÔNG bao giờ trả cho người chưa đăng nhập (kể cả trường thêm vào sau này).
const SECRET_KEY_PATTERN = /(token|secret|password|apikey|api_key|chatid|recipientid)/i;
const redactSecrets = (value) => {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (/^has[A-Z]/.test(key)) {
        out[key] = val;
      } else if (!SECRET_KEY_PATTERN.test(key)) {
        out[key] = redactSecrets(val);
      }
    }
    return out;
  }
  return value;
};

app.get('/api/settings', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const settings = (await readJson('settings.json')) || {};
    const isAdmin = Boolean(getRequestAdmin(req));

    const flags = {
      hasTelegramToken: Boolean(settings.telegramBotToken && settings.telegramBotToken.length > 5),
      hasTelegramChatId: Boolean(settings.telegramChatId),
      hasFacebookPageToken: Boolean(settings.facebookSettings?.pageAccessToken)
    };

    const safeSettings = isAdmin
      ? { ...settings, ...flags }
      : { ...redactSecrets(settings), ...flags };

    res.json({ success: true, data: safeSettings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/settings', requireAdminAuth, async (req, res) => {
  try {
    const current = (await readJson('settings.json')) || {};
    const payload = { ...req.body };

    // Không ghi đè nếu payload gửi lên là chuỗi mask (chứa '...')
    if (payload.telegramBotToken && payload.telegramBotToken.includes('...')) {
      delete payload.telegramBotToken;
    }

    const updated = {
      ...current,
      ...payload,
      updatedAt: req.body.updatedAt || new Date().toISOString()
    };

    if (payload.brandSettings) {
      updated.brandSettings = {
        ...(current.brandSettings || {}),
        ...payload.brandSettings
      };
      if (payload.brandSettings.hotline && !payload.shopZaloPhone) {
        updated.shopZaloPhone = payload.brandSettings.hotline;
      }
    }
    if (payload.shopZaloPhone) {
      updated.brandSettings = {
        ...(updated.brandSettings || current.brandSettings || {}),
        hotline: payload.shopZaloPhone
      };
    }

    await writeJson('settings.json', updated);
    res.json({ success: true, data: updated, message: 'Đã lưu cấu hình cài đặt thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 8. FACEBOOK MESSENGER WEBHOOK & GRAPH API INTEGRATION
// ----------------------------------------------------

// Helper gửi tin nhắn qua Facebook Graph API Send API
const callFacebookSendApi = async (pageAccessToken, recipientId, messageText, quickReplies = []) => {
  if (!pageAccessToken) {
    return {
      success: true,
      isMock: true,
      message: 'Chế độ giả lập (Chưa cấu hình Page Access Token)',
      recipientId,
      text: messageText
    };
  }

  const messagePayload = { text: messageText };
  if (quickReplies && quickReplies.length > 0) {
    messagePayload.quick_replies = quickReplies.map(qr => ({
      content_type: 'text',
      title: qr.title,
      payload: qr.payload || qr.title
    }));
  }

  const graphUrl = `https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(pageAccessToken)}`;
  const response = await fetchWithTimeout(graphUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: messagePayload
    })
  });

  const resData = await response.json();
  if (resData.error) {
    throw new Error(`Facebook Graph API Lỗi: ${resData.error.message}`);
  }
  return { success: true, isLiveApi: true, data: resData };
};

// 8.1. Meta Webhook Verification (Xác thực Webhook với Meta Developer Portal)
app.get('/api/facebook/webhook', async (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const settings = (await readJson('settings.json')) || {};
    const expectedToken = settings.facebookSettings?.verifyToken;
    if (!expectedToken) {
      return res.status(403).send('Forbidden: Webhook verify token chưa được cấu hình');
    }

    if (mode && token) {
      if (mode === 'subscribe' && safeEqual(token, expectedToken)) {
        console.log('✅ [Facebook Webhook] Đã xác thực thành công Webhook với Meta for Developers!');
        return res.status(200).send(challenge);
      } else {
        console.warn('⚠️ [Facebook Webhook] Từ chối: Verify Token không khớp');
        return res.status(403).send('Forbidden: Token mismatch');
      }
    }
    return res.status(400).send('Bad Request: Thiếu thông số xác thực hub.mode hoặc hub.verify_token');
  } catch (error) {
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

// 8.2. Nhận tin nhắn sự kiện từ Webhook Facebook Messenger & Tự động phản hồi thông minh (Chatbot)
app.post('/api/facebook/webhook', async (req, res) => {
  try {
    // Chỉ chấp nhận sự kiện có chữ ký HMAC hợp lệ từ Meta (cần biến môi trường FACEBOOK_APP_SECRET)
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (!appSecret) {
      console.warn('[Facebook Webhook] Bỏ qua sự kiện: chưa đặt FACEBOOK_APP_SECRET nên không thể xác minh chữ ký X-Hub-Signature-256.');
      return res.sendStatus(403);
    }
    const signature = String(req.headers['x-hub-signature-256'] || '');
    const expectedSignature = 'sha256=' + crypto.createHmac('sha256', appSecret).update(req.rawBody || Buffer.alloc(0)).digest('hex');
    if (!safeEqual(signature, expectedSignature)) {
      return res.sendStatus(403);
    }

    const body = req.body;

    if (body.object === 'page') {
      const settings = (await readJson('settings.json')) || {};
      const fbConfig = settings.facebookSettings || {};

      for (const entry of (body.entry || [])) {
        const webhookEvent = entry.messaging?.[0];
        if (!webhookEvent) continue;

        const senderPsid = webhookEvent.sender?.id;
        const userMessage = webhookEvent.message?.text?.trim() || '';

        console.log(`📩 [Facebook Messenger] Nhận tin nhắn từ PSID ${senderPsid}: "${userMessage}"`);

        // Nếu bật Auto Reply và có senderPsid
        if (fbConfig.autoReplyEnabled !== false && senderPsid && userMessage) {
          const lowerText = userMessage.toLowerCase();
          const orderMatch = userMessage.match(/FB-[\w\d]+/i);

          let replyText = '';
          const quickReplies = [
            { title: '💐 Xem mẫu hoa', payload: 'MENU' },
            { title: '🔍 Tra cứu đơn', payload: 'TRACK' },
            { title: '⚡ Giao gấp 60p', payload: 'EXPRESS' }
          ];

          // 1. Trường hợp khách hỏi mã đơn hàng (VD: "Kiểm tra đơn FB-89241")
          if (orderMatch) {
            const searchedCode = orderMatch[0].toUpperCase();
            const orders = (await readJson('orders.json')) || [];
            const found = orders.find(o => (o.orderCode || o.id || '').toUpperCase() === searchedCode);

            if (found) {
              const statusMap = {
                ARRANGING: 'Đang cắm tại xưởng',
                PHOTO_READY: 'Đã cắm xong - Chờ khách duyệt ảnh',
                DELIVERING: 'Đang trên đường giao hoa',
                COMPLETED: 'Đã giao hoa thành công'
              };
              replyText = `🌸 Thông tin đơn hàng #${found.orderCode}:\n` +
                `• Người nhận: ${found.receiverName}\n` +
                `• Mẫu hoa: ${found.productName}\n` +
                `• Trạng thái: ${statusMap[found.status] || found.status}\n` +
                `• Khung giờ: ${found.deliverySlot || 'Hỏa tốc'}\n` +
                (found.proofPhotoUrl ? `📸 Xem ảnh hoa thực tế: ${found.proofPhotoUrl}\n` : '') +
                `👉 Nếu quý khách cần thay đổi nội dung thiệp hoặc hỗ trợ gấp, vui lòng nhắn tin ngay tại đây nhé!`;
            } else {
              replyText = `🌸 Flora & Bloom đã tìm kiếm nhưng chưa thấy mã đơn #${searchedCode} trên hệ thống. Quý khách vui lòng kiểm tra lại mã đơn hoặc để lại số điện thoại đặt hoa để tiệm tra cứu nhé!`;
            }
          } 
          // 2. Trường hợp khách hỏi Menu / Mẫu hoa
          else if (lowerText.includes('hoa') || lowerText.includes('menu') || lowerText.includes('mẫu') || lowerText.includes('giá')) {
            const products = (await readJson('products.json')) || [];
            const topProducts = products.slice(0, 3).map(p => `• ${p.name}: ${Number(p.price).toLocaleString('vi-VN')}đ`).join('\n');
            replyText = `🌸 Dạ chào bạn! Các mẫu hoa thiết kế đang được yêu thích nhất hôm nay tại Flora & Bloom Studio:\n\n` +
              `${topProducts}\n\n` +
              `💐 Tất cả mẫu hoa đều được tặng kèm thiệp thiết kế & túi xách cao cấp. Bạn muốn tiệm tư vấn hoa cho dịp nào ạ?`;
          } 
          // 3. Chào mừng mặc định
          else {
            replyText = fbConfig.welcomeMessage || 
              'Dạ chào bạn! Flora & Bloom Studio rất vui được hỗ trợ bạn. Bạn muốn tư vấn đặt hoa theo dịp hay cần tra cứu tiến trình đơn hàng đã đặt ạ? 🌸';
          }

          // Gửi phản hồi qua Graph API nếu có Token, hoặc log nếu mock
          try {
            await callFacebookSendApi(fbConfig.pageAccessToken, senderPsid, replyText, quickReplies);
          } catch (sendErr) {
            console.warn('⚠️ Lỗi gửi tin nhắn Facebook:', sendErr.message);
          }
        }
      }

      return res.status(200).send('EVENT_RECEIVED');
    }

    res.sendStatus(404);
  } catch (error) {
    console.error('Lỗi xử lý Facebook Webhook:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8.3. API gửi tin nhắn chủ động qua Facebook Messenger (Send Message / Push Notification)
app.post('/api/facebook/send-message', requireAdminAuth, async (req, res) => {
  try {
    const { recipientId, message, pageAccessToken, quickReplies } = req.body;
    const settings = (await readJson('settings.json')) || {};
    const token = pageAccessToken || settings.facebookSettings?.pageAccessToken;
    const targetRecipient = recipientId || settings.facebookSettings?.adminRecipientId;

    if (!targetRecipient) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp recipientId (PSID người nhận) hoặc cấu hình Admin Recipient ID trong Cài đặt' 
      });
    }

    if (!message) {
      return res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống' });
    }

    const result = await callFacebookSendApi(token, targetRecipient, message, quickReplies);
    res.json({
      success: true,
      message: result.isMock 
        ? '✅ Đã kích hoạt kịch bản gửi tin nhắn Messenger (Chế độ mô phỏng / Chưa gắn Token)'
        : '🎉 Đã gửi tin nhắn thành công qua Facebook Messenger!',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8.4. API thử nghiệm kết nối Facebook Messenger (Test Connection)
app.post('/api/facebook/test-connection', requireAdminAuth, async (req, res) => {
  try {
    const { pageId, pageAccessToken, recipientId, testOrder } = req.body;
    const cleanId = (pageId || 'tiemhoaflorabloom').trim();

    const order = testOrder || {
      orderCode: 'FB-FB-TEST',
      customerName: 'Khách hàng Messenger',
      productName: 'Bó Hoa Juliet Nắng Ban Mai',
      totalAmount: 850000,
      deliverySlot: 'Hỏa tốc 90 phút'
    };

    const notificationMessage = `🌸 [FLORA & BLOOM] THÔNG BÁO TEST KẾT NỐI MESSENGER!\n\n` +
      `👤 Khách hàng: ${order.customerName}\n` +
      `💐 Mẫu hoa: ${order.productName}\n` +
      `💰 Tổng tiền: ${Number(order.totalAmount).toLocaleString('vi-VN')}đ\n` +
      `⏱️ Khung giờ: ${order.deliverySlot}\n\n` +
      `👉 Kết nối Facebook Fanpage (@${cleanId}) đang hoạt động hoàn hảo!`;

    if (pageAccessToken && recipientId) {
      const graphResult = await callFacebookSendApi(pageAccessToken, recipientId, notificationMessage);
      return res.json({
        success: true,
        isLiveApi: true,
        message: `🎉 Đã gửi tin nhắn test thành công đến Messenger PSID: ${recipientId}`,
        messengerUrl: `https://m.me/${cleanId}`,
        data: graphResult
      });
    }

    // Nếu không có Token/PSID, trả về xác nhận cấu hình Fanpage và liên kết m.me
    res.json({
      success: true,
      isLiveApi: false,
      message: `🎉 Kết nối Fanpage @${cleanId} hợp lệ! Link chat: https://m.me/${cleanId}`,
      messengerUrl: `https://m.me/${cleanId}`,
      data: {
        pageId: cleanId,
        previewText: notificationMessage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 9. ARTICLES & SEO BLOG REST API (Tin Tức & SEO Content)
// ----------------------------------------------------

export const slugifyVietnamese = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// GET /api/articles (Lấy danh sách bài viết)
app.get('/api/articles', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const articles = (await readJson('articles.json')) || [];

    const isAdmin = Boolean(getRequestAdmin(req));

    const { status, category, search, limit } = req.query;

    let filtered = [...articles];

    // Khách hàng vãng lai chỉ xem bài đã xuất bản
    if (!isAdmin && status !== 'draft') {
      filtered = filtered.filter(a => !a.status || a.status === 'published');
    } else if (status && status !== 'all') {
      filtered = filtered.filter(a => a.status === status);
    }

    if (category && category !== 'all') {
      filtered = filtered.filter(a => a.category === category);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(a => 
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.excerpt && a.excerpt.toLowerCase().includes(q)) ||
        (a.seoKeywords && a.seoKeywords.toLowerCase().includes(q))
      );
    }

    // Sắp xếp bài mới nhất lên đầu
    filtered.sort((a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0));

    if (limit && Number(limit) > 0) {
      filtered = filtered.slice(0, Number(limit));
    }

    res.json({ success: true, data: filtered, total: filtered.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/articles/:slugOrId (Xem chi tiết bài viết & đếm lượt xem)
app.get('/api/articles/:slugOrId', async (req, res) => {
  try {
    const { slugOrId } = req.params;
    const articles = (await readJson('articles.json')) || [];
    const articleIndex = articles.findIndex(a => a.slug === slugOrId || a.id === slugOrId);

    if (articleIndex === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    if (articles[articleIndex].status === 'draft' && !getRequestAdmin(req)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    const article = { ...articles[articleIndex] };

    // Tăng lượt xem (viewsCount) nếu không bị tắt bởi query view=false
    if (req.query.view !== 'false') {
      article.viewsCount = (article.viewsCount || 0) + 1;
      articles[articleIndex] = article;
      writeJson('articles.json', articles).catch(err => console.warn('Lỗi cập nhật viewsCount:', err.message));
    }

    res.json({ success: true, data: article });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/articles (Tạo bài viết SEO mới)
app.post('/api/articles', requireAdminAuth, async (req, res) => {
  try {
    const { 
      title, 
      excerpt, 
      content, 
      category, 
      thumbnail, 
      author, 
      authorAvatar, 
      readingTime, 
      relatedProductId, 
      seoTitle, 
      seoDescription, 
      seoKeywords, 
      isFeatured, 
      status 
    } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Tiêu đề bài viết không được để trống' });
    }

    const articles = (await readJson('articles.json')) || [];

    let slug = req.body.slug ? slugifyVietnamese(req.body.slug) : slugifyVietnamese(title);
    if (!slug) slug = `bai-viet-${Date.now()}`;

    // Đảm bảo slug duy nhất
    let uniqueSlug = slug;
    let counter = 1;
    while (articles.some(a => a.slug === uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const newArticle = {
      id: req.body.id || `art-${Date.now()}`,
      slug: uniqueSlug,
      title: title.trim(),
      category: category || 'Cẩm Nang PCCC',
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80',
      excerpt: excerpt || '',
      content: content || '<p>Nội dung bài viết đang được cập nhật...</p>',
      author: author || 'Kỹ Sư PCCC FLAMEGUARD PRO',
      authorAvatar: authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      publishedAt: req.body.publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewsCount: Number(req.body.viewsCount) || 0,
      readingTime: readingTime || '4 phút đọc',
      status: status || 'published',
      isFeatured: Boolean(isFeatured),
      relatedProductId: relatedProductId || '',
      seoTitle: seoTitle || title.trim(),
      seoDescription: seoDescription || excerpt || '',
      seoKeywords: seoKeywords || ''
    };

    articles.unshift(newArticle);
    await writeJson('articles.json', articles);

    broadcastAdminEvent({ type: 'ARTICLE_ADDED', article: newArticle });
    res.status(201).json({ success: true, data: newArticle, message: 'Tạo bài viết mới thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/articles/:id (Cập nhật bài viết)
app.put('/api/articles/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const articles = (await readJson('articles.json')) || [];
    const index = articles.findIndex(a => a.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết cần cập nhật' });
    }

    const current = articles[index];
    let slug = req.body.slug ? slugifyVietnamese(req.body.slug) : current.slug;
    
    if (slug !== current.slug && articles.some(a => a.id !== id && a.slug === slug)) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const updated = {
      ...current,
      ...req.body,
      id,
      slug,
      updatedAt: new Date().toISOString()
    };

    articles[index] = updated;
    await writeJson('articles.json', articles);

    broadcastAdminEvent({ type: 'ARTICLE_UPDATED', article: updated });
    res.json({ success: true, data: updated, message: 'Cập nhật bài viết thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/articles/:id (Xóa bài viết)
app.delete('/api/articles/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let articles = (await readJson('articles.json')) || [];
    const beforeCount = articles.length;
    articles = articles.filter(a => a.id !== id);

    if (articles.length === beforeCount) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết cần xóa' });
    }

    await writeJson('articles.json', articles);
    broadcastAdminEvent({ type: 'ARTICLE_DELETED', id });
    res.json({ success: true, message: 'Đã xóa bài viết thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/articles/:id/toggle (Bật/tắt trạng thái xuất bản)
app.patch('/api/articles/:id/toggle', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const articles = (await readJson('articles.json')) || [];
    const index = articles.findIndex(a => a.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    const article = articles[index];
    article.status = article.status === 'published' ? 'draft' : 'published';
    article.updatedAt = new Date().toISOString();

    await writeJson('articles.json', articles);
    broadcastAdminEvent({ type: 'ARTICLE_UPDATED', article });
    res.json({ 
      success: true, 
      data: article, 
      message: `Đã chuyển bài viết sang: ${article.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ----------------------------------------------------
// 10. HEALTH CHECK
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'FLAMEGUARD PRO Fire Safety Backend API',
    time: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ----------------------------------------------------
// 11. PHỤC VỤ GIAO DIỆN FRONTEND & SPA ROUTING (VPS / DOCKER / SEO SSR)
// ----------------------------------------------------
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  // index:false — để "/" đi qua handler SSR bên dưới (inject SEO), không bị static trả index.html gốc
  app.use(express.static(distPath, { index: false }));
  app.get('*', async (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    const indexPath = path.join(distPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      return next();
    }
    try {
      let html = fs.readFileSync(indexPath, 'utf-8');
      const settings = (await readJson('settings.json')) || {};
      const brand = settings.brandSettings || {};

      // 1. Kiểm tra trang chi tiết tin tức: /tin-tuc/:slug
      const newsDetailMatch = req.path.match(/^\/tin-tuc\/([a-zA-Z0-9_-]+)/);
      if (newsDetailMatch) {
        const slug = newsDetailMatch[1];
        const articles = (await readJson('articles.json')) || [];
        const article = articles.find(a => a.slug === slug || a.id === slug);

        if (article) {
          const seoTitle = article.seoTitle || `${article.title} | ${brand.brandName || 'FLAMEGUARD PRO'}`;
          const seoDesc = article.seoDescription || article.excerpt || '';
          const seoImg = article.thumbnail || 'https://pcccphatantam.com/images/og-image.jpg';
          const pageUrl = `https://pcccphatantam.com/tin-tuc/${article.slug}`;

          html = html.replace(/<title>.*?<\/title>/i, `<title>${seoTitle}</title>`);
          html = html.replace(/(<meta\s+property=["']og:title["']\s+content=["']).*?(["'])/i, `$1${seoTitle}$2`);
          html = html.replace(/(<meta\s+name=["']twitter:title["']\s+content=["']).*?(["'])/i, `$1${seoTitle}$2`);

          if (seoDesc) {
            html = html.replace(/(<meta\s+name=["']description["']\s+content=["']).*?(["'])/i, `$1${seoDesc}$2`);
            html = html.replace(/(<meta\s+property=["']og:description["']\s+content=["']).*?(["'])/i, `$1${seoDesc}$2`);
            html = html.replace(/(<meta\s+name=["']twitter:description["']\s+content=["']).*?(["'])/i, `$1${seoDesc}$2`);
          }

          if (article.seoKeywords) {
            html = html.replace(/(<meta\s+name=["']keywords["']\s+content=["']).*?(["'])/i, `$1${article.seoKeywords}$2`);
          }

          html = html.replace(/(<meta\s+property=["']og:image["']\s+content=["']).*?(["'])/i, `$1${seoImg}$2`);
          html = html.replace(/(<meta\s+name=["']twitter:image["']\s+content=["']).*?(["'])/i, `$1${seoImg}$2`);
          html = html.replace(/(<meta\s+property=["']og:url["']\s+content=["']).*?(["'])/i, `$1${pageUrl}$2`);
          html = html.replace(/(<meta\s+property=["']og:type["']\s+content=["']).*?(["'])/i, `$1article$2`);
          html = html.replace(/(<link\s+rel=["']canonical["']\s+href=["']).*?(["'])/i, `$1${pageUrl}$2`);

          // Schema JSON-LD NewsArticle cho Google & Bot SEO
          const articleSchema = {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": article.title,
            "description": article.excerpt || seoDesc,
            "image": [seoImg],
            "datePublished": article.publishedAt,
            "dateModified": article.updatedAt,
            "author": [{
              "@type": "Person",
              "name": article.author || "Kỹ Sư PCCC"
            }],
            "publisher": {
              "@type": "Organization",
              "name": brand.brandName || "FLAMEGUARD PRO",
              "logo": {
                "@type": "ImageObject",
                "url": brand.logoUrl || "https://pcccphatantam.com/images/hero-fire-safety.jpg"
              }
            },
            "mainEntityOfPage": pageUrl
          };

          html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>\n</head>`);
          return res.send(html);
        }
      }

      // 2. Kiểm tra trang chi tiết sản phẩm: /san-pham/:idOrSlug (Hỗ trợ SEO & Chạy Ads Facebook, Google, Zalo)
      const productDetailMatch = req.path.match(/^\/san-pham\/([a-zA-Z0-9_-]+)/);
      if (productDetailMatch) {
        const prodIdOrSlug = decodeURIComponent(productDetailMatch[1]).toLowerCase();
        const products = (await readJson('products.json')) || [];
        const product = products.find(p => {
          const directSlug = p.slug ? String(p.slug).toLowerCase() : '';
          const nameSlug = slugifyVietnamese(p.name).toLowerCase();
          const pId = String(p.id).toLowerCase();
          return directSlug === prodIdOrSlug || nameSlug === prodIdOrSlug || pId === prodIdOrSlug || prodIdOrSlug.endsWith(`-${pId}`);
        });

        if (product) {
          const brandName = brand.brandName || 'FLAMEGUARD PRO';
          const seoTitle = `${product.name} | Chuẩn Kiểm Định PCCC BCA | ${brandName}`;
          const seoDesc = product.subtitle || product.meaning || `Trang bị ${product.name} chính hãng đạt chuẩn kiểm định PCCC BCA, bảo hành uy tín tại ${brandName}.`;
          const seoImg = product.image ? (product.image.startsWith('http') ? product.image : `https://pcccphatantam.com${product.image}`) : 'https://pcccphatantam.com/images/hero-fire-safety.jpg';
          const productSlug = product.slug || slugifyVietnamese(product.name) || product.id;
          const pageUrl = `https://pcccphatantam.com/san-pham/${productSlug}`;

          html = html.replace(/<title>.*?<\/title>/i, `<title>${seoTitle}</title>`);
          html = html.replace(/(<meta\s+property=["']og:title["']\s+content=["']).*?(["'])/i, `$1${seoTitle}$2`);
          html = html.replace(/(<meta\s+name=["']twitter:title["']\s+content=["']).*?(["'])/i, `$1${seoTitle}$2`);

          if (seoDesc) {
            html = html.replace(/(<meta\s+name=["']description["']\s+content=["']).*?(["'])/i, `$1${seoDesc}$2`);
            html = html.replace(/(<meta\s+property=["']og:description["']\s+content=["']).*?(["'])/i, `$1${seoDesc}$2`);
            html = html.replace(/(<meta\s+name=["']twitter:description["']\s+content=["']).*?(["'])/i, `$1${seoDesc}$2`);
          }

          html = html.replace(/(<meta\s+property=["']og:image["']\s+content=["']).*?(["'])/i, `$1${seoImg}$2`);
          html = html.replace(/(<meta\s+name=["']twitter:image["']\s+content=["']).*?(["'])/i, `$1${seoImg}$2`);
          html = html.replace(/(<meta\s+property=["']og:url["']\s+content=["']).*?(["'])/i, `$1${pageUrl}$2`);
          html = html.replace(/(<meta\s+property=["']og:type["']\s+content=["']).*?(["'])/i, `$1product$2`);
          html = html.replace(/(<link\s+rel=["']canonical["']\s+href=["']).*?(["'])/i, `$1${pageUrl}$2`);

          // Schema JSON-LD Product cho Google Rich Snippets & Ads Crawlers
          const productSchema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "image": [seoImg],
            "description": seoDesc,
            "sku": product.id,
            "brand": {
              "@type": "Brand",
              "name": brandName
            },
            "offers": {
              "@type": "Offer",
              "url": pageUrl,
              "priceCurrency": "VND",
              "price": product.price,
              "priceValidUntil": "2027-12-31",
              "availability": product.isAvailable !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "itemCondition": "https://schema.org/NewCondition"
            },
            ...(product.rating ? {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": product.rating,
                "reviewCount": product.reviewsCount || 10
              }
            } : {})
          };

          html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(productSchema)}</script>\n</head>`);
          return res.send(html);
        }
      }

      // 3. Kiểm tra trang trung tâm tin tức: /tin-tuc
      if (req.path === '/tin-tuc' || req.path === '/tin-tuc/') {
        const newsTitle = `Tin Tức & Cẩm Nang PCCC Chuẩn TCVN 3890 | ${brand.brandName || 'FLAMEGUARD PRO'}`;
        const newsDesc = `Tổng hợp tin tức an toàn PCCC, hướng dẫn sử dụng bình chữa cháy, quy định pháp luật và kỹ năng thoát hiểm hỏa hoạn nhà cao tầng mới nhất.`;
        const newsUrl = `https://pcccphatantam.com/tin-tuc`;

        html = html.replace(/<title>.*?<\/title>/i, `<title>${newsTitle}</title>`);
        html = html.replace(/(<meta\s+property=["']og:title["']\s+content=["']).*?(["'])/i, `$1${newsTitle}$2`);
        html = html.replace(/(<meta\s+name=["']twitter:title["']\s+content=["']).*?(["'])/i, `$1${newsTitle}$2`);
        html = html.replace(/(<meta\s+name=["']description["']\s+content=["']).*?(["'])/i, `$1${newsDesc}$2`);
        html = html.replace(/(<meta\s+property=["']og:description["']\s+content=["']).*?(["'])/i, `$1${newsDesc}$2`);
        html = html.replace(/(<meta\s+name=["']twitter:description["']\s+content=["']).*?(["'])/i, `$1${newsDesc}$2`);
        html = html.replace(/(<meta\s+property=["']og:url["']\s+content=["']).*?(["'])/i, `$1${newsUrl}$2`);
        html = html.replace(/(<link\s+rel=["']canonical["']\s+href=["']).*?(["'])/i, `$1${newsUrl}$2`);
        return res.send(html);
      }

      // 3. Fallback theo cài đặt thương hiệu trang chủ
      if (brand && (brand.seoTitle || brand.seoDescription || brand.brandName || brand.logoUrl)) {
        // Escape + dùng hàm thay thế để ký tự `"`, `<`, `$` trong cấu hình không làm hỏng HTML
        const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const setMeta = (re, val) => { html = html.replace(re, (_m, a, b) => `${a}${esc(val)}${b}`); };
        const metaRe = (attr, name) => new RegExp(`(<meta\\s+${attr}=["']${name}["']\\s+content=["'])[^"']*(["'])`, 'i');

        if (brand.seoTitle) {
          html = html.replace(/<title>.*?<\/title>/i, () => `<title>${esc(brand.seoTitle)}</title>`);
          setMeta(metaRe('property', 'og:title'), brand.seoTitle);
          setMeta(metaRe('name', 'twitter:title'), brand.seoTitle);
        }
        if (brand.seoDescription) {
          setMeta(metaRe('name', 'description'), brand.seoDescription);
          setMeta(metaRe('property', 'og:description'), brand.seoDescription);
          setMeta(metaRe('name', 'twitter:description'), brand.seoDescription);
        }
        if (brand.seoKeywords) setMeta(metaRe('name', 'keywords'), brand.seoKeywords);
        if (brand.brandName) setMeta(metaRe('property', 'og:site_name'), brand.brandName);
        // Ảnh chia sẻ: chỉ nhận URL http(s) hoặc đường dẫn tuyệt đối (bỏ qua ảnh base64 vì crawler không đọc được)
        const logo = String(brand.logoUrl || '');
        if (/^https?:\/\//i.test(logo) || logo.startsWith('/')) {
          const img = logo.startsWith('/') ? `https://pcccphatantam.com${logo}` : logo;
          setMeta(metaRe('property', 'og:image'), img);
          setMeta(metaRe('property', 'og:image:secure_url'), img);
          setMeta(metaRe('name', 'twitter:image'), img);
        }
        res.setHeader('Cache-Control', 'no-cache');
        return res.send(html);
      }
    } catch (_e) {}
    res.sendFile(indexPath);
  });
}

// ----------------------------------------------------
// 9. MIDDLEWARE XỬ LÝ LỖI 500 TẬP TRUNG & BÁO ĐỘNG TELEGRAM DEVELOPER
// ----------------------------------------------------
app.use(async (err, req, res, next) => {
  // Lỗi do client (JSON hỏng, body quá lớn...) không phải sự cố máy chủ: trả 4xx, không báo động Telegram.
  const clientStatus = err.status || err.statusCode;
  if (clientStatus >= 400 && clientStatus < 500) {
    if (res.headersSent) return next(err);
    const tooLarge = err.type === 'entity.too.large';
    return res.status(clientStatus).json({
      success: false,
      error: tooLarge ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST',
      message: tooLarge ? 'Dữ liệu gửi lên quá lớn.' : 'Yêu cầu không hợp lệ.'
    });
  }

  console.error('❌ [EXPRESS ERROR 500]:', err);

  try {
    await notifyServerError(err, {
      source: 'express_500_middleware',
      endpoint: req.originalUrl || req.url,
      method: req.method,
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent']
    });
  } catch (notifyErr) {
    console.error('Lỗi khi gửi cảnh báo Telegram cho Express Error:', notifyErr.message);
  }

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Đã có lỗi kỹ thuật xảy ra trên máy chủ. Đội ngũ kỹ thuật đã nhận được cảnh báo tự động.'
  });
});

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  try {
    const weakAdmins = findDefaultCredentialAdmins();
    if (weakAdmins.length > 0) {
      const warning = `Tài khoản admin [${weakAdmins.join(', ')}] vẫn dùng mật khẩu/PIN mặc định đã công khai. Đăng nhập bằng thông tin mặc định đã bị chặn. Hãy đặt lại: docker exec -it flameguard-web node scripts/reset-admin.js`;
      console.error('🚨 [SECURITY] ' + warning);
      notifyServerWarning('Admin còn mật khẩu mặc định', warning).catch(() => {});
    }
  } catch (err) {
    console.error('🚨 [SECURITY] Cấu hình xác thực không hợp lệ, máy chủ không khởi động:', err.message);
    process.exit(1);
  }

  const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🔥 FLAMEGUARD PRO API Server đang chạy tại: http://127.0.0.1:${PORT} (dữ liệu: ${DATA_DIR})`);
    notifyServerStartup().catch(err => {
      console.warn('[Startup Alert Note]:', err.message);
    });
  });

  process.on('SIGTERM', () => server.close());
  process.on('SIGINT', () => server.close());
}

export default app;
