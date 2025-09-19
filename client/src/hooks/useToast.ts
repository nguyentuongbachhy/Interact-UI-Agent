import { useState, useCallback } from "react";
import type { ToastData } from "../components/ui/ToastContainer";

export interface UseToastReturn {
  toasts: ToastData[];
  showToast: (
    message: string,
    type?: ToastData["type"],
    duration?: number
  ) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback(
    (
      message: string,
      type: ToastData["type"] = "info",
      duration: number = type === "error" ? 5000 : 3000
    ) => {
      const id = `toast-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const newToast: ToastData = {
        id,
        message,
        type,
        duration,
      };

      setToasts((prev) => [newToast, ...prev]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    clearToasts,
  };
}
