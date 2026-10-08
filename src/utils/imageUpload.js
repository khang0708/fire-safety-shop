// Chuẩn bị ảnh để tải lên máy chủ: thu nhỏ về chiều rộng hợp lý và nén JPEG ngay trên trình duyệt,
// để ảnh chụp điện thoại vài MB vẫn tải lên nhanh và không vượt giới hạn của máy chủ.

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const MAX_OUTPUT_DATAURL_CHARS = 3.6 * 1024 * 1024; // ≈ 2.7MB nhị phân, dưới giới hạn 3MB của máy chủ

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không đọc được ảnh này. Hãy thử ảnh JPG, PNG hoặc WEBP khác.'));
    };
    img.src = url;
  });

export const fileToUploadDataUrl = async (file, { maxWidth = 1600 } = {}) => {
  if (!file) throw new Error('Chưa chọn ảnh.');
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Chỉ nhận ảnh JPG, PNG hoặc WEBP.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Ảnh quá lớn (tối đa 20MB). Hãy chọn ảnh nhỏ hơn.');
  }

  const img = await loadImage(file);
  const attempts = [
    { width: maxWidth, quality: 0.85 },
    { width: Math.round(maxWidth * 0.75), quality: 0.78 },
    { width: Math.round(maxWidth * 0.5), quality: 0.7 }
  ];

  for (const { width, quality } of attempts) {
    const scale = Math.min(1, width / img.naturalWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    // Nền trắng để ảnh PNG trong suốt không bị chuyển thành nền đen khi nén sang JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length <= MAX_OUTPUT_DATAURL_CHARS) return dataUrl;
  }
  throw new Error('Ảnh vẫn quá nặng sau khi nén. Hãy chọn ảnh có kích thước nhỏ hơn.');
};

// Ảnh chia sẻ mạng xã hội (og:image): đặt nguyên ảnh vào khung 1200x630 nền trắng, không cắt/méo,
// vì Zalo/Facebook sẽ cắt ảnh không đúng tỉ lệ 1.91:1.
export const fileToOgImageDataUrl = async (file) => {
  if (!file) throw new Error('Chưa chọn ảnh.');
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) throw new Error('Chỉ nhận ảnh JPG, PNG hoặc WEBP.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('Ảnh quá lớn (tối đa 20MB). Hãy chọn ảnh nhỏ hơn.');

  const img = await loadImage(file);
  const W = 1200;
  const H = 630;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight);
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  ctx.drawImage(img, Math.round((W - w) / 2), Math.round((H - h) / 2), w, h);
  return canvas.toDataURL('image/jpeg', 0.88);
};
