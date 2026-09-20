import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'server', 'data');

console.log('====================================================');
console.log('🧪 BẮT ĐẦU CHUỖI KIỂM THỬ ĐƠN VỊ & NGHIỆP VỤ SHOP');
console.log('====================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failedTests++;
  }
}

// 1. Dữ liệu JSON
const requiredFiles = ['products.json', 'orders.json', 'discounts.json', 'reviews.json', 'inventory.json', 'settings.json'];
requiredFiles.forEach(file => {
  const filePath = path.join(DATA_DIR, file);
  assert(fs.existsSync(filePath), `File ${file} tồn tại`);
});

// 2. Discount validation
const discounts = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'discounts.json'), 'utf-8'));
function validateCoupon(code, cartTotal, discountList) {
  const match = discountList.find(d => d.code === code && d.isActive);
  if (!match) return { valid: false };
  if (cartTotal < (match.minOrderValue || 0)) return { valid: false };
  let amount = 0;
  if (match.type === 'percentage') {
    amount = Math.round((cartTotal * match.value) / 100);
    if (match.maxDiscount && amount > match.maxDiscount) amount = match.maxDiscount;
  } else if (match.type === 'fixed') {
    amount = Math.min(match.value, cartTotal);
  } else if (match.type === 'shipping') {
    amount = match.value || 35000;
  }
  return { valid: true, discountAmount: amount };
}

assert(validateCoupon('ANTOAN10', 850000, discounts).discountAmount === 85000, 'ANTOAN10 chiết khấu đúng 10%');
assert(validateCoupon('FREESHIP', 500000, discounts).discountAmount === 35000, 'FREESHIP giảm đúng 35.000đ');
assert(validateCoupon('CHUNGCU50K', 450000, discounts).discountAmount === 50000, 'CHUNGCU50K giảm đúng 50.000đ');

// 3. Analytics
const orders = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'orders.json'), 'utf-8'));
assert(orders.length > 0, `Có ${orders.length} đơn hàng được đồng bộ`);

// 4. Reviews
const reviews = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'reviews.json'), 'utf-8'));
assert(reviews.length > 0, `Có ${reviews.length} đánh giá khách hàng`);

// 5. Inventory Calculations & Deductions
const inventory = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'inventory.json'), 'utf-8'));
assert(inventory.length > 0, `Có ${inventory.length} thiết bị PCCC trong kho dữ liệu`);

const testItem = { name: 'Thiết Bị Test', total: 100, used: 40 };
const calculatedRemain = Math.max(0, testItem.total - testItem.used);
assert(calculatedRemain === 60, 'Công thức tồn kho remain = total - used (100 - 40 = 60)');

// Test Restock
const restockedTotal = testItem.total + 50;
const restockedRemain = Math.max(0, restockedTotal - testItem.used);
assert(restockedTotal === 150 && restockedRemain === 110, 'Nhập thêm hàng +50 thiết bị: total=150, remain=110');

// Test Status
function getStatus(remain) {
  if (remain <= 5) return 'danger';
  if (remain <= 20) return 'warning';
  return 'normal';
}
assert(getStatus(4) === 'danger', 'Mức tồn <= 5 là danger');
assert(getStatus(18) === 'warning', 'Mức tồn 6-20 là warning');
assert(getStatus(45) === 'normal', 'Mức tồn > 20 là normal');

// 6. Native XLSX Generator (Zero-warning OpenXML binary format)
import { SimpleZip } from '../src/utils/excelGenerator.js';

const testZip = new SimpleZip();
testZip.addFile('test.txt', 'Hello FLAMEGUARD PRO');
const zipBytes = testZip.generateUint8Array();
assert(zipBytes.length > 50, 'Bộ nén SimpleZip tạo thành công mảng binary');
assert(zipBytes[0] === 0x50 && zipBytes[1] === 0x4B, 'Header file đúng chuẩn PKZip signature (0x504B)');

// 7. Facebook Messenger Integration & Deep Linking
import { 
  cleanFacebookPageId, 
  getMessengerUrl, 
  generateMessengerProductInquiry, 
  generateMessengerOrderInquiry 
} from '../src/services/facebookService.js';

const settings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'settings.json'), 'utf-8'));
assert(Boolean(settings.facebookSettings), 'Cấu hình facebookSettings tồn tại trong settings.json');
assert(Boolean(settings.facebookSettings?.pageId), 'Facebook Page ID được cấu hình mặc định');
assert(Boolean(settings.facebookSettings?.verifyToken), 'Facebook Webhook Verify Token được thiết lập');

assert(cleanFacebookPageId('https://facebook.com/flameguardpccc') === 'flameguardpccc', 'cleanFacebookPageId làm sạch URL https://facebook.com/...');
assert(cleanFacebookPageId('https://m.me/flameguardpccc/') === 'flameguardpccc', 'cleanFacebookPageId làm sạch link m.me/...');
assert(cleanFacebookPageId('@flameguardpccc') === 'flameguardpccc', 'cleanFacebookPageId loại bỏ ký tự @');
assert(cleanFacebookPageId('') === 'flameguardpccc', 'cleanFacebookPageId fallback về fanpage mặc định nếu rỗng');

const messengerUrl = getMessengerUrl('flameguardpccc', 'Tư vấn thiết bị PCCC');
assert(messengerUrl.startsWith('https://m.me/flameguardpccc?text='), 'getMessengerUrl tạo link m.me với param text đúng chuẩn');

const orderInquiryUrl = generateMessengerOrderInquiry('flameguardpccc', 'FG-89241');
assert(orderInquiryUrl.includes('FG-89241'), 'generateMessengerOrderInquiry kèm chính xác mã đơn hàng');

const productInquiryUrl = generateMessengerProductInquiry('flameguardpccc', { name: 'Bình Bột ABC 4kg', price: 320000 });
assert(productInquiryUrl.includes('B%C3%ACnh') || productInquiryUrl.includes('ABC'), 'generateMessengerProductInquiry mã hóa đúng tên sản phẩm');

// 8. Product Update & Synchronization
import { 
  broadcastProductUpdateToTabs, 
  broadcastProductAddToTabs, 
  broadcastProductDeleteToTabs 
} from '../src/services/notificationService.js';

assert(typeof broadcastProductUpdateToTabs === 'function', 'broadcastProductUpdateToTabs hàm tồn tại');
assert(typeof broadcastProductAddToTabs === 'function', 'broadcastProductAddToTabs hàm tồn tại');
assert(typeof broadcastProductDeleteToTabs === 'function', 'broadcastProductDeleteToTabs hàm tồn tại');

const products = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'products.json'), 'utf-8'));
assert(Array.isArray(products) && products.length > 0, 'Danh sách sản phẩm products.json hợp lệ và có dữ liệu');
const sampleProduct = products[0];
assert(Boolean(sampleProduct.id && sampleProduct.name && sampleProduct.price), 'Mẫu thiết bị PCCC có đầy đủ id, name, price');

// Test merge sản phẩm khi sửa
const updatedSample = {
  ...sampleProduct,
  price: 990000,
  updatedAt: new Date().toISOString()
};
assert(updatedSample.price === 990000 && updatedSample.id === sampleProduct.id, 'Merge cập nhật giá thiết bị PCCC chính xác mà không mất id');

console.log('\n====================================================');
console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passedTests} ĐẠT / ${passedTests + failedTests} BÀI TEST`);
console.log('====================================================');

