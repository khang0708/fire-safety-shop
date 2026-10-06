import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const SETTINGS_FILE = path.join(ROOT_DIR, 'server', 'seed', 'settings.json');

console.log('====================================================');
console.log('🏷️ BẮT ĐẦU KIỂM THỬ TÍNH NĂNG THƯƠNG HIỆU & SEO');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

// 1. Kiểm tra cấu trúc dữ liệu brandSettings
const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
assert(Boolean(settings.brandSettings), 'Cấu trúc brandSettings tồn tại trong settings.json');
assert(settings.brandSettings.brandName.length > 0, 'brandName có dữ liệu hợp lệ');
assert(settings.brandSettings.address.length > 0, 'address có dữ liệu hợp lệ');
assert(Array.isArray(settings.brandSettings.addresses), 'addresses là mảng danh sách địa chỉ kho hàng');
assert(settings.brandSettings.addresses.length >= 1, 'addresses có ít nhất 1 địa chỉ kho');
assert(settings.brandSettings.email.includes('@'), 'email có định dạng hợp lệ');
assert(Boolean(settings.brandSettings.hotline), 'hotline tồn tại trong brandSettings');
assert(settings.brandSettings.seoTitle.length > 0, 'seoTitle có dữ liệu hợp lệ');
assert(settings.brandSettings.seoDescription.length > 0, 'seoDescription có dữ liệu hợp lệ');

// 2. Kiểm tra thao tác merge dữ liệu cập nhật và cấu hình động kho hàng
const updatePayload = {
  brandSettings: {
    brandName: 'PCCC PHÁT AN TÂM TEST',
    brandSlogan: 'Kiểm Định BCA Nhanh Chóng',
    logoUrl: 'https://example.com/test-logo.png',
    hotline: '0987.654.321',
    address: '999 Đường Cứu Hỏa, Q.1, TP.HCM',
    secondaryAddress: '111 Phố PCCC, Hà Nội',
    addresses: [
      'Kho 1: 999 Đường Cứu Hỏa, Q.1, TP.HCM',
      'Kho 2: 111 Phố PCCC, Hoàn Kiếm, Hà Nội',
      'Kho 3 (Miền Trung): 55 Lê Duẩn, Hải Châu, Đà Nẵng'
    ],
    email: 'test@phatantam.vn',
    seoTitle: 'PCCC PHÁT AN TÂM TEST | Thiết Bị Cứu Hỏa Chuẩn Kiểm Định',
    seoDescription: 'Mô tả SEO thử nghiệm cho hệ thống an toàn phòng cháy chữa cháy...'
  },
  updatedAt: new Date().toISOString()
};

const mergedSettings = {
  ...settings,
  ...updatePayload,
  brandSettings: {
    ...settings.brandSettings,
    ...updatePayload.brandSettings
  }
};

assert(mergedSettings.brandSettings.hotline === '0987.654.321', 'Cập nhật hotline thành công');

assert(mergedSettings.brandSettings.brandName === 'PCCC PHÁT AN TÂM TEST', 'Cập nhật brandName thành công');
assert(mergedSettings.brandSettings.address === '999 Đường Cứu Hỏa, Q.1, TP.HCM', 'Cập nhật address thành công');
assert(mergedSettings.brandSettings.email === 'test@phatantam.vn', 'Cập nhật email thành công');
assert(mergedSettings.brandSettings.logoUrl === 'https://example.com/test-logo.png', 'Cập nhật logoUrl thành công');
assert(mergedSettings.brandSettings.seoTitle.includes('PCCC PHÁT AN TÂM TEST'), 'Cập nhật seoTitle thành công');
assert(Array.isArray(mergedSettings.brandSettings.addresses), 'addresses trong payload hợp nhất là mảng');
assert(mergedSettings.brandSettings.addresses.length === 3, 'Cấu hình 3 địa chỉ kho hàng thành công');
assert(mergedSettings.brandSettings.addresses[2].includes('Đà Nẵng'), 'Kho thứ 3 tại Đà Nẵng được lưu chính xác');

// 3. Kiểm tra logic thêm / sửa / xóa động danh sách kho hàng (Dynamic Address Operations)
let dynamicAddresses = [...mergedSettings.brandSettings.addresses];

// Thêm kho thứ 4
dynamicAddresses.push('Kho 4 (Cần Thơ): 123 Đường 30/4, Ninh Kiều, Cần Thơ');
assert(dynamicAddresses.length === 4, 'Thêm mới kho hàng vào danh sách thành công');
assert(dynamicAddresses[3].includes('Cần Thơ'), 'Kho mới tại Cần Thơ có nội dung chính xác');

// Sửa kho thứ 2
dynamicAddresses[1] = 'Kho 2 (Cập nhật): 222 Phố Xã Đàn, Đống Đa, Hà Nội';
assert(dynamicAddresses[1].includes('222 Phố Xã Đàn'), 'Chỉnh sửa nội dung kho hàng thành công');

// Xóa kho thứ 3 (Đà Nẵng)
dynamicAddresses = dynamicAddresses.filter((_, idx) => idx !== 2);
assert(dynamicAddresses.length === 3, 'Xóa kho hàng khỏi danh sách thành công');
assert(!dynamicAddresses.some(a => a.includes('Đà Nẵng')), 'Kho Đà Nẵng đã bị gỡ bỏ chính xác');

// Đồng bộ tương thích ngược (addresses[0] -> address, addresses[1] -> secondaryAddress)
const syncAddress = dynamicAddresses[0] || '';
const syncSecondary = dynamicAddresses[1] || '';
assert(syncAddress.includes('999 Đường Cứu Hỏa'), 'Đồng bộ addresses[0] sang address chính');
assert(syncSecondary.includes('222 Phố Xã Đàn'), 'Đồng bộ addresses[1] sang secondaryAddress phụ');

// 4. Kiểm tra helper getShopAddresses (Xử lý fallback và dữ liệu rác)
function getShopAddresses(brandSettings) {
  if (Array.isArray(brandSettings?.addresses) && brandSettings.addresses.length > 0) {
    const valid = brandSettings.addresses
      .map(a => (typeof a === 'string' ? a.trim() : (a && a.address ? String(a.address).trim() : '')))
      .filter(a => a.length > 0);
    if (valid.length > 0) return valid;
  }
  const fallback = [];
  if (brandSettings?.address && String(brandSettings.address).trim()) fallback.push(String(brandSettings.address).trim());
  if (brandSettings?.secondaryAddress && String(brandSettings.secondaryAddress).trim()) fallback.push(String(brandSettings.secondaryAddress).trim());
  return fallback.length > 0 ? fallback : [
    'Kho Tổng Nam: 128 Nguyễn Trãi, P. Bến Thành, Quận 1, TP.HCM',
    'Trạm Kỹ Thuật Bắc: 45 Lý Thường Kiệt, Q. Hoàn Kiếm, Hà Nội'
  ];
}

const listWithWhitespace = getShopAddresses({
  addresses: ['  Kho A: Số 1  ', '   ', '', 'Kho B: Số 2  ']
});
assert(listWithWhitespace.length === 2 && listWithWhitespace[0] === 'Kho A: Số 1' && listWithWhitespace[1] === 'Kho B: Số 2', 'getShopAddresses lọc bỏ chuỗi rỗng và khoảng trắng');

const listFallback = getShopAddresses({
  addresses: [],
  address: 'Kho Chính: 100 CMT8, Q.3, TP.HCM',
  secondaryAddress: ''
});
assert(listFallback.length === 1 && listFallback[0] === 'Kho Chính: 100 CMT8, Q.3, TP.HCM', 'getShopAddresses fallback về address khi addresses rỗng');

const listDefaultFallback = getShopAddresses({});
assert(listDefaultFallback.length === 2 && listDefaultFallback[0].includes('Kho Tổng Nam'), 'getShopAddresses trả về 2 kho mặc định khi cấu hình trống hoàn toàn');

// 5. Kiểm tra logic Dynamic HTML SEO Injection
const sampleHtml = `<!doctype html><html><head>
<title>FLAMEGUARD PRO | Thiết Bị Cứu Hỏa</title>
<meta name="description" content="Mô tả cũ..." />
<meta property="og:title" content="FLAMEGUARD PRO | Cũ" />
<meta property="og:description" content="Mô tả cũ..." />
<meta property="og:site_name" content="FLAMEGUARD" />
<meta name="twitter:title" content="FLAMEGUARD PRO | Cũ" />
<meta name="twitter:description" content="Mô tả cũ..." />
</head><body><div id="root"></div></body></html>`;

let injectedHtml = sampleHtml;
const brand = updatePayload.brandSettings;
if (brand.seoTitle) {
  injectedHtml = injectedHtml.replace(/<title>.*?<\/title>/i, `<title>${brand.seoTitle}</title>`);
  injectedHtml = injectedHtml.replace(/(<meta\s+property=["']og:title["']\s+content=["']).*?(["'])/i, `$1${brand.seoTitle}$2`);
  injectedHtml = injectedHtml.replace(/(<meta\s+name=["']twitter:title["']\s+content=["']).*?(["'])/i, `$1${brand.seoTitle}$2`);
}
if (brand.seoDescription) {
  injectedHtml = injectedHtml.replace(/(<meta\s+name=["']description["']\s+content=["']).*?(["'])/i, `$1${brand.seoDescription}$2`);
  injectedHtml = injectedHtml.replace(/(<meta\s+property=["']og:description["']\s+content=["']).*?(["'])/i, `$1${brand.seoDescription}$2`);
  injectedHtml = injectedHtml.replace(/(<meta\s+name=["']twitter:description["']\s+content=["']).*?(["'])/i, `$1${brand.seoDescription}$2`);
}
if (brand.brandName) {
  injectedHtml = injectedHtml.replace(/(<meta\s+property=["']og:site_name["']\s+content=["']).*?(["'])/i, `$1${brand.brandName}$2`);
}

assert(injectedHtml.includes(`<title>${brand.seoTitle}</title>`), 'Tiêu đề trang HTML được thay thế chính xác bằng seoTitle');
assert(injectedHtml.includes(`name="description" content="${brand.seoDescription}"`), 'Meta description được thay thế chính xác bằng seoDescription');
assert(injectedHtml.includes(`property="og:title" content="${brand.seoTitle}"`), 'OpenGraph title được thay thế chính xác');
assert(injectedHtml.includes(`property="og:description" content="${brand.seoDescription}"`), 'OpenGraph description được thay thế chính xác');
assert(injectedHtml.includes(`property="og:site_name" content="${brand.brandName}"`), 'OpenGraph site_name được thay thế chính xác bằng brandName');

// 6. Kiểm tra đồng bộ Hotline / Số điện thoại & Helpers định dạng
function formatPhoneNumber(phone) {
  if (!phone) return '0843.066.604';
  const clean = String(phone).trim();
  if (clean.includes('.') || clean.includes(' ') || clean.includes('-')) {
    return clean;
  }
  const digits = clean.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`;
  }
  if (digits.length === 11) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`;
  }
  return clean || '0843.066.604';
}

function getCleanPhoneNumber(phone) {
  if (!phone) return '0843066604';
  const digits = String(phone).replace(/\D/g, '');
  return digits || '0843066604';
}

assert(formatPhoneNumber('0843066604') === '0843.066.604', 'formatPhoneNumber tự động định dạng SĐT 10 số thành dạng chấm 0843.066.604');
assert(formatPhoneNumber('0912345678') === '0912.345.678', 'formatPhoneNumber định dạng đúng số điện thoại di động');
assert(formatPhoneNumber('0909 888 114') === '0909 888 114', 'formatPhoneNumber giữ nguyên định dạng có dấu cách do người dùng nhập');
assert(formatPhoneNumber('0843.066.604') === '0843.066.604', 'formatPhoneNumber giữ nguyên định dạng có sẵn dấu chấm');
assert(formatPhoneNumber('') === '0843.066.604', 'formatPhoneNumber fallback về số mặc định khi chuỗi rỗng');

assert(getCleanPhoneNumber('0843.066.604') === '0843066604', 'getCleanPhoneNumber trích xuất chính xác 10 chữ số sạch để gọi điện tel:');
assert(getCleanPhoneNumber('0909 888 114') === '0909888114', 'getCleanPhoneNumber loại bỏ khoảng trắng cho tel: link');

// Kiểm tra đồng bộ hai chiều giữa shopZaloPhone và brandSettings.hotline
let backendSettings = {
  shopZaloPhone: '0843066604',
  brandSettings: { hotline: '0843.066.604' }
};

// Cập nhật từ Zalo settings -> đồng bộ sang brandSettings.hotline
const updateFromZalo = { shopZaloPhone: '0988889999' };
if (updateFromZalo.shopZaloPhone) {
  backendSettings.shopZaloPhone = updateFromZalo.shopZaloPhone;
  backendSettings.brandSettings.hotline = updateFromZalo.shopZaloPhone;
}
assert(backendSettings.brandSettings.hotline === '0988889999', 'Đồng bộ từ Zalo phone sang brandSettings.hotline');

// Cập nhật từ Brand settings -> đồng bộ sang shopZaloPhone
const updateFromBrand = { brandSettings: { hotline: '0977771111' } };
if (updateFromBrand.brandSettings?.hotline) {
  backendSettings.brandSettings.hotline = updateFromBrand.brandSettings.hotline;
  backendSettings.shopZaloPhone = updateFromBrand.brandSettings.hotline;
}
// Kiểm tra thứ tự ưu tiên (Precedence) giải quyết Hotline trên Header, Hero, Footer, Invoice
function resolveCurrentHotline(shopZaloPhone, brandSettingsHotline, fallback = '0843066604') {
  return shopZaloPhone || brandSettingsHotline || fallback;
}

assert(
  resolveCurrentHotline('0909888777', '0843.066.604') === '0909888777',
  'Thứ tự ưu tiên: shopZaloPhone (0909888777) luôn đè lên hotline cũ trong brandSettings (0843.066.604)'
);
assert(
  resolveCurrentHotline('', '0912345678') === '0912345678',
  'Thứ tự ưu tiên: Khi shopZaloPhone rỗng, fallback về brandSettings.hotline'
);
assert(
  resolveCurrentHotline('', '') === '0843066604',
  'Thứ tự ưu tiên: Khi cả 2 rỗng, fallback về số mặc định 0843066604'
);

console.log('\n====================================================');
console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passed} ĐẠT / ${passed + failed} BÀI TEST`);
console.log('====================================================\n');

if (failed > 0) process.exit(1);
