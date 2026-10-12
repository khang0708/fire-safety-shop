import { escapeHtml, jsonLdSafe, sanitizeHtml } from '../server/htmlSafe.js';

let failed = 0;
const assert = (cond, msg) => { console.log(`  ${cond ? '✅ [PASS]' : '❌ [FAIL]'} ${msg}`); if (!cond) failed++; };

console.log('🛡️ KIỂM THỬ CHỐNG XSS (htmlSafe)\n');

const bad = [
  '<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '<a href="javascript:alert(1)">x</a>',
  '<a href="jav&#x61;script:alert(1)">x</a>', '<a href="java\tscript:alert(1)">x</a>', '<iframe src="//evil"></iframe>',
  '<svg onload=alert(1)>', '<div style="background:url(javascript:alert(1))">x</div>', '<p onclick="x()">x</p>',
  '<img src="data:text/html;base64,PHNjcmlwdD4=">', '<scr<script>ipt>alert(1)</script>', '<style>*{}</style>'
];
for (const b of bad) {
  const out = sanitizeHtml(b);
  assert(!/<script|<iframe|<svg|<style|\son\w+=|javascript:|data:text/i.test(out), `Lọc được: ${b}  =>  ${out}`);
}

const good = '<h2>Tiêu đề</h2><p style="color: #b91c1c; margin: 0">Nội dung <strong>đậm</strong></p><table style="width: 100%"><tr><td colspan="2">ô</td></tr></table><a href="https://example.com" target="_blank">link</a><img src="/uploads/1.jpg" alt="a">';
const cleaned = sanitizeHtml(good);
assert(cleaned.includes('<h2>') && cleaned.includes('style="color: #b91c1c; margin: 0"') && cleaned.includes('colspan="2"'), 'Giữ nguyên định dạng hợp lệ');
assert(cleaned.includes('rel="noopener noreferrer"') && cleaned.includes('src="/uploads/1.jpg"'), 'Thêm rel cho target=_blank, giữ ảnh nội bộ');

assert(escapeHtml('"><script>') === '&quot;&gt;&lt;script&gt;', 'escapeHtml escape đủ ký tự');
assert(!jsonLdSafe({ a: '</script><script>alert(1)</script>' }).includes('<'), 'jsonLdSafe không còn ký tự "<"');
assert(JSON.parse(jsonLdSafe({ a: '</x>' })).a === '</x>', 'jsonLdSafe vẫn là JSON hợp lệ, giữ nguyên giá trị');

console.log(failed ? `\n❌ ${failed} test thất bại` : '\n✅ Tất cả đạt');
process.exit(failed ? 1 : 0);
