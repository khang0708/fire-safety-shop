// scripts/server-watchdog.js
// ====================================================
// SCRIPT GIÁM SÁT DOWNTIME ĐỘC LẬP TỪ BÊN NGOÀI (WATCHDOG 24/7)
// Chạy độc lập qua PM2 hoặc Cron để kiểm tra sức khỏe máy chủ
// ====================================================

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { 
  getDeveloperTelegramConfig, 
  escapeTelegramHtml 
} from '../server/monitoringBot.js';

dotenv.config();
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const STATE_FILE = path.join(ROOT_DIR, 'server', 'data', '.watchdog_state.json');

// Cấu hình giám sát
const HEALTH_URL = process.env.HEALTH_URL || `http://127.0.0.1:${process.env.PORT || 3001}/api/health`;
const CHECK_INTERVAL_SECONDS = parseInt(process.env.CHECK_INTERVAL_SECONDS || '60', 10);
const MAX_CONSECUTIVE_FAILURES = parseInt(process.env.MAX_CONSECUTIVE_FAILURES || '2', 10);
const RESTART_COMMAND = process.env.RESTART_CMD || 'pm2 restart fire-safety-api || pm2 restart all';

// ----------------------------------------------------
// 1. QUẢN LÝ TRẠNG THÁI (PERSISTENT STATE)
// ----------------------------------------------------

const loadState = () => {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch {}
  return {
    consecutiveFailures: 0,
    isDown: false,
    lastFailureTime: null,
    lastRecoveryTime: null,
    lastCheckTime: null,
    restartCount: 0
  };
};

const saveState = (state) => {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('[Watchdog] Không thể lưu file trạng thái:', err.message);
  }
};

const sendTelegramDeveloperAlert = async (htmlMessage) => {
  const config = getDeveloperTelegramConfig();
  if (!config.isConfigured) {
    console.warn('[Watchdog] Chưa cấu hình DEV_ALERT_TELEGRAM_TOKEN hoặc DEV_ALERT_TELEGRAM_CHAT_ID.');
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `https://api.telegram.org/bot${config.token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: htmlMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }),
      signal: controller.signal
    });
    const data = await res.json();
    return Boolean(data?.ok);
  } catch (err) {
    console.error('[Watchdog] Lỗi khi gửi Telegram alert:', err.message);
    return false;
  } finally {
    clearTimeout(timer);
  }
};

const getVnTime = () => {
  return new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// ----------------------------------------------------
// 2. LOGIC KIỂM TRA SỨC KHỎE MÁY CHỦ (HEALTH CHECK)
// ----------------------------------------------------

export const performHealthCheck = async (options = {}) => {
  const healthUrl = options.healthUrl || HEALTH_URL;
  const state = loadState();
  const nowStr = getVnTime();
  state.lastCheckTime = nowStr;

  let isHealthy = false;
  let errorDetails = '';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(healthUrl, { signal: controller.signal });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.status === 'ONLINE' || res.status === 200) {
        isHealthy = true;
      } else {
        errorDetails = `HTTP ${res.status}: Status=${data.status || 'UNKNOWN'}`;
      }
    } else {
      errorDetails = `HTTP ${res.status} ${res.statusText}`;
    }
  } catch (err) {
    errorDetails = err.name === 'AbortError' ? 'Yêu cầu kiểm tra sức khỏe bị Timeout (>8s)' : err.message;
  } finally {
    clearTimeout(timer);
  }

  if (isHealthy) {
    if (state.isDown) {
      // Máy chủ vừa phục hồi trở lại sau sự cố!
      state.isDown = false;
      state.consecutiveFailures = 0;
      state.lastRecoveryTime = nowStr;

      const recoveryHtml = `✅ <b>[MÁY CHỦ ĐÃ PHỤC HỒI HOẠT ĐỘNG BÌNH THƯỜNG]</b>\n\n` +
        `🎉 <b>Dịch vụ:</b> FLAMEGUARD PRO PCCC Backend API\n` +
        `🌐 <b>Health URL:</b> <code>${escapeTelegramHtml(healthUrl)}</code>\n` +
        `⏰ <b>Thời điểm phục hồi:</b> ${escapeTelegramHtml(nowStr)}\n` +
        `📡 <b>Trạng thái:</b> <code>HTTP 200 OK (ONLINE)</code>\n\n` +
        `🟢 <i>Hệ thống Watchdog 24/7 tiếp tục theo dõi tiến trình máy chủ định kỳ.</i>`;

      console.log(`[Watchdog] ✅ Máy chủ đã phục hồi lúc ${nowStr}`);
      await sendTelegramDeveloperAlert(recoveryHtml);
    } else {
      state.consecutiveFailures = 0;
      console.log(`[Watchdog] [${nowStr}] ✅ Sức khỏe máy chủ bình thường (200 OK)`);
    }
  } else {
    state.consecutiveFailures++;
    state.lastFailureTime = nowStr;
    console.warn(`[Watchdog] [${nowStr}] ⚠️ Lần thất bại ${state.consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}: ${errorDetails}`);

    if (state.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && !state.isDown) {
      state.isDown = true;
      state.restartCount++;

      const alertHtml = `🚨 <b>[BÁO ĐỘNG ĐỎ] - MÁY CHỦ BACKEND NGỪNG PHẢN HỒI (DOWNTIME DETECTED)</b>\n\n` +
        `💥 <b>Tình trạng:</b> Máy chủ không phản hồi sau <b>${state.consecutiveFailures} lần kiểm tra liên tiếp</b>.\n` +
        `🌐 <b>Health URL:</b> <code>${escapeTelegramHtml(healthUrl)}</code>\n` +
        `💬 <b>Lỗi phát hiện:</b> <code>${escapeTelegramHtml(errorDetails)}</code>\n` +
        `⏰ <b>Thời điểm phát hiện:</b> ${escapeTelegramHtml(nowStr)}\n` +
        `🔄 <b>Lệnh tự khởi động lại:</b> <code>${escapeTelegramHtml(RESTART_COMMAND)}</code>\n\n` +
        `⚡ <i>Watchdog đang tự động kích hoạt lệnh restart tiến trình qua PM2...</i>`;

      console.error(`[Watchdog] 🚨 BÁO ĐỘNG ĐỎ! Đang gửi cảnh báo tới Developer Telegram và restart server...`);
      await sendTelegramDeveloperAlert(alertHtml);

      // Tự động kích hoạt khởi động lại dịch vụ
      if (!options.skipRestart) {
        exec(RESTART_COMMAND, (restartErr, stdout, stderr) => {
          if (restartErr) {
            console.error('[Watchdog] Lỗi khi thực thi lệnh restart:', restartErr.message);
          } else {
            console.log('[Watchdog] Kết quả restart PM2:', stdout || stderr || 'Thành công');
          }
        });
      }
    }
  }

  saveState(state);
  return { isHealthy, consecutiveFailures: state.consecutiveFailures, isDown: state.isDown, errorDetails };
};

// ----------------------------------------------------
// 3. KHỞI CHẠY TIẾN TRÌNH WATCHDOG
// ----------------------------------------------------

const run = async () => {
  const isOnce = process.argv.includes('--once');

  console.log('====================================================');
  console.log('🛡️ KHỞI CHẠY TIẾN TRÌNH SERVER WATCHDOG 24/7');
  console.log(`🌐 Target: ${HEALTH_URL}`);
  console.log(`⏱️ Chu kỳ: ${CHECK_INTERVAL_SECONDS} giây/lần`);
  console.log(`🚨 Ngưỡng báo động: ${MAX_CONSECUTIVE_FAILURES} lần thất bại liên tiếp`);
  console.log(`🔄 Lệnh restart: ${RESTART_COMMAND}`);
  console.log('====================================================\n');

  if (isOnce) {
    const result = await performHealthCheck();
    process.exit(result.isHealthy ? 0 : 1);
  }

  // Chạy lần đầu ngay lập tức
  await performHealthCheck();

  // Đặt lịch lặp định kỳ
  const interval = setInterval(performHealthCheck, CHECK_INTERVAL_SECONDS * 1000);

  const cleanup = () => {
    console.log('\n[Watchdog] Đang dừng tiến trình giám sát...');
    clearInterval(interval);
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
};

// Chỉ tự chạy nếu được gọi trực tiếp từ command line
if (process.argv[1] && process.argv[1].endsWith('server-watchdog.js')) {
  run();
}
