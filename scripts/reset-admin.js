// scripts/reset-admin.js
// Đặt lại mật khẩu / mã PIN admin ngay trên máy chủ (không cần mật khẩu cũ). Mọi phiên đăng nhập cũ bị thu hồi.
//
// Dùng với Docker:  docker exec -it flameguard-web node scripts/reset-admin.js [--user=admin]
// Dùng không Docker: DATA_DIR=/var/lib/fire-safety-data node scripts/reset-admin.js
//
// Nhập tương tác (ẩn ký tự). Nếu không có TTY, đọc từ biến môi trường NEW_ADMIN_PASSWORD / NEW_ADMIN_PIN.

import { resetAdminCredentials, validateNewPassword, validateNewPin } from '../server/auth.js';
import { DATA_DIR } from '../server/storage.js';

const userArg = process.argv.find(a => a.startsWith('--user='));
const username = userArg ? userArg.slice('--user='.length) : process.env.ADMIN_USERNAME || '';

const readHidden = (prompt) =>
  new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(prompt);
    let buffer = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const finish = (value) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
      process.stdout.write('\n');
      resolve(value);
    };

    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') return finish(buffer);
        if (ch === '\u0003') {
          process.stdout.write('\n');
          process.exit(130);
        }
        if (ch === '\u007f' || ch === '\b') buffer = buffer.slice(0, -1);
        else buffer += ch;
      }
    };
    stdin.on('data', onData);
  });

const main = async () => {
  console.log(`Thư mục dữ liệu: ${DATA_DIR}`);

  let newPassword = process.env.NEW_ADMIN_PASSWORD || '';
  let newPin = process.env.NEW_ADMIN_PIN || '';

  if (process.stdin.isTTY) {
    newPassword = await readHidden('Mật khẩu mới (>= 10 ký tự, bỏ trống để không đổi): ');
    if (newPassword) {
      const again = await readHidden('Nhập lại mật khẩu mới: ');
      if (again !== newPassword) {
        console.error('Hai lần nhập không khớp. Hủy.');
        process.exit(1);
      }
    }
    newPin = await readHidden('Mã PIN mới (6 - 10 chữ số, bỏ trống để không đổi): ');
  }

  if (!newPassword && !newPin) {
    console.error('Chưa nhập gì để đổi. Hủy.');
    process.exit(1);
  }

  const problems = [];
  if (newPassword && validateNewPassword(newPassword)) problems.push(validateNewPassword(newPassword));
  if (newPin && validateNewPin(newPin)) problems.push(validateNewPin(newPin));
  if (problems.length > 0) {
    console.error(`Không hợp lệ: ${problems.join(' ')}`);
    process.exit(1);
  }

  const result = resetAdminCredentials({ username, newPassword, newPin });
  if (!result.success) {
    console.error(`Thất bại: ${result.message}`);
    process.exit(1);
  }
  console.log(`Đã đặt lại thông tin đăng nhập cho tài khoản "${result.username}". Mọi phiên đăng nhập cũ đã bị thu hồi.`);
};

main().catch((err) => {
  console.error('Lỗi:', err.message);
  process.exit(1);
});
