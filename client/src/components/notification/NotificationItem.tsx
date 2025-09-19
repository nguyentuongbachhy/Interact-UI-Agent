import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Settings,
} from "lucide-react";
import { Button } from "../ui";
import type { Notification } from "../../types/notification";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onAction?: (notification: Notification) => void;
}

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  system: Settings,
};

const typeColors = {
  info: "text-blue-500 bg-blue-50",
  success: "text-green-500 bg-green-50",
  warning: "text-yellow-500 bg-yellow-50",
  error: "text-red-500 bg-red-50",
  system: "text-purple-500 bg-purple-50",
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onAction,
}: NotificationItemProps) {
  const Icon = typeIcons[notification.type];
  const timeAgo = formatDistanceToNow(notification.createdAt, {
    addSuffix: true,
    locale: vi,
  });

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl && onAction) {
      onAction(notification);
    }
  };

  return (
    <div
      className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.isRead ? "bg-blue-50/30" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            typeColors[notification.type]
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4
              className={`text-sm font-medium truncate ${
                !notification.isRead ? "text-gray-900" : "text-gray-700"
              }`}
            >
              {notification.title}
            </h4>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
            )}
          </div>

          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">{timeAgo}</span>

            {notification.actionText && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction?.(notification);
                }}
              >
                {notification.actionText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
