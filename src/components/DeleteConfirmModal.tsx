import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - iOS Alert style */}
      <div className="relative w-full max-w-[270px] bg-white/95 backdrop-blur-xl rounded-2xl 
        shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Content */}
        <div className="px-4 pt-5 pb-4 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-[17px] font-semibold text-slate-900 mb-1">{title}</h3>
          <p className="text-[13px] text-slate-500 leading-relaxed">{message}</p>
        </div>

        {/* Actions - iOS style stacked buttons */}
        <div className="border-t border-slate-200/80">
          <button
            onClick={onClose}
            className="w-full py-3 text-[17px] text-[#007AFF] font-medium 
              active:bg-slate-100 transition-colors border-b border-slate-200/80"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full py-3 text-[17px] text-red-500 font-semibold 
              active:bg-slate-100 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
