// scripts/test-dev-alert.js
// ====================================================
// SCRIPT TEST THỬ NGHIỆM TIỆN DỤNG CHO DEVELOPER / DEVOPS
// Cú pháp: node scripts/test-dev-alert.js [BOT_TOKEN] [CHAT_ID]
// ====================================================

import fs from 'fs';
import os from 'os';
import dotenv from 'dotenv';
import { 
  cleanTelegramToken, 
  cleanTelegramChatId, 
  getDeveloperTelegramConfig 
} from '../server/monitoringBot.js';

dotenv.config();
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true });
}

const args = process.argv.slice(2);
let inputToken = args[0];
let inputChatId = args[1];

if (!inputToken) {
  const existingConfig = getDeveloperTelegramConfig();
  inputToken = existingConfig.token;
  inputChatId = inputChatId || existingConfig.chatId;
}

inputToken = cleanTelegramToken(inputToken);
inputChatId = cleanTelegramChatId(inputChatId);

console.log('====================================================');
console.log('🧪 CÔNG CỤ TEST KẾT NỐI TELEGRAM BOT DEVELOPER');
console.log('====================================================\n');

if (!inputToken) {
  console.error('❌ LỖI: Chưa cung cấp Telegram Bot Token!');
  console.log('\n📖 HƯỚNG DẪN SỬ DỤNG:');
  console.log('  1. Chạy với tham số:');
  console.log('     node scripts/test-dev-alert.js <BOT_TOKEN> [CHAT_ID]');
  console.log('  2. Hoặc điền cấu hình vào file .env:');
  console.log('     DEV_ALERT_TELEGRAM_TOKEN=123456:ABC-DEF...');
  console.log('     DEV_ALERT_TELEGRAM_CHAT_ID=123456789\n');
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
    console.log('\n====================================================');
    console.log('📌 HÃY LƯU THÔNG TIN NÀY VÀO FILE .env TRÊN VPS:');
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
