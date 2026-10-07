import React, { useMemo, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, AlertTriangle, ImagePlus, Loader2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { resolveProductCategoryId } from '../utils/categories';
import { uploadImageApi } from '../api';
import { fileToUploadDataUrl, ACCEPTED_IMAGE_TYPES } from '../utils/imageUpload';

// Ảnh banner hợp lệ để xem trước: đường dẫn https, ảnh có sẵn trong /images hoặc ảnh admin đã tải lên
const isPreviewableImage = (value) => /^(https?:\/\/|\/images\/|\/uploads\/)/.test(value || '');

// Bảng biểu tượng để chọn (người dùng không cần tự gõ emoji): thiết bị PCCC, cứu hộ, báo cháy, an ninh, điện, công trình...
// Chỉ dùng emoji đã có từ lâu (Unicode ≤ 11) để máy cũ/Windows 10 vẫn hiển thị đúng, không bị ô vuông trống.
const ICON_CHOICES = [
  '🧯', '🔥', '🚨', '🔔', '🚒', '⛑️', '🚪', '🏃', '😷', '🧪', '💧', '🌬️',
  '⚠️', '🛡️', '✅', '⭐', '🔦', '💡', '📷', '🎥', '🔒', '🔑', '📟', '📡',
  '🔌', '🔋', '⚡', '🧰', '🔧', '🛠️', '🏭', '🏢', '🏠', '🚗', '🚚', '📦',
  '📋', '📄', '🚧', '📢', '🎯', '🧱', '📞', '🔍'
];

const EMPTY_FORM = {
  shortName: '',
  label: '',
  icon: '📦',
  badge: '',
  tagline: '',
  showcaseImg: '',
  showcaseBadge: '',
  showcaseTitle: '',
  showcaseDesc: ''
};

const FORM_FIELDS = [
  { key: 'shortName', label: 'Tên ngắn (hiện trên menu) *', max: 40, required: true },
  { key: 'label', label: 'Tên đầy đủ', max: 80 },
  { key: 'icon', label: 'Biểu tượng (một emoji)', max: 8 },
  { key: 'badge', label: 'Nhãn nổi bật (ví dụ: Tem BCA Vạch Xanh)', max: 60 },
  { key: 'tagline', label: 'Dòng mô tả ngắn', max: 120 },
  { key: 'showcaseImg', label: 'Ảnh nổi bật trang chủ (tải ảnh lên hoặc dán đường dẫn https://...)', max: 500 },
  { key: 'showcaseBadge', label: 'Nhãn nhỏ trên ảnh nổi bật', max: 80 },
  { key: 'showcaseTitle', label: 'Tiêu đề trên ảnh nổi bật', max: 100 },
  { key: 'showcaseDesc', label: 'Mô tả ngắn trên ảnh nổi bật', max: 200 }
];

export const CategoryManagerModal = ({ onClose }) => {
  const { categories, products, addCategory, updateCategory, deleteCategory, reorderCategories } = useShop();

  const [view, setView] = useState('list'); // 'list' | 'form' | 'delete'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleting, setDeleting] = useState(null);
  const [reassignTo, setReassignTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'error' | 'success', text }
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const productCounts = useMemo(() => {
    const counts = {};
    for (const p of products) {
      const id = resolveProductCategoryId(p, categories);
      counts[id] = (counts[id] || 0) + 1;
    }
    return counts;
  }, [products, categories]);

  const run = async (action, successText) => {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      if (successText) setMessage({ type: 'success', text: successText });
      return true;
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Có lỗi xảy ra, vui lòng thử lại.' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleBannerFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // cho phép chọn lại đúng tệp đó lần sau
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const dataUrl = await fileToUploadDataUrl(file, { maxWidth: 1600 });
      const url = await uploadImageApi(dataUrl);
      setForm(prev => ({ ...prev, showcaseImg: url }));
      setMessage({ type: 'success', text: 'Đã tải ảnh lên. Bấm "Lưu" để áp dụng cho danh mục.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Không tải được ảnh, vui lòng thử lại.' });
    } finally {
      setUploading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setMessage(null);
    setView('form');
  };

  const openEdit = (cat) => {
    setEditingId(cat.id);
    setForm({ ...EMPTY_FORM, ...Object.fromEntries(FORM_FIELDS.map(f => [f.key, cat[f.key] || ''])) });
    setMessage(null);
    setView('form');
  };

  const openDelete = (cat) => {
    setDeleting(cat);
    setReassignTo('');
    setMessage(null);
    setView('delete');
  };

  const move = async (index, delta) => {
    const ids = categories.map(c => c.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await run(() => reorderCategories(ids));
  };

  const submitForm = async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(FORM_FIELDS.map(f => [f.key, String(form[f.key] || '').trim()]));
    if (!payload.shortName) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên ngắn của danh mục.' });
      return;
    }
    const ok = await run(
      () => (editingId ? updateCategory(editingId, payload) : addCategory(payload)),
      editingId ? 'Đã cập nhật danh mục.' : 'Đã thêm danh mục mới.'
    );
    if (ok) setView('list');
  };

  const deletingCount = deleting ? productCounts[deleting.id] || 0 : 0;
  const otherCategories = deleting ? categories.filter(c => c.id !== deleting.id) : [];
  const isLastCategory = categories.length <= 1;
  const canConfirmDelete = deleting && !isLastCategory && (deletingCount === 0 || Boolean(reassignTo));

  const submitDelete = async () => {
    if (!canConfirmDelete) return;
    const ok = await run(
      () => deleteCategory(deleting.id, deletingCount > 0 ? reassignTo : undefined),
      deletingCount > 0
        ? `Đã xóa danh mục và chuyển ${deletingCount} sản phẩm sang "${categories.find(c => c.id === reassignTo)?.shortName || reassignTo}".`
        : 'Đã xóa danh mục.'
    );
    if (ok) setView('list');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Quản lý danh mục sản phẩm">
      <div className="bg-white w-full sm:max-w-2xl max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-lg truncate">
              {view === 'form' ? (editingId ? 'Sửa danh mục' : 'Thêm danh mục mới') : view === 'delete' ? 'Xóa danh mục' : 'Quản lý danh mục sản phẩm'}
            </h3>
            {view === 'list' && (
              <p className="text-xs text-slate-500">Danh mục hiện ở menu đầu trang, banner và bộ lọc sản phẩm.</p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="shrink-0 w-11 h-11 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {message && (
            <div role="status" className={`text-sm font-medium rounded-xl px-4 py-3 border ${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
              {message.text}
            </div>
          )}

          {view === 'list' && (
            <>
              <ul className="space-y-2">
                {categories.map((cat, index) => (
                  <li key={cat.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center gap-3 min-w-0 basis-full sm:basis-0 sm:flex-1">
                      <span className="text-2xl w-10 text-center shrink-0" aria-hidden="true">{cat.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 text-sm break-words">{cat.shortName}</div>
                        <div className="text-xs text-slate-500 break-words">{cat.label}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{productCounts[cat.id] || 0} sản phẩm</div>
                      </div>
                    </div>
                    <div className="flex items-center shrink-0 ml-auto">
                      <button type="button" disabled={busy || index === 0} onClick={() => move(index, -1)} aria-label={`Đưa "${cat.shortName}" lên trên`} className="w-11 h-11 rounded-xl hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center cursor-pointer">
                        <ChevronUp className="w-5 h-5" />
                      </button>
                      <button type="button" disabled={busy || index === categories.length - 1} onClick={() => move(index, 1)} aria-label={`Đưa "${cat.shortName}" xuống dưới`} className="w-11 h-11 rounded-xl hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center cursor-pointer">
                        <ChevronDown className="w-5 h-5" />
                      </button>
                      <button type="button" disabled={busy} onClick={() => openEdit(cat)} aria-label={`Sửa "${cat.shortName}"`} className="w-11 h-11 rounded-xl hover:bg-blue-50 text-blue-600 flex items-center justify-center cursor-pointer">
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button type="button" disabled={busy || categories.length <= 1} onClick={() => openDelete(cat)} aria-label={`Xóa "${cat.shortName}"`} className="w-11 h-11 rounded-xl hover:bg-red-50 text-red-600 disabled:opacity-30 flex items-center justify-center cursor-pointer">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={openAdd} className="w-full min-h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4" />
                <span>Thêm danh mục mới</span>
              </button>
            </>
          )}

          {view === 'form' && (
            <form onSubmit={submitForm} className="space-y-3">
              {FORM_FIELDS.map(field => field.key === 'icon' ? (
                <div key="icon">
                  <span id="cat-icon-label" className="block text-xs font-bold text-slate-700 mb-1">Biểu tượng (bấm để chọn)</span>
                  <div
                    role="radiogroup"
                    aria-labelledby="cat-icon-label"
                    className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-44 overflow-y-auto p-1.5 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    {(form.icon && !ICON_CHOICES.includes(form.icon) ? [form.icon, ...ICON_CHOICES] : ICON_CHOICES).map(icon => (
                      <button
                        key={icon}
                        type="button"
                        role="radio"
                        aria-checked={form.icon === icon}
                        aria-label={`Biểu tượng ${icon}`}
                        onClick={() => setForm(prev => ({ ...prev, icon }))}
                        className={`min-h-11 rounded-lg text-2xl flex items-center justify-center cursor-pointer transition-colors ${
                          form.icon === icon ? 'bg-red-50 ring-2 ring-red-500' : 'bg-white border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div key={field.key}>
                  <label htmlFor={`cat-${field.key}`} className="block text-xs font-bold text-slate-700 mb-1">{field.label}</label>
                  <input
                    id={`cat-${field.key}`}
                    type="text"
                    value={form[field.key]}
                    maxLength={field.max}
                    required={field.required}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full min-h-11 px-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  />
                  {field.key === 'showcaseImg' && (
                    <div className="mt-2 space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_IMAGE_TYPES.join(',')}
                        onChange={handleBannerFile}
                        className="hidden"
                        aria-label="Chọn ảnh banner từ máy"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy || uploading}
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          className="min-h-11 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 disabled:opacity-60 text-sm font-bold text-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                          <span>{uploading ? 'Đang tải ảnh lên...' : 'Tải ảnh từ máy'}</span>
                        </button>
                        {form.showcaseImg && (
                          <button
                            type="button"
                            disabled={busy || uploading}
                            onClick={() => setForm(prev => ({ ...prev, showcaseImg: '' }))}
                            className="min-h-11 px-4 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60 cursor-pointer"
                          >
                            Gỡ ảnh
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Ảnh này hiện ở <b>khung ảnh lớn bên phải đầu trang chủ</b> khi khách chọn danh mục này, kèm nhãn, tiêu đề và mô tả bên dưới đè lên phần cuối ảnh.
                        Nên dùng <b>ảnh dọc tỉ lệ 4:5</b> (ví dụ 800×1000), chủ thể nằm giữa ảnh. Hỗ trợ JPG, PNG, WEBP; ảnh lớn tự được thu nhỏ và nén.
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {isPreviewableImage(form.showcaseImg) && (
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 mb-1">Xem trước (đúng khung 4:5 khách sẽ thấy)</span>
                  <img src={form.showcaseImg} alt="Xem trước ảnh nổi bật" className="w-40 aspect-[4/5] object-cover object-center bg-slate-100 rounded-2xl border border-slate-200" />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" disabled={busy} onClick={() => setView('list')} className="flex-1 min-h-12 rounded-2xl border border-slate-300 font-bold text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                  Quay lại
                </button>
                <button type="submit" disabled={busy} className="flex-1 min-h-12 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm cursor-pointer">
                  {busy ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thêm danh mục'}
                </button>
              </div>
            </form>
          )}

          {view === 'delete' && deleting && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  Bạn sắp xóa danh mục <b>{deleting.icon} {deleting.shortName}</b>.
                  {deletingCount > 0
                    ? <> Danh mục đang có <b>{deletingCount} sản phẩm</b>; hãy chọn danh mục khác để chuyển các sản phẩm sang. Sản phẩm sẽ không bị xóa.</>
                    : <> Danh mục này không có sản phẩm nào.</>}
                </div>
              </div>

              {deletingCount > 0 && (
                <div>
                  <label htmlFor="cat-reassign" className="block text-xs font-bold text-slate-700 mb-1">Chuyển {deletingCount} sản phẩm sang *</label>
                  <select
                    id="cat-reassign"
                    value={reassignTo}
                    onChange={(e) => setReassignTo(e.target.value)}
                    className="w-full min-h-11 px-3 rounded-xl border border-slate-300 text-base bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {otherCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.shortName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={() => setView('list')} className="flex-1 min-h-12 rounded-2xl border border-slate-300 font-bold text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                  Hủy
                </button>
                <button type="button" disabled={busy || !canConfirmDelete} onClick={submitDelete} className="flex-1 min-h-12 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-sm cursor-pointer">
                  {busy ? 'Đang xóa...' : deletingCount > 0 ? 'Chuyển sản phẩm và xóa' : 'Xóa danh mục'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
