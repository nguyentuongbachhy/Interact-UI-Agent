import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { useAppStore } from "../store";
import { notificationService } from "../services";
import type { Notification } from "../types/notification";
import type { NotificationFilterOptions } from "../components/notification/NotificationFilters";

interface UseNotificationsReturn {
  notifications: Notification[];
  allNotifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  filters: NotificationFilterOptions;
  filteredCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  bulkDelete: (ids: string[]) => void;
  addNotification: (
    notification: Omit<Notification, "id" | "isRead" | "createdAt">
  ) => void;
  handleNotificationAction: (notification: Notification) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilters: (filters: NotificationFilterOptions) => void;
  resetFilters: () => void;
  refetch: () => Promise<void>;
}

const defaultFilters: NotificationFilterOptions = {
  query: "",
  type: "all",
  status: "all",
  dateRange: "all",
};

export function useNotifications(): UseNotificationsReturn {
  const navigate = useNavigate();
  const { showToast } = useAppStore();

  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFilters] =
    useState<NotificationFilterOptions>(defaultFilters);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        type: filters.type === "all" ? undefined : filters.type,
        status: filters.status === "all" ? undefined : filters.status,
        query: filters.query || undefined,
        dateRange: filters.dateRange === "all" ? undefined : filters.dateRange,
      };

      const response = await notificationService.getNotifications(params);

      setAllNotifications(response.notifications);
      setTotalCount(response.total);
      setUnreadCount(response.unreadCount);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notifications"
      );
      showToast("Failed to load notifications", "error");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, filters, showToast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filteredNotifications = useMemo(() => {
    let filtered = [...allNotifications];

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

  const notifications = useMemo(() => {
    return filteredNotifications;
  }, [filteredNotifications]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const filteredCount = filteredNotifications.length;

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await notificationService.markAsRead(id);
        setAllNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        showToast("Failed to mark notification as read", "error");
      }
    },
    [showToast]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setAllNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast("All notifications marked as read", "success");
    } catch (err) {
      showToast("Failed to mark all notifications as read", "error");
    }
  }, [showToast]);

  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        await notificationService.deleteNotification(id);
        setAllNotifications((prev) => prev.filter((n) => n.id !== id));
        setTotalCount((prev) => prev - 1);
        showToast("Notification deleted", "success");
      } catch (err) {
        showToast("Failed to delete notification", "error");
      }
    },
    [showToast]
  );

  const bulkDelete = useCallback(
    async (ids: string[]) => {
      try {
        await notificationService.bulkDelete(ids);
        setAllNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
        setTotalCount((prev) => prev - ids.length);
        showToast(`${ids.length} notifications deleted`, "success");
      } catch (err) {
        showToast("Failed to delete notifications", "error");
      }
    },
    [showToast]
  );

  const addNotification = useCallback(
    async (
      notificationData: Omit<Notification, "id" | "isRead" | "createdAt">
    ) => {
      try {
        const newNotification = await notificationService.createNotification(
          notificationData
        );
        setAllNotifications((prev) => [newNotification, ...prev]);
        setTotalCount((prev) => prev + 1);
        if (!newNotification.isRead) {
          setUnreadCount((prev) => prev + 1);
        }
      } catch (err) {
        showToast("Failed to create notification", "error");
      }
    },
    [showToast]
  );

  const handleNotificationAction = useCallback(
    (notification: Notification) => {
      if (!notification.isRead) {
        markAsRead(notification.id);
      }

      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }
    },
    [navigate, markAsRead]
  );

  const setPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  const setPageSizeCallback = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const setFiltersCallback = useCallback(
    (newFilters: NotificationFilterOptions) => {
      setFilters(newFilters);
      setCurrentPage(1);
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
    notifications,
    allNotifications,
    unreadCount,
    isLoading,
    error,
    totalCount,
    currentPage,
    pageSize,
    totalPages,
    filters,
    filteredCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    bulkDelete,
    addNotification,
    handleNotificationAction,
    setPage,
    setPageSize: setPageSizeCallback,
    setFilters: setFiltersCallback,
    resetFilters,
    refetch,
  };
}
