import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 w-80 max-w-[90vw] rounded-lg shadow-2xl p-4 flex items-center gap-3 animate-toast-in z-50 ${
        type === 'success'
          ? 'bg-cpn-yellow/80 text-cpn-dark'
          : 'bg-red-500/80 text-white'
      }`}
      role="alert"
    >
      {type === 'success' ? (
        <CheckCircle size={20} className="flex-shrink-0" />
      ) : (
        <AlertCircle size={20} className="flex-shrink-0" />
      )}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </div>
  );
}
