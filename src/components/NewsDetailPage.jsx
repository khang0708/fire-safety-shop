import React, { useMemo, useEffect, useState } from 'react';
import { useShop, formatPhoneNumber, getCleanPhoneNumber } from '../context/ShopContext';
import { 
  Calendar, 
  Clock, 
  Eye, 
  ChevronRight, 
  Share2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Flame, 
  ShoppingBag, 
  PhoneCall, 
  ArrowLeft,
  Tag,
  TrendingUp,
  MessageCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export const NewsDetailPage = ({ slug }) => {
  const { 
    articles = [], 
    products = [], 
    navigateTo, 
    showToast, 
    addToCart, 
    setQuickViewProduct,
    openZaloInquiry,
    brandSettings, 
    shopZaloPhone 
  } = useShop();

  const [copied, setCopied] = useState(false);

  const currentHotline = shopZaloPhone || brandSettings?.hotline || '0843066604';
  const cleanPhone = getCleanPhoneNumber(currentHotline);
  const formattedPhone = formatPhoneNumber(currentHotline);

  // Tìm bài viết hiện tại theo slug hoặc id
  const currentArticle = useMemo(() => {
    return articles.find(a => a.slug === slug || a.id === slug) || articles[0];
  }, [articles, slug]);

  // Cập nhật document title khi xem bài viết
  useEffect(() => {
    if (currentArticle?.title) {
      const brand = brandSettings?.brandName || 'FLAMEGUARD PRO';
      document.title = `${currentArticle.seoTitle || currentArticle.title} | ${brand}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentArticle, brandSettings]);

  // Tìm sản phẩm liên quan trong kho
  const relatedProduct = useMemo(() => {
    if (!currentArticle) return null;
    if (currentArticle.relatedProductId) {
      const found = products.find(p => p.id === currentArticle.relatedProductId);
      if (found) return found;
    }
    // Fallback tìm sản phẩm đầu tiên phù hợp
    return products[0] || null;
  }, [currentArticle, products]);

  // Bài viết liên quan (cùng chuyên mục hoặc mới nhất)
  const relatedArticles = useMemo(() => {
    if (!currentArticle) return [];
    return articles
      .filter(a => a.id !== currentArticle.id && (!a.status || a.status === 'published'))
      .sort((a, b) => (b.category === currentArticle.category ? 1 : 0) - (a.category === currentArticle.category ? 1 : 0))
      .slice(0, 3);
  }, [articles, currentArticle]);

  // Bài viết xem nhiều nhất (Trending Sidebar)
  const trendingArticles = useMemo(() => {
    return [...articles]
      .filter(a => !a.status || a.status === 'published')
      .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
      .slice(0, 4);
  }, [articles]);

  // Top 3 sản phẩm PCCC bán chạy cho sidebar
  const featuredProducts = useMemo(() => {
    return products.slice(0, 3);
  }, [products]);

  // Xử lý sao chép link
  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast('Đã sao chép liên kết bài viết vào bộ nhớ tạm!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Chia sẻ Facebook
  const handleShareFacebook = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = encodeURIComponent(window.location.href);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank', 'width=600,height=400');
    }
  };

  // Chia sẻ Zalo
  const handleShareZalo = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = encodeURIComponent(window.location.href);
      window.open(`https://sp.zalo.me/share?url=${shareUrl}`, '_blank', 'width=600,height=500');
    }
  };

  if (!currentArticle) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy bài viết</h2>
        <button 
          onClick={() => navigateTo('/tin-tuc')} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold"
        >
          Về trang tin tức
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* 1. Breadcrumbs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium overflow-x-auto scrollbar-none whitespace-nowrap" aria-label="Breadcrumb">
            <button 
              onClick={() => navigateTo('/')} 
              className="hover:text-red-600 transition-colors shrink-0 cursor-pointer"
            >
              Trang Chủ
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <button 
              onClick={() => navigateTo('/tin-tuc')} 
              className="hover:text-red-600 transition-colors shrink-0 cursor-pointer"
            >
              Tin Tức & Cẩm Nang
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500 shrink-0">{currentArticle.category}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-md">
              {currentArticle.title}
            </span>
          </nav>
        </div>
      </div>

      {/* 2. Layout Chi Tiết: Nội Dung Bài Viết (Cột Trái) & Sidebar Bán Chạy (Cột Phải) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CỘT CHÍNH: NỘI DUNG BÀI VIẾT (8 Cột trên Desktop) */}
          <main className="lg:col-span-8 bg-white rounded-2xl p-4 sm:p-8 shadow-xs border border-slate-200">
            
            {/* Header Bài Viết */}
            <header className="space-y-4 border-b border-slate-100 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-red-50 text-red-700 text-xs font-bold uppercase px-3 py-1 rounded-full border border-red-200">
                  {currentArticle.category}
                </span>
                {currentArticle.isFeatured && (
                  <span className="bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Bài Viết Nổi Bật</span>
                  </span>
                )}
              </div>

              {/* H1 Title Chuẩn SEO */}
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight font-heading">
                {currentArticle.title}
              </h1>

              {/* Meta Thông Tin Tác Giả & Thời Gian */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <img 
                    src={currentArticle.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} 
                    alt={currentArticle.author}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200" 
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">{currentArticle.author}</span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{new Date(currentArticle.publishedAt).toLocaleDateString('vi-VN')}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {currentArticle.readingTime || '5 phút đọc'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nút Chia Sẻ Mạng Xã Hội */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleShareFacebook}
                    className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                    title="Chia sẻ lên Facebook"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                  <button
                    onClick={handleShareZalo}
                    className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-bold text-xs cursor-pointer flex items-center justify-center w-8 h-8"
                    title="Chia sẻ qua Zalo"
                  >
                    Z
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Sao chép liên kết"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </header>

            {/* Sapo / Tóm Tắt Đầu Bài Viết */}
            {currentArticle.excerpt && (
              <div className="my-6 p-4 rounded-xl bg-slate-50 border-l-4 border-red-600 text-slate-700 text-xs sm:text-sm font-medium leading-relaxed italic">
                {currentArticle.excerpt}
              </div>
            )}

            {/* Ảnh Tiêu Điểm / Banner Bài Viết */}
            {currentArticle.thumbnail && (
              <figure className="my-6 rounded-2xl overflow-hidden shadow-xs border border-slate-200">
                <img 
                  src={currentArticle.thumbnail} 
                  alt={currentArticle.title}
                  className="w-full max-h-[460px] object-cover" 
                />
                <figcaption className="text-center text-[11px] text-slate-400 py-2 bg-slate-50 italic">
                  Hình ảnh: Kỹ sư kiểm định thực hiện đo áp kế và kiểm tra tem Cục Cảnh sát PCCC BCA.
                </figcaption>
              </figure>
            )}

            {/* Nội Dung Chi Tiết (Rich HTML Content) */}
            <div 
              className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed space-y-4
                prose-headings:font-heading prose-headings:font-bold prose-headings:text-slate-900
                prose-h2:text-lg prose-h2:sm:text-2xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-2
                prose-h3:text-base prose-h3:sm:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-red-700
                prose-p:leading-relaxed prose-p:my-3
                prose-ul:list-disc prose-ul:pl-5 prose-ul:my-3
                prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-3
                prose-li:my-1.5
                prose-blockquote:border-l-4 prose-blockquote:border-red-500 prose-blockquote:bg-red-50/50 prose-blockquote:p-4 prose-blockquote:rounded-r-xl prose-blockquote:italic
                prose-table:w-full prose-table:border-collapse prose-table:my-4
              "
              dangerouslySetInnerHTML={{ __html: currentArticle.content }}
            />

            {/* EMBEDDED PRODUCT CTA CARD: Thẻ Sản Phẩm Khuyên Dùng Trong Bài */}
            {relatedProduct && (
              <div className="my-10 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-red-50 via-white to-slate-50 border-2 border-red-200 shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-red-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                    Gợi Ý Trang Bị
                  </span>
                  <span className="text-xs font-bold text-slate-700">Thiết Bị PCCC Được Nhắc Đến Trong Bài Viết</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div 
                    className="w-32 h-32 sm:w-36 sm:h-36 rounded-xl overflow-hidden shrink-0 bg-white border border-slate-200 p-1 cursor-pointer group"
                    onClick={() => setQuickViewProduct(relatedProduct)}
                  >
                    <img 
                      src={relatedProduct.image} 
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform" 
                    />
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <h3 
                      onClick={() => setQuickViewProduct(relatedProduct)}
                      className="font-bold text-slate-900 text-sm sm:text-base hover:text-red-600 transition-colors cursor-pointer font-heading"
                    >
                      {relatedProduct.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {relatedProduct.meaning || relatedProduct.subtitle || 'Thiết bị đạt tem kiểm định Cục Cảnh sát PCCC & CNCH Bộ Công An.'}
                    </p>

                    <div className="flex items-baseline justify-center sm:justify-start gap-2 pt-1">
                      <span className="text-lg font-black text-red-600 font-mono">
                        {Number(relatedProduct.price).toLocaleString('vi-VN')}đ
                      </span>
                      {relatedProduct.originalPrice > relatedProduct.price && (
                        <span className="text-xs text-slate-400 line-through font-mono">
                          {Number(relatedProduct.originalPrice).toLocaleString('vi-VN')}đ
                        </span>
                      )}
                      <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                        Tem BCA
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                      <button
                        onClick={() => {
                          addToCart(relatedProduct);
                          showToast(`Đã thêm "${relatedProduct.name}" vào giỏ hàng!`);
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Thêm Vào Giỏ</span>
                      </button>

                      <button
                        onClick={() => openZaloInquiry(relatedProduct)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Tư Vấn Zalo</span>
                      </button>

                      <button
                        onClick={() => setQuickViewProduct(relatedProduct)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      >
                        Chi Tiết
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Focus Keywords / Tags SEO */}
            {currentArticle.seoKeywords && (
              <div className="pt-6 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Từ khóa chủ đề:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentArticle.seoKeywords.split(',').map((kw, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors"
                    >
                      #{kw.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Box Chứng Nhận Tác Quyền Kỹ Sư PCCC */}
            <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
              <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <strong className="text-slate-900 block">Kiểm duyệt nội dung chuyên môn:</strong>
                <span>Bài viết được biên soạn và kiểm chứng theo Quy chuẩn Kỹ thuật Quốc gia QCVN 06:2022/BXD và Tiêu chuẩn TCVN 3890:2023 bởi Kỹ sư An Toàn {brandSettings?.brandName || 'FLAMEGUARD PRO'}.</span>
              </div>
            </div>

            {/* Nút Quay Lại Danh Sách */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => navigateTo('/tin-tuc')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-red-600 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại trang tin tức</span>
              </button>

              <button
                onClick={() => navigateTo('/#catalog')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
              >
                <span>Xem danh mục thiết bị PCCC</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </main>

          {/* CỘT PHỤ (SIDEBAR): THIẾT BỊ BÁN CHẠY & HOTLINE CẤP BÁCH (4 Cột Desktop) */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* 1. Card Hotline 24/7 & Cứu Hộ Khẩn Cấp */}
            <div className="bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl p-6 shadow-md border border-red-500/50 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-200">
                  HOTLINE KIỂM ĐỊNH & CỨU HỘ
                </span>
              </div>

              <div>
                <span className="text-xs text-red-100 block">Hỗ trợ kỹ thuật & Báo giá sỉ:</span>
                <a 
                  href={`tel:${cleanPhone}`} 
                  className="text-2xl font-black font-mono tracking-tight text-white hover:text-amber-200 block mt-0.5"
                >
                  {formattedPhone}
                </a>
              </div>

              <p className="text-xs text-red-100 leading-relaxed">
                Giao hỏa tốc 60 phút nội thành. Đầy đủ tem kiểm định Bộ Công An & biên bản bàn giao nghiệm thu.
              </p>

              <div className="pt-2 flex gap-2">
                <a
                  href={`tel:${cleanPhone}`}
                  className="flex-1 py-2.5 bg-white text-red-700 hover:bg-red-50 rounded-xl text-center font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Gọi Ngay</span>
                </a>
                <button
                  onClick={() => navigateTo('/#catalog')}
                  className="flex-1 py-2.5 bg-red-900/60 hover:bg-red-900/90 text-white border border-red-400/30 rounded-xl text-center font-bold text-xs transition-all cursor-pointer"
                >
                  <span>Xem Bảng Giá</span>
                </button>
              </div>
            </div>

            {/* 2. Top Thiết Bị PCCC Bán Chạy (Chuẩn TCVN 3890) */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 font-heading">
                  <Flame className="w-4 h-4 text-red-600" />
                  <span>Thiết Bị PCCC Khuyên Dùng</span>
                </h3>
                <button 
                  onClick={() => navigateTo('/#catalog')}
                  className="text-[11px] text-red-600 font-bold hover:underline cursor-pointer"
                >
                  Tất cả →
                </button>
              </div>

              <div className="space-y-3.5">
                {featuredProducts.map((prod) => (
                  <div 
                    key={prod.id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer border border-transparent hover:border-slate-200"
                    onClick={() => setQuickViewProduct(prod)}
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-white border border-slate-100 p-0.5">
                      <img 
                        src={prod.image} 
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-800 group-hover:text-red-600 transition-colors line-clamp-2">
                        {prod.name}
                      </h4>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-xs font-black text-red-600 font-mono">
                          {Number(prod.price).toLocaleString('vi-VN')}đ
                        </span>
                        {prod.originalPrice > prod.price && (
                          <span className="text-[10px] text-slate-400 line-through font-mono">
                            {Number(prod.originalPrice).toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Bài Viết Đọc Nhiều Nhất (Trending) */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 font-heading">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <span>Bài Viết Đọc Nhiều Nhất</span>
                </h3>
              </div>

              <div className="space-y-3">
                {trendingArticles.map((art, idx) => (
                  <div 
                    key={art.id}
                    onClick={() => navigateTo(`/tin-tuc/${art.slug}`)}
                    className="flex items-start gap-3 group cursor-pointer py-1.5"
                  >
                    <span className="font-mono font-black text-base text-slate-300 group-hover:text-red-600 w-5 shrink-0 transition-colors">
                      0{idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                        {art.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        👁️ {art.viewsCount?.toLocaleString('vi-VN') || 0} lượt xem
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </aside>
        </div>

        {/* 3. Các Bài Viết Cùng Chuyên Mục (Bottom Related Articles) */}
        {relatedArticles.length > 0 && (
          <div className="mt-14 pt-8 border-t border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                  Bài Viết Liên Quan Cùng Chủ Đề
                </h3>
                <p className="text-xs text-slate-500">
                  Kiến thức an toàn PCCC hữu ích dành cho bạn
                </p>
              </div>

              <button
                onClick={() => navigateTo('/tin-tuc')}
                className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
              >
                Xem tất cả bài viết →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((article) => (
                <div 
                  key={article.id}
                  onClick={() => navigateTo(`/tin-tuc/${article.slug}`)}
                  className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md border border-slate-200 transition-all group cursor-pointer flex flex-col"
                >
                  <div className="h-40 overflow-hidden relative">
                    <img 
                      src={article.thumbnail} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {article.category}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h4>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span>{article.author}</span>
                      <span>{article.readingTime || '4 phút'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
