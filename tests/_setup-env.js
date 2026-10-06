// tests/_setup-env.js
// Import FILE NÀY ĐẦU TIÊN trong mọi test chạm tới server/*.js.
// Cô lập dữ liệu chạy test vào thư mục tạm để không đụng tới server/data hay dữ liệu thật,
// và đặt thông tin admin dành riêng cho test (không phải mật khẩu thật).

import fs from 'fs';
import os from 'os';
import path from 'path';

if (!process.env.DATA_DIR) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fire-safety-test-'));
  process.env.DATA_DIR = dir;
  process.on('exit', () => {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // thư mục tạm, bỏ qua lỗi dọn dẹp
    }
  });
}

process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'FlameGuard@2026';
process.env.ADMIN_PIN = '123456';
process.env.SESSION_SECRET = 'test-only-session-secret-0123456789abcdef';
delete process.env.DATABASE_URL;
