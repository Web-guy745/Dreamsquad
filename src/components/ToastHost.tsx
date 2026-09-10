import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { subscribeToToasts, type ToastType } from '../utils/toast';
import './ToastHost.css';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let nextId = 0;

function ToastHost(): JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToToasts((message, type) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2600);
    });
  }, []);

  if (toasts.length === 0) return <></>;

  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-host__item toast-host__item--${toast.type}`}>
          {toast.type === 'error' ? (
            <AlertCircle size={14} strokeWidth={2.4} />
          ) : (
            <CheckCircle2 size={14} strokeWidth={2.4} />
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

export default ToastHost;
