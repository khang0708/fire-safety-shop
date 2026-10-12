// server/htmlSafe.js
// Tiện ích chống chèn mã (XSS) dùng chung cho máy chủ và giao diện: không phụ thuộc thư viện nào.
//  - escapeHtml:     escape văn bản/thuộc tính HTML
//  - jsonLdSafe:     JSON an toàn để đặt trong <script type="application/ld+json">
//  - sanitizeHtml:   lọc HTML bài viết theo danh sách cho phép (thẻ, thuộc tính, URL, style)

export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// JSON.stringify không escape "</script>" nên phải thay các ký tự nguy hiểm bằng mã \u
export const jsonLdSafe = (obj) =>
  JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')

const ALLOWED_TAGS = new Set([
  'p', 'br', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins', 'sub', 'sup', 'small', 'mark',
  'blockquote', 'pre', 'code', 'hr', 'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col', 'font'
]);
const VOID_TAGS = new Set(['br', 'hr', 'img', 'col']);
// Thẻ bị xóa cùng toàn bộ nội dung bên trong
const DROP_WITH_CONTENT = 'script|style|iframe|frame|frameset|object|embed|applet|noscript|template|svg|math|textarea|title|head|xmp|plaintext|noembed|noframes|select|button|form|audio|video|canvas|link|meta|base';

const GLOBAL_ATTRS = new Set(['style', 'class', 'title', 'dir', 'lang']);
const TAG_ATTRS = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading']),
  td: new Set(['colspan', 'rowspan', 'align']),
  th: new Set(['colspan', 'rowspan', 'align']),
  col: new Set(['span', 'width']),
  colgroup: new Set(['span']),
  font: new Set(['color', 'size', 'face']),
  ol: new Set(['start', 'type'])
};
const URL_ATTRS = new Set(['href', 'src']);
const ALLOWED_SCHEMES = {
  href: new Set(['http', 'https', 'mailto', 'tel']),
  src: new Set(['http', 'https'])
};

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", colon: ':', tab: '\t', newline: '\n', nbsp: ' ' };
const decodeEntities = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);?/gi, (m, body) => {
    if (body[0] === '#') {
      const code = body[1].toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : '';
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named !== undefined ? named : m;
  });

// Ký tự điều khiển / khoảng trắng / ký tự vô hình mà trình duyệt bỏ qua khi đọc scheme của URL
const INVISIBLE_RE = new RegExp('[\\u0000-\\u0020\\u007f-\\u009f\\u200b-\\u200f\\u2028\\u2029\\ufeff]', 'g');

const isSafeUrl = (attr, raw) => {
  const url = decodeEntities(raw).replace(INVISIBLE_RE, '');
  if (!url) return false;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url);
  if (!scheme) return true; // đường dẫn tương đối: /uploads/x.jpg, #muc, ?a=1
  const name = scheme[1].toLowerCase();
  if (ALLOWED_SCHEMES[attr].has(name)) return true;
  return attr === 'src' && /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(url);
};

const isSafeStyle = (raw) => {
  const css = decodeEntities(raw).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\\/g, '\\\\');
  return !/(expression|url\s*\(|javascript|vbscript|@import|behavior|binding|image-set|[<>])/i.test(css) && !css.includes('\\\\');
};

const ATTR_RE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

const cleanAttributes = (tag, rawAttrs) => {
  const allowed = TAG_ATTRS[tag];
  const out = [];
  const seen = new Set();
  let linkTargetBlank = false;
  ATTR_RE.lastIndex = 0;
  let m;
  while ((m = ATTR_RE.exec(rawAttrs)) !== null) {
    const name = m[1].toLowerCase();
    if (seen.has(name) || name.startsWith('on')) continue;
    if (!GLOBAL_ATTRS.has(name) && !(allowed && allowed.has(name))) continue;
    const value = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
    if (URL_ATTRS.has(name) && !isSafeUrl(name, value)) continue;
    if (name === 'style' && !isSafeStyle(value)) continue;
    if (name === 'target') {
      if (value !== '_blank') continue;
      linkTargetBlank = true;
    }
    if (name === 'rel') continue; // rel được đặt lại bên dưới
    seen.add(name);
    out.push(`${name}="${escapeHtml(value)}"`);
  }
  if (tag === 'a' && linkTargetBlank) out.push('rel="noopener noreferrer"');
  return out.length ? ' ' + out.join(' ') : '';
};

const TAG_RE = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;

export const sanitizeHtml = (input) => {
  if (typeof input !== 'string' || !input) return '';

  let html = input;
  const dropRe = new RegExp(`<(${DROP_WITH_CONTENT})\\b[^>]*>[\\s\\S]*?<\\/\\1\\s*>`, 'gi');
  for (let prev; prev !== html;) {
    prev = html;
    html = html.replace(dropRe, '');
  }

  let result = '';
  let last = 0;
  TAG_RE.lastIndex = 0;
  let m;
  while ((m = TAG_RE.exec(html)) !== null) {
    result += html.slice(last, m.index).replace(/</g, '&lt;');
    last = TAG_RE.lastIndex;
    if (!m[1]) continue; // chú thích HTML -> bỏ
    const tag = m[1].toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) continue; // bỏ thẻ, giữ nội dung chữ bên trong
    if (m[0].startsWith('</')) {
      if (!VOID_TAGS.has(tag)) result += `</${tag}>`;
    } else {
      result += `<${tag}${cleanAttributes(tag, m[2])}>`;
    }
  }
  result += html.slice(last).replace(/</g, '&lt;');
  return result;
};
