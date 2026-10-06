// tests/migration-test.js
// Bảo đảm lần deploy đầu tiên (chuyển dữ liệu ra DATA_DIR) KHÔNG làm mất dữ liệu khách/admin đã sửa trên VPS.
// Chạy mô phỏng bằng git thật (tests/migration-sim.sh) và kiểm tra workflow/deploy.sh có đúng bước bảo vệ.
// Bỏ qua phần mô phỏng nếu máy không có bash/git (ví dụ cmd.exe thuần trên Windows).

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

console.log('====================================================');
console.log('🚚 BẮT ĐẦU KIỂM THỬ DI CHUYỂN DỮ LIỆU KHI DEPLOY (KHÔNG MẤT DỮ LIỆU)');
console.log('====================================================\n');

let passed = 0;
let failed = 0;
function assert(condition, message, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.log(`  ❌ [FAIL] ${message}${details ? ' -> ' + details : ''}`);
    failed++;
  }
}

// 1. Bước bảo vệ phải có mặt, và nằm TRƯỚC git reset --hard, ở cả CI lẫn deploy.sh
console.log('1️⃣ WORKFLOW & DEPLOY.SH CÓ BƯỚC BẢO VỆ DỮ LIỆU TRƯỚC KHI RESET:');
const PROTECT = 'git ls-files -z server/data | xargs -0 -r git update-index --force-remove --';
for (const file of ['.github/workflows/deploy.yml', 'deploy.sh']) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf-8').replace(/\r\n/g, '\n');
  const protectAt = text.indexOf(PROTECT);
  const resetAt = text.indexOf('git reset --hard origin/main');
  assert(protectAt !== -1, `${file} có bước gỡ dữ liệu khỏi chỉ mục git`);
  assert(protectAt !== -1 && resetAt !== -1 && protectAt < resetAt, `${file}: bước bảo vệ nằm TRƯỚC git reset --hard`);
}
{
  const wf = fs.readFileSync(path.join(ROOT, '.github/workflows/deploy.yml'), 'utf-8').replace(/\r\n/g, '\n');
  const prepareAt = wf.indexOf('prepare-data.sh prepare');
  const resetAt = wf.indexOf('git reset --hard origin/main');
  assert(prepareAt !== -1 && prepareAt < resetAt, 'Workflow sao lưu/chuyển dữ liệu (prepare-data) TRƯỚC khi git reset');
  assert(!/fl-1787735321783|startsWith\('fl-'\)/.test(wf), 'Workflow không còn đoạn tự xóa sản phẩm fl-');
}

// 2. Mô phỏng bằng git thật
console.log('\n2️⃣ MÔ PHỎNG LẦN DEPLOY ĐẦU TIÊN BẰNG GIT THẬT:');
const sim = (mode) =>
  spawnSync('bash', [path.join(__dirname, 'migration-sim.sh'), mode], {
    env: { ...process.env, REPO_ROOT: ROOT },
    encoding: 'utf-8',
    timeout: 60000
  });

const probe = spawnSync('bash', ['-c', 'command -v git >/dev/null 2>&1 && echo ok'], { encoding: 'utf-8' });
if (probe.error || !(probe.stdout || '').includes('ok')) {
  console.log('  ⏭️ [SKIP] Máy này không có bash/git; bỏ qua phần mô phỏng (CI trên Linux vẫn chạy).');
} else {
  const protectedRun = sim('protect');
  const out = `${protectedRun.stdout || ''}${protectedRun.stderr || ''}`;
  assert(protectedRun.status === 0, 'Mô phỏng chạy xong không lỗi', out.slice(-300));
  for (const item of ['khach A', 'khach B', 'khach C luc build', 'cai dat admin', 'admins.json va .auth_secret', 'co .migrated']) {
    assert(out.includes(`CON: ${item}`), `Có bảo vệ: "${item}" còn nguyên sau deploy`, out.includes(`MAT: ${item}`) ? 'BỊ MẤT' : '');
  }

  // Đối chứng: không có bước bảo vệ thì dữ liệu mất. Test này chứng minh bước bảo vệ là cần thiết.
  const plainRun = sim('plain');
  const plainOut = `${plainRun.stdout || ''}${plainRun.stderr || ''}`;
  assert(plainOut.includes('MAT: khach A') || plainOut.includes('MAT: khach B'), 'Đối chứng: KHÔNG có bảo vệ thì đơn hàng của khách bị mất (xác nhận bước bảo vệ là cần thiết)');
}

console.log('\n====================================================');
console.log(`🏁 KẾT QUẢ KIỂM THỬ DI CHUYỂN DỮ LIỆU: ${passed} ĐẠT / ${passed + failed} BÀI TEST`);
console.log('====================================================');
process.exit(failed === 0 ? 0 : 1);
