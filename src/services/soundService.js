// src/services/soundService.js
// Web Audio API Synthesizer: Tạo âm thanh chuông báo tinh tế trực tiếp bằng code, không cần tải file ngoài

let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

/**
 * Phát âm thanh chuông báo đơn hàng mới "Botanical Crystal Chime"
 * Giai điệu 3 nốt thánh thót: D5 (587Hz) -> F#5 (739Hz) -> A5 (880Hz)
 */
export const playNewOrderChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 587.33, start: 0, duration: 0.35, gain: 0.25 },   // D5
      { freq: 739.99, start: 0.12, duration: 0.45, gain: 0.28 }, // F#5
      { freq: 880.00, start: 0.26, duration: 0.75, gain: 0.35 }, // A5
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Dạng sóng Sine êm ái kết hợp Triangle ấm áp
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      // Envelope: Tăng nhanh và tắt dần mượt mà
      gain.gain.setValueAtTime(0.001, now + n.start);
      gain.gain.exponentialRampToValueAtTime(n.gain, now + n.start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.start);
      osc.stop(now + n.start + n.duration + 0.05);
    });
  } catch (err) {
    console.warn('Audio Synthesis Notice:', err.message);
  }
};

/**
 * Phát âm thanh chuông thử nghiệm cho Admin
 */
export const playTestChime = () => {
  playNewOrderChime();
};
