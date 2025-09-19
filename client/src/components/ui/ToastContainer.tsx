import { Toast } from "./Toast";
import { clsx } from "clsx";

export interface ToastData {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  maxToasts?: number;
}

const positionClasses = {
  "top-right": "fixed top-4 right-4 z-50",
  "top-left": "fixed top-4 left-4 z-50",
  "bottom-right": "fixed bottom-4 right-4 z-50",
  "bottom-left": "fixed bottom-4 left-4 z-50",
};

export function ToastContainer({
  toasts,
  onRemove,
  position = "top-right",
  maxToasts = 5,
}: ToastContainerProps) {
  const displayToasts = toasts.slice(0, maxToasts);

  if (displayToasts.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx(positionClasses[position], "space-y-2")}
      aria-live="polite"
      aria-label="Notifications"
    >
      {displayToasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            zIndex: 50 - index,
          }}
        >
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={onRemove}
            position={position}
          />
        </div>
      ))}
    </div>
  );
}
