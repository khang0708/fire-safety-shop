import React, { useState } from 'react';
import { 
  Star, 
  CheckCircle, 
  ShieldCheck, 
  Camera, 
  ThumbsUp, 
  Plus, 
  Filter,
  Send,
  Building2
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const ReviewsSection = () => {
  const { reviews, addReview, products } = useShop();
  
  const [filterType, setFilterType] = useState('all'); // 'all' | 'with_photo' | '5_star'
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formOccasion, setFormOccasion] = useState('Căn Hộ Chung Cư');
  const [formProductName, setFormProductName] = useState(products[0]?.name || 'Bình Chữa Cháy Bột ABC 4kg');
  const [formComment, setFormComment] = useState('');
  const [formImage, setFormImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Lọc đánh giá
  const visibleReviews = reviews.filter(r => r.isVisible !== false);
  const filteredReviews = visibleReviews.filter(r => {
    if (filterType === 'with_photo') return Boolean(r.proofImage);
    if (filterType === '5_star') return r.rating === 5;
    return true;
  });

  const averageRating = visibleReviews.length > 0
    ? (visibleReviews.reduce((sum, r) => sum + r.rating, 0) / visibleReviews.length).toFixed(1)
    : '5.0';

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addReview({
        customerName: formName || 'Khách hàng PCCC',
        rating: Number(formRating),
        occasion: formOccasion,
        productName: formProductName,
        comment: formComment,
        proofImage: formImage || null,
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsWriteModalOpen(false);
        setFormComment('');
        setFormImage('');
      }, 1500);
    } catch (err) {
      alert('Không thể gửi đánh giá: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="reviews-section" className="py-16 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold mb-3 border border-red-200">
              <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
              <span>Nghiệm Thu Thực Tế Từ Công Trình & Cư Dân</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Phản Hồi & Đánh Giá Chất Lượng PCCC
            </h2>
            <p className="text-sm text-slate-600 mt-2 max-w-xl">
              100% phản hồi thực tế từ các ban quản trị chung cư, kỹ sư an toàn nhà xưởng và chủ hộ gia đình sau khi tiếp nhận thiết bị.
            </p>
          </div>

          {/* Action CTA & Rating Badge */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="text-center border-r border-slate-200 pr-3">
                <span className="text-2xl font-black text-slate-900 leading-none block font-mono">{averageRating}</span>
                <span className="text-[10px] text-slate-400 font-bold">/ 5.0 sao</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex text-amber-400 text-xs">
                  {'★★★★★'.split('').map((s, i) => (
                    <span key={i}>{s}</span>
                  ))}
                </div>
                <span className="text-[11px] text-slate-600 font-bold block">
                  {visibleReviews.length} Đánh giá đã xác thực nghiệm thu
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-3.5 rounded-xl shadow-md shadow-red-600/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Gửi Đánh Giá Nghiệm Thu</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-600 mr-1">Bộ lọc:</span>
          {[
            { id: 'all', label: `Tất Cả (${visibleReviews.length})` },
            { id: 'with_photo', label: '📸 Có Ảnh Nghiệm Thu Thực Tế' },
            { id: '5_star', label: '⭐ Đánh Giá 5 Sao' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                filterType === f.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid Reviews Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((rev) => (
            <div 
              key={rev.id} 
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header User */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={rev.customerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                      alt={rev.customerName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200" 
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="font-heading text-sm font-bold text-slate-900">{rev.customerName}</strong>
                        {rev.verified && (
                          <span title="Đã nghiệm thu thiết bị thực tế">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block">{rev.createdAt}</span>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex text-amber-400 text-xs">
                    {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Tags Thiết bị & Khu vực */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2.5 py-0.5 rounded-md border border-red-200">
                    🧯 {rev.productName}
                  </span>
                  {rev.occasion && (
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                      Khu vực: {rev.occasion}
                    </span>
                  )}
                </div>

                {/* Comment */}
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "{rev.comment}"
                </p>

                {/* Ảnh chụp nghiệm thu thực tế */}
                {rev.proofImage && (
                  <div 
                    onClick={() => setSelectedPhotoModal(rev.proofImage)}
                    className="relative group cursor-pointer aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 mt-2"
                  >
                    <img 
                      src={rev.proofImage} 
                      alt={`Ảnh nghiệm thu thiết bị PCCC thực tế ${rev.customerName}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                      <Camera className="w-4 h-4" />
                      <span>Xem ảnh lớn</span>
                    </div>
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded-md font-bold backdrop-blur-xs">
                      📸 Ảnh lắp đặt thực tế
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  Đã bàn giao nghiệm thu
                </span>
                <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                  <ThumbsUp className="w-3 h-3 text-slate-400" />
                  {rev.likes || 1} hữu ích
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* MODAL GỬI ĐÁNH GIÁ MỚI */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-fade-in my-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">✍️</span>
                <h3 className="font-heading text-lg font-bold">Gửi Đánh Giá Nghiệm Thu Thiết Bị PCCC</h3>
              </div>
              <button 
                onClick={() => setIsWriteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 text-base transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs text-slate-800">
              
              {/* Rating stars picker */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
                <span className="text-xs font-bold text-slate-900 block">Mức độ hài lòng về chất lượng & kiểm định:</span>
                <div className="flex justify-center gap-2 text-2xl cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className={`transition-transform hover:scale-125 ${
                        star <= formRating ? 'text-amber-400' : 'text-slate-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-emerald-800 font-bold block">
                  {formRating === 5 ? 'Thiết bị mới 100%, tem BCA sắc nét, áp suất vạch xanh chuẩn!' : `${formRating} / 5 sao`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ tên / Đơn vị quản lý *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: Anh Minh (BQT Chung cư)"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khu vực lắp đặt</label>
                  <input
                    type="text"
                    value={formOccasion}
                    onChange={(e) => setFormOccasion(e.target.value)}
                    placeholder="VD: Hộ gia đình / Nhà xưởng"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Thiết bị đã bàn giao *</label>
                <select
                  value={formProductName}
                  onChange={(e) => setFormProductName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none bg-white font-bold"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ý kiến nghiệm thu & đánh giá kỹ thuật *</label>
                <textarea
                  rows={3}
                  required
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Áp suất bình thế nào? Tem kiểm định BCA có rõ ràng không? Thái độ kỹ sư bàn giao..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ảnh chụp thực tế sau khi lắp đặt (URL ảnh)</label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/... hoặc link ảnh"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-red-500"
                />
              </div>

              {submitSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Cảm ơn quý khách! Đánh giá đã được ghi nhận trên hệ thống FLAMEGUARD PRO.</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang gửi...' : 'Đăng Đánh Giá'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-5 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Đóng
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL ZOOM XEM ẢNH LỚN */}
      {selectedPhotoModal && (
        <div 
          onClick={() => setSelectedPhotoModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-fade-in"
        >
          <div className="relative max-w-2xl w-full bg-transparent">
            <img 
              src={selectedPhotoModal} 
              alt="Zoomed review proof" 
              className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border-2 border-white/20"
            />
            <button 
              onClick={() => setSelectedPhotoModal(null)}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-black font-bold flex items-center justify-center shadow-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </section>
  );
};
