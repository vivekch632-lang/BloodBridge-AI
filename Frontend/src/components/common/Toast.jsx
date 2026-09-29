import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { registerToastListener } from '../../services/toastService';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unregister = registerToastListener((newToast) => {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.duration);
    });

    return () => {
      unregister();
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div key={toast.id} className={`toast-card toast-${toast.type}`}>
            <div className="toast-icon">
              {isSuccess && <CheckCircle2 size={18} color="#059669" />}
              {isError && <AlertCircle size={18} color="#dc2626" />}
              {!isSuccess && !isError && <Info size={18} color="#0284c7" />}
            </div>
            <div className="toast-message">{toast.message}</div>
            <button className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Close notification">
              <X size={14} />
            </button>
          </div>
        );
      })}

      <style>{`
        .toast-container {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          z-index: 9999;
          max-width: 380px;
          width: calc(100% - 3rem);
          pointer-events: none;
        }
        .toast-card {
          pointer-events: auto;
          background: white;
          border: 1px solid var(--slate-200);
          border-radius: var(--radius-md);
          padding: 0.85rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: var(--shadow-lg);
          animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .toast-success {
          border-left: 4px solid #10b981;
        }
        .toast-error {
          border-left: 4px solid #dc2626;
        }
        .toast-info {
          border-left: 4px solid #06b6d4;
        }
        .toast-message {
          flex: 1;
          font-size: 0.875rem;
          color: var(--slate-800);
          font-weight: 500;
          line-height: 1.4;
        }
        .toast-close {
          background: none;
          color: var(--slate-400);
          display: flex;
          align-items: center;
          padding: 2px;
          border-radius: 4px;
        }
        .toast-close:hover {
          color: var(--slate-700);
        }
      `}</style>
    </div>
  );
}
