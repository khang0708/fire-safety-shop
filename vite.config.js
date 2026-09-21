import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'server', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const readJson = (fileName) => {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    return null;
  }
};

const writeJson = (fileName, data) => {
  const filePath = path.join(DATA_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

const sseClients = new Set();
const broadcastAdminEvent = (payload) => {
  const message = `data: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach((res) => {
    try {
      res.write(message);
    } catch (e) {
      sseClients.delete(res);
    }
  });
};

// Helper mã hóa an toàn các ký tự đặc biệt cho Telegram HTML parse_mode
function escapeTelegramHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Helper gửi tin nhắn trực tiếp qua Telegram API
async function sendTelegramMessage(botToken, chatId, order) {
  if (!botToken || !chatId) return false;
  const token = botToken.trim().replace(/^bot/i, '');
  const targetChatId = String(chatId).trim();

  // Danh sách các món hoa và quà kèm chi tiết
  let itemsListText = '';
  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsListText = '\n📋 <b>Chi tiết sản phẩm & quà kèm:</b>\n' +
      order.items.map((it, idx) => `  ${idx + 1}. ${escapeTelegramHtml(it.name)} (<b>${Number(it.price || 0).toLocaleString('vi-VN')}đ</b>)`).join('\n') + '\n';
  }

  const anonymousNotice = order.isAnonymous ? ' <i>(🕵️ Đơn gửi ẩn danh bí mật)</i>' : '';

  const htmlMessage = `🚨 <b>CÓ ĐƠN ĐẶT THIẾT BỊ PCCC MỚI!</b> (#${escapeTelegramHtml(order.orderCode || order.id)})\n\n` +
    `👤 <b>Người đặt / Đơn vị:</b> ${escapeTelegramHtml(order.customerName || 'Khách hàng')}${anonymousNotice}\n` +
    `📞 <b>SĐT kỹ thuật:</b> ${escapeTelegramHtml(order.customerPhone || 'Chưa cung cấp')}\n` +
    `🧯 <b>Thiết bị chính:</b> ${escapeTelegramHtml(order.productName || 'Bình chữa cháy / Thiết bị PCCC')}\n` +
    itemsListText +
    `💰 <b>Tổng giá trị:</b> <b>${Number(order.totalAmount || 0).toLocaleString('vi-VN')}đ</b>\n` +
    `⏱️ <b>Hạn giao / Nghiệm thu:</b> ${escapeTelegramHtml(order.deliverySlot || 'Trong ngày (Hỏa tốc 60p)')}\n` +
    `📍 <b>Đơn vị nhận:</b> ${escapeTelegramHtml(order.receiverName || '')} (${escapeTelegramHtml(order.receiverPhone || '')})\n` +
    `🏠 <b>Địa chỉ lắp đặt / Công trình:</b> ${escapeTelegramHtml(order.receiverAddress || 'Chưa cung cấp')}\n` +
    `📑 <b>Vị trí & Thẻ hướng dẫn:</b> <i>"${escapeTelegramHtml(order.cardMessage || 'Theo biên bản nghiệm thu')}"</i>\n` +
    `✍️ <b>Người đại diện:</b> <i>"${escapeTelegramHtml(order.senderSign || order.customerName || 'Bên giao')}"</i>\n\n` +
    `👉 <i>FLAMEGUARD PRO: Hãy mở Admin để kiểm tra áp suất, số seri tem BCA và xuất phiếu nghiệm thu!</i>`;

  try {
    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: htmlMessage,
        parse_mode: 'HTML'
      })
    });
    const data = await res.json();
    return Boolean(data && data.ok);
  } catch (err) {
    console.warn('Lỗi server gửi Telegram:', err.message);
    return false;
  }
}

function fullstackApiPlugin() {
  return {
    name: 'flora-fullstack-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.originalUrl || req.url || '';
        const url = rawUrl.split('?')[0];

        if (!url.startsWith('/api')) {
          return next();
        }

        // 1. Health check
        if (url === '/api/health' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ONLINE', service: 'Flora & Bloom Vite Direct API' }));
          return;
        }

        // 2. Realtime SSE
        if (url === '/api/admin/events' && req.method === 'GET') {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);
          sseClients.add(res);
          req.on('close', () => sseClients.delete(res));
          return;
        }

        // Helper to read JSON body safely
        const readBody = () => new Promise((resolve) => {
          if (req.body && typeof req.body === 'object') {
            return resolve(req.body);
          }
          let body = '';
          let chunk;
          while (null !== (chunk = req.read())) {
            body += chunk;
          }
          if (req.readableEnded || req.complete) {
            try {
              return resolve(body ? JSON.parse(body) : {});
            } catch (e) {
              return resolve({});
            }
          }
          req.on('data', c => { body += c; });
          req.on('end', () => {
            try {
              resolve(body ? JSON.parse(body) : {});
            } catch (e) {
              resolve({});
            }
          });
          req.on('error', () => resolve({}));
        });

        // 3. Settings API (Lưu Token & Cấu hình máy chủ)
        if (url === '/api/settings') {
          if (req.method === 'GET') {
            const settings = readJson('settings.json') || {};
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: settings }));
            return;
          }
          if (req.method === 'POST' || req.method === 'PUT') {
            const body = await readBody();
            const current = readJson('settings.json') || {};
            const updated = { ...current, ...body, updatedAt: new Date().toISOString() };
            writeJson('settings.json', updated);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: updated }));
            return;
          }
        }

        // 4. Products API
        if (url === '/api/products') {
          if (req.method === 'GET') {
            const products = readJson('products.json') || [];
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: products }));
            return;
          }
          if (req.method === 'POST') {
            const body = await readBody();
            const products = readJson('products.json') || [];
            const newProduct = {
              id: body.id || `fl-${Date.now()}`,
              name: body.name || 'Bó Hoa Mới',
              subtitle: body.subtitle || '',
              price: Number(body.price) || 500000,
              originalPrice: Number(body.originalPrice) || Number(body.price) || 600000,
              occasion: body.occasion || 'love',
              colorTone: body.colorTone || 'pastel',
              image: body.image || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
              tags: body.tags || ['Mẫu Mới'],
              meaning: body.meaning || 'Gửi gắm yêu thương.',
              flowerTypes: body.flowerTypes || ['Hoa Hồng Nhập Khẩu', 'Hoa Baby'],
              rating: 5.0,
              reviewsCount: 0,
              freshDays: Number(body.freshDays) || 4,
              isAvailable: true,
              createdAt: new Date().toISOString()
            };
            products.unshift(newProduct);
            writeJson('products.json', products);
            broadcastAdminEvent({ type: 'PRODUCT_ADDED', product: newProduct });
            broadcastAdminEvent({ type: 'PRODUCT_UPDATED', product: newProduct });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: newProduct }));
            return;
          }
        }

        if (url.startsWith('/api/products/')) {
          const id = decodeURIComponent(url.replace('/api/products/', '').split('/')[0].split('?')[0]);
          let products = readJson('products.json') || [];
          let index = products.findIndex(p => p.id === id);

          if (req.method === 'PUT') {
            const body = await readBody();
            if (index === -1) {
              const newEntry = {
                id,
                name: body.name || 'Mẫu Hoa',
                subtitle: body.subtitle || '',
                price: Number(body.price) || 500000,
                originalPrice: Number(body.originalPrice) || Number(body.price) || 500000,
                occasion: body.occasion || 'love',
                colorTone: body.colorTone || 'pastel',
                image: body.image || '',
                tags: body.tags || ['Mẫu Mới'],
                meaning: body.meaning || '',
                flowerTypes: body.flowerTypes || [],
                rating: 5.0,
                reviewsCount: 0,
                freshDays: Number(body.freshDays) || 4,
                isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : true,
                ...body,
                updatedAt: new Date().toISOString()
              };
              products.push(newEntry);
              index = products.length - 1;
            } else {
              products[index] = {
                ...products[index],
                ...body,
                price: body.price ? Number(body.price) : products[index].price,
                originalPrice: body.originalPrice ? Number(body.originalPrice) : products[index].originalPrice,
                isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : products[index].isAvailable,
                updatedAt: new Date().toISOString()
              };
            }
            writeJson('products.json', products);
            broadcastAdminEvent({ type: 'PRODUCT_UPDATED', product: products[index] });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: products[index] }));
            return;
          }

          if (req.method === 'PATCH' && url.endsWith('/toggle')) {
            if (index === -1) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: 'Không tìm thấy mẫu hoa' }));
              return;
            }
            products[index].isAvailable = products[index].isAvailable === false ? true : false;
            products[index].updatedAt = new Date().toISOString();
            writeJson('products.json', products);
            broadcastAdminEvent({ type: 'PRODUCT_UPDATED', product: products[index] });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: products[index] }));
            return;
          }

          if (req.method === 'DELETE') {
            if (index === -1) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: 'Không tìm thấy mẫu hoa' }));
              return;
            }
            const filtered = products.filter(p => p.id !== id);
            writeJson('products.json', filtered);
            broadcastAdminEvent({ type: 'PRODUCT_DELETED', productId: id });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, message: 'Đã xóa' }));
            return;
          }
        }


        // 5. Orders API
        if (url === '/api/orders') {
          if (req.method === 'GET') {
            const orders = readJson('orders.json') || [];
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: orders }));
            return;
          }
          if (req.method === 'POST') {
            const body = await readBody();
            const orders = readJson('orders.json') || [];
            const newOrderCode = `FB-${Math.floor(10000 + Math.random() * 90000)}`;
            const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            const newOrder = {
              id: newOrderCode,
              orderCode: newOrderCode,
              customerName: body.customerName || body.senderName || 'Khách hàng',
              customerPhone: body.customerPhone || body.senderPhone || '0901 234 567',
              receiverName: body.receiverName || 'Người nhận hoa',
              receiverPhone: body.receiverPhone || '0988 765 432',
              receiverAddress: body.receiverAddress || 'Quận 1, TP.HCM',
              isAnonymous: Boolean(body.isAnonymous),
              productName: body.productName || 'Bó hoa tươi nghệ thuật',
              cardMessage: body.cardMessage || 'Gửi gắm yêu thương!',
              senderSign: body.senderSign || body.senderName || 'Người gửi',
              deliverySlot: body.deliverySlot || 'Hỏa tốc 90 phút',
              totalAmount: Number(body.totalAmount) || 850000,
              status: 'ARRANGING',
              florist: 'Thợ cắm hoa Minh Thư (Studio A)',
              floristAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
              proofPhotoUrl: body.proofPhotoUrl || null,
              isApproved: false,
              createdAt: currentTime,
              items: body.items || []
            };

            orders.unshift(newOrder);
            writeJson('orders.json', orders);
            broadcastAdminEvent({ type: 'NEW_ORDER', order: newOrder });

            // Tự động gửi thông báo Telegram từ Server nếu đã lưu settings
            const settings = readJson('settings.json') || {};
            const botToken = body.telegramBotToken || settings.telegramBotToken;
            const chatId = body.telegramChatId || settings.telegramChatId;
            let telegramSent = false;
            if (botToken && chatId) {
              try {
                telegramSent = await sendTelegramMessage(botToken, chatId, newOrder);
              } catch (e) {
                telegramSent = false;
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: newOrder, telegramSent }));
            return;
          }
        }

        if (url.startsWith('/api/orders/') && url.endsWith('/status')) {
          const id = url.replace('/api/orders/', '').replace('/status', '');
          const orders = readJson('orders.json') || [];
          const index = orders.findIndex(o => o.id === id || o.orderCode === id);
          if (index !== -1) {
            const body = await readBody();
            orders[index] = { ...orders[index], ...body };
            writeJson('orders.json', orders);
            broadcastAdminEvent({ type: 'ORDER_STATUS_CHANGED', order: orders[index] });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: orders[index] }));
            return;
          }
        }

        // 6. Inventory API
        if (url === '/api/inventory') {
          if (req.method === 'GET') {
            const inventory = readJson('inventory.json') || [];
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: inventory }));
            return;
          }
          if (req.method === 'PUT') {
            const body = await readBody();
            writeJson('inventory.json', body);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: body }));
            return;
          }
        }

        // 7. Discounts / Voucher API
        if (url === '/api/discounts') {
          if (req.method === 'GET') {
            const discounts = readJson('discounts.json') || [];
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: discounts }));
            return;
          }
          if (req.method === 'POST') {
            const body = await readBody();
            const discounts = readJson('discounts.json') || [];
            const newDiscount = {
              id: `dc-${Date.now()}`,
              code: (body.code || '').trim().toUpperCase(),
              name: body.name || 'Mã giảm giá mới',
              type: body.type || 'percentage', // 'percentage' | 'fixed' | 'shipping'
              value: Number(body.value) || 10,
              maxDiscount: Number(body.maxDiscount) || 100000,
              minOrderValue: Number(body.minOrderValue) || 0,
              usageLimit: Number(body.usageLimit) || 100,
              usedCount: 0,
              isActive: true,
              expiresAt: body.expiresAt || '2026-12-31'
            };
            discounts.unshift(newDiscount);
            writeJson('discounts.json', discounts);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: newDiscount }));
            return;
          }
        }

        if (url === '/api/discounts/validate' && req.method === 'POST') {
          const body = await readBody();
          const codeToTest = (body.code || '').trim().toUpperCase();
          const orderTotal = Number(body.orderTotal || 0);
          const discounts = readJson('discounts.json') || [];
          const discount = discounts.find(d => d.code === codeToTest && d.isActive);

          if (!discount) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn.' }));
            return;
          }

          if (orderTotal < (discount.minOrderValue || 0)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              success: false, 
              message: `Mã này chỉ áp dụng cho đơn hàng từ ${Number(discount.minOrderValue).toLocaleString('vi-VN')}đ trở lên.` 
            }));
            return;
          }

          let discountAmount = 0;
          if (discount.type === 'percentage') {
            discountAmount = Math.round((orderTotal * discount.value) / 100);
            if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
              discountAmount = discount.maxDiscount;
            }
          } else if (discount.type === 'fixed') {
            discountAmount = discount.value;
          } else if (discount.type === 'shipping') {
            discountAmount = discount.value || 35000;
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            discount: {
              ...discount,
              discountAmount: Math.min(discountAmount, orderTotal)
            },
            message: `🎉 Áp dụng thành công! Giảm ${discountAmount.toLocaleString('vi-VN')}đ`
          }));
          return;
        }

        if (url.startsWith('/api/discounts/')) {
          const id = url.replace('/api/discounts/', '').split('/')[0];
          const discounts = readJson('discounts.json') || [];
          const index = discounts.findIndex(d => d.id === id);

          if (req.method === 'PATCH' && url.endsWith('/toggle') && index !== -1) {
            discounts[index].isActive = !discounts[index].isActive;
            writeJson('discounts.json', discounts);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: discounts[index] }));
            return;
          }

          if (req.method === 'DELETE' && index !== -1) {
            const filtered = discounts.filter(d => d.id !== id);
            writeJson('discounts.json', filtered);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, message: 'Đã xóa mã voucher' }));
            return;
          }
        }

        // 8. Reviews & Customer Feedback API
        if (url === '/api/reviews') {
          if (req.method === 'GET') {
            const reviews = readJson('reviews.json') || [];
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: reviews }));
            return;
          }
          if (req.method === 'POST') {
            const body = await readBody();
            const reviews = readJson('reviews.json') || [];
            const newReview = {
              id: `REV-${Date.now()}`,
              customerName: body.customerName || 'Khách hàng Flora',
              customerAvatar: body.customerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              productName: body.productName || 'Bó Hoa Tươi Nghệ Thuật',
              rating: Number(body.rating) || 5,
              occasion: body.occasion || 'Gửi Tặng Yêu Thương',
              comment: body.comment || 'Hoa rất tươi và đẹp, giao hàng đúng giờ!',
              proofImage: body.proofImage || null,
              verified: true,
              createdAt: new Date().toISOString().split('T')[0],
              isVisible: true,
              likes: 1
            };
            reviews.unshift(newReview);
            writeJson('reviews.json', reviews);
            broadcastAdminEvent({ type: 'NEW_REVIEW', review: newReview });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: newReview, message: 'Cảm ơn bạn đã đánh giá!' }));
            return;
          }
        }

        if (url.startsWith('/api/reviews/')) {
          const id = url.replace('/api/reviews/', '').split('/')[0];
          const reviews = readJson('reviews.json') || [];
          const index = reviews.findIndex(r => r.id === id);

          if (req.method === 'PATCH' && url.endsWith('/toggle') && index !== -1) {
            reviews[index].isVisible = !reviews[index].isVisible;
            writeJson('reviews.json', reviews);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: reviews[index] }));
            return;
          }

          if (req.method === 'DELETE' && index !== -1) {
            const filtered = reviews.filter(r => r.id !== id);
            writeJson('reviews.json', filtered);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, message: 'Đã xóa đánh giá' }));
            return;
          }
        }

        // 9. Telegram Test & ChatID API trong Vite
        if (url === '/api/notifications/telegram-test' && req.method === 'POST') {
          const body = await readBody();
          const token = (body.botToken || '').trim().replace(/^bot/i, '');
          const chatId = String(body.chatId || '').trim();
          const ok = await sendTelegramMessage(token, chatId, body.testOrder || {
            orderCode: 'FB-TEST-2026',
            customerName: 'Anh Hoàng Nam',
            productName: 'Bó Hoa Juliet Nắng Ban Mai',
            totalAmount: 850000,
            deliverySlot: '14:00 - 16:00 Hôm nay',
            receiverAddress: 'Bitexco, Q.1'
          });
          res.setHeader('Content-Type', 'application/json');
          if (ok) {
            res.end(JSON.stringify({ success: true, message: '🎉 Đã gửi tin nhắn thông báo đến Telegram thành công!' }));
          } else {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, message: 'Không thể gửi tin nhắn Telegram. Vui lòng kiểm tra lại Token và đảm bảo bạn đã bấm START bot.' }));
          }
          return;
        }

        // 10. Facebook Messenger Webhook & Send API trong Vite
        const queryParams = new URLSearchParams(rawUrl.split('?')[1] || '');

        // 10.1. Meta Webhook Verification
        if (url === '/api/facebook/webhook' && req.method === 'GET') {
          const mode = queryParams.get('hub.mode');
          const token = queryParams.get('hub.verify_token');
          const challenge = queryParams.get('hub.challenge');

          const settings = readJson('settings.json') || {};
          const expectedToken = settings.facebookSettings?.verifyToken || 'flora_bloom_webhook_secret_2026';

          if (mode && token) {
            if (mode === 'subscribe' && token === expectedToken) {
              console.log('✅ [Facebook Webhook Vite] Xác thực thành công Webhook với Meta for Developers!');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/plain');
              res.end(challenge || '');
              return;
            } else {
              res.statusCode = 403;
              res.end('Forbidden: Token mismatch');
              return;
            }
          }
          res.statusCode = 400;
          res.end('Bad Request');
          return;
        }

        // 10.2. Meta Webhook Event (Incoming Messages & Chatbot)
        if (url === '/api/facebook/webhook' && req.method === 'POST') {
          const body = await readBody();
          if (body.object === 'page') {
            const settings = readJson('settings.json') || {};
            const fbConfig = settings.facebookSettings || {};

            for (const entry of (body.entry || [])) {
              const webhookEvent = entry.messaging?.[0];
              if (!webhookEvent) continue;

              const senderPsid = webhookEvent.sender?.id;
              const userMessage = webhookEvent.message?.text?.trim() || '';

              if (fbConfig.autoReplyEnabled !== false && senderPsid && userMessage) {
                const lowerText = userMessage.toLowerCase();
                const orderMatch = userMessage.match(/FB-[\w\d]+/i);
                let replyText = '';

                if (orderMatch) {
                  const searchedCode = orderMatch[0].toUpperCase();
                  const orders = readJson('orders.json') || [];
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
                      (found.proofPhotoUrl ? `📸 Xem ảnh hoa: ${found.proofPhotoUrl}\n` : '') +
                      `👉 Cần hỗ trợ thêm hãy nhắn ngay tại đây bạn nhé!`;
                  } else {
                    replyText = `🌸 Chưa tìm thấy mã đơn #${searchedCode} trên hệ thống. Quý khách vui lòng kiểm tra lại mã hoặc để lại SĐT nhé!`;
                  }
                } else if (lowerText.includes('hoa') || lowerText.includes('menu') || lowerText.includes('mẫu')) {
                  const products = readJson('products.json') || [];
                  const top = products.slice(0, 3).map(p => `• ${p.name}: ${Number(p.price).toLocaleString('vi-VN')}đ`).join('\n');
                  replyText = `🌸 Các mẫu hoa thiết kế thịnh hành hôm nay:\n\n${top}\n\n💐 Tặng kèm thiệp thiết kế & túi cao cấp!`;
                } else {
                  replyText = fbConfig.welcomeMessage || 'Chào bạn! Flora & Bloom Studio rất vui được hỗ trợ bạn. Bạn cần tư vấn mẫu hoa nào ạ? 🌸';
                }

                // Gửi phản hồi
                if (fbConfig.pageAccessToken) {
                  try {
                    await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(fbConfig.pageAccessToken)}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        recipient: { id: senderPsid },
                        message: { text: replyText }
                      })
                    });
                  } catch (err) {
                    console.warn('Lỗi gửi Facebook Send API:', err.message);
                  }
                }
              }
            }

            res.statusCode = 200;
            res.end('EVENT_RECEIVED');
            return;
          }

          res.statusCode = 404;
          res.end('Not Found');
          return;
        }

        // 10.3. Facebook Test Connection
        if (url === '/api/facebook/test-connection' && req.method === 'POST') {
          const body = await readBody();
          const cleanId = (body.pageId || 'flameguardpccc').trim();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            message: `🎉 Kết nối Fanpage @${cleanId} thành công! Link chat: https://m.me/${cleanId}`,
            messengerUrl: `https://m.me/${cleanId}`
          }));
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), fullstackApiPlugin()],
  server: {
    port: 5175,
    host: true,
    allowedHosts: true,
  },
  build: {
    cssMinify: true,
    chunkSizeWarningLimit: 1000,
  }
});
