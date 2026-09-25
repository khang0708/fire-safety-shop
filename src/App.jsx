import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { ZaloMiniAppBanner } from './components/ZaloMiniAppBanner';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { OccasionFilter } from './components/OccasionFilter';
import { FlowerGrid } from './components/FlowerGrid';
import { SocialChatHubFloatingButton } from './components/SocialChatHubFloatingButton';
import { Footer } from './components/Footer';

// Code-splitting lazy load các thành phần nặng không cần tải ở màn hình ban đầu
const ReviewsSection = lazy(() => import('./components/ReviewsSection').then(m => ({ default: m.ReviewsSection })));
const ProductDetailModal = lazy(() => import('./components/ProductDetailModal').then(m => ({ default: m.ProductDetailModal })));
const CartDrawer = lazy(() => import('./components/CartDrawer').then(m => ({ default: m.CartDrawer })));
const CheckoutModal = lazy(() => import('./components/CheckoutModal').then(m => ({ default: m.CheckoutModal })));
const AIFloristModal = lazy(() => import('./components/AIFloristModal').then(m => ({ default: m.AIFloristModal })));
const OrderTrackingModal = lazy(() => import('./components/OrderTrackingModal').then(m => ({ default: m.OrderTrackingModal })));
const AdminLoginModal = lazy(() => import('./components/AdminLoginModal').then(m => ({ default: m.AdminLoginModal })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

function AppContent() {
  const { toastNotification, hideToast } = useShop();
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  
  // Tự động khôi phục tài khoản Admin đã đăng nhập
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const cached = localStorage.getItem('flameguard_admin_user');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  });

  const isAdminAuthenticated = Boolean(adminUser);

  // Lắng nghe URL Hash (#admin) hoặc phím tắt bảo mật
  useEffect(() => {
    const handleHashCheck = () => {
      if (window.location.hash === '#admin') {
        if (isAdminAuthenticated) {
          setIsAdminView(true);
        } else {
          setIsAdminLoginOpen(true);
        }
      }
    };

    const handleKeyDown = (e) => {
      // Phím tắt: Alt + Shift + A hoặc Ctrl + Shift + A
      if ((e.altKey || e.ctrlKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (isAdminAuthenticated) {
          setIsAdminView(true);
        } else {
          setIsAdminLoginOpen(true);
        }
      }
    };

    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', handleHashCheck);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdminAuthenticated]);

  const handleLoginSuccess = (userData) => {
    setAdminUser(userData);
    setIsAdminLoginOpen(false);
    setIsAdminView(true);
    window.location.hash = 'admin';
  };

  const handleExitAdmin = () => {
    setIsAdminView(false);
    window.location.hash = '';
  };

  const handleLogoutAdmin = () => {
    localStorage.removeItem('flameguard_admin_user');
    setAdminUser(null);
    setIsAdminView(false);
    window.location.hash = '';
  };

  if (isAdminView && isAdminAuthenticated) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white space-y-3">
          <div className="w-10 h-10 border-3 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <span className="font-sans font-bold text-lg text-slate-100 tracking-wide">Đang tải Trung Tâm Kiểm Định & Điều Phối PCCC FLAMEGUARD PRO...</span>
        </div>
      }>
        <AdminDashboard 
          adminUser={adminUser}
          onBackToStore={handleExitAdmin} 
          onLogout={handleLogoutAdmin}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-red-100 selection:text-red-700">
      {/* Banner Mô phỏng Zalo Mini App */}
      <ZaloMiniAppBanner />

      {/* Header Khách Hàng */}
      <Header />

      {/* Nội dung chính Storefront */}
      <main className="flex-grow">
        <HeroSection />
        <OccasionFilter />
        <FlowerGrid />
        <Suspense fallback={<div className="py-12 text-center text-xs text-gray-400">Đang tải đánh giá khách hàng...</div>}>
          <ReviewsSection />
        </Suspense>
      </main>

      {/* Floating Multi-Channel Social Chat Hub (Messenger + Zalo) */}
      <SocialChatHubFloatingButton />

      {/* Modals & Drawers */}
      <Suspense fallback={null}>
        <ProductDetailModal />
        <CartDrawer />
        <CheckoutModal />
        <AIFloristModal />
        <OrderTrackingModal />
        <AdminLoginModal
          isOpen={isAdminLoginOpen}
          onClose={() => {
            setIsAdminLoginOpen(false);
            if (window.location.hash === '#admin') window.location.hash = '';
          }}
          onLoginSuccess={handleLoginSuccess}
        />
      </Suspense>

      {/* Footer với link Cổng Nội Bộ kín đáo */}
      <Footer onOpenAdminLogin={() => setIsAdminLoginOpen(true)} />

      {/* Global Toast Notification (Thông báo sao chép nội dung Zalo) */}
      {toastNotification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[92%] sm:w-auto bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-red-500/40 backdrop-blur-md flex items-center gap-3 animate-fade-in text-xs sm:text-sm font-medium">
          <span className="text-xl shrink-0">📋</span>
          <span className="flex-1 leading-snug">{toastNotification}</span>
          <button 
            onClick={hideToast}
            className="text-slate-400 hover:text-white p-1 text-sm font-bold cursor-pointer transition-colors"
            aria-label="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ShopProvider>
      <AppContent />
    </ShopProvider>
  );
}
