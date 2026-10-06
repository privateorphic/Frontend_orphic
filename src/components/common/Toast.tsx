import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

let addToastFn: ((type: ToastType, message: string) => void) | null = null;

export function toast(type: ToastType, message: string) {
  addToastFn?.(type, message);
}

export function useToast() {
  return {
    showToast: (message: string, type: ToastType = 'info') => toast(type, message),
  };
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    addToastFn = (type, message) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    };
    return () => { addToastFn = null; };
  }, []);

  if (!toasts.length) return null;

  const icons = {
    success: <CheckCircle size={16} className="text-emerald-500 shrink-0" />,
    error:   <AlertCircle size={16} className="text-red-500 shrink-0" />,
    info:    <Info size={16} className="text-blue-500 shrink-0" />,
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 bg-white border border-slate-200 shadow-lg rounded-lg px-4 py-3 min-w-[280px] max-w-sm animate-in slide-in-from-right"
        >
          {icons[t.type]}
          <p className="text-sm text-slate-700 flex-1">{t.message}</p>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
