import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

// Hộp thoại xác nhận dùng chung cho các thao tác nguy hiểm (xóa, đặt lại...).
// Mặc định focus vào nút Hủy để Enter/Space không vô tình xác nhận; Esc hoặc bấm nền để hủy.
export const ConfirmDialog = ({
  open,
  title,
  children,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  danger = true,
  busy = false,
  onConfirm,
  onCancel
}) => {
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);
  const titleId = 'confirm-dialog-title';
  const descId = 'confirm-dialog-desc';

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    cancelRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !busy) {
        e.stopPropagation();
        onCancel?.();
        return;
      }
      // Giữ focus trong hộp thoại (chỉ có 2 nút)
      if (e.key === 'Tab') {
        const first = cancelRef.current;
        const last = confirmRef.current;
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel?.();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center animate-fade-in"
      >
        <div
          className={`mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center ${
            danger ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
          }`}
        >
          <AlertTriangle className="w-7 h-7" aria-hidden="true" />
        </div>

        <h3 id={titleId} className="text-lg font-black text-slate-900">{title}</h3>
        <div id={descId} className="mt-2 text-sm text-slate-600 leading-relaxed break-words">{children}</div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`min-h-11 rounded-2xl text-white font-bold text-sm shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
