import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "../ui";
import { NotificationDropdown } from "./NotificationDropdown";
import { useNotifications } from "../../hooks";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNotificationAction,
  } = useNotifications();

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleDropdown}
        className={`relative ${className}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <NotificationDropdown
        notifications={notifications}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
        onAction={handleNotificationAction}
        loading={isLoading}
      />
    </div>
  );
}