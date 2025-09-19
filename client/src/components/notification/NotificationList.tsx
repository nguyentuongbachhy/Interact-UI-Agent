import { useState } from "react";
import { isToday, isYesterday, isThisWeek } from "date-fns";
import {
  CheckCircle,
  Trash2,
  Check,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../ui";
import { NotificationItem } from "./NotificationItem";
import type { Notification } from "../../types/notification";

interface NotificationListProps {
  notifications: Notification[];
  loading?: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onAction: (notification: Notification) => void;
  onBulkDelete?: (ids: string[]) => void;

  // Pagination props
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  thisWeek: Notification[];
  older: Notification[];
}

export function NotificationList({
  notifications,
  loading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onAction,
  onBulkDelete,
  totalCount = 0,
  currentPage = 1,
  pageSize = 20,
  onPageChange,
}: NotificationListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasUnread = unreadCount > 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Group notifications by date
  const groupedNotifications: GroupedNotifications = notifications.reduce(
    (groups, notification) => {
      const date = notification.createdAt;

      if (isToday(date)) {
        groups.today.push(notification);
      } else if (isYesterday(date)) {
        groups.yesterday.push(notification);
      } else if (isThisWeek(date)) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    } as GroupedNotifications
  );

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectNotification = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleBulkMarkAsRead = () => {
    selectedIds.forEach((id) => onMarkAsRead(id));
    setSelectedIds([]);
    setSelectAll(false);
  };

  const handleBulkDelete = () => {
    if (
      window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} thông báo?`)
    ) {
      if (onBulkDelete) {
        onBulkDelete(selectedIds);
      } else {
        selectedIds.forEach((id) => onDeleteNotification(id));
      }
      setSelectedIds([]);
      setSelectAll(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg p-4 border">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Chưa có thông báo nào
        </h3>
        <p className="text-gray-500">Các thông báo mới sẽ xuất hiện ở đây</p>
      </div>
    );
  }

  const renderNotificationGroup = (
    title: string,
    groupNotifications: Notification[]
  ) => {
    if (groupNotifications.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">
          {title}
        </h3>
        <div className="space-y-2">
          {groupNotifications.map((notification) => (
            <div key={notification.id} className="relative">
              <div className="absolute left-2 top-4 z-10">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(notification.id)}
                  onChange={() => handleSelectNotification(notification.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-8">
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onAction={onAction}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with bulk actions */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Chọn tất cả ({notifications.length})
              </span>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>{selectedIds.length} đã chọn</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="flex items-center space-x-1"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Đánh dấu tất cả đã đọc</span>
              </Button>
            )}

            {selectedIds.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkMarkAsRead}
                  className="flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Đánh dấu đã đọc</span>
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {hasUnread && (
          <div className="mt-2 text-sm text-blue-600">
            {unreadCount} thông báo chưa đọc
          </div>
        )}
      </div>

      {/* Grouped notifications */}
      <div className="space-y-6">
        {renderNotificationGroup("Hôm nay", groupedNotifications.today)}
        {renderNotificationGroup("Hôm qua", groupedNotifications.yesterday)}
        {renderNotificationGroup("Tuần này", groupedNotifications.thisWeek)}
        {renderNotificationGroup("Cũ hơn", groupedNotifications.older)}
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị {Math.min((currentPage - 1) * pageSize + 1, totalCount)}{" "}
              - {Math.min(currentPage * pageSize, totalCount)} trên {totalCount}{" "}
              thông báo
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Trang trước</span>
              </Button>

              <div className="flex items-center space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum =
                    Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum <= totalPages) {
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "primary" : "ghost"}
                        size="sm"
                        onClick={() => onPageChange(pageNum)}
                        className="min-w-8"
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  return null;
                })}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center space-x-1"
              >
                <span>Trang sau</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
