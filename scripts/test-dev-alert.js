// scripts/test-dev-alert.js
// ====================================================
// SCRIPT TEST THỬ NGHIỆM TIỆN DỤNG CHO DEVELOPER / DEVOPS
// Cú pháp: node scripts/test-dev-alert.js [BOT_TOKEN] [CHAT_ID]
// ====================================================

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { 
  cleanTelegramToken, 
  cleanTelegramChatId, 
  getDeveloperTelegramConfig,
  getEnvDiagnosticInfo,
  loadEnvSafely
} from '../server/monitoringBot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
let inputToken = args[0];
let inputChatId = args[1];

// 1. Nếu chưa truyền qua CLI, nạp từ cấu hình hệ thống
if (!inputToken) {
  const existingConfig = getDeveloperTelegramConfig();
  inputToken = existingConfig.token;
  inputChatId = inputChatId || existingConfig.chatId;
}

// 2. Dự phòng thông minh: Nếu vẫn chưa có, kiểm tra biến dự phòng trong env
if (!inputToken) {
  loadEnvSafely();
  const fallbackToken = process.env.DEV_ALERT_TELEGRAM_TOKEN ||
                        process.env.DEV_TELEGRAM_TOKEN ||
                        process.env.DEV_ALERT_BOT_TOKEN ||
                        process.env.DEV_BOT_TOKEN ||
                        process.env.TELEGRAM_BOT_TOKEN ||
                        process.env.TELEGRAM_TOKEN ||
                        process.env.BOT_TOKEN;
  if (fallbackToken) {
    inputToken = fallbackToken;
    inputChatId = inputChatId || 
                  process.env.DEV_ALERT_TELEGRAM_CHAT_ID || 
                  process.env.DEV_TELEGRAM_CHAT_ID ||
                  process.env.DEV_CHAT_ID ||
                  process.env.TELEGRAM_CHAT_ID || 
                  process.env.CHAT_ID;
    console.log('ℹ️ Tự động tìm thấy token từ biến môi trường trong file cấu hình!');
  }
}

inputToken = cleanTelegramToken(inputToken);
inputChatId = cleanTelegramChatId(inputChatId);

console.log('====================================================');
console.log('🧪 CÔNG CỤ TEST KẾT NỐI TELEGRAM BOT DEVELOPER 24/7');
console.log('====================================================\n');

if (!inputToken) {
  console.error('❌ LỖI: Chưa tìm thấy Telegram Bot Token!');
  
  const diag = getEnvDiagnosticInfo();
  console.log('\n🔍 BÁO CÁO QUÉT TÌM FILE CẤU HÌNH TRÊN HỆ THỐNG:');
  console.log(`  • Thư mục làm việc: ${process.cwd()}`);
  
  if (diag.foundFiles.length === 0) {
    console.log(`  • Trạng thái file: Chưa tìm thấy bất kỳ file .env hoặc env nào!`);
    console.log(`    (Đã quét các đường dẫn: ${diag.checkedFiles.slice(0, 4).join(', ')})`);
  } else {
    for (const f of diag.foundFiles) {
      console.log(`  • Tìm thấy file: ${f.file} (${f.sizeBytes} bytes)`);
      if (f.isWithoutDot) {
        console.log(`    ↳ ⚠️ Chú ý: File này có tên là 'env' (không có dấu chấm ở đầu).`);
        console.log(`    ↳ ℹ️ Hệ thống đã tự động sao chép sang '.env' cho bạn.`);
      }
      if (f.keys && f.keys.length > 0) {
        console.log(`    ↳ Các biến có trong file: ${f.keys.join(', ')}`);
        const tokenLike = f.keys.find(k => k.toUpperCase().includes('TOKEN') || k.toUpperCase().includes('TELEGRAM'));
        if (tokenLike) {
          console.log(`    ↳ ⚠️ Biến '${tokenLike}' có trong file nhưng giá trị đang rỗng hoặc bị thiếu!`);
        }
      } else {
        console.log(`    ↳ ⚠️ File này đang TRỐNG (0 dòng cấu hình)!`);
      }
    }
  }

  console.log('\n👉 CÁCH KHẮC PHỤC NHANH NHẤT (Chạy trực tiếp với Token của bạn):');
  console.log('   node scripts/test-dev-alert.js <DÁN_TOKEN_VÀO_ĐÂY>');
  console.log('   Ví dụ: node scripts/test-dev-alert.js 7123456789:AAEFGH...\n');
  console.log('👉 HOẶC CẬP NHẬT FILE .env:');
  console.log('   nano .env');
  console.log('   (Dán 2 dòng sau vào file):');
  console.log('   DEV_ALERT_TELEGRAM_TOKEN=123456789:AAEFGH...');
  console.log('   DEV_ALERT_TELEGRAM_CHAT_ID=123456789\n');
  process.exit(1);
}

async function main() {
  // BƯỚC 1: Kiểm tra tính hợp lệ của Bot Token qua API getMe
  console.log('1️⃣ Đang xác thực Bot Token với Telegram API...');
  let botInfo = null;

  try {
    const getMeUrl = `https://api.telegram.org/bot${inputToken}/getMe`;
    const res = await fetch(getMeUrl);
    const data = await res.json();

    if (!data.ok) {
      console.error(`\n❌ Bot Token không hợp lệ hoặc đã bị vô hiệu hóa!`);
      console.error(`   Phản hồi từ Telegram: ${data.description || 'Unknown error'}`);
      console.log('\n💡 Hãy kiểm tra lại Bot Token được tạo từ @BotFather trên Telegram.');
      process.exit(1);
    }

    botInfo = data.result;
    console.log(`  ✅ Xác thực Bot thành công!`);
    console.log(`     • Tên hiển thị: ${botInfo.first_name}`);
    console.log(`     • Username: @${botInfo.username}`);
    console.log(`     • Bot ID: ${botInfo.id}`);
    console.log(`     • Link trực tiếp: https://t.me/${botInfo.username}\n`);
  } catch (err) {
    console.error(`\n❌ Lỗi kết nối mạng tới Telegram API: ${err.message}`);
    process.exit(1);
  }

  // BƯỚC 2: Tự động tìm Chat ID nếu chưa có
  let targetChatId = inputChatId;

  if (!targetChatId) {
    console.log('2️⃣ Chưa có Chat ID, đang tự động quét hộp thư getUpdates...');
    try {
      const getUpdatesUrl = `https://api.telegram.org/bot${inputToken}/getUpdates`;
      const res = await fetch(getUpdatesUrl);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
        // Lấy tin nhắn gần nhất có chat info
        for (let i = data.result.length - 1; i >= 0; i--) {
          const item = data.result[i];
          const chat = item.message?.chat || item.channel_post?.chat || item.my_chat_member?.chat;
          if (chat && chat.id) {
            targetChatId = String(chat.id);
            const chatName = chat.title || chat.username || `${chat.first_name || ''} ${chat.last_name || ''}`.trim() || 'Cá nhân';
            console.log(`  🔎 Tự động tìm thấy Chat ID gần nhất: ${targetChatId} (${chatName})\n`);
            break;
          }
        }
      }

      if (!targetChatId) {
        console.warn(`\n⚠️ CHƯA TÌM THẤY CUỘC TRÒ CHUYỆN NÀO VỚI BOT!`);
        console.log(`👉 BƯỚC CẦN THỰC HIỆN:`);
        console.log(`   1. Mở ứng dụng Telegram trên điện thoại hoặc máy tính.`);
        console.log(`   2. Truy cập vào link Bot: https://t.me/${botInfo.username}`);
        console.log(`   3. Nhấn nút "START" (hoặc gửi bất kỳ tin nhắn "Hello" cho Bot).`);
        console.log(`   4. Chạy lại lệnh này: node scripts/test-dev-alert.js ${inputToken}\n`);
        process.exit(0);
      }
    } catch (err) {
      console.warn(`  ⚠️ Không thể quét getUpdates: ${err.message}`);
    }
  }

  // BƯỚC 3: Gửi tin nhắn kiểm tra tới Developer Telegram
  console.log(`3️⃣ Đang gửi tin nhắn test tới Chat ID: ${targetChatId}...`);

  const nowVn = new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false
  });

  const testHtml = `🧪 <b>[TEST DEV ALERT] KIỂM TRA BOT GIÁM SÁT DEVELOPER 24/7</b>\n\n` +
    `✅ <b>Kết nối Bot Giám Sát Developer thành công!</b>\n` +
    `🤖 <b>Bot Username:</b> @${botInfo.username}\n` +
    `💬 <b>Chat ID:</b> <code>${targetChatId}</code>\n` +
    `💻 <b>Máy chủ:</b> <code>${os.hostname()}</code>\n` +
    `⏰ <b>Thời gian kiểm tra:</b> ${nowVn}\n\n` +
    `🚀 <i>Hệ thống giám sát sự cố máy chủ 24/7 đã sẵn sàng nhận báo động lỗi 500, crash và downtime từ VPS.</i>`;

  try {
    const sendMessageUrl = `https://api.telegram.org/bot${inputToken}/sendMessage`;
    const sendRes = await fetch(sendMessageUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: testHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const sendData = await sendRes.json();

    if (!sendData.ok) {
      console.error(`\n❌ Gửi tin nhắn thất bại: ${sendData.description || 'Lỗi không xác định'}`);
      if (sendData.description?.includes('chat not found') || sendData.description?.includes('bot was blocked')) {
        console.log(`\n💡 HƯỚNG DẪN KHẮC PHỤC:`);
        console.log(`   • Bạn chưa kích hoạt Bot hoặc đã chặn Bot.`);
        console.log(`   • Hãy mở link: https://t.me/${botInfo.username} và nhấn nút START.`);
        console.log(`   • Sau đó thử chạy lại lệnh này.`);
      }
      process.exit(1);
    }

    console.log(`\n🎉 THÀNH CÔNG! Đã gửi tin nhắn test tới Telegram Developer (Message ID: ${sendData.result.message_id})!`);

    // Tự động lưu vào server/data/dev-alerts.json để backend nhận diện ngay lập tức mà không cần sửa tay!
    try {
      const devAlertsDir = path.join(ROOT_DIR, 'server', 'data');
      if (!fs.existsSync(devAlertsDir)) fs.mkdirSync(devAlertsDir, { recursive: true });
      const devAlertsFile = path.join(devAlertsDir, 'dev-alerts.json');
      fs.writeFileSync(devAlertsFile, JSON.stringify({
        telegramBotToken: inputToken,
        telegramChatId: targetChatId,
        savedAt: new Date().toISOString()
      }, null, 2), 'utf8');
      console.log('💾 Đã tự động lưu cấu hình vào server/data/dev-alerts.json (Backend & Docker nhận diện ngay)!');
    } catch (saveErr) {
      console.warn(`  ⚠️ Không thể lưu server/data/dev-alerts.json: ${saveErr.message}`);
    }

    // Tự động lưu/cập nhật vào .env nếu chưa có
    try {
      const dotEnvPath = path.join(ROOT_DIR, '.env');
      let currentEnv = '';
      if (fs.existsSync(dotEnvPath)) {
        currentEnv = fs.readFileSync(dotEnvPath, 'utf8');
      }
      if (!currentEnv.includes('DEV_ALERT_TELEGRAM_TOKEN=')) {
        const appendContent = `\n# BOT GIÁM SÁT DEVELOPER 24/7\nDEV_ALERT_TELEGRAM_TOKEN=${inputToken}\nDEV_ALERT_TELEGRAM_CHAT_ID=${targetChatId}\n`;
        fs.appendFileSync(dotEnvPath, appendContent, 'utf8');
        console.log('💾 Đã tự động bổ sung cấu hình vào file .env!');
      }
    } catch {}

    console.log('\n====================================================');
    console.log('📌 THÔNG TIN CẤU HÌNH BOT GIÁM SÁT DEVELOPER:');
    console.log('====================================================');
    console.log(`DEV_ALERT_TELEGRAM_TOKEN=${inputToken}`);
    console.log(`DEV_ALERT_TELEGRAM_CHAT_ID=${targetChatId}`);
    console.log('====================================================\n');
  } catch (err) {
    console.error(`\n❌ Lỗi khi gửi tin nhắn test: ${err.message}`);
    process.exit(1);
  }
}

main();
