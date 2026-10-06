import React, { useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  BookOpen, 
  ArrowRight, 
  Clock, 
  Eye, 
  ShieldCheck, 
  ChevronRight,
  Flame,
  Tag
} from 'lucide-react';

export const HomeNewsSection = () => {
  const { articles = [], navigateTo, brandSettings } = useShop();

  // Lọc chỉ lấy bài đã xuất bản
  const publishedArticles = useMemo(() => {
    return articles.filter(a => !a.status || a.status === 'published');
  }, [articles]);

  // Ưu tiên bài viết nổi bật và lấy tối đa 3 bài viết tiêu biểu
  const displayArticles = useMemo(() => {
    const sorted = [...publishedArticles].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
    return sorted.slice(0, 3);
  }, [publishedArticles]);

  // Nếu chưa có bài viết nào, không render để tránh chiếm khoảng trống
  if (displayArticles.length === 0) return null;

  return (
    <section id="home-news" className="py-16 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold mb-3 border border-red-200">
              <BookOpen className="w-3.5 h-3.5 text-red-600" />
              <span>Cẩm Nang An Toàn & Tiêu Chuẩn PCCC</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Kiến Thức PCCC & Cẩm Nang Thoát Hiểm
            </h2>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
              Cập nhật quy định kiểm định Bộ Công An mới nhất, kỹ năng xử lý đám cháy chung cư và hướng dẫn kiểm tra áp suất thiết bị do đội ngũ kỹ sư PCCC {brandSettings?.brandName || 'FLAMEGUARD PRO'} biên soạn.
            </p>
          </div>

          <button
            onClick={() => navigateTo('/tin-tuc')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-red-600 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer shrink-0 group"
          >
            <span>Xem tất cả bài viết</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Article Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {displayArticles.map((article) => (
            <article
              key={article.id}
              onClick={() => navigateTo(`/tin-tuc/${article.slug}`)}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-red-500 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
            >
              {/* 16:10 Thumbnail Container */}
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                <img
                  src={article.thumbnail}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Category & Featured Badge */}
                <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/95 text-slate-900 backdrop-blur-xs shadow-xs border border-slate-200">
                    {article.category}
                  </span>
                  {article.isFeatured && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                      ⭐ Nổi bật
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  {/* Meta stats */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {article.readingTime || '5 phút đọc'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-400" />
                      {(article.viewsCount || 0).toLocaleString('vi-VN')} lượt xem
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-heading font-bold text-slate-900 text-base group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                {/* Footer Info */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-600 truncate max-w-[160px]">
                    ✍️ {article.author}
                  </span>
                  <span className="text-red-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Đọc tiếp</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom Quick Topics Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-red-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700">Chủ đề PCCC được quan tâm nhiều:</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {['TCVN 3890:2023', 'Cách Dùng Bình Cứu Hỏa', 'Mặt Nạ Lọc Khói Độc', 'Dây Thoát Hiểm Chung Cư', 'Quy Chuẩn PCCC 2026'].map((topic, i) => (
              <button
                key={i}
                onClick={() => navigateTo('/tin-tuc')}
                className="px-3 py-1 rounded-xl bg-white hover:bg-red-50 hover:text-red-600 text-slate-600 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                #{topic}
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
