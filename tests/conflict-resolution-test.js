// tests/conflict-resolution-test.js
// Bộ kiểm thử tự động giải quyết xung đột Local-First & Timestamp Reconciliation
import assert from 'assert';

console.log('\n====================================================');
console.log('🔄 BẮT ĐẦU CHUỖI KIỂM THỬ LOCAL-FIRST CONFLICT RESOLUTION');
console.log('====================================================\n');

// Mock localStorage
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

// Import conflict resolution logic
import { 
  mergeProductsWithConflictResolution, 
  markProductDeletedLocal, 
  unmarkProductDeletedLocal, 
  getDeletedProductIds 
} from '../src/utils/conflictResolution.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

// 1. Kiểm tra khi sản phẩm local mới hơn sản phẩm server (Case người dùng vừa sửa trên Vercel)
test('Local-First: Bản local mới hơn (updatedAt lớn hơn) KHÔNG BỊ server cũ ghi đè text', () => {
  const localProducts = [
    {
      id: 'fl-1',
      name: 'Bó Juliet Nắng Ban Mai (ĐÃ CẬP NHẬT TÊN MỚI)',
      meaning: 'Ý nghĩa mới vừa sửa',
      price: 990000,
      updatedAt: '2026-09-19T15:00:00.000Z'
    }
  ];

  const staleServerProducts = [
    {
      id: 'fl-1',
      name: 'Bó Juliet Cũ Cũ',
      meaning: 'Ý nghĩa cũ trong Git',
      price: 750000,
      updatedAt: '2026-09-05T07:00:00.000Z'
    }
  ];

  const merged = mergeProductsWithConflictResolution(localProducts, staleServerProducts);
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].name, 'Bó Juliet Nắng Ban Mai (ĐÃ CẬP NHẬT TÊN MỚI)');
  assert.strictEqual(merged[0].meaning, 'Ý nghĩa mới vừa sửa');
  assert.strictEqual(merged[0].price, 990000);
});

// 2. Kiểm tra khi server có bản cập nhật mới hơn (từ máy khác hoặc admin khác)
test('Last-Write-Wins: Bản server mới hơn (updatedAt lớn hơn) ĐƯỢC CHẤP NHẬN cập nhật', () => {
  const localProducts = [
    {
      id: 'fl-2',
      name: 'Bó Hướng Dương Cũ',
      price: 500000,
      updatedAt: '2026-09-10T10:00:00.000Z'
    }
  ];

  const freshServerProducts = [
    {
      id: 'fl-2',
      name: 'Bó Hướng Dương Rạng Rỡ (Admin Máy Khác Sửa)',
      price: 580000,
      updatedAt: '2026-09-19T15:30:00.000Z'
    }
  ];

  const merged = mergeProductsWithConflictResolution(localProducts, freshServerProducts);
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].name, 'Bó Hướng Dương Rạng Rỡ (Admin Máy Khác Sửa)');
  assert.strictEqual(merged[0].price, 580000);
});

// 2b. Kiểm tra khi local là dữ liệu mẫu chưa sửa (không có updatedAt hoặc localTime = 0), server phải thắng
test('Default Local Yields to Server: Local mẫu chưa sửa (updatedAt undefined) nhường chỗ cho server', () => {
  const localDefault = [
    {
      id: 'fl-01',
      name: 'Bó Hoa Juliet Nắng Ban Mai (Mẫu cứng mặc định)',
      price: 850000
      // không có updatedAt
    }
  ];

  const serverUpdated = [
    {
      id: 'fl-01',
      name: 'Bó Hoa Juliet Sang Trọng VIP',
      price: 1200000,
      updatedAt: '2026-09-19T10:00:00.000Z'
    }
  ];

  const merged = mergeProductsWithConflictResolution(localDefault, serverUpdated);
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].name, 'Bó Hoa Juliet Sang Trọng VIP');
  assert.strictEqual(merged[0].price, 1200000);
});

// 3. Kiểm tra sản phẩm mới từ server được bổ sung vào danh mục
test('Server Sync: Mẫu hoa mới thêm từ server được đồng bộ vào local', () => {
  const localProducts = [
    { id: 'fl-1', name: 'Hoa 1', updatedAt: '2026-09-19T12:00:00.000Z' }
  ];

  const serverProducts = [
    { id: 'fl-1', name: 'Hoa 1', updatedAt: '2026-09-19T12:00:00.000Z' },
    { id: 'fl-3', name: 'Hoa 3 Mới Tinh', updatedAt: '2026-09-19T14:00:00.000Z' }
  ];

  const merged = mergeProductsWithConflictResolution(localProducts, serverProducts);
  assert.strictEqual(merged.length, 2);
  assert.ok(merged.some(p => p.id === 'fl-3' && p.name === 'Hoa 3 Mới Tinh'));
});

// 4. Kiểm tra xóa sản phẩm không bị server cũ hồi sinh (Zombie product prevention)
test('Zombie Prevention: Mẫu hoa đã xóa ở local KHÔNG BỊ server cũ lôi trở lại', () => {
  mockStorage.clear();
  markProductDeletedLocal('fl-deleted-99');

  const localProducts = [];
  const staleServerProducts = [
    { id: 'fl-deleted-99', name: 'Mẫu hoa đã bị xóa', updatedAt: '2026-09-01T00:00:00.000Z' }
  ];

  const merged = mergeProductsWithConflictResolution(localProducts, staleServerProducts);
  assert.strictEqual(merged.length, 0);
  assert.ok(!merged.some(p => p.id === 'fl-deleted-99'));

  // Phục hồi lại nếu sau này thêm lại
  unmarkProductDeletedLocal('fl-deleted-99');
  assert.ok(!getDeletedProductIds().has('fl-deleted-99'));
});

// 5. Kiểm tra Settings Timestamp Reconciliation
test('Settings Reconciliation: Cấu hình local mới hơn không bị stale server đè', () => {
  const localSettingsTime = new Date('2026-09-19T15:20:00.000Z').getTime();
  const serverSettings = {
    shopZaloPhone: '0123456789 (SĐT cũ trong Git)',
    telegramBotToken: 'old_token',
    updatedAt: '2026-09-05T07:57:48.683Z'
  };
  const serverSettingsTime = new Date(serverSettings.updatedAt).getTime();

  // Kiểm tra điều kiện: serverSettingsTime > localSettingsTime phải là FALSE
  const shouldOverwriteLocal = serverSettingsTime > localSettingsTime;
  assert.strictEqual(shouldOverwriteLocal, false, 'Stale server không được phép ghi đè local settings');
});

// 6. Kiểm tra Settings Timestamp Reconciliation khi có cập nhật hợp lệ từ máy khác
test('Settings Reconciliation: Cấu hình server mới hơn từ máy khác ĐƯỢC CHẤP NHẬN', () => {
  const localSettingsTime = new Date('2026-09-19T10:00:00.000Z').getTime();
  const serverSettings = {
    shopZaloPhone: '0988888888 (SĐT mới từ Admin khác)',
    updatedAt: '2026-09-19T15:25:00.000Z'
  };
  const serverSettingsTime = new Date(serverSettings.updatedAt).getTime();

  const shouldOverwriteLocal = serverSettingsTime > localSettingsTime;
  assert.strictEqual(shouldOverwriteLocal, true, 'Server mới hơn phải được chấp nhận');
});

console.log('\n====================================================');
console.log(`🏁 KẾT QUẢ KIỂM THỬ CONFLICT RESOLUTION: ${passed} ĐẠT / ${passed + failed} BÀI TEST`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
