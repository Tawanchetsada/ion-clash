"use client";

import { CloseIcon } from "../components/ui/Icon";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type Toast = {
  id: string;
  messageTh: string;
};

export type ToastContextValue = {
  show: (messageTh: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_TOAST_CONTEXT: ToastContextValue = {
  show: () => {},
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timeoutsRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (messageTh: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, messageTh }]);

      const timer = setTimeout(() => {
        dismiss(id);
      }, 5000);
      timeoutsRef.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const timeoutsMap = timeoutsRef.current;
    return () => {
      for (const timer of timeoutsMap.values()) {
        clearTimeout(timer);
      }
      timeoutsMap.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
          aria-live="polite"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role="status"
              className="flex items-center justify-between gap-3 rounded-card bg-navy px-4 py-3 text-sm text-white shadow-lg border border-gold/30"
            >
              <span>{toast.messageTh}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="ปิดข้อความแจ้งเตือน"
                className="ml-2 flex h-6 w-6 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              >
                <CloseIcon className="text-sm" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  return ctx ?? DEFAULT_TOAST_CONTEXT;
}
