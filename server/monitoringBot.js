// server/monitoringBot.js
// ====================================================
// HỆ THỐNG GIÁM SÁT SỰ CỐ MÁY CHỦ 24/7 QUA TELEGRAM BOT
// DÀNH RIÊNG CHO DEVELOPER / DEVOPS (TÁCH BIỆT VỚI BOT KHÁCH HÀNG)
// ====================================================

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tự động nạp file .env thuần Node.js không phụ thuộc vào node_modules
export const getEnvDiagnosticInfo = () => {
  const rootDir = path.resolve(__dirname, '..');
  const candidateFiles = [
    path.join(rootDir, '.env'),
    path.join(rootDir, 'env'),
    path.join(rootDir, '.env.local'),
    path.join(rootDir, '.env.production'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'env'),
    path.join(process.cwd(), '.env.local'),
    path.join(rootDir, 'server', '.env'),
    path.join(rootDir, 'server', 'env'),
    path.join(process.cwd(), 'server', '.env'),
    path.join(process.cwd(), 'server', 'env')
  ];

  const uniqueCandidates = [...new Set(candidateFiles)];
  const checked = [];
  const found = [];

  for (const envFile of uniqueCandidates) {
    checked.push(envFile);
    try {
      if (fs.existsSync(envFile) && fs.statSync(envFile).isFile()) {
        const rawContent = fs.readFileSync(envFile, 'utf8').replace(/^\uFEFF/, '');
        const keys = [];
        for (const line of rawContent.split(/\r?\n/)) {
          let trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          if (trimmed.startsWith('export ')) trimmed = trimmed.slice(7).trim();
          let key = '';
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            key = trimmed.slice(0, eqIdx).trim();
          } else {
            const colonMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*:\s*(.+)$/);
            if (colonMatch) key = colonMatch[1].trim();
          }
          if (key) keys.push(key);
        }
        found.push({
          file: envFile,
          isWithoutDot: path.basename(envFile) === 'env',
          sizeBytes: rawContent.length,
          keys
        });
      }
    } catch {}
  }

  const devAlertsJsonPath = path.join(__dirname, 'data', 'dev-alerts.json');
  const devAlertsJsonExists = fs.existsSync(devAlertsJsonPath);

  return {
    checkedFiles: checked,
    foundFiles: found,
    devAlertsJsonExists
  };
};

export const loadEnvSafely = () => {
  const rootDir = path.resolve(__dirname, '..');
  const candidateFiles = [
    path.join(rootDir, '.env'),
    path.join(rootDir, 'env'),
    path.join(rootDir, '.env.local'),
    path.join(rootDir, '.env.production'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'env'),
    path.join(process.cwd(), '.env.local'),
    path.join(rootDir, 'server', '.env'),
    path.join(rootDir, 'server', 'env'),
    path.join(process.cwd(), 'server', '.env'),
    path.join(process.cwd(), 'server', 'env')
  ];

  const uniqueCandidates = [...new Set(candidateFiles)];

  for (const envFile of uniqueCandidates) {
    try {
      if (fs.existsSync(envFile) && fs.statSync(envFile).isFile()) {
        let content = fs.readFileSync(envFile, 'utf8');
        // Xóa ký tự BOM nếu file được lưu từ Windows UTF-8 with BOM
        content = content.replace(/^\uFEFF/, '');

        for (const line of content.split(/\r?\n/)) {
          let trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;

          // Hỗ trợ cú pháp export KEY=VAL
          if (trimmed.startsWith('export ')) {
            trimmed = trimmed.slice(7).trim();
          }

          let key = '';
          let val = '';

          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            key = trimmed.slice(0, eqIdx).trim();
            val = trimmed.slice(eqIdx + 1).trim();
          } else {
            // Hỗ trợ định dạng YAML / key: val
            const colonMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*:\s*(.+)$/);
            if (colonMatch) {
              key = colonMatch[1].trim();
              val = colonMatch[2].trim();
            }
          }

          if (key) {
            // Bỏ dấu nháy kép hoặc đơn
            if ((val.startsWith('"') && val.includes('"', 1)) || (val.startsWith("'") && val.includes("'", 1))) {
              const quoteChar = val[0];
              const endQuoteIdx = val.indexOf(quoteChar, 1);
              val = val.slice(1, endQuoteIdx);
            } else {
              // Cắt bỏ comment dạng # ở cuối dòng
              const hashIdx = val.indexOf(' #');
              if (hashIdx !== -1) {
                val = val.slice(0, hashIdx).trim();
              }
            }

            if (process.env[key] === undefined || process.env[key] === '') {
              process.env[key] = val;
            }
            const upperKey = key.toUpperCase();
            if (process.env[upperKey] === undefined || process.env[upperKey] === '') {
              process.env[upperKey] = val;
            }
          }
        }

        // Tự động sao chép env -> .env nếu file tên là 'env' (không có dấu chấm)
        // để tương thích hoàn hảo với Docker Compose và PM2
        if (path.basename(envFile) === 'env') {
          const dotEnvTarget = path.join(path.dirname(envFile), '.env');
          try {
            if (!fs.existsSync(dotEnvTarget)) {
              fs.writeFileSync(dotEnvTarget, content, 'utf8');
            }
          } catch {}
        }
      }
    } catch {}
  }
};
loadEnvSafely();

// ----------------------------------------------------
// 1. HELPERS: XỬ LÝ CHUỖI & DỌN DẸP DỮ LIỆU TELEGRAM
// ----------------------------------------------------

export const cleanTelegramToken = (token) => {
  if (!token || typeof token !== 'string') return '';
  return token.trim().replace(/^bot/i, '');
};

export const cleanTelegramChatId = (chatId) => {
  if (chatId === null || chatId === undefined) return '';
  return String(chatId).trim();
};

export const escapeTelegramHtml = (text) => {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

// ----------------------------------------------------
// 2. CẤU HÌNH BOT DEVELOPER (BẢO MẬT & ĐỘC LẬP HOÀN TOÀN)
// TUYỆT ĐỐI KHÔNG ĐỌC TỪ settings.json CỦA KHÁCH HÀNG!
// ----------------------------------------------------

export const getDeveloperTelegramConfig = () => {
  loadEnvSafely();

  // 1. Ưu tiên biến môi trường từ .env dành riêng cho Developer
  const tokenCandidates = [
    process.env.DEV_ALERT_TELEGRAM_TOKEN,
    process.env.DEV_TELEGRAM_TOKEN,
    process.env.DEV_TELEGRAM_BOT_TOKEN,
    process.env.DEV_ALERT_BOT_TOKEN,
    process.env.DEV_BOT_TOKEN
  ];
  let token = tokenCandidates.find(t => t && String(t).trim().length > 0) || '';

  const chatIdCandidates = [
    process.env.DEV_ALERT_TELEGRAM_CHAT_ID,
    process.env.DEV_TELEGRAM_CHAT_ID,
    process.env.DEV_ALERT_CHAT_ID,
    process.env.DEV_CHAT_ID
  ];
  let chatId = chatIdCandidates.find(c => c !== undefined && c !== null && String(c).trim().length > 0) || '';

  // 2. Dự phòng: file riêng tư server/data/dev-alerts.json (đã được gitignore)
  if (!token || !chatId) {
    try {
      const devAlertsPath = path.join(__dirname, 'data', 'dev-alerts.json');
      if (fs.existsSync(devAlertsPath)) {
        const fileContent = fs.readFileSync(devAlertsPath, 'utf8');
        const data = JSON.parse(fileContent);
        token = token || data.telegramBotToken || data.botToken || data.token;
        chatId = chatId || data.telegramChatId || data.chatId;
      }
    } catch {
      // Bỏ qua lỗi đọc file dev-alerts.json
    }
  }

  const cleanedToken = cleanTelegramToken(token);
  const cleanedChatId = cleanTelegramChatId(chatId);

  return {
    token: cleanedToken,
    chatId: cleanedChatId,
    isConfigured: Boolean(cleanedToken && cleanedChatId)
  };
};

// ----------------------------------------------------
// 3. CƠ CHẾ CHỐNG SPAM / THROTTLING LỖI TRONG BỘ NHỚ
// ----------------------------------------------------

const THROTTLE_WINDOW_MS = 60 * 1000; // 60 giây cooldown
const errorHistory = new Map();

/**
 * Xóa bộ nhớ throttle (dùng cho unit test)
 */
export const resetErrorHistoryForTest = () => {
  for (const item of errorHistory.values()) {
    if (item.timer) clearTimeout(item.timer);
    if (item.cleanupTimer) clearTimeout(item.cleanupTimer);
  }
  errorHistory.clear();
};

/**
 * Gửi HTTP request tới Telegram Bot API
 */
const sendTelegramRaw = async (token, chatId, htmlText, timeoutMs = 10000) => {
  if (!token || !chatId || !htmlText) {
    return { ok: false, error: 'Thiếu thông tin gửi Telegram' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }),
      signal: controller.signal
    });

    const data = await res.json();
    return {
      ok: Boolean(data?.ok),
      data,
      error: data?.ok ? null : (data?.description || `HTTP ${res.status}`)
    };
  } catch (err) {
    return {
      ok: false,
      error: err.name === 'AbortError' ? 'Telegram request timed out' : err.message
    };
  } finally {
    clearTimeout(timer);
  }
};

const getVnTimeString = (date = new Date()) => {
  try {
    return date.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return date.toISOString();
  }
};

const getMemoryStats = () => {
  try {
    const mem = process.memoryUsage();
    return {
      rssMb: (mem.rss / (1024 * 1024)).toFixed(1),
      heapUsedMb: (mem.heapUsed / (1024 * 1024)).toFixed(1),
      heapTotalMb: (mem.heapTotal / (1024 * 1024)).toFixed(1)
    };
  } catch {
    return { rssMb: 'N/A', heapUsedMb: 'N/A', heapTotalMb: 'N/A' };
  }
};

// ----------------------------------------------------
// 4. CẢNH BÁO LỖI NGHIÊM TRỌNG (notifyServerError)
// ----------------------------------------------------

export const notifyServerError = async (error, context = {}) => {
  const config = getDeveloperTelegramConfig();
  if (!config.isConfigured) {
    return { success: false, error: 'DEV_TELEGRAM_NOT_CONFIGURED' };
  }

  const errObj = error instanceof Error ? error : new Error(String(error || 'Lỗi không xác định'));
  const errName = errObj.name || 'Error';
  const errMsg = errObj.message || 'Không có mô tả chi tiết';
  const errStack = errObj.stack || '';

  // 4.1. Cơ chế Chống Spam / Cooldown
  const throttleKey = `${errName}:${errMsg}:${context.endpoint || context.source || ''}`;
  const now = Date.now();
  const existing = errorHistory.get(throttleKey);

  if (existing) {
    const elapsed = now - existing.firstSeen;
    if (elapsed < THROTTLE_WINDOW_MS) {
      existing.count++;

      // Nếu chưa có timer gửi tin tóm tắt thì hẹn giờ gửi
      if (!existing.timer) {
        const remainingMs = Math.max(1000, THROTTLE_WINDOW_MS - elapsed);
        existing.timer = setTimeout(async () => {
          const currentItem = errorHistory.get(throttleKey);
          if (currentItem && currentItem.count > 1) {
            const summaryHtml = `⚠️ <b>[TÓM TẮT CHỐNG SPAM - DEV ALERT]</b>\n\n` +
              `🔴 <b>Lỗi:</b> <code>${escapeTelegramHtml(errName)}</code> (${escapeTelegramHtml(errMsg)})\n` +
              `📍 <b>Nơi phát sinh:</b> <code>${escapeTelegramHtml(context.endpoint || context.source || 'Server')}</code>\n` +
              `🔄 <b>Số lần lặp lại:</b> Đã xuất hiện thêm <b>${currentItem.count - 1} lần</b> trong 60 giây qua.\n` +
              `⏰ <b>Thời gian cập nhật:</b> ${escapeTelegramHtml(getVnTimeString())}\n\n` +
              `🛡️ <i>Cơ chế chống spam tự động gộp các lỗi trùng lặp để bảo vệ bot.</i>`;

            await sendTelegramRaw(config.token, config.chatId, summaryHtml).catch(() => {});
          }
          errorHistory.delete(throttleKey);
        }, remainingMs);
        if (existing.timer.unref) existing.timer.unref();
      }

      return { success: true, throttled: true, count: existing.count };
    } else {
      // Đã quá cửa sổ 60s, xóa entry cũ
      if (existing.timer) clearTimeout(existing.timer);
      if (existing.cleanupTimer) clearTimeout(existing.cleanupTimer);
      errorHistory.delete(throttleKey);
    }
  }

  // Đăng ký entry mới trong errorHistory
  const cleanupTimer = setTimeout(() => {
    const it = errorHistory.get(throttleKey);
    if (it && it.count <= 1) {
      errorHistory.delete(throttleKey);
    }
  }, THROTTLE_WINDOW_MS);
  if (cleanupTimer.unref) cleanupTimer.unref();

  const newEntry = { firstSeen: now, count: 1, timer: null, cleanupTimer };
  errorHistory.set(throttleKey, newEntry);

  // 4.2. Định dạng thông điệp cảnh báo sự cố máy chủ
  const mem = getMemoryStats();
  const timeStr = getVnTimeString();

  // Trích xuất tối đa 5 dòng đầu của Stack Trace
  const stackLines = errStack
    .split('\n')
    .slice(0, 5)
    .join('\n')
    .trim();

  const isFatal = Boolean(context.fatal);
  const severityBadge = isFatal ? '💥 [FATAL CRASH ALERT]' : '🚨 [BÁO ĐỘNG SỰ CỐ MÁY CHỦ]';

  const htmlMessage = `${severityBadge} - <b>FLAMEGUARD PRO BACKEND</b>\n\n` +
    `🔴 <b>Phân loại lỗi:</b> <code>${escapeTelegramHtml(errName)}</code>\n` +
    `💬 <b>Chi tiết:</b> ${escapeTelegramHtml(errMsg)}\n` +
    `📍 <b>Nguồn gốc:</b> <code>${escapeTelegramHtml(context.source || 'Express API')}</code>\n` +
    (context.endpoint ? `🌐 <b>Endpoint:</b> <code>${escapeTelegramHtml((context.method ? context.method + ' ' : '') + context.endpoint)}</code>\n` : '') +
    (context.ip ? `🖥️ <b>Client IP:</b> <code>${escapeTelegramHtml(context.ip)}</code>\n` : '') +
    `⏰ <b>Thời điểm:</b> ${escapeTelegramHtml(timeStr)}\n` +
    `📊 <b>RAM RSS:</b> <code>${mem.rssMb} MB</code> (Heap: ${mem.heapUsedMb}/${mem.heapTotalMb} MB)\n` +
    (context.extraInfo ? `ℹ️ <b>Thông tin phụ:</b> ${escapeTelegramHtml(JSON.stringify(context.extraInfo))}\n` : '') +
    `\n📑 <b>Stack Trace (5 dòng đầu):</b>\n` +
    `<pre><code>${escapeTelegramHtml(stackLines || 'Không có stack trace')}</code></pre>\n\n` +
    `⚠️ <i>Kiểm tra log trên VPS bằng lệnh: <code>pm2 logs fire-safety-api</code></i>`;

  const result = await sendTelegramRaw(config.token, config.chatId, htmlMessage);
  return {
    success: result.ok,
    messageId: result.data?.result?.message_id,
    throttled: false,
    error: result.error
  };
};

// ----------------------------------------------------
// 5. CẢNH BÁO TRẠNG THÁI MÁY CHỦ (notifyServerWarning)
// ----------------------------------------------------

export const notifyServerWarning = async (title, message, details = {}) => {
  const config = getDeveloperTelegramConfig();
  if (!config.isConfigured) {
    return { success: false, error: 'DEV_TELEGRAM_NOT_CONFIGURED' };
  }

  const mem = getMemoryStats();
  const timeStr = getVnTimeString();

  let detailsBlock = '';
  if (details && Object.keys(details).length > 0) {
    detailsBlock = `\n📋 <b>Chi tiết bổ sung:</b>\n` +
      Object.entries(details)
        .map(([k, v]) => `  • <b>${escapeTelegramHtml(k)}:</b> <code>${escapeTelegramHtml(String(v))}</code>`)
        .join('\n') + '\n';
  }

  const htmlMessage = `⚠️ <b>[CẢNH BÁO HỆ THỐNG MÁY CHỦ]</b> - <b>${escapeTelegramHtml(title)}</b>\n\n` +
    `💬 <b>Nội dung:</b> ${escapeTelegramHtml(message)}\n` +
    `⏰ <b>Thời điểm:</b> ${escapeTelegramHtml(timeStr)}\n` +
    `📊 <b>Bộ nhớ RAM:</b> <code>${mem.rssMb} MB</code> (Heap: ${mem.heapUsedMb} MB)\n` +
    detailsBlock +
    `\n🔔 <i>Đội ngũ DevOps vui lòng lưu ý và kiểm tra nếu cảnh báo kéo dài.</i>`;

  const result = await sendTelegramRaw(config.token, config.chatId, htmlMessage);
  return {
    success: result.ok,
    messageId: result.data?.result?.message_id,
    error: result.error
  };
};

// ----------------------------------------------------
// 6. THÔNG BÁO KHỞI ĐỘNG THÀNH CÔNG (notifyServerStartup)
// ----------------------------------------------------

export const notifyServerStartup = async (extraInfo = {}) => {
  const config = getDeveloperTelegramConfig();
  if (!config.isConfigured) {
    return { success: false, error: 'DEV_TELEGRAM_NOT_CONFIGURED' };
  }

  const mem = getMemoryStats();
  const timeStr = getVnTimeString();
  const port = process.env.PORT || 3001;
  const domain = process.env.DOMAIN || 'pcccphatantam.com';
  const nodeEnv = process.env.NODE_ENV || 'production';
  const hostname = os.hostname();

  const htmlMessage = `🟢 <b>[MÁY CHỦ ĐÃ KHỞI ĐỘNG THÀNH CÔNG]</b>\n\n` +
    `🚀 <b>Dịch vụ:</b> FLAMEGUARD PRO PCCC Backend API\n` +
    `🌐 <b>Domain:</b> <code>https://${escapeTelegramHtml(domain)}</code>\n` +
    `🔌 <b>Cổng (Port):</b> <code>${port}</code>\n` +
    `📡 <b>Môi trường:</b> <code>${escapeTelegramHtml(nodeEnv)}</code>\n` +
    `💻 <b>Node.js:</b> <code>${process.version}</code> (PID: ${process.pid} | Host: ${escapeTelegramHtml(hostname)})\n` +
    `⏰ <b>Khởi động lúc:</b> ${escapeTelegramHtml(timeStr)}\n` +
    `📊 <b>Khởi tạo RAM:</b> <code>${mem.rssMb} MB</code>\n` +
    (extraInfo.reason ? `🔄 <b>Nguyên nhân:</b> ${escapeTelegramHtml(extraInfo.reason)}\n` : '') +
    `\n🛡️ <i>Hệ thống giám sát sự cố & watchdog 24/7 đang hoạt động bình thường.</i>`;

  const result = await sendTelegramRaw(config.token, config.chatId, htmlMessage);
  return {
    success: result.ok,
    messageId: result.data?.result?.message_id,
    error: result.error
  };
};

// ----------------------------------------------------
// 7. KIỂM TRA KẾT NỐI BOT DEVELOPER (testDeveloperServerAlert)
// ----------------------------------------------------

export const testDeveloperServerAlert = async (customToken = null, customChatId = null) => {
  let token = customToken;
  let chatId = customChatId;

  if (!token || !chatId) {
    const config = getDeveloperTelegramConfig();
    token = token || config.token;
    chatId = chatId || config.chatId;
  }

  token = cleanTelegramToken(token);
  chatId = cleanTelegramChatId(chatId);

  if (!token || !chatId) {
    return {
      success: false,
      error: 'Thiếu cấu hình Token hoặc Chat ID của Bot Developer (kiểm tra DEV_ALERT_TELEGRAM_TOKEN trong .env hoặc server/data/dev-alerts.json)'
    };
  }

  const timeStr = getVnTimeString();
  const mem = getMemoryStats();

  const htmlMessage = `🧪 <b>[KIỂM TRA KẾT NỐI BOT GIÁM SÁT DEVELOPER]</b>\n\n` +
    `✅ <b>Kết nối thành công tới Bot Giám Sát Kỹ Thuật FLAMEGUARD PRO!</b>\n` +
    `📡 <b>Môi trường:</b> <code>${process.env.NODE_ENV || 'production'}</code>\n` +
    `💻 <b>Máy chủ:</b> <code>${escapeTelegramHtml(os.hostname())}</code> (PID: ${process.pid})\n` +
    `📊 <b>RAM tiêu thụ:</b> <code>${mem.rssMb} MB</code>\n` +
    `⏰ <b>Thời gian kiểm tra:</b> ${escapeTelegramHtml(timeStr)}\n\n` +
    `🔔 <i>Kênh này chuyên nhận cảnh báo lỗi 500, crash, downtime và các sự cố kỹ thuật 24/7 từ máy chủ.</i>`;

  const result = await sendTelegramRaw(token, chatId, htmlMessage);
  if (!result.ok) {
    return {
      success: false,
      error: result.error || 'Gửi tin nhắn thử nghiệm thất bại'
    };
  }

  return {
    success: true,
    messageId: result.data?.result?.message_id,
    botUser: result.data?.result?.from
  };
};
