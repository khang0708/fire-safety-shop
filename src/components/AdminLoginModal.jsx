import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  ShieldAlert, 
  ArrowLeft, 
  CheckCircle2, 
  Send,
  ShieldCheck
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const AdminLoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const { telegramChatId } = useShop();
  const [authMode, setAuthMode] = useState('social'); // 'social' | 'pin'
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(null);

  if (!isOpen) return null;

  // 1. Đăng nhập Google
  const handleGoogleLogin = () => {
    setError('');
    setIsLoading(true);
    setLoadingProvider('google');

    setTimeout(() => {
      const googleAdminUser = {
        id: 'admin_google_01',
        name: 'Kỹ Sư Trưởng PCCC (Google)',
        email: 'admin.pccc@flameguard.vn',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        provider: 'google',
        role: 'CHIEF_INSPECTOR',
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('flameguard_admin_user', JSON.stringify(googleAdminUser));
      setIsLoading(false);
      setLoadingProvider(null);
      onLoginSuccess(googleAdminUser);
    }, 600);
  };

  // 2. Đăng nhập Facebook
  const handleFacebookLogin = () => {
    setError('');
    setIsLoading(true);
    setLoadingProvider('facebook');

    setTimeout(() => {
      const fbAdminUser = {
        id: 'admin_fb_02',
        name: 'Điều Phối Kho PCCC (Facebook)',
        email: 'dispatch@flameguard.vn',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        provider: 'facebook',
        role: 'DISPATCH_MANAGER',
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('flameguard_admin_user', JSON.stringify(fbAdminUser));
      setIsLoading(false);
      setLoadingProvider(null);
      onLoginSuccess(fbAdminUser);
    }, 600);
  };

  // 3. Đăng nhập Telegram
  const handleTelegramLogin = () => {
    setError('');
    setIsLoading(true);
    setLoadingProvider('telegram');

    const tgId = telegramChatId || localStorage.getItem('flameguard_tg_chat_id') || '5686726439';

    setTimeout(() => {
      const tgAdminUser = {
        id: `tg_${tgId}`,
        name: `Kỹ Sư Trực Trạm Telegram (#${tgId.slice(-4)})`,
        email: `telegram_${tgId}@flameguard.vn`,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
        provider: 'telegram',
        telegramChatId: tgId,
        role: 'TELEGRAM_INSPECTOR',
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('flameguard_admin_user', JSON.stringify(tgAdminUser));
      setIsLoading(false);
      setLoadingProvider(null);
      onLoginSuccess(tgAdminUser);
    }, 600);
  };

  // 4. Đăng nhập dự phòng bằng mã PIN
  const handlePinSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setLoadingProvider('pin');

    setTimeout(() => {
      if (pin === '1234' || pin === 'pccc2026' || pin === 'admin') {
        const pinAdminUser = {
          id: 'admin_pin_00',
          name: 'Kỹ Sư Kiểm Định Thiết Bị',
          email: 'inspector@flameguard.vn',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          provider: 'pin',
          role: 'INSPECTOR',
          loginTime: new Date().toISOString()
        };
        localStorage.setItem('flameguard_admin_user', JSON.stringify(pinAdminUser));
        setIsLoading(false);
        setLoadingProvider(null);
        onLoginSuccess(pinAdminUser);
      } else {
        setIsLoading(false);
        setLoadingProvider(null);
        setError('Mã PIN không chính xác. Mặc định: 1234 hoặc sử dụng Google / Facebook / Telegram.');
        setPin('');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-fade-in text-slate-800">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-white p-6 text-center relative border-b border-red-900/50">
          <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-red-500/50 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldCheck className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="font-heading text-xl font-bold">FLAMEGUARD Portal</h3>
          <p className="text-[11px] text-red-300 mt-1">Cổng điều hành & kiểm định kỹ thuật PCCC</p>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white text-base transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 sm:p-8 space-y-5">

          {error && (
            <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs flex items-center gap-2 border border-red-200 animate-fade-in font-bold">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {authMode === 'social' ? (
            <div className="space-y-3.5">
              
              <div className="text-center pb-1">
                <span className="text-xs font-bold text-slate-500">
                  Chọn phương thức xác thực kỹ sư:
                </span>
              </div>

              {/* 1. Nút Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs py-3.5 px-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 shadow-xs transition-all flex items-center justify-between active:scale-[0.98] disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span className="text-sm">Đăng nhập với Google</span>
                </div>
                {loadingProvider === 'google' ? (
                  <span className="text-[11px] text-red-600 font-bold animate-pulse">Đang kết nối...</span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-normal">OAuth 2.0</span>
                )}
              </button>

              {/* 2. Nút Facebook */}
              <button
                type="button"
                onClick={handleFacebookLogin}
                disabled={isLoading}
                className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-between active:scale-[0.98] disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-sm">Đăng nhập với Facebook</span>
                </div>
                {loadingProvider === 'facebook' ? (
                  <span className="text-[11px] text-blue-100 font-bold animate-pulse">Đang kết nối...</span>
                ) : (
                  <span className="text-[11px] text-blue-200 font-normal">Meta Connect</span>
                )}
              </button>

              {/* 3. Nút Telegram */}
              <button
                type="button"
                onClick={handleTelegramLogin}
                disabled={isLoading}
                className="w-full bg-[#24A1DE] hover:bg-[#1E88E5] text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-between active:scale-[0.98] disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <Send className="w-5 h-5" />
                  <span className="text-sm">Đăng nhập bằng Telegram Bot</span>
                </div>
                {loadingProvider === 'telegram' ? (
                  <span className="text-[11px] text-sky-100 font-bold animate-pulse">Đang kết nối...</span>
                ) : (
                  <span className="text-[11px] text-sky-200 font-normal">Instant Auth</span>
                )}
              </button>

              {/* Chuyển qua mã PIN dự phòng */}
              <div className="pt-4 border-t border-slate-200 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('pin')}
                  className="text-xs text-slate-500 hover:text-red-600 font-bold transition-colors flex items-center justify-center gap-1.5 mx-auto"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Hoặc đăng nhập bằng mã PIN nội bộ (1234)</span>
                </button>
              </div>

            </div>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-red-600" />
                  Nhập mã PIN truy cập kỹ sư kiểm định:
                </label>
                <input
                  type="password"
                  autoFocus
                  maxLength={10}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Nhập mã PIN (Mặc định: 1234)"
                  className="w-full text-center tracking-[0.3em] font-mono text-lg py-3 px-4 rounded-xl border border-slate-300 focus:outline-none focus:border-red-600 bg-slate-50 font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !pin}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {isLoading ? 'Đang xác thực...' : 'Mở Bảng Điều Hành PCCC'}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('social')}
                  className="text-xs text-[#0068FF] hover:underline font-bold"
                >
                  ← Trở lại đăng nhập bằng Google / Facebook / Telegram
                </button>
              </div>
            </form>
          )}

          <div className="pt-2 text-center">
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
