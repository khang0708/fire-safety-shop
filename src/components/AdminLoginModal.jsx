import React, { useState } from 'react';
import { 
  KeyRound, 
  ShieldAlert, 
  ArrowLeft, 
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { authLoginApi } from '../api';
import { useShop } from '../context/ShopContext';

export const AdminLoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const { brandSettings } = useShop();
  const [authMode, setAuthMode] = useState('credentials'); // 'credentials' | 'pin'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // 1. Đăng nhập bằng Tài khoản & Mật khẩu thật (Server Scrypt & Timing-Safe Check)
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await authLoginApi({ username: username.trim(), password });
      if (res.success && res.token) {
        localStorage.setItem('flameguard_admin_token', res.token);
        localStorage.setItem('flameguard_admin_user', JSON.stringify(res.user));
        setIsLoading(false);
        window.dispatchEvent(new Event('flameguard:admin-login'));
        onLoginSuccess(res.user);
      } else {
        throw new Error(res.message || 'Đăng nhập không thành công');
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Lỗi kết nối máy chủ xác thực.');
    }
  };

  // 2. Đăng nhập bằng mã PIN bảo mật
  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await authLoginApi({ pin: pin.trim() });
      if (res.success && res.token) {
        localStorage.setItem('flameguard_admin_token', res.token);
        localStorage.setItem('flameguard_admin_user', JSON.stringify(res.user));
        setIsLoading(false);
        window.dispatchEvent(new Event('flameguard:admin-login'));
        onLoginSuccess(res.user);
      } else {
        throw new Error(res.message || 'Mã PIN không hợp lệ');
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Mã PIN không chính xác.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-fade-in text-slate-800">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-white p-6 text-center relative border-b border-red-900/50">
          {brandSettings?.logoUrl ? (
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-700 p-1 flex items-center justify-center mx-auto mb-3 shadow-inner overflow-hidden">
              <img
                src={brandSettings.logoUrl}
                alt={brandSettings?.brandName || 'Logo'}
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-red-500/50 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-red-400" />
            </div>
          )}
          <h3 className="font-heading text-xl font-bold tracking-tight">
            {brandSettings?.brandName ? `${brandSettings.brandName} Portal` : 'FLAMEGUARD Admin Portal'}
          </h3>
          <p className="text-[11px] text-red-300 mt-1">
            {brandSettings?.brandSlogan || 'Cổng điều hành & kiểm định kỹ thuật PCCC chuẩn BCA'}
          </p>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white text-base transition-all"
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setAuthMode('credentials'); setError(''); }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-1.5 transition-all ${
              authMode === 'credentials'
                ? 'bg-white text-red-600 border-b-2 border-red-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Tài khoản & Mật khẩu</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('pin'); setError(''); }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-1.5 transition-all ${
              authMode === 'pin'
                ? 'bg-white text-red-600 border-b-2 border-red-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Mã PIN Nhanh</span>
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 sm:p-7 space-y-4">

          {error && (
            <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs flex items-center gap-2 border border-red-200 animate-fade-in font-bold">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {authMode === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Tên đăng nhập / Email quản trị:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tên đăng nhập hoặc email quản trị..."
                  className="w-full text-sm py-2.5 px-3.5 rounded-xl border border-slate-300 focus:outline-none focus:border-red-600 bg-slate-50 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Mật khẩu truy cập:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu an toàn..."
                    className="w-full text-sm py-2.5 px-3.5 pr-10 rounded-xl border border-slate-300 focus:outline-none focus:border-red-600 bg-slate-50 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xác thực bảo mật...
                  </span>
                ) : (
                  'Đăng Nhập Cổng Quản Trị PCCC'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-red-600" />
                  Nhập mã PIN truy cập nhanh (6 - 10 số):
                </label>
                <input
                  type="password"
                  autoFocus
                  maxLength={10}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 px-4 rounded-xl border border-slate-300 focus:outline-none focus:border-red-600 bg-slate-50 font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !pin}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isLoading ? 'Đang kiểm tra mã PIN...' : 'Mở Bảng Điều Hành PCCC'}
              </button>
            </form>
          )}

          {/* Thông báo chuẩn bảo mật */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-500 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="leading-relaxed">
              Cổng quản trị được mã hóa bảo mật chuẩn quân sự. Tự động khóa đăng nhập sau 5 lần nhập sai.
            </p>
          </div>

          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Quay lại trang chủ thiết bị PCCC</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
