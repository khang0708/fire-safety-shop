import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { ZaloMiniAppBanner } from './components/ZaloMiniAppBanner';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { OccasionFilter } from './components/OccasionFilter';
import { FlowerGrid } from './components/FlowerGrid';
import { HomeNewsSection } from './components/HomeNewsSection';
import { SocialChatHubFloatingButton } from './components/SocialChatHubFloatingButton';
import { Footer } from './components/Footer';

// Code-splitting lazy load các thành phần nặng không cần tải ở màn hình ban đầu
const ReviewsSection = lazy(() => import('./components/ReviewsSection').then(m => ({ default: m.ReviewsSection })));
const ProductDetailModal = lazy(() => import('./components/ProductDetailModal').then(m => ({ default: m.ProductDetailModal })));
const CartDrawer = lazy(() => import('./components/CartDrawer').then(m => ({ default: m.CartDrawer })));
const CheckoutModal = lazy(() => import('./components/CheckoutModal').then(m => ({ default: m.CheckoutModal })));
const AIFloristModal = lazy(() => import('./components/AIFloristModal').then(m => ({ default: m.AIFloristModal })));
const OrderTrackingModal = lazy(() => import('./components/OrderTrackingModal').then(m => ({ default: m.OrderTrackingModal })));
const ZaloInquiryModal = lazy(() => import('./components/ZaloInquiryModal').then(m => ({ default: m.ZaloInquiryModal })));
const AdminLoginModal = lazy(() => import('./components/AdminLoginModal').then(m => ({ default: m.AdminLoginModal })));
const NewsListPage = lazy(() => import('./components/NewsListPage').then(m => ({ default: m.NewsListPage })));
const NewsDetailPage = lazy(() => import('./components/NewsDetailPage').then(m => ({ default: m.NewsDetailPage })));
const ProductDetailPage = lazy(() => import('./components/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
import { authMeApi, authLogoutApi } from './api';

const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

function AppContent() {
  const { toastNotification, hideToast, currentPath = '/' } = useShop();
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  
  // Tự động khôi phục tài khoản Admin đã đăng nhập
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const cached = localStorage.getItem('flameguard_admin_user');
      const token = localStorage.getItem('flameguard_admin_token');
      if (cached && token) return JSON.parse(cached);
    } catch (_e) {}
    return null;
  });

  const isAdminAuthenticated = Boolean(adminUser);

  // Xác thực token với máy chủ khi tải trang
  useEffect(() => {
    const token = localStorage.getItem('flameguard_admin_token');
    if (token) {
      authMeApi()
        .then(res => {
          if (res.success && res.user) {
            setAdminUser(res.user);
          }
        })
        .catch(() => {
          localStorage.removeItem('flameguard_admin_token');
          localStorage.removeItem('flameguard_admin_user');
          setAdminUser(null);
          if (window.location.hash === '#admin') {
            setIsAdminLoginOpen(true);
          }
        });
    }
  }, []);

  // Lắng nghe sự kiện phiên làm việc hết hạn (401)
  useEffect(() => {
    const handleUnauthorized = () => {
      setAdminUser(null);
      setIsAdminView(prevView => {
        // Chỉ khi người dùng ĐANG ở giao diện Quản trị (Admin View) hoặc cố tình vào hash #admin
        // thì mới hiển thị modal đăng nhập lại. Tuyệt đối không bật modal với khách hàng ở storefront!
        if (prevView || window.location.hash === '#admin') {
          setIsAdminLoginOpen(true);
        } else {
          setIsAdminLoginOpen(false);
        }
        return false;
      });
    };
    window.addEventListener('flameguard:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('flameguard:unauthorized', handleUnauthorized);
  }, []);

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

  const handleLogoutAdmin = async () => {
    await authLogoutApi();
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

      {/* Nội dung chính Storefront & Routing Tin Tức */}
      <main className="flex-grow">
        {(() => {
          // 1. Kiểm tra Trang Chi Tiết Sản Phẩm (Dành cho SEO & Chạy Ads - Hỗ trợ cả Slug & ID)
          const isProductDetail = currentPath.startsWith('/san-pham/') && currentPath.replace(/^\/san-pham\/?/, '').trim().length > 0;
          let prodId = isProductDetail ? decodeURIComponent(currentPath.replace(/^\/san-pham\/?/, '').split('/')[0].split('?')[0]) : '';
          
          if (!prodId && typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const queryParam = urlParams.get('product') || urlParams.get('san-pham') || urlParams.get('p') || '';
            if (queryParam) prodId = decodeURIComponent(queryParam);
          }

          if (isProductDetail || prodId) {
            return (
              <Suspense fallback={<div className="py-24 text-center text-xs text-slate-400">Đang tải chi tiết thiết bị PCCC...</div>}>
                <ProductDetailPage productId={prodId} />
              </Suspense>
            );
          }

          // 2. Kiểm tra Trang Chi Tiết Tin Tức
          const isNewsDetail = currentPath.startsWith('/tin-tuc/') && currentPath.length > 9;
          const newsSlug = isNewsDetail ? currentPath.replace(/^\/tin-tuc\/?/, '').split('/')[0] : '';
          const isNewsList = currentPath === '/tin-tuc' || currentPath === '/tin-tuc/';

          if (isNewsDetail) {
            return (
              <Suspense fallback={<div className="py-24 text-center text-xs text-slate-400">Đang tải nội dung bài viết PCCC...</div>}>
                <NewsDetailPage slug={newsSlug} />
              </Suspense>
            );
          }

          if (isNewsList) {
            return (
              <Suspense fallback={<div className="py-24 text-center text-xs text-slate-400">Đang tải danh sách bài viết PCCC...</div>}>
                <NewsListPage />
              </Suspense>
            );
          }

          return (
            <>
              <HeroSection />
              <OccasionFilter />
              <FlowerGrid />
              <HomeNewsSection />
              <Suspense fallback={<div className="py-12 text-center text-xs text-gray-400">Đang tải đánh giá khách hàng...</div>}>
                <ReviewsSection />
              </Suspense>
            </>
          );
        })()}
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
        <ZaloInquiryModal />
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
