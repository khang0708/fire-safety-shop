import React from 'react';
import { SVG_ICON_PREFIX } from '../utils/categories';

// Biểu tượng danh mục: là emoji (hiện nguyên văn) hoặc "svg:<khóa>" (thiết bị cứu nạn vẽ sẵn, hiển thị giống nhau trên mọi thiết bị).
// Nét vẽ dùng currentColor nên tự theo màu chữ xung quanh.

const SHAPES = {
  ladder: (
    <>
      <path d="M7 2v20M17 2v20" />
      <path d="M7 6h10M7 10.5h10M7 15h10M7 19.5h10" />
    </>
  ),
  'rope-ladder': (
    <>
      <circle cx="7" cy="3" r="1.3" />
      <circle cx="17" cy="3" r="1.3" />
      <path d="M7 4.3c-1.3 4.7 1.3 11.3 0 17.2M17 4.3c1.3 4.7-1.3 11.3 0 17.2" />
      <path d="M7.1 8.5h9.8M6.9 13h10.2M7.1 17.5h9.8" />
    </>
  ),
  'gas-mask': (
    <>
      <path d="M5 10a7 7 0 0 1 14 0v3.5c0 3-2.5 5.5-7 5.5s-7-2.5-7-5.5z" />
      <circle cx="9" cy="10.5" r="2" />
      <circle cx="15" cy="10.5" r="2" />
      <rect x="9.5" y="16" width="5" height="5.5" rx="1.5" />
      <path d="M11 18.8h2" />
    </>
  ),
  helmet: (
    <>
      <path d="M4 15a8 8 0 0 1 16 0" />
      <path d="M2.5 15h19v3h-19z" />
      <path d="M12 7v8M8.5 8.8V15M15.5 8.8V15" />
    </>
  ),
  harness: (
    <>
      <circle cx="12" cy="4" r="2.2" />
      <path d="M8 8.5l8 7.5M16 8.5l-8 7.5" />
      <path d="M7 16.5h10" />
      <path d="M8 16.5v4a1.5 1.5 0 0 0 3 0v-4M13 16.5v4a1.5 1.5 0 0 0 3 0v-4" />
      <circle cx="12" cy="12.3" r="1" />
    </>
  ),
  'rescue-rope': (
    <>
      <circle cx="11" cy="11" r="8" />
      <circle cx="11" cy="11" r="5" />
      <circle cx="11" cy="11" r="2" />
      <path d="M16.7 16.7c2.3.3 4.3 2.3 4.8 5" />
    </>
  ),
  stretcher: (
    <>
      <rect x="4" y="8" width="16" height="7" rx="1.5" />
      <path d="M1.5 11.5H4M20 11.5h2.5" />
      <path d="M12 9.8v3.4M10.3 11.5h3.4" />
      <path d="M7 15v3.5M17 15v3.5" />
    </>
  ),
  'exit-sign': (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M5.5 12h7M9.5 9l3 3-3 3" />
      <path d="M16 8.5h3v7h-3z" />
    </>
  )
};

// Tên tiếng Việt để hiện dưới biểu tượng trong bảng chọn và cho trình đọc màn hình
export const SVG_ICON_LABELS = {
  ladder: 'Thang',
  'rope-ladder': 'Thang dây',
  'gas-mask': 'Mặt nạ phòng độc',
  helmet: 'Mũ bảo hộ',
  harness: 'Dây đai an toàn',
  'rescue-rope': 'Dây cứu hộ',
  stretcher: 'Cáng cứu thương',
  'exit-sign': 'Biển thoát hiểm'
};

export const isSvgIcon = (icon) => typeof icon === 'string' && icon.startsWith(SVG_ICON_PREFIX);

// Dùng cho chỗ chỉ nhận chữ thuần (ví dụ <option>): emoji giữ nguyên, biểu tượng SVG trả về chuỗi rỗng
export const categoryIconText = (icon) => (isSvgIcon(icon) ? '' : icon || '');

export const CategoryIcon = ({ icon, className = '' }) => {
  if (isSvgIcon(icon)) {
    const shape = SHAPES[icon.slice(SVG_ICON_PREFIX.length)];
    if (!shape) return null;
    return (
      <svg
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`inline-block align-[-0.125em] ${className}`}
        aria-hidden="true"
      >
        {shape}
      </svg>
    );
  }
  return <>{icon}</>;
};
