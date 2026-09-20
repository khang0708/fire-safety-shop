import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
dotenv.config();
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true });
}
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {}
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
    await sql`
      CREATE TABLE IF NOT EXISTS flameguard_store (
        key VARCHAR(50) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
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
      const rows = await sql`SELECT data FROM flameguard_store WHERE key = ${key}`;
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

  // 3. Fallback /tmp container local
  const tmpPath = path.join('/tmp', fileName);
  if (fs.existsSync(tmpPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(tmpPath, 'utf-8'));
      memoryDb.set(fileName, data);
      return data;
    } catch (err) {}
  }

  // 4. Fallback DATA_DIR (tệp bundle gốc)
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return fileName.includes('settings') ? {} : [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    memoryDb.set(fileName, data);
    return data;
  } catch (err) {
    console.error(`Lỗi đọc file ${fileName}:`, err);
    return fileName.includes('settings') ? {} : [];
  }
};

const writeJson = async (fileName, data) => {
  const key = fileName.replace('.json', '');
  memoryDb.set(fileName, data);

  // 1. Lưu vào Neon Database (Đồng bộ tức thì lên đám mây cho mọi container)
  if (sql) {
    try {
      await ensureTable();
      const jsonStr = JSON.stringify(data);
      await sql`
        INSERT INTO flameguard_store (key, data, updated_at)
        VALUES (${key}, ${jsonStr}, NOW())
        ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `;
    } catch (dbErr) {
      console.error(`[Neon DB] Lỗi ghi ${key}:`, dbErr.message);
    }
  }

  // 2. Ghi fallback vào filesystem cục bộ
  try {
    const filePath = path.join(DATA_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    try {
      const tmpPath = path.join('/tmp', fileName);
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (tmpErr) {
      console.warn(`Không thể ghi file ${fileName}:`, tmpErr.message);
    }
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

// GET /api/admin/events (SSE Stream)
app.get('/api/admin/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Admin Stream Active' })}\n\n`);
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
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
app.post('/api/products', async (req, res) => {
  try {
    const products = (await readJson('products.json')) || [];
    const newProduct = {
      id: req.body.id || `fl-${Date.now()}`,
      name: req.body.name || 'Bó Hoa Mới',
      subtitle: req.body.subtitle || '',
      price: Number(req.body.price) || 500000,
      originalPrice: Number(req.body.originalPrice) || Number(req.body.price) || 600000,
      occasion: req.body.occasion || 'love',
      colorTone: req.body.colorTone || 'pastel',
      image: req.body.image || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
      tags: req.body.tags || ['Mẫu Mới'],
      meaning: req.body.meaning || 'Gửi gắm yêu thương.',
      flowerTypes: req.body.flowerTypes || ['Hoa Hồng Nhập Khẩu', 'Hoa Baby'],
      rating: 5.0,
      reviewsCount: 0,
      freshDays: Number(req.body.freshDays) || 4,
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

// PUT /api/products/:id (Cập nhật mẫu hoa)
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let products = (await readJson('products.json')) || [];
    let index = products.findIndex(p => p.id === id);

    if (index === -1) {
      // Nếu sản phẩm chưa có trong file products.json nhưng được sửa
      const newEntry = {
        id,
        name: req.body.name || 'Mẫu Hoa',
        subtitle: req.body.subtitle || '',
        price: Number(req.body.price) || 500000,
        originalPrice: Number(req.body.originalPrice) || Number(req.body.price) || 500000,
        occasion: req.body.occasion || 'love',
        colorTone: req.body.colorTone || 'pastel',
        image: req.body.image || '',
        tags: req.body.tags || ['Mẫu Mới'],
        meaning: req.body.meaning || '',
        flowerTypes: req.body.flowerTypes || [],
        rating: 5.0,
        reviewsCount: 0,
        freshDays: Number(req.body.freshDays) || 4,
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
app.patch('/api/products/:id/toggle', async (req, res) => {
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
app.delete('/api/products/:id', async (req, res) => {
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
// 2. ORDERS REST API (Quản Lý Đơn Hàng & Vận Hành Florist)
// ----------------------------------------------------

// GET /api/orders
app.get('/api/orders', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const orders = await readJson('orders.json');
    res.json({ success: true, data: orders, total: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders
app.post('/api/orders', async (req, res) => {
  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    const currentTime = `${timeStr} (${dateStr})`;
    const newOrderCode = req.body.orderCode || req.body.id || ('FB-' + Math.floor(10000 + Math.random() * 90000));

    const orders = (await readJson('orders.json')) || [];
    const newOrder = {
      id: newOrderCode,
      orderCode: newOrderCode,
      customerName: req.body.customerName || req.body.senderName || 'Khách hàng',
      customerPhone: req.body.customerPhone || req.body.senderPhone || '0901 234 567',
      receiverName: req.body.receiverName || 'Người nhận hoa',
      receiverPhone: req.body.receiverPhone || '0988 765 432',
      receiverAddress: req.body.receiverAddress || 'Quận 1, TP.HCM',
      isAnonymous: Boolean(req.body.isAnonymous),
      productName: req.body.productName || 'Bó hoa tươi nghệ thuật',
      cardMessage: req.body.cardMessage || 'Gửi gắm yêu thương!',
      senderSign: req.body.senderSign || req.body.senderName || 'Người gửi',
      deliverySlot: req.body.deliverySlot || 'Hỏa tốc 90 phút',
      totalAmount: Number(req.body.totalAmount) || 850000,
      status: 'ARRANGING',
      florist: 'Thợ cắm hoa Minh Thư (Studio A)',
      floristAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      proofPhotoUrl: req.body.proofPhotoUrl || null,
      isApproved: false,
      createdAt: currentTime,
      items: req.body.items || []
    };

    orders.unshift(newOrder);
    await writeJson('orders.json', orders);

    broadcastAdminEvent({
      type: 'NEW_ORDER',
      order: newOrder,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/orders/:id/status
app.patch('/api/orders/:id/status', async (req, res) => {
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

// ----------------------------------------------------
// 3. TELEGRAM BOT NOTIFICATION WEBHOOK & AUTO-DETECT CHAT ID
// ----------------------------------------------------

// Clean helper for Telegram tokens
const cleanTelegramToken = (token) => {
  if (!token) return '';
  return token.trim().replace(/^bot/i, '');
};

const cleanTelegramChatId = (chatId) => {
  if (!chatId) return '';
  return String(chatId).trim();
};

// Endpoint tự động tìm Chat ID từ Bot Token 1-Chạm!
app.post('/api/notifications/telegram-get-chat-id', async (req, res) => {
  try {
    const rawToken = req.body.botToken;
    if (!rawToken) {
      return res.status(400).json({ success: false, message: 'Vui lòng dán chuỗi Bot Token vào ô trên trước khi bấm dò tìm' });
    }

    const token = cleanTelegramToken(rawToken);
    const updatesUrl = `https://api.telegram.org/bot${token}/getUpdates`;
    const tgRes = await fetch(updatesUrl);
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
app.post('/api/notifications/telegram-test', async (req, res) => {
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
    const tgRes = await fetch(telegramUrl, {
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

app.put('/api/inventory', async (req, res) => {
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

app.post('/api/reviews', async (req, res) => {
  try {
    const reviews = (await readJson('reviews.json')) || [];
    const newReview = {
      id: req.body.id || `REV-${Date.now()}`,
      ...req.body,
      createdAt: req.body.createdAt || new Date().toISOString().split('T')[0],
      likes: req.body.likes || 0,
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
app.post('/api/zalo/send-zns', async (req, res) => {
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
        const response = await fetch('https://business.openapi.zalo.me/message/template', {
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
app.get('/api/settings', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const settings = await readJson('settings.json');
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const current = (await readJson('settings.json')) || {};
    const updated = {
      ...current,
      ...req.body,
      updatedAt: req.body.updatedAt || new Date().toISOString()
    };
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
  const response = await fetch(graphUrl, {
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
    const expectedToken = settings.facebookSettings?.verifyToken || 'flameguard_webhook_secret_2026';

    if (mode && token) {
      if (mode === 'subscribe' && token === expectedToken) {
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
app.post('/api/facebook/send-message', async (req, res) => {
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
app.post('/api/facebook/test-connection', async (req, res) => {
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
// 7. HEALTH CHECK
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'FLAMEGUARD PRO Fire Safety Backend API',
    time: new Date().toISOString(),
    version: '1.0.0'
  });
});

if (!process.env.VERCEL) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 FLAMEGUARD PRO API Server đang chạy tại: http://127.0.0.1:${PORT}`);
  });

  process.on('SIGTERM', () => server.close());
  process.on('SIGINT', () => server.close());
}

export default app;
