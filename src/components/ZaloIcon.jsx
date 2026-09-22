import React from 'react';

/**
 * ZaloIcon - Icon ứng dụng Zalo chuẩn với nhận diện thương hiệu đặc trưng
 */
export const ZaloIcon = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect width="24" height="24" rx="6" fill="#0068FF" />
    <path
      d="M7 6.5H17L10.2 16.5H17.2V18.5H6.8L13.8 8.5H7V6.5Z"
      fill="white"
    />
  </svg>
);

export default ZaloIcon;
