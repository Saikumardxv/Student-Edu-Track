import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-slide-up">
      <div className={`
        flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl backdrop-blur-md border font-sans text-sm min-w-[280px] max-w-sm md:max-w-md
        ${toast.type === 'success' 
          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30' 
          : 'bg-rose-950/80 text-rose-300 border-rose-500/30'}
      `}>
        {toast.type === 'success' ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
        )}
        <div className="flex-1 font-medium">{toast.text}</div>
        <button 
          onClick={onClose} 
          className="text-slate-400 hover:text-slate-200 transition-colors rounded-lg p-0.5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
