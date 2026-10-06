import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { ARTICLE_CATEGORIES } from '../data/articles';
import { ArticleRichEditor } from './ArticleRichEditor';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  Check, 
  X, 
  Globe, 
  Clock, 
  Tag, 
  Image as ImageIcon,
  Share2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Copy,
  Link as LinkIcon,
  Upload
} from 'lucide-react';

// Fallback slugify nếu chạy phía client
const clientSlugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const PRESET_ARTICLE_PHOTOS = [
  { name: 'Kiểm Tra Đồng Hồ Áp Suất', url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Bình Cứu Hỏa Nhà Ở & Chung Cư', url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=1200&q=80' },
  { name: 'So Sánh Bình Bột & Bình CO2', url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Kỹ Năng Thoát Hiểm Khẩn Cấp', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Mặt Nạ Lọc Khói TZL30', url: '/images/smoke-mask-tzl30.jpg' },
  { name: 'Bình Bột ABC 4kg', url: '/images/abc-powder-4kg.jpg' },
  { name: 'Bình CO2 3kg', url: '/images/co2-extinguisher-3kg.jpg' }
];

export const ArticlesManagementView = () => {
  const { 
    articles = [], 
    products = [], 
    addArticle, 
    editArticle, 
    removeArticle, 
    toggleArticleStatus, 
    navigateTo, 
    showToast,
    brandSettings
  } = useShop();

  const defaultAuthor = brandSettings?.brandName ? `Kỹ Sư PCCC ${brandSettings.brandName}` : 'Kỹ Sư PCCC FLAMEGUARD PRO';

  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeEditorTab, setActiveEditorTab] = useState('content'); // 'content' | 'seo' | 'preview'

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Cẩm Nang PCCC',
    thumbnail: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80',
    excerpt: '',
    content: '',
    author: defaultAuthor,
    readingTime: '5 phút đọc',
    relatedProductId: '',
    isFeatured: false,
    status: 'published',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: ''
  });

  // Lọc bài viết
  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      const matchSearch = !searchFilter.trim() ||
        a.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        a.slug?.toLowerCase().includes(searchFilter.toLowerCase());
      const matchCat = categoryFilter === 'all' || a.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || 
        (statusFilter === 'published' && (!a.status || a.status === 'published')) ||
        (statusFilter === 'draft' && a.status === 'draft');
      return matchSearch && matchCat && matchStatus;
    });
  }, [articles, searchFilter, categoryFilter, statusFilter]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = articles.length;
    const published = articles.filter(a => !a.status || a.status === 'published').length;
    const drafts = total - published;
    const totalViews = articles.reduce((sum, a) => sum + (Number(a.viewsCount) || 0), 0);
    return { total, published, drafts, totalViews };
  }, [articles]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: '',
      slug: '',
      category: 'Cẩm Nang PCCC',
      thumbnail: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80',
      excerpt: '',
      content: '<h2>1. Giới thiệu</h2>\n<p>Nội dung bài viết chuẩn TCVN 3890...</p>',
      author: defaultAuthor,
      readingTime: '5 phút đọc',
      relatedProductId: products[0]?.id || '',
      isFeatured: false,
      status: 'published',
      viewsCount: 0,
      seoTitle: '',
      seoDescription: '',
      seoKeywords: ''
    });
    setActiveEditorTab('content');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (article) => {
    setEditingId(article.id);
    setFormData({
      title: article.title || '',
      slug: article.slug || '',
      category: article.category || 'Cẩm Nang PCCC',
      thumbnail: article.thumbnail || '',
      excerpt: article.excerpt || '',
      content: article.content || '',
      author: article.author || defaultAuthor,
      readingTime: article.readingTime || '5 phút đọc',
      viewsCount: Number(article.viewsCount) || 0,
      relatedProductId: article.relatedProductId || '',
      isFeatured: Boolean(article.isFeatured),
      status: article.status || 'published',
      seoTitle: article.seoTitle || article.title || '',
      seoDescription: article.seoDescription || article.excerpt || '',
      seoKeywords: article.seoKeywords || ''
    });
    setActiveEditorTab('content');
    setIsEditorOpen(true);
  };

  const handleAutoSlug = () => {
    if (!formData.title) return;
    const generated = clientSlugify(formData.title);
    setFormData(prev => ({
      ...prev,
      slug: generated,
      seoTitle: prev.seoTitle || prev.title,
      seoDescription: prev.seoDescription || prev.excerpt
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề bài viết!');
      return;
    }

    const payload = {
      ...formData,
      viewsCount: Number(formData.viewsCount) || 0,
      slug: formData.slug.trim() || clientSlugify(formData.title),
      seoTitle: formData.seoTitle.trim() || formData.title.trim(),
      seoDescription: formData.seoDescription.trim() || formData.excerpt.trim()
    };

    if (editingId) {
      await editArticle(editingId, payload);
      showToast('Đã cập nhật bài viết thành công!');
    } else {
      await addArticle(payload);
      showToast('Đã tạo bài viết SEO mới thành công!');
    }
    setIsEditorOpen(false);
  };

  const handleDelete = async (id, title) => {
    if (confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}"?`)) {
      await removeArticle(id);
      showToast('Đã xóa bài viết thành công!');
    }
  };

  const handleToggleStatus = async (id) => {
    await toggleArticleStatus(id);
    showToast('Đã đổi trạng thái xuất bản bài viết!');
  };

  // Quản lý sao chép đường dẫn bài viết
  const [copiedSlug, setCopiedSlug] = useState(null);

  const getArticleFullUrl = (slug) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const cleanSlug = String(slug || '').trim();
    return `${origin}/tin-tuc/${cleanSlug}`;
  };

  const handleCopyArticleLink = (slug, title = '') => {
    let cleanSlug = String(slug || '').trim();
    if (!cleanSlug && (title || formData.title)) {
      cleanSlug = clientSlugify(title || formData.title);
      if (cleanSlug) {
        setFormData(prev => ({
          ...prev,
          slug: cleanSlug,
          seoTitle: prev.seoTitle || prev.title,
          seoDescription: prev.seoDescription || prev.excerpt
        }));
      }
    }
    if (!cleanSlug) {
      showToast('Vui lòng nhập tiêu đề hoặc slug để lấy link bài viết!');
      return;
    }
    const fullUrl = getArticleFullUrl(cleanSlug);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        setCopiedSlug(cleanSlug);
        showToast(`Đã sao chép link bài viết: ${fullUrl}`);
        setTimeout(() => setCopiedSlug(null), 3000);
      }).catch(() => {
        if (typeof prompt !== 'undefined') {
          prompt('Sao chép liên kết bài viết:', fullUrl);
        }
      });
    } else if (typeof prompt !== 'undefined') {
      prompt('Sao chép liên kết bài viết:', fullUrl);
    }
  };

  // Xử lý tải ảnh đại diện từ máy tính / điện thoại
  const handleThumbnailFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một file hình ảnh hợp lệ (JPG, PNG, WEBP, GIF,...)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Data = uploadEvent.target?.result;
      if (base64Data) {
        setFormData(prev => ({ ...prev, thumbnail: base64Data }));
        showToast('Đã tải ảnh lên thành công!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Thống Kê Tổng Quan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading flex items-center gap-2">
            <span>📰 Quản Lý Tin Tức & SEO Traffic</span>
            <span className="text-xs bg-red-100 text-red-700 font-mono font-bold px-2 py-0.5 rounded-full">
              {stats.total} bài viết
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Xây dựng nội dung chuẩn SEO, tối ưu thứ hạng Google & kéo khách hàng tiềm năng về trang sản phẩm.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Bài Viết Mới</span>
        </button>
      </div>

      {/* 2. Thẻ Thống Kê Nhanh (KPI Stats Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Tổng Bài Viết</span>
          <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{stats.total}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 block uppercase">Đã Xuất Bản (Live)</span>
          <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">{stats.published}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-500 block uppercase">Bản Nháp (Draft)</span>
          <span className="text-2xl font-black text-amber-500 font-mono mt-1 block">{stats.drafts}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-600 block uppercase">Tổng Lượt Xem SEO</span>
          <span className="text-2xl font-black text-blue-600 font-mono mt-1 block">
            {stats.totalViews.toLocaleString('vi-VN')}
          </span>
        </div>
      </div>

      {/* 3. Thanh Bộ Lọc & Tìm Kiếm */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc slug URL..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-red-600"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none focus:border-red-600"
          >
            <option value="all">Tất cả chuyên mục</option>
            {ARTICLE_CATEGORIES.filter(c => c.id !== 'all').map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none focus:border-red-600"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="published">Đã xuất bản</option>
            <option value="draft">Bản nháp</option>
          </select>
        </div>
      </div>

      {/* 4. Bảng Danh Sách Bài Viết */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 w-16">Ảnh</th>
                <th className="p-3.5">Tiêu Đề & Đường Dẫn Tĩnh (Slug)</th>
                <th className="p-3.5">Chuyên Mục</th>
                <th className="p-3.5">Tác Giả</th>
                <th className="p-3.5">Lượt Xem</th>
                <th className="p-3.5">Trạng Thái</th>
                <th className="p-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => {
                  const isPub = !article.status || article.status === 'published';
                  return (
                    <tr 
                      key={article.id} 
                      onClick={() => handleOpenEdit(article)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                      title="Nhấn vào bài viết để chỉnh sửa"
                    >
                      {/* Thumbnail */}
                      <td className="p-3.5">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                          <img 
                            src={article.thumbnail} 
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                        </div>
                      </td>

                      {/* Title & Slug */}
                      <td className="p-3.5 max-w-xs sm:max-w-md">
                        <div className="font-bold text-slate-900 group-hover:text-red-600 text-xs sm:text-sm line-clamp-1 transition-colors">
                          {article.title}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                          /tin-tuc/{article.slug}
                        </div>
                        {article.isFeatured && (
                          <span className="inline-block mt-1 text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                            ⭐ Nổi bật
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold text-[11px]">
                          {article.category}
                        </span>
                      </td>

                      {/* Author */}
                      <td className="p-3.5 whitespace-nowrap text-slate-600">
                        {article.author}
                      </td>

                      {/* Views */}
                      <td className="p-3.5 whitespace-nowrap font-mono text-slate-700">
                        {article.viewsCount?.toLocaleString('vi-VN') || 0}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(article.id);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            isPub 
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {isPub ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          <span>{isPub ? 'Đã xuất bản' : 'Bản nháp'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Xem trực tiếp */}
                          <a
                            href={`/tin-tuc/${article.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Mở xem bài viết trên web"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Lấy link bài viết */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyArticleLink(article.slug, article.title);
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              copiedSlug === article.slug
                                ? 'text-emerald-600 bg-emerald-50'
                                : 'text-slate-500 hover:text-[#0068FF] hover:bg-blue-50'
                            }`}
                            title="Lấy link bài viết (Sao chép URL)"
                          >
                            {copiedSlug === article.slug ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>

                          {/* Sửa */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(article);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Chỉnh sửa bài viết"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Xóa */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(article.id, article.title);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Xóa bài viết"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">
                    Không tìm thấy bài viết nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL TẠO & CHỈNH SỬA BÀI VIẾT RICH EDITOR */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                  <span>{editingId ? 'Chỉnh Sửa Bài Viết SEO' : 'Tạo Bài Viết Tin Tức Mới'}</span>
                  {formData.slug && (
                    <span className="hidden sm:inline-block text-[11px] font-mono font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                      /tin-tuc/{formData.slug}
                    </span>
                  )}
                </h3>
                <span className="text-[11px] text-slate-400">
                  Hỗ trợ kéo traffic SEO, tích hợp thẻ sản phẩm CTA & Schema NewsArticle tự động.
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Button Lấy Link Bài Viết */}
                <button
                  type="button"
                  onClick={() => handleCopyArticleLink(formData.slug, formData.title)}
                  disabled={!formData.slug}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs border ${
                    !formData.slug
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                      : copiedSlug === formData.slug
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white hover:bg-blue-50 text-[#0068FF] border-blue-200 hover:border-blue-300'
                  }`}
                  title="Sao chép đường dẫn bài viết này để chia sẻ hoặc chạy quảng cáo"
                >
                  {copiedSlug === formData.slug ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã chép link!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Lấy Link Bài Viết</span>
                    </>
                  )}
                </button>

                {formData.slug && (
                  <a
                    href={`/tin-tuc/${formData.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-200 border border-slate-200 bg-white transition-colors"
                    title="Mở xem bài viết trên web"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                <button 
                  onClick={() => setIsEditorOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Đóng modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-tabs: Nội dung | SEO | Xem trước */}
            <div className="flex border-b border-slate-200 bg-white px-6 gap-4 text-xs font-bold">
              <button
                onClick={() => setActiveEditorTab('content')}
                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                  activeEditorTab === 'content'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Nội Dung Bài Viết
              </button>
              <button
                onClick={() => setActiveEditorTab('seo')}
                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                  activeEditorTab === 'seo'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Cấu Hình SEO & SERP
              </button>
              <button
                onClick={() => setActiveEditorTab('preview')}
                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                  activeEditorTab === 'preview'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Xem Trước (Live Preview)
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              
              {/* TAB 1: NỘI DUNG BÀI VIẾT */}
              {activeEditorTab === 'content' && (
                <div className="space-y-4">
                  {/* Tiêu đề */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tiêu đề bài viết <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setFormData(prev => {
                          const isSlugAuto = !prev.slug || prev.slug === clientSlugify(prev.title);
                          return {
                            ...prev,
                            title: newTitle,
                            slug: isSlugAuto ? clientSlugify(newTitle) : prev.slug,
                            seoTitle: (!prev.seoTitle || prev.seoTitle === prev.title) ? newTitle : prev.seoTitle
                          };
                        });
                      }}
                      placeholder="VD: Hướng dẫn kiểm tra bình chữa cháy còn dùng được không theo TCVN 3890"
                      className="w-full p-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-red-600 font-semibold"
                    />
                  </div>

                  {/* Slug & Auto-slug & Lấy link */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <label className="block text-xs font-bold text-slate-700">
                          Đường dẫn tĩnh SEO (Slug URL)
                        </label>
                        {formData.slug && (
                          <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono truncate max-w-[280px]">
                            {getArticleFullUrl(formData.slug)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleAutoSlug}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all border border-slate-300 cursor-pointer flex items-center gap-1 active:scale-95"
                          title="Tự động tạo slug chuẩn SEO từ tiêu đề"
                        >
                          <span>⚡ Tạo slug</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyArticleLink(formData.slug, formData.title)}
                          disabled={!formData.slug && !formData.title}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer active:scale-95 ${
                            !formData.slug && !formData.title
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                              : copiedSlug === formData.slug
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-blue-50 hover:bg-blue-100 text-[#0068FF] border-blue-200'
                          }`}
                          title="Lấy link bài viết (Sao chép URL)"
                        >
                          {copiedSlug === formData.slug ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSlug === formData.slug ? 'Đã sao chép' : 'Lấy link'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-stretch rounded-xl border border-slate-300 bg-slate-50 overflow-hidden focus-within:border-red-600 focus-within:ring-1 focus-within:ring-red-600 focus-within:bg-white transition-all shadow-2xs">
                      <span className="shrink-0 whitespace-nowrap select-none px-3.5 py-2.5 bg-slate-100 text-slate-500 font-mono text-xs border-r border-slate-300 flex items-center font-medium">
                        /tin-tuc/
                      </span>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="huong-dan-kiem-tra-binh-chua-chay"
                        className="flex-1 min-w-0 px-3 py-2.5 text-xs bg-transparent font-mono focus:outline-none text-slate-900 font-medium"
                      />
                      {formData.slug && (
                        <button
                          type="button"
                          onClick={() => handleCopyArticleLink(formData.slug, formData.title)}
                          className="shrink-0 px-3 py-2 text-xs font-bold text-[#0068FF] hover:bg-blue-50 border-l border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Sao chép toàn bộ đường dẫn URL bài viết này"
                        >
                          {copiedSlug === formData.slug ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 text-[11px]">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Sao chép</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chuyên mục & Tác giả & Lượt xem */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Chuyên mục</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-red-600"
                      >
                        {ARTICLE_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tác giả biên soạn</label>
                      <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-red-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian đọc</label>
                      <input
                        type="text"
                        value={formData.readingTime}
                        onChange={(e) => setFormData({ ...formData, readingTime: e.target.value })}
                        placeholder="5 phút đọc"
                        className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-red-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Lượt xem</span>
                        <span className="text-[10px] text-slate-400 font-normal">Tự động tăng</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.viewsCount}
                        onChange={(e) => setFormData({ ...formData, viewsCount: Math.max(0, parseInt(e.target.value) || 0) })}
                        placeholder="0"
                        className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-red-600 font-mono"
                      />
                    </div>
                  </div>

                  {/* Ảnh đại diện (Thumbnail) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-red-600" />
                        <span>Ảnh tiêu đề bài viết (Thumbnail)</span>
                        <span className="text-red-500">*</span>
                      </label>
                      
                      <div className="flex items-center gap-2">
                        {/* Nút bấm chọn ảnh từ máy */}
                        <label className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs active:scale-95">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Tải ảnh từ máy</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailFileUpload}
                            className="hidden"
                          />
                        </label>

                        {formData.thumbnail && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, thumbnail: '' })}
                            className="text-[11px] text-slate-400 hover:text-red-600 font-medium cursor-pointer"
                            title="Xóa ảnh hiện tại"
                          >
                            Xóa ảnh
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Khung hiển thị / Nhập link / Kéo thả ảnh */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                      {/* Xem trước ảnh nếu có */}
                      {formData.thumbnail ? (
                        <div className="sm:col-span-4 relative aspect-[16/10] rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-900 group shadow-xs">
                          <img
                            src={formData.thumbnail}
                            alt="Thumbnail Preview"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white text-xs font-bold cursor-pointer transition-all flex items-center gap-1">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Đổi ảnh</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleThumbnailFileUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="sm:col-span-4 relative aspect-[16/10] rounded-xl border-2 border-dashed border-slate-300 hover:border-red-400 bg-slate-50 hover:bg-red-50/30 transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                            <Upload className="w-4 h-4 text-red-600" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">Chọn ảnh tải lên</span>
                          <span className="text-[10px] text-slate-400">JPG, PNG, WEBP</span>
                        </div>
                      )}

                      {/* Ô nhập đường dẫn URL (cho người muốn dán link trực tiếp) */}
                      <div className="sm:col-span-8 space-y-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Hoặc dán trực tiếp đường dẫn ảnh (URL):
                          </label>
                          <div className="flex items-center rounded-xl border border-slate-300 bg-slate-50 focus-within:border-red-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-red-600 overflow-hidden transition-all">
                            <span className="shrink-0 px-2.5 text-slate-400 text-xs">
                              <Globe className="w-3.5 h-3.5" />
                            </span>
                            <input
                              type="text"
                              value={formData.thumbnail}
                              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                              placeholder="https://images.unsplash.com/... hoặc dán link ảnh"
                              className="flex-1 min-w-0 p-2 text-xs bg-transparent focus:outline-none text-slate-900 font-mono"
                            />
                            {formData.thumbnail && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, thumbnail: '' })}
                                className="px-2 text-slate-400 hover:text-slate-600 text-xs"
                                title="Xóa URL"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Preset Photos chọn nhanh */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                          <span className="text-slate-400 shrink-0 font-medium text-[10px]">Ảnh mẫu PCCC:</span>
                          {PRESET_ARTICLE_PHOTOS.map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setFormData({ ...formData, thumbnail: p.url })}
                              className={`px-2 py-0.5 rounded text-[10px] shrink-0 border transition-all cursor-pointer ${
                                formData.thumbnail === p.url
                                  ? 'bg-red-600 text-white border-red-600 font-bold'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                              }`}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tóm tắt bài viết (Excerpt / Sapo) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Đoạn tóm tắt / Sapo (Dùng cho meta description & danh sách xem trước)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Tóm tắt ngắn gọn 2-3 câu làm nổi bật vấn đề và giải pháp PCCC..."
                      className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-red-600 leading-relaxed"
                    />
                  </div>

                  {/* Nội dung bài viết với Trình Soạn Thảo Trực Quan WYSIWYG */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-red-600" />
                        <span>Nội dung bài viết chi tiết</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        ✨ Gõ trực quan như Word/Docs • Bôi đen chữ để in đậm/đổi màu • Chèn ảnh & bảng dễ dàng
                      </span>
                    </div>

                    <ArticleRichEditor
                      value={formData.content}
                      onChange={(newContent) => setFormData(prev => ({ ...prev, content: newContent }))}
                      onReadingTimeCalculated={(timeStr) => setFormData(prev => ({ ...prev, readingTime: timeStr }))}
                    />
                  </div>

                  {/* Nhúng Thiết Bị Khuyên Dùng Trong Bài (Product CTA Selector) */}
                  <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200 space-y-2">
                    <label className="block text-xs font-bold text-red-900">
                      🎯 Gắn thiết bị PCCC liên quan (Hiển thị thẻ Mua Ngay & Tư Vấn Zalo trong bài)
                    </label>
                    <select
                      value={formData.relatedProductId}
                      onChange={(e) => setFormData({ ...formData, relatedProductId: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg bg-white border border-red-300 text-slate-800 font-medium"
                    >
                      <option value="">-- Không gắn thiết bị --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({Number(p.price).toLocaleString('vi-VN')}đ)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cài đặt trạng thái & Nổi bật */}
                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="rounded text-red-600 w-4 h-4"
                      />
                      <span>Đánh dấu bài viết nổi bật (Hiển thị đầu trang)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.status === 'published'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'published' : 'draft' })}
                        className="rounded text-red-600 w-4 h-4"
                      />
                      <span>Xuất bản ngay cho khách hàng xem</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: CẤU HÌNH SEO & SERP */}
              {activeEditorTab === 'seo' && (
                <div className="space-y-4">
                  {/* Mô phỏng Google Search Snippet Preview */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Mô phỏng hiển thị trên Google Tìm Kiếm (SERP Snippet):
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyArticleLink(formData.slug, formData.title)}
                        disabled={!formData.slug}
                        className={`text-[11px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          !formData.slug
                            ? 'opacity-40 cursor-not-allowed text-slate-400'
                            : copiedSlug === formData.slug
                            ? 'text-emerald-600'
                            : 'text-[#0068FF] hover:underline'
                        }`}
                        title="Sao chép link bài viết"
                      >
                        {copiedSlug === formData.slug ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSlug === formData.slug ? 'Đã sao chép link' : 'Lấy link bài viết'}</span>
                      </button>
                    </div>
                    <div className="text-xs text-[#202124] flex items-center gap-1 font-mono">
                      <span>{typeof window !== 'undefined' ? window.location.origin : 'https://flameguard.vn'} › tin-tuc › {formData.slug || 'duong-dan-bai-viet'}</span>
                    </div>
                    <div className="text-base font-medium text-[#1a0dab] hover:underline cursor-pointer line-clamp-1">
                      {formData.seoTitle || formData.title || 'Tiêu đề bài viết hiển thị trên Google'}
                    </div>
                    <div className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                      {formData.seoDescription || formData.excerpt || 'Đoạn mô tả ngắn gọn về bài viết sẽ được bot Google đọc và hiển thị cho người tìm kiếm...'}
                    </div>
                  </div>

                  {/* SEO Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tiêu đề SEO (Title Tag) - Đề xuất 50-65 ký tự
                    </label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      placeholder={formData.title || 'Tiêu đề SEO'}
                      className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-red-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Độ dài: {(formData.seoTitle || formData.title || '').length} ký tự
                    </span>
                  </div>

                  {/* SEO Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Thẻ mô tả SEO (Meta Description) - Đề xuất 140-160 ký tự
                    </label>
                    <textarea
                      rows={3}
                      value={formData.seoDescription}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      placeholder={formData.excerpt || 'Mô tả tóm tắt cho Google'}
                      className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-red-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Độ dài: {(formData.seoDescription || formData.excerpt || '').length} ký tự
                    </span>
                  </div>

                  {/* Focus Keywords */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Từ khóa mục tiêu SEO (Focus Keywords - Phân cách bằng dấu phẩy)
                    </label>
                    <input
                      type="text"
                      value={formData.seoKeywords}
                      onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                      placeholder="bình chữa cháy bột abc, kiểm tra bình cứu hỏa, tcvn 3890 2023"
                      className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: XEM TRƯỚC (LIVE PREVIEW) */}
              {activeEditorTab === 'preview' && (
                <div className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200">
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold">
                      {formData.category}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 font-heading">
                      {formData.title || 'Tiêu đề bài viết mẫu'}
                    </h1>
                    <div className="text-xs text-slate-400 mt-1">
                      Tác giả: {formData.author} • {formData.readingTime}
                    </div>
                  </div>

                  {formData.thumbnail && (
                    <div className="rounded-xl overflow-hidden max-h-72">
                      <img src={formData.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div 
                    className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formData.content || '<p>Chưa có nội dung...</p>' }}
                  />
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 max-w-full sm:max-w-md">
                  {formData.slug ? (
                    <button
                      type="button"
                      onClick={() => handleCopyArticleLink(formData.slug, formData.title)}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-[#0068FF] bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-all font-mono truncate cursor-pointer shadow-2xs"
                      title="Bấm để lấy link bài viết này"
                    >
                      <LinkIcon className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span className="truncate">/tin-tuc/{formData.slug}</span>
                      {copiedSlug === formData.slug ? (
                        <span className="text-[10px] font-sans font-bold text-emerald-600 ml-1 shrink-0">✓ Đã chép link</span>
                      ) : (
                        <span className="text-[10px] font-sans font-bold text-[#0068FF] ml-1 shrink-0">Lấy link</span>
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Nhập tiêu đề hoặc slug để kích hoạt link bài viết
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    {editingId ? 'Cập Nhật Bài Viết' : 'Xuất Bản Bài Viết'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
