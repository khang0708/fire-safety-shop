/**
 * FLAMEGUARD PRO - Facebook Messenger Service
 * Tiện ích kết nối, mở liên kết m.me và xử lý tương tác qua Facebook Messenger
 */

/**
 * Chuẩn hóa Facebook Page ID hoặc Fanpage Username
 * Loại bỏ dấu @, khoảng trắng hoặc tiền tố m.me/ / facebook.com/
 */
export const cleanFacebookPageId = (rawInput) => {
  if (!rawInput) return 'flameguardpccc';
  return String(rawInput)
    .trim()
    .replace(/^https?:\/\/(www\.)?(facebook\.com|m\.me)\//i, '')
    .replace(/^@/, '')
    .replace(/\/.*$/, '')
    .trim();
};

/**
 * Tạo URL m.me chuẩn mở cuộc trò chuyện Messenger
 * @param {string} pageId - Fanpage ID hoặc Username
 * @param {string} [refOrText] - Tin nhắn mẫu hoặc tham số ref
 */
export const getMessengerUrl = (pageId, refOrText = '') => {
  const cleanId = cleanFacebookPageId(pageId);
  if (!refOrText) {
    return `https://m.me/${cleanId}`;
  }
  // Nếu là chuỗi text thông thường, encode param text
  return `https://m.me/${cleanId}?text=${encodeURIComponent(refOrText)}`;
};

/**
 * Mở trực tiếp cuộc trò chuyện Messenger trong tab mới hoặc App Messenger
 */
export const openFacebookMessenger = (pageId, message = '') => {
  const url = getMessengerUrl(pageId, message);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return url;
};

/**
 * Tạo link Messenger tư vấn thiết bị PCCC cụ thể
 */
export const generateMessengerProductInquiry = (pageId, product) => {
  if (!product) return openFacebookMessenger(pageId);
  const priceStr = Number(product.price || 0).toLocaleString('vi-VN');
  const message = `Chào FLAMEGUARD, tôi muốn tư vấn thiết bị "${product.name}" (giá: ${priceStr}đ). Nhờ kỹ sư gửi thêm thông số TCVN và ảnh tem kiểm định BCA giúp tôi nhé!`;
  return openFacebookMessenger(pageId, message);
};

/**
 * Tạo link Messenger tra cứu đơn hàng hoặc gửi yêu cầu kiểm định
 */
export const generateMessengerOrderInquiry = (pageId, orderCode) => {
  const code = orderCode || 'FG-XXXXX';
  const message = `Chào kỹ sư FLAMEGUARD, tôi muốn hỏi về tiến trình kiểm định áp suất đơn hàng #${code}. Cho tôi xem ảnh đồng hồ đo vạch xanh và tem BCA trước khi giao với ạ!`;
  return openFacebookMessenger(pageId, message);
};

/**
 * Tạo link Messenger gửi hồ sơ thẩm định AI PCCC đã phân tích
 */
export const generateMessengerAIInquiry = (pageId, analysisResult) => {
  const detected = analysisResult?.detectedRisks?.join(', ') || 'Khu vực có nguy cơ cháy';
  const standard = analysisResult?.applicableStandard || 'TCVN 3890:2023';
  const message = `Chào kỹ sư FLAMEGUARD, tôi vừa dùng AI Safety Inspector quét mặt bằng (Chuẩn: ${standard}, Nguy cơ: ${detected}). Nhờ kỹ sư xuất phương án bố trí thiết bị và báo giá giúp tôi nhé!`;
  return openFacebookMessenger(pageId, message);
};
