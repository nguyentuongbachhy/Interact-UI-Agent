import { useRef, useEffect } from "react";
import { X, Check, Bell } from "lucide-react";
import { Button } from "../ui";
import { NotificationItem } from "./NotificationItem";
import type { Notification } from "../../types/notification";

interface NotificationDropdownProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onAction: (notification: Notification) => void;
  loading?: boolean;
}

export function NotificationDropdown({
  notifications,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onAction,
  loading = false,
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const hasUnread = unreadNotifications.length > 0;

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50"
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {hasUnread && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-600">
              {unreadNotifications.length} thông báo chưa đọc
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-xs h-6 px-2"
            >
              <Check className="w-3 h-3 mr-1" />
              Đánh dấu tất cả đã đọc
            </Button>
          </div>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Đang tải...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-500">Chưa có thông báo nào</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onAction={onAction}
              />
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-sm h-8"
            onClick={() => {
              // Navigate to notifications page
              onAction({
                id: "view-all",
                actionUrl: "/notifications",
              } as Notification);
            }}
          >
            Xem tất cả thông báo
          </Button>
        </div>
      )}
    </div>
  );
}
