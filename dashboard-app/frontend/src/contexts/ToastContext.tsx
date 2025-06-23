import { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  toast: { message: string; type: ToastType } | null;
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400 shadow-green-500/25';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-rose-600 border-red-400 shadow-red-500/25';
      case 'info':
      default:
        return 'bg-gradient-to-r from-blue-500 to-cyan-600 border-blue-400 shadow-blue-500/25';
    }
  };

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in-out">
          <div
            className={`
              flex items-center space-x-3 px-6 py-4 rounded-xl 
              text-white font-medium text-sm
              border border-opacity-30
              shadow-xl backdrop-blur-sm
              transform transition-all duration-300 ease-out
              hover:scale-105 cursor-pointer
              max-w-md min-w-[280px]
              ${getToastStyles(toast.type)}
            `}
            onClick={() => setToast(null)}
          >
            {/* Icon */}
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white/20 rounded-full">
              <span className="text-base">{getToastIcon(toast.type)}</span>
            </div>
            
            {/* Message */}
            <div className="flex-1">
              <p className="leading-relaxed">
                {toast.message}
              </p>
            </div>
            
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setToast(null);
              }}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors duration-200"
              aria-label="Close notification"
            >
              <span className="text-sm font-bold">×</span>
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
