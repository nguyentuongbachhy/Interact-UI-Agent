import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { useAppStore } from "../store";
import type { Notification } from "../types/notification";
import type { NotificationFilterOptions } from "../components/notification/NotificationFilters";

interface UseNotificationsReturn {
  // Basic state
  notifications: Notification[];
  allNotifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Pagination
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;

  // Filtering
  filters: NotificationFilterOptions;
  filteredCount: number;

  // Actions
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  bulkDelete: (ids: string[]) => void;
  addNotification: (
    notification: Omit<Notification, "id" | "isRead" | "createdAt">
  ) => void;
  handleNotificationAction: (notification: Notification) => void;

  // Pagination actions
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Filter actions
  setFilters: (filters: NotificationFilterOptions) => void;
  resetFilters: () => void;

  // Refresh
  refetch: () => Promise<void>;
}

const defaultFilters: NotificationFilterOptions = {
  query: "",
  type: "all",
  status: "all",
  dateRange: "all",
};

// Generate mock notifications for testing
const generateMockNotifications = (): Notification[] => {
  const notifications: Notification[] = [];
  const types: Notification["type"][] = [
    "info",
    "success",
    "warning",
    "error",
    "system",
  ];
  const now = new Date();

  // Today notifications
  for (let i = 0; i < 8; i++) {
    notifications.push({
      id: `today-${i}`,
      title: `Thông báo hôm nay ${i + 1}`,
      message: `Đây là nội dung thông báo số ${
        i + 1
      } trong ngày hôm nay. Nội dung có thể dài để test UI.`,
      type: types[i % types.length],
      isRead: i % 3 === 0,
      createdAt: new Date(now.getTime() - i * 1000 * 60 * 30), // 30 minutes apart
      actionUrl: i % 2 === 0 ? "/products" : undefined,
      actionText: i % 2 === 0 ? "Xem chi tiết" : undefined,
    });
  }

  // Yesterday notifications
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  for (let i = 0; i < 5; i++) {
    notifications.push({
      id: `yesterday-${i}`,
      title: `Thông báo hôm qua ${i + 1}`,
      message: `Nội dung thông báo từ hôm qua số ${i + 1}.`,
      type: types[i % types.length],
      isRead: i % 2 === 0,
      createdAt: new Date(yesterday.getTime() - i * 1000 * 60 * 60 * 2), // 2 hours apart
      actionUrl: i % 3 === 0 ? "/analytics" : undefined,
      actionText: i % 3 === 0 ? "Xem báo cáo" : undefined,
    });
  }

  // This week notifications
  const weekAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  for (let i = 0; i < 10; i++) {
    notifications.push({
      id: `week-${i}`,
      title: `Thông báo tuần này ${i + 1}`,
      message: `Nội dung thông báo trong tuần số ${i + 1}.`,
      type: types[i % types.length],
      isRead: i % 4 === 0,
      createdAt: new Date(weekAgo.getTime() - i * 1000 * 60 * 60 * 6), // 6 hours apart
    });
  }

  // Older notifications
  const monthAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
  for (let i = 0; i < 20; i++) {
    notifications.push({
      id: `old-${i}`,
      title: `Thông báo cũ ${i + 1}`,
      message: `Nội dung thông báo cũ số ${i + 1}.`,
      type: types[i % types.length],
      isRead: i % 3 !== 0,
      createdAt: new Date(monthAgo.getTime() - i * 1000 * 60 * 60 * 24), // 1 day apart
    });
  }

  return notifications.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
};

export function useNotifications(): UseNotificationsReturn {
  const navigate = useNavigate();
  const { showToast } = useAppStore();

  // State
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] =
    useState<NotificationFilterOptions>(defaultFilters);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockNotifications = generateMockNotifications();
      setAllNotifications(mockNotifications);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notifications"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter notifications based on current filters
  const filteredNotifications = useMemo(() => {
    let filtered = [...allNotifications];

    // Filter by query
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filters.type && filters.type !== "all") {
      filtered = filtered.filter((n) => n.type === filters.type);
    }

    // Filter by status
    if (filters.status && filters.status !== "all") {
      if (filters.status === "read") {
        filtered = filtered.filter((n) => n.isRead);
      } else if (filters.status === "unread") {
        filtered = filtered.filter((n) => !n.isRead);
      }
    }

    // Filter by date range
    if (filters.dateRange && filters.dateRange !== "all") {
      filtered = filtered.filter((n) => {
        const date = n.createdAt;

        switch (filters.dateRange) {
          case "today":
            return isToday(date);
          case "yesterday":
            return isYesterday(date);
          case "week":
            return isThisWeek(date);
          case "month":
            return isThisMonth(date);
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [allNotifications, filters]);

  // Paginated notifications
  const notifications = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredNotifications.slice(startIndex, endIndex);
  }, [filteredNotifications, currentPage, pageSize]);

  // Computed values
  const totalCount = filteredNotifications.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const unreadCount = allNotifications.filter((n) => !n.isRead).length;
  const filteredCount = totalCount;

  // Load data on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Actions
  const markAsRead = useCallback((id: string) => {
    setAllNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setAllNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast("Đã đánh dấu tất cả thông báo đã đọc", "success");
  }, [showToast]);

  const deleteNotification = useCallback(
    (id: string) => {
      setAllNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast("Đã xóa thông báo", "success");
    },
    [showToast]
  );

  const bulkDelete = useCallback(
    (ids: string[]) => {
      setAllNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
      showToast(`Đã xóa ${ids.length} thông báo`, "success");
    },
    [showToast]
  );

  const addNotification = useCallback(
    (notificationData: Omit<Notification, "id" | "isRead" | "createdAt">) => {
      const newNotification: Notification = {
        ...notificationData,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isRead: false,
        createdAt: new Date(),
      };

      setAllNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  const handleNotificationAction = useCallback(
    (notification: Notification) => {
      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }
    },
    [navigate]
  );

  const setPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  const setPageSizeCallback = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
  }, []);

  const setFiltersCallback = useCallback(
    (newFilters: NotificationFilterOptions) => {
      setFilters(newFilters);
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  }, []);

  const refetch = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  return {
    // Basic state
    notifications,
    allNotifications,
    unreadCount,
    isLoading,
    error,

    // Pagination
    totalCount,
    currentPage,
    pageSize,
    totalPages,

    // Filtering
    filters,
    filteredCount,

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    bulkDelete,
    addNotification,
    handleNotificationAction,

    // Pagination actions
    setPage,
    setPageSize: setPageSizeCallback,

    // Filter actions
    setFilters: setFiltersCallback,
    resetFilters,

    // Refresh
    refetch,
  };
}
