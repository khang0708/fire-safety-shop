import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('📱 Bắt đầu kiểm tra toàn diện Mobile UI/UX (Viewport: 390x844 iPhone 14)...');

  const outDir = path.join(process.cwd(), 'mobile_audit_screenshots');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    userDataDir: path.join(os.tmpdir(), 'chrome-mobile-' + Date.now()),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  const issues = [];

  const checkOverflow = async (screenName) => {
    const overflowData = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const elements = Array.from(document.querySelectorAll('*'));
      const overflowing = [];

      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        // Ignore floating chat or hidden
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

        if (rect.right > docWidth + 2) {
          overflowing.push({
            tag: el.tagName,
            className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '',
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            text: (el.innerText || el.textContent || '').trim().slice(0, 40)
          });
        }
      }
      return { docWidth, scrollWidth, isBodyOverflowing: scrollWidth > docWidth + 1, overflowing: overflowing.slice(0, 5) };
    });

    if (overflowData.isBodyOverflowing) {
      console.warn(`⚠️ [CẢNH BÁO OVERFLOW] Tại màn hình ${screenName}: docWidth=${overflowData.docWidth}, scrollWidth=${overflowData.scrollWidth}`);
      console.warn('Phần tử tràn viền:', overflowData.overflowing);
      issues.push({ screen: screenName, ...overflowData });
    } else {
      console.log(`✅ [OK] Màn hình ${screenName} không bị tràn ngang (docWidth=${overflowData.docWidth}).`);
    }
  };

  // 1. Home Page & Announcement
  console.log('1. Tải trang chủ FlameGuard Pro...');
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle2' });
  await delay(1200);
  await checkOverflow('Home Top / Header');
  await page.screenshot({ path: path.join(outDir, '01_mobile_home.png') });

  // Scroll down to Occasion & Catalog
  console.log('2. Kiểm tra bộ lọc & danh mục...');
  await page.evaluate(() => window.scrollBy(0, 600));
  await delay(500);
  await checkOverflow('Catalog Filter');
  await page.screenshot({ path: path.join(outDir, '02_mobile_catalog.png') });

  // Scroll down to Products & Testimonials & Footer
  console.log('3. Kiểm tra chân trang Footer...');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await delay(500);
  await checkOverflow('Footer');
  await page.screenshot({ path: path.join(outDir, '03_mobile_footer.png') });

  // 4. Mở Product Detail Modal
  console.log('4. Mở Modal Chi Tiết Thiết Bị...');
  await page.evaluate(() => {
    window.scrollTo(0, 800);
    const card = document.querySelector('[data-product-card], div.group.relative.flex.flex-col');
    if (card) card.click();
  });
  await delay(800);
  await checkOverflow('Product Detail Modal');
  await page.screenshot({ path: path.join(outDir, '04_mobile_product_detail.png') });

  // Đóng modal
  await page.keyboard.press('Escape');
  await delay(500);

  // 5. Mở Giỏ Hàng (Cart Drawer)
  console.log('5. Mở Cart Drawer...');
  await page.evaluate(() => {
    // Click add to cart or open cart button
    const cartBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label')?.includes('giỏ hàng') || b.innerHTML.includes('ShoppingBag') || b.querySelector('svg.lucide-shopping-bag'));
    if (cartBtn) cartBtn.click();
  });
  await delay(800);
  await checkOverflow('Cart Drawer');
  await page.screenshot({ path: path.join(outDir, '05_mobile_cart_drawer.png') });

  // 6. Mở Checkout Modal
  console.log('6. Mở Checkout Modal...');
  await page.evaluate(() => {
    const checkoutBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tiến Hành Đặt Hàng') || b.textContent.includes('Đặt Hàng'));
    if (checkoutBtn) checkoutBtn.click();
  });
  await delay(800);
  await checkOverflow('Checkout Modal');
  await page.screenshot({ path: path.join(outDir, '06_mobile_checkout.png') });

  await page.keyboard.press('Escape');
  await delay(500);

  // 7. Mở Tra cứu đơn hàng
  console.log('7. Mở Order Tracking Modal...');
  await page.evaluate(() => {
    const trackBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tra cứu') || b.textContent.includes('Đơn của tôi'));
    if (trackBtn) trackBtn.click();
  });
  await delay(800);
  await checkOverflow('Order Tracking Modal');
  await page.screenshot({ path: path.join(outDir, '07_mobile_order_tracking.png') });

  await page.keyboard.press('Escape');
  await delay(500);

  // 8. Mở AI Khảo sát an toàn PCCC
  console.log('8. Mở AI Khảo Sát Modal...');
  await page.evaluate(() => {
    const aiBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Khảo sát') || b.textContent.includes('AI'));
    if (aiBtn) aiBtn.click();
  });
  await delay(800);
  await checkOverflow('AI Survey Modal');
  await page.screenshot({ path: path.join(outDir, '08_mobile_ai_survey.png') });

  await page.keyboard.press('Escape');
  await delay(500);

  // 9. Mở Admin Dashboard
  console.log('9. Mở Admin Dashboard...');
  await page.evaluate(() => {
    localStorage.setItem('flora_admin_user', JSON.stringify({
      id: 'adm-01',
      name: 'Chỉ Huy Trưởng',
      role: 'admin',
      provider: 'pin'
    }));
  });
  await page.goto('http://localhost:4173/#admin', { waitUntil: 'networkidle2' });
  await delay(1200);
  await checkOverflow('Admin Dashboard (Mobile)');
  await page.screenshot({ path: path.join(outDir, '09_mobile_admin_dashboard.png') });

  // 10. Mở Admin Mobile Sidebar
  console.log('10. Mở Admin Mobile Sidebar...');
  await page.evaluate(() => {
    const menuBtn = document.querySelector('button[aria-label="Mở Menu Admin"]');
    if (menuBtn) menuBtn.click();
  });
  await delay(600);
  await checkOverflow('Admin Mobile Sidebar Opened');
  await page.screenshot({ path: path.join(outDir, '10_mobile_admin_sidebar.png') });

  await browser.close();

  console.log('\n📊 KẾT QUẢ KIỂM TRA MOBILE AUDIT:');
  if (issues.length === 0) {
    console.log('🎉 KHÔNG CÓ LỖI TRÀN VIỀN / OVERFLOW! Tất cả các màn hình đều vừa vặn hoàn hảo trên mobile.');
  } else {
    console.log(`⚠️ Phát hiện ${issues.length} màn hình có vấn đề cần xử lý:`);
    console.log(JSON.stringify(issues, null, 2));
  }
}

main().catch(err => {
  console.error('Lỗi khi chạy mobile audit:', err);
  process.exit(1);
});
