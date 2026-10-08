import React, { useState, useMemo } from 'react';
import { useShop, formatPhoneNumber, getCleanPhoneNumber } from '../context/ShopContext';
import { ARTICLE_CATEGORIES } from '../data/articles';
import { 
  Search, 
  Calendar, 
  Clock, 
  Eye, 
  ArrowRight, 
  BookOpen, 
  Flame, 
  ShieldCheck, 
  ChevronRight,
  PhoneCall,
  Sparkles
} from 'lucide-react';

export const NewsListPage = () => {
  const { articles = [], navigateTo, brandSettings, shopZaloPhone } = useShop();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const currentHotline = shopZaloPhone || brandSettings?.hotline || '0843066604';
  const cleanPhone = getCleanPhoneNumber(currentHotline);
  const formattedPhone = formatPhoneNumber(currentHotline);

  // Lọc chỉ lấy bài đã xuất bản
  const publishedArticles = useMemo(() => {
    return articles.filter(a => !a.status || a.status === 'published');
  }, [articles]);

  // Lọc theo chuyên mục và từ khóa tìm kiếm
  const filteredArticles = useMemo(() => {
    return publishedArticles.filter(a => {
      const matchCat = selectedCategory === 'all' || a.category === selectedCategory;
      const matchSearch = !searchQuery.trim() || 
        a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.seoKeywords?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [publishedArticles, selectedCategory, searchQuery]);

  // Bài viết nổi bật (Featured)
  const featuredArticle = useMemo(() => {
    return publishedArticles.find(a => a.isFeatured) || publishedArticles[0];
  }, [publishedArticles]);

  // Danh sách các bài còn lại
  const regularArticles = useMemo(() => {
    if (!featuredArticle || searchQuery.trim() || selectedCategory !== 'all') {
      return filteredArticles;
    }
    return filteredArticles.filter(a => a.id !== featuredArticle.id);
  }, [filteredArticles, featuredArticle, searchQuery, selectedCategory]);

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* 1. Breadcrumbs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium" aria-label="Breadcrumb">
            <button 
              onClick={() => navigateTo('/')} 
              className="hover:text-red-600 transition-colors cursor-pointer"
            >
              Trang Chủ
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">Cẩm Nang & Tin Tức PCCC</span>
          </nav>
        </div>
      </div>

      {/* 2. Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-[#1E293B] to-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 shadow-inner border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-600/30 text-red-400 border border-red-500/40">
              <Flame className="w-3.5 h-3.5 text-red-500" />
              <span>CẨM NANG & KIẾN THỨC PCCC CHUẨN BỘ CÔNG AN</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-heading">
              Tin Tức, Quy Chuẩn & Kỹ Năng Thoát Hiểm
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Cập nhật thông tư PCCC mới nhất, cẩm nang kiểm tra bình chữa cháy định kỳ chuẩn TCVN 3890:2023 và kỹ năng sinh tồn trong hỏa hoạn nhà cao tầng.
            </p>
          </div>

          {/* Hộp Tìm Kiếm Bài Viết */}
          <div className="w-full md:w-80 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài viết (Bình bột, CO2, TCVN...)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 text-white placeholder-slate-400 text-xs border border-slate-700 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-sans"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Pills */}
      <div className="bg-white border-b border-slate-200 sticky top-14 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 overflow-x-auto scrollbar-none flex items-center gap-2">
          {ARTICLE_CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Nội Dung Chính */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Bài viết nổi bật (Hero Highlight Card) - Chỉ hiển thị khi đang ở tab Tất cả và không tìm kiếm */}
        {featuredArticle && !searchQuery && selectedCategory === 'all' && (
          <div className="mb-10 bg-white rounded-2xl overflow-hidden shadow-md border border-slate-200 hover:shadow-xl transition-all group">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              <div 
                className="lg:col-span-7 h-64 sm:h-80 lg:h-96 overflow-hidden relative bg-slate-100 cursor-pointer"
                onClick={() => navigateTo(`/tin-tuc/${featuredArticle.slug}`)}
              >
                <img 
                  src={featuredArticle.thumbnail} 
                  alt={featuredArticle.title}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-4 left-4 bg-red-600 text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>TIÊU ĐIỂM PCCC</span>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="bg-red-50 text-red-700 px-2.5 py-0.5 rounded-md font-bold border border-red-200">
                      {featuredArticle.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {featuredArticle.readingTime || '5 phút đọc'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      {featuredArticle.viewsCount?.toLocaleString('vi-VN') || 0}
                    </span>
                  </div>

                  <h2 
                    onClick={() => navigateTo(`/tin-tuc/${featuredArticle.slug}`)}
                    className="text-lg sm:text-2xl font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 cursor-pointer font-heading"
                  >
                    {featuredArticle.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {featuredArticle.excerpt}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={featuredArticle.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} 
                      alt={featuredArticle.author}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200" 
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{featuredArticle.author}</span>
                      <span className="text-[10px] text-slate-400 block">Kỹ sư kiểm định PCCC</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigateTo(`/tin-tuc/${featuredArticle.slug}`)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 group/btn cursor-pointer"
                  >
                    <span>Đọc bài viết</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lưới danh sách bài viết (Articles Grid) */}
        {regularArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularArticles.map((article) => (
              <article 
                key={article.id}
                onClick={() => navigateTo(`/tin-tuc/${article.slug}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-xl border border-slate-200/80 transition-all duration-300 flex flex-col group cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="h-48 overflow-hidden relative bg-slate-100">
                  <img 
                    src={article.thumbnail} 
                    alt={article.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                    {article.category}
                  </div>
                  {article.isFeatured && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      Hot
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.readingTime || '4 phút'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.viewsCount?.toLocaleString('vi-VN') || 0}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-red-600 transition-colors line-clamp-2 leading-snug font-heading">
                      {article.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>

                  {/* Footer Author & Link */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium truncate max-w-[150px]">
                      {article.author}
                    </span>
                    <span className="text-red-600 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Xem tiếp →
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4 max-w-md mx-auto my-12">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">Không tìm thấy bài viết phù hợp</h3>
            <p className="text-xs text-slate-500">
              Vui lòng thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục bài viết khác.
            </p>
            <button
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all cursor-pointer"
            >
              Xem tất cả bài viết
            </button>
          </div>
        )}

        {/* 5. Banner Kêu Gọi Hành Động (CTA Hotline & Zalo PCCC) */}
        <div className="mt-14 bg-gradient-to-r from-red-600 via-red-700 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-red-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>ĐƠN VỊ CUNG CẤP THIẾT BỊ PCCC CHUẨN KIỂM ĐỊNH BCA</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-heading">
              Cần Tư Vấn Trang Bị PCCC Theo Tiêu Chuẩn TCVN 3890?
            </h3>
            <p className="text-xs sm:text-sm text-red-100 max-w-xl">
              Đội ngũ kỹ sư kiểm định {brandSettings?.brandName || 'FLAMEGUARD PRO'} sẵn sàng khảo sát, đề xuất phương án bình chữa cháy, mặt nạ chống khói và dây thoát hiểm phù hợp nhất cho công trình của bạn.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <a
              href={`tel:${cleanPhone}`}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-red-700 hover:bg-red-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <PhoneCall className="w-4 h-4 text-red-600" />
              <span>Hotline 24/7: {formattedPhone}</span>
            </a>
            <button
              onClick={() => navigateTo('/#catalog')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-red-900/60 hover:bg-red-900/90 text-white border border-red-400/40 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Xem Bảng Giá Thiết Bị →</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
