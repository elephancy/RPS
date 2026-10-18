import { X } from "lucide-react";

const Modal = ({ 
  isOpen, 
  title, 
  message, 
  children,
  onConfirm, 
  onCancel,
  onClose,
  confirmText = "Confirm",
  cancelText = "Cancel"
}) => {
  if (!isOpen) return null;
  const close = onCancel || onClose;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center px-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border  bg-[linear-gradient(145deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] p-6 text-white shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl animate-fade-in">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
        <button
          onClick={close}
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/20 p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>
        <h2 className="mb-3 pr-10 text-2xl font-black tracking-tight text-white">{title}</h2>
        <div className="mb-6 text-base leading-6 ">
          {children || message}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={close}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/[0.1] hover:text-white"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-2xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-4 py-2 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/25 transition hover:brightness-110"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
