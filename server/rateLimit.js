// server/rateLimit.js
// Giới hạn tần suất theo khoá (mặc định theo IP) bằng bộ nhớ tiến trình. Đủ cho một instance sau Nginx.
// Lưu ý: req.ip chỉ đáng tin khi đã đặt app.set('trust proxy', ...) đúng với số lớp proxy phía trước.

export const createRateLimiter = ({
  windowMs,
  max,
  keyFn = (req) => req.ip,
  message = 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.'
}) => {
  const hits = new Map(); // key -> { count, resetAt }

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, Math.max(windowMs, 60 * 1000));
  sweep.unref?.();

  const middleware = (req, res, next) => {
    const key = keyFn(req) || 'unknown';
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ success: false, error: 'RATE_LIMITED', message, retryAfterSeconds: retryAfter });
    }
    return next();
  };

  middleware.reset = () => hits.clear();
  return middleware;
};
