// tests/zero-dependency-test.js
// Watchdog và reset-admin chạy TRỰC TIẾP trên VPS, nơi không có node_modules (ứng dụng chạy trong Docker).
// Test này bảo đảm chuỗi import của chúng chỉ gồm module có sẵn của Node, và chạy được khi không có node_modules.

import fs from 'fs';
import os from 'os';
import path from 'path';
import { builtinModules } from 'module';
import { spawnSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

console.log('====================================================');
console.log('📦 KIỂM THỬ WATCHDOG / RESET-ADMIN KHÔNG PHỤ THUỘC node_modules');
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

const ENTRY_FILES = [
  'scripts/server-watchdog.js',
  'scripts/reset-admin.js',
  'scripts/test-dev-alert.js',
  'server/monitoringBot.js',
  'server/auth.js',
  'server/storage.js'
];

const builtins = new Set([...builtinModules, ...builtinModules.map(m => `node:${m}`)]);
const IMPORT_PATTERNS = [
  /^\s*import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/gm,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
  /^\s*export\s+[^;]*?\s+from\s+['"]([^'"]+)['"]/gm
];

const collectImports = (file, seen = new Set(), external = new Set()) => {
  const abs = path.resolve(ROOT, file);
  if (seen.has(abs) || !fs.existsSync(abs)) return external;
  seen.add(abs);
  const source = fs.readFileSync(abs, 'utf-8');
  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const spec = match[1];
      if (spec.startsWith('.')) {
        collectImports(path.relative(ROOT, path.resolve(path.dirname(abs), spec)), seen, external);
      } else if (!builtins.has(spec)) {
        external.add(`${spec}  (trong ${path.relative(ROOT, abs)})`);
      }
    }
  }
  return external;
};

// 1. Kiểm tra tĩnh
console.log('1️⃣ CHUỖI IMPORT CHỈ GỒM MODULE CÓ SẴN CỦA NODE:');
for (const entry of ENTRY_FILES) {
  const external = [...collectImports(entry)];
  assert(external.length === 0, `${entry} không import thư viện ngoài`, external.join('; '));
}

// 2. Chạy thật trong thư mục không có node_modules (giống VPS)
console.log('\n2️⃣ CHẠY THẬT TRONG THƯ MỤC KHÔNG CÓ node_modules:');
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-dep-'));
const dataDir = path.join(sandbox, 'data');
for (const file of ['server/storage.js', 'server/monitoringBot.js', 'server/auth.js', 'scripts/server-watchdog.js', 'scripts/reset-admin.js']) {
  const target = path.join(sandbox, 'app', file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(ROOT, file), target);
}
const appDir = path.join(sandbox, 'app');
fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify({ type: 'module' }));

const run = (args, extraEnv = {}, cwd = appDir) =>
  spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf-8',
    timeout: 30000,
    env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, ...extraEnv }
  });

const watchdog = run(['scripts/server-watchdog.js', '--once'], { DATA_DIR: dataDir, HEALTH_URL: 'http://127.0.0.1:9/api/health' });
const watchdogOut = `${watchdog.stdout}${watchdog.stderr}`;
assert(!/ERR_MODULE_NOT_FOUND|Cannot find package/.test(watchdogOut), 'Watchdog nạp được khi không có node_modules', watchdogOut.slice(0, 200));
assert(watchdog.status === 1, 'Watchdog --once báo máy chủ không khỏe (exit 1) khi health URL không phản hồi', `exit=${watchdog.status}`);
assert(fs.existsSync(path.join(dataDir, '.watchdog_state.json')), 'Watchdog ghi file trạng thái vào DATA_DIR');

const reset = run(['scripts/reset-admin.js'], { DATA_DIR: dataDir });
const resetOut = `${reset.stdout}${reset.stderr}`;
assert(!/ERR_MODULE_NOT_FOUND|Cannot find package/.test(resetOut), 'reset-admin nạp được khi không có node_modules', resetOut.slice(0, 200));
assert(/Chưa nhập gì|Thư mục dữ liệu/.test(resetOut), 'reset-admin chạy tới bước nhập liệu');

// 3. DATA_DIR đọc được từ file .env mà không cần dotenv
console.log('\n3️⃣ ĐỌC DATA_DIR TỪ FILE .env (KHÔNG CẦN THƯ VIỆN dotenv):');
const envDir = path.join(sandbox, 'cwd');
fs.mkdirSync(envDir, { recursive: true });
fs.writeFileSync(path.join(envDir, '.env'), `PORT=3001\nDATA_DIR="${path.join(sandbox, 'tu-env')}"\n`);
const storageUrl = pathToFileURL(path.join(appDir, 'server/storage.js')).href;
const probeScript = `import(${JSON.stringify(storageUrl)}).then(m => console.log('DATA_DIR=' + m.DATA_DIR))`;
const probe = run(['--input-type=module', '-e', probeScript], {}, envDir);
assert(probe.stdout.trim() === `DATA_DIR=${path.join(sandbox, 'tu-env')}`, 'DATA_DIR được lấy từ .env trong thư mục hiện hành', probe.stdout + probe.stderr);
const probeEnvWins = run(
  ['--input-type=module', '-e', probeScript],
  { DATA_DIR: path.join(sandbox, 'tu-bien-moi-truong') },
  envDir
);
assert(probeEnvWins.stdout.trim() === `DATA_DIR=${path.join(sandbox, 'tu-bien-moi-truong')}`, 'Biến môi trường DATA_DIR được ưu tiên hơn file .env');

fs.rmSync(sandbox, { recursive: true, force: true });

console.log('\n====================================================');
console.log(`🏁 KẾT QUẢ KIỂM THỬ KHÔNG PHỤ THUỘC THƯ VIỆN: ${passed} ĐẠT / ${passed + failed} BÀI TEST`);
console.log('====================================================');
process.exit(failed === 0 ? 0 : 1);
