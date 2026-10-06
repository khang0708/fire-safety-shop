import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table,
  Image as ImageIcon,
  Link as LinkIcon,
  Upload,
  X,
  Check,
  RotateCcw,
  RotateCw,
  RemoveFormatting,
  Sparkles,
  Code,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  Palette,
  Eye,
  Clock,
  FileText
} from 'lucide-react';

/**
 * Trình soạn thảo trực quan WYSIWYG thân thiện 100% cho người dùng Non-tech
 * - Chế độ trực quan như Word / Google Docs (Mặc định)
 * - Chế độ mã nguồn HTML cho kỹ thuật viên
 * - Hỗ trợ chèn ảnh từ máy tính (Base64) hoặc link ảnh URL
 * - 1-Click chèn các khung lưu ý, cảnh báo PCCC chuyên nghiệp
 * - Tự động tính số từ và thời gian đọc ước tính
 */
export const ArticleRichEditor = ({ value = '', onChange, onReadingTimeCalculated }) => {
  const [mode, setMode] = useState('visual'); // 'visual' | 'html'
  const editorRef = useRef(null);
  const isUpdatingFromProps = useRef(false);

  // State cho Modal chèn ảnh
  const [showImageModal, setShowImageModal] = useState(false);
  const [imgUrl, setImgUrl] = useState('');
  const [imgCaption, setImgCaption] = useState('');
  const [imgUploadMode, setImgUploadMode] = useState('upload'); // 'upload' | 'url'

  // State cho Modal chèn liên kết
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Dropdown chọn màu chữ
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Đồng bộ giá trị từ ngoài vào editor trực quan
  useEffect(() => {
    if (editorRef.current && mode === 'visual') {
      const currentHtml = editorRef.current.innerHTML;
      if (value !== currentHtml) {
        isUpdatingFromProps.current = true;
        editorRef.current.innerHTML = value || '<p><br></p>';
        isUpdatingFromProps.current = false;
      }
    }
  }, [value, mode]);

  // Cập nhật khi người dùng gõ trong editor trực quan
  const handleEditorInput = useCallback(() => {
    if (isUpdatingFromProps.current || !editorRef.current) return;
    const html = editorRef.current.innerHTML;
    onChange(html);
  }, [onChange]);

  // Thực thi lệnh định dạng
  const executeCmd = (command, val = null) => {
    if (mode !== 'visual') return;
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleEditorInput();
  };

  // Đổi kiểu đoạn văn / Tiêu đề (Heading)
  const handleFormatHeading = (tag) => {
    executeCmd('formatBlock', tag);
  };

  // Đổi màu chữ
  const handleTextColor = (color) => {
    executeCmd('foreColor', color);
    setShowColorPicker(false);
  };

  // Chèn HTML tùy chỉnh an toàn vào vị trí con trỏ
  const insertHtmlSnippet = (htmlSnippet) => {
    if (mode === 'html') {
      onChange((value || '') + '\n' + htmlSnippet + '\n');
      return;
    }
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current.contains(sel.anchorNode)) {
      // Nếu không có vùng chọn bên trong editor, nối vào cuối
      editorRef.current.innerHTML = (editorRef.current.innerHTML || '') + htmlSnippet;
    } else {
      document.execCommand('insertHTML', false, htmlSnippet);
    }
    handleEditorInput();
  };

  // 1. Chèn Khung Lưu Ý An Toàn (Màu vàng cam)
  const insertSafetyNote = () => {
    const html = `
      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 18px; margin: 18px 0; border-radius: 0 12px 12px 0;">
        <p style="margin: 0; font-weight: bold; color: #b45309; font-size: 14px;">⚠️ LƯU Ý AN TOÀN QUAN TRỌNG:</p>
        <p style="margin: 6px 0 0 0; color: #78350f; font-size: 13px; line-height: 1.6;">
          Luôn tuân thủ định kỳ kiểm tra thiết bị chữa cháy tối thiểu 30 ngày/lần theo tiêu chuẩn TCVN 3890:2023.
        </p>
      </div>
      <p><br></p>
    `;
    insertHtmlSnippet(html);
  };

  // 2. Chèn Khung Cảnh Báo Nguy Hiểm (Màu đỏ)
  const insertDangerAlert = () => {
    const html = `
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 18px; margin: 18px 0; border-radius: 0 12px 12px 0;">
        <p style="margin: 0; font-weight: bold; color: #b91c1c; font-size: 14px;">🚨 CẢNH BÁO NGUY HIỂM:</p>
        <p style="margin: 6px 0 0 0; color: #7f1d1d; font-size: 13px; line-height: 1.6;">
          Tuyệt đối KHÔNG dùng nước để dập đám cháy kim loại kiềm hoặc xăng dầu! Hãy sử dụng bình bọt Foam hoặc bình bột ABC chuyên dụng.
        </p>
      </div>
      <p><br></p>
    `;
    insertHtmlSnippet(html);
  };

  // 3. Chèn Khung Mẹo Hướng Dẫn Nhanh (Màu xanh dương)
  const insertProTip = () => {
    const html = `
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 18px; margin: 18px 0; border-radius: 0 12px 12px 0;">
        <p style="margin: 0; font-weight: bold; color: #1d4ed8; font-size: 14px;">💡 MẸO THỰC HÀNH NHANH:</p>
        <p style="margin: 6px 0 0 0; color: #1e3a8a; font-size: 13px; line-height: 1.6;">
          Quy tắc PASS khi dập lửa: Pull (Rút chốt) - Aim (Hướng vòi vào gốc lửa) - Squeeze (Bóp cò) - Sweep (Quét ngang).
        </p>
      </div>
      <p><br></p>
    `;
    insertHtmlSnippet(html);
  };

  // 4. Chèn Bảng Thông Số Kỹ Thuật
  const insertSpecTable = () => {
    const html = `
      <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 10px 14px; text-align: left; font-weight: bold; color: #1e293b; border: 1px solid #e2e8f0;">Tiêu chuẩn kiểm tra</th>
            <th style="padding: 10px 14px; text-align: left; font-weight: bold; color: #1e293b; border: 1px solid #e2e8f0;">Yêu cầu kỹ thuật PCCC</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 9px 14px; border: 1px solid #e2e8f0; color: #334155;">Áp suất đồng hồ</td>
            <td style="padding: 9px 14px; border: 1px solid #e2e8f0; color: #334155; font-weight: bold; color: #15803d;">Kim nằm ở vạch XANH (1.2 - 1.4 MPa)</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 9px 14px; border: 1px solid #e2e8f0; color: #334155;">Niêm phong chì & chốt hãm</td>
            <td style="padding: 9px 14px; border: 1px solid #e2e8f0; color: #334155;">Nguyên vẹn, không biến dạng hay xê dịch</td>
          </tr>
          <tr>
            <td style="padding: 9px 14px; border: 1px solid #e2e8f0; color: #334155;">Tem kiểm định Bộ Công An</td>
            <td style="padding: 9px 14px; border: 1px solid #e2e8f0; color: #334155;">Có mã QR tra cứu cơ sở dữ liệu Cục PCCC</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    insertHtmlSnippet(html);
  };

  // Xử lý chèn liên kết URL
  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    const url = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    const text = linkText.trim() || url;
    const html = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #dc2626; font-weight: bold; text-decoration: underline;">${text}</a> `;
    insertHtmlSnippet(html);
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  // Xử lý upload ảnh cho vào bài viết
  const handleUploadImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (JPG, PNG, WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      const base64 = uploadEvt.target?.result;
      if (base64) {
        setImgUrl(base64);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Hoàn tất chèn ảnh vào bài
  const handleConfirmInsertImage = () => {
    if (!imgUrl.trim()) {
      alert('Vui lòng chọn ảnh từ máy hoặc dán link ảnh!');
      return;
    }
    const captionHtml = imgCaption.trim() 
      ? `<figcaption style="text-align: center; font-size: 12px; color: #64748b; margin-top: 6px; font-style: italic;">Hình ảnh: ${imgCaption.trim()}</figcaption>`
      : '';
    const html = `
      <figure style="margin: 20px auto; text-align: center; max-width: 100%;">
        <img src="${imgUrl.trim()}" alt="${imgCaption.trim() || 'Hình ảnh minh họa PCCC'}" style="max-width: 100%; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.06); display: block; margin: 0 auto;" />
        ${captionHtml}
      </figure>
      <p><br></p>
    `;
    insertHtmlSnippet(html);
    setShowImageModal(false);
    setImgUrl('');
    setImgCaption('');
  };

  // Thống kê số từ và thời gian đọc ước tính
  const textStats = React.useMemo(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = value || '';
    const cleanText = tempDiv.textContent || tempDiv.innerText || '';
    const trimmed = cleanText.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = trimmed.length;
    // Ước tính trung bình người Việt đọc 200 từ / phút
    const readMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readMinutes, readingTimeStr: `${readMinutes} phút đọc` };
  }, [value]);

  return (
    <div className="rounded-2xl border border-slate-300 bg-white overflow-hidden shadow-xs focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 transition-all">
      {/* 1. THANH ĐIỀU HƯỚNG CHẾ ĐỘ (VISUAL vs HTML) & CÁC CHỨC NĂNG CHÍNH */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2 select-none">
        {/* Nhãn và Chuyển Chế Độ */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-0.5 rounded-xl border border-slate-300">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'visual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Soạn thảo trực quan (Dễ như Word)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('html')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'html'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-blue-600" />
            <span>Mã HTML (Kỹ thuật)</span>
          </button>
        </div>

        {/* Trợ lý tính thời gian đọc */}
        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <div className="hidden sm:flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>{textStats.words} từ</span>
            <span>•</span>
            <span>~{textStats.readMinutes} phút đọc</span>
          </div>

          {onReadingTimeCalculated && (
            <button
              type="button"
              onClick={() => onReadingTimeCalculated(textStats.readingTimeStr)}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
              title="Tự động áp dụng thời gian đọc ước tính vào ô thông tin"
            >
              <span>⚡ Điền "{textStats.readingTimeStr}"</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. THANH CÔNG CỤ SOẠN THẢO TRỰC QUAN (TOOLBAR) */}
      {mode === 'visual' && (
        <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-700">
          {/* Nhóm 1: Tiêu đề & Cỡ chữ */}
          <div className="flex items-center gap-1 pr-1.5 border-r border-slate-300">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleFormatHeading(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:border-slate-400 focus:outline-none cursor-pointer"
              title="Chọn kiểu đoạn văn / Tiêu đề"
            >
              <option value="" disabled>Kiểu chữ & Tiêu đề...</option>
              <option value="p">Văn bản thường</option>
              <option value="h2">Tiêu đề lớn (H2 - Mục chính)</option>
              <option value="h3">Tiêu đề vừa (H3 - Mục con)</option>
              <option value="h4">Tiêu đề nhỏ (H4)</option>
            </select>

            <button
              type="button"
              onClick={() => handleFormatHeading('h2')}
              className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg font-bold text-xs cursor-pointer"
              title="Tiêu đề chính H2"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => handleFormatHeading('h3')}
              className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-bold text-xs cursor-pointer"
              title="Tiêu đề phụ H3"
            >
              H3
            </button>
          </div>

          {/* Nhóm 2: Định dạng chữ (B, I, U, Color) */}
          <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-300">
            <button
              type="button"
              onClick={() => executeCmd('bold')}
              className="p-1.5 hover:bg-slate-200 rounded-lg font-extrabold cursor-pointer transition-colors"
              title="In đậm (Ctrl+B)"
            >
              <Bold className="w-4 h-4 text-slate-800" />
            </button>

            <button
              type="button"
              onClick={() => executeCmd('italic')}
              className="p-1.5 hover:bg-slate-200 rounded-lg italic cursor-pointer transition-colors"
              title="In nghiêng (Ctrl+I)"
            >
              <Italic className="w-4 h-4 text-slate-800" />
            </button>

            <button
              type="button"
              onClick={() => executeCmd('underline')}
              className="p-1.5 hover:bg-slate-200 rounded-lg underline cursor-pointer transition-colors"
              title="Gạch chân (Ctrl+U)"
            >
              <Underline className="w-4 h-4 text-slate-800" />
            </button>

            {/* Bảng chọn màu chữ nhanh */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer flex items-center gap-0.5"
                title="Đổi màu chữ nổi bật"
              >
                <Palette className="w-4 h-4 text-slate-700" />
              </button>

              {showColorPicker && (
                <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-slate-200 p-2 rounded-xl shadow-lg flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTextColor('#dc2626')}
                    className="w-6 h-6 rounded-full bg-red-600 border border-red-700 shadow-2xs hover:scale-110 transition-transform"
                    title="Màu đỏ PCCC"
                  />
                  <button
                    type="button"
                    onClick={() => handleTextColor('#d97706')}
                    className="w-6 h-6 rounded-full bg-amber-500 border border-amber-600 shadow-2xs hover:scale-110 transition-transform"
                    title="Màu vàng cam chú ý"
                  />
                  <button
                    type="button"
                    onClick={() => handleTextColor('#16a34a')}
                    className="w-6 h-6 rounded-full bg-green-600 border border-green-700 shadow-2xs hover:scale-110 transition-transform"
                    title="Màu xanh an toàn"
                  />
                  <button
                    type="button"
                    onClick={() => handleTextColor('#2563eb')}
                    className="w-6 h-6 rounded-full bg-blue-600 border border-blue-700 shadow-2xs hover:scale-110 transition-transform"
                    title="Màu xanh dương"
                  />
                  <button
                    type="button"
                    onClick={() => handleTextColor('#1e293b')}
                    className="w-6 h-6 rounded-full bg-slate-800 border border-slate-900 shadow-2xs hover:scale-110 transition-transform"
                    title="Màu đen mặc định"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Nhóm 3: Danh sách Bullet & Số */}
          <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-300">
            <button
              type="button"
              onClick={() => executeCmd('insertUnorderedList')}
              className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              title="Danh sách dấu chấm (Bullet)"
            >
              <List className="w-4 h-4 text-slate-800" />
            </button>

            <button
              type="button"
              onClick={() => executeCmd('insertOrderedList')}
              className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              title="Danh sách đánh số (1, 2, 3...)"
            >
              <ListOrdered className="w-4 h-4 text-slate-800" />
            </button>
          </div>

          {/* Nhóm 4: Căn lề */}
          <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-300">
            <button
              type="button"
              onClick={() => executeCmd('justifyLeft')}
              className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer"
              title="Căn lề trái"
            >
              <AlignLeft className="w-4 h-4 text-slate-800" />
            </button>
            <button
              type="button"
              onClick={() => executeCmd('justifyCenter')}
              className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer"
              title="Căn giữa"
            >
              <AlignCenter className="w-4 h-4 text-slate-800" />
            </button>
            <button
              type="button"
              onClick={() => executeCmd('justifyRight')}
              className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer"
              title="Căn lề phải"
            >
              <AlignRight className="w-4 h-4 text-slate-800" />
            </button>
          </div>

          {/* Nhóm 5: Chèn Đa Phương Tiện & Liên Kết */}
          <div className="flex items-center gap-1 pr-1.5 border-r border-slate-300">
            {/* Chèn Ảnh Vào Thân Bài */}
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
              title="Chèn hình ảnh vào bài viết"
            >
              <ImageIcon className="w-3.5 h-3.5 text-red-600" />
              <span>Chèn ảnh</span>
            </button>

            {/* Chèn Link */}
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer"
              title="Chèn liên kết web (URL)"
            >
              <LinkIcon className="w-4 h-4 text-slate-800" />
            </button>

            {/* Chèn Bảng Thông Số */}
            <button
              type="button"
              onClick={insertSpecTable}
              className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer"
              title="Chèn bảng thông số kỹ thuật"
            >
              <Table className="w-4 h-4 text-slate-800" />
            </button>
          </div>

          {/* Nhóm 6: 1-CLICK CHÈN KHUNG LƯU Ý PCCC (DÀNH CHO NGƯỜI DÙNG NON-TECH) */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase hidden md:inline ml-1">Mẫu PCCC:</span>
            
            <button
              type="button"
              onClick={insertSafetyNote}
              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              title="Chèn khung Lưu ý an toàn màu vàng"
            >
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>+ Lưu ý</span>
            </button>

            <button
              type="button"
              onClick={insertDangerAlert}
              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              title="Chèn khung Cảnh báo nguy hiểm màu đỏ"
            >
              <ShieldAlert className="w-3 h-3 text-red-600" />
              <span>+ Cảnh báo</span>
            </button>

            <button
              type="button"
              onClick={insertProTip}
              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              title="Chèn khung Mẹo thực hành màu xanh"
            >
              <Lightbulb className="w-3 h-3 text-blue-600" />
              <span>+ Mẹo PASS</span>
            </button>

            {/* Hoàn tác & Xóa định dạng */}
            <button
              type="button"
              onClick={() => executeCmd('undo')}
              className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer ml-1"
              title="Hoàn tác (Undo)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => executeCmd('redo')}
              className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer"
              title="Làm lại (Redo)"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => executeCmd('removeFormat')}
              className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer"
              title="Xóa định dạng bôi đen"
            >
              <RemoveFormatting className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>
      )}

      {/* 3. KHUNG SOẠN THẢO NỘI DUNG (CONTENT AREA) */}
      {mode === 'visual' ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          onBlur={handleEditorInput}
          className="min-h-[360px] max-h-[550px] overflow-y-auto p-4 sm:p-6 text-slate-900 text-sm leading-relaxed focus:outline-none focus:ring-0
            prose prose-slate max-w-none
            [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h2]:border-b [&_h2]:border-slate-100 [&_h2]:pb-2 [&_h2]:mt-6 [&_h2]:mb-3
            [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-red-700 [&_h3]:mt-5 [&_h3]:mb-2
            [&_p]:my-3 [&_p]:leading-relaxed
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3
            [&_li]:my-1
            [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-3
            [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
          "
          data-placeholder="Bắt đầu viết nội dung bài viết tại đây... (Bôi đen chữ để in đậm, chọn tiêu đề H2/H3 hoặc nhấn 'Chèn ảnh' phía trên)"
        />
      ) : (
        <div className="relative">
          <textarea
            rows={16}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="<h2>Tiêu đề bài viết</h2><p>Nội dung...</p>"
            className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-900/5 focus:outline-none focus:bg-white leading-relaxed resize-y"
          />
        </div>
      )}

      {/* 4. MODAL CHÈN ẢNH VÀO BÀI VIẾT */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-red-600" />
                <span>Chèn hình ảnh vào nội dung bài viết</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab chuyển đổi tải từ máy / dán link */}
            <div className="flex rounded-xl bg-slate-100 p-1 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setImgUploadMode('upload')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  imgUploadMode === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                📁 Tải ảnh từ máy
              </button>
              <button
                type="button"
                onClick={() => setImgUploadMode('url')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  imgUploadMode === 'url' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                🌐 Dán link ảnh (URL)
              </button>
            </div>

            {imgUploadMode === 'upload' ? (
              <div className="space-y-3">
                {imgUrl ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                    <img src={imgUrl} alt="Preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setImgUrl('')}
                      className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-red-50/20 transition-all">
                    <Upload className="w-8 h-8 text-red-500 mb-2" />
                    <span className="text-xs font-bold text-slate-700">Nhấn để chọn ảnh từ máy</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WEBP</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadImageFile}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Đường dẫn ảnh trực tiếp (URL)</label>
                <input
                  type="text"
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... hoặc link ảnh"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-red-600 font-mono"
                />
              </div>
            )}

            {/* Chú thích ảnh (Caption) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chú thích ảnh (Hiển thị chữ nhỏ dưới ảnh - Tùy chọn)
              </label>
              <input
                type="text"
                value={imgCaption}
                onChange={(e) => setImgCaption(e.target.value)}
                placeholder="VD: Kiểm tra đồng hồ áp suất bình bột ABC định kỳ..."
                className="w-full p-2 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-red-600"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmInsertImage}
                disabled={!imgUrl}
                className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition-all cursor-pointer ${
                  imgUrl ? 'bg-red-600 hover:bg-red-700 shadow-md' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                Chèn vào bài viết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL CHÈN LIÊN KẾT (LINK) */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-red-600" />
                <span>Chèn liên kết (Hyperlink)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ liên kết (URL)</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://flameguard.vn hoặc /san-pham"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-red-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chữ hiển thị (Tùy chọn)</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="VD: Xem bình cứu hỏa tại đây"
                  className="w-full p-2 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                disabled={!linkUrl.trim()}
                className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition-all cursor-pointer ${
                  linkUrl.trim() ? 'bg-red-600 hover:bg-red-700 shadow-md' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                Chèn liên kết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
