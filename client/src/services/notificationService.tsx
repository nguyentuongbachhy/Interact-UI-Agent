import { apiService } from "./api";
import type { Notification } from "../types/notification";
import { getErrorMessage } from "../utils/constants";

interface GetNotificationsParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: "read" | "unread" | "all";
  query?: string;
  dateRange?: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CreateNotificationRequest {
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "system";
  actionUrl?: string;
  actionText?: string;
  userId?: string;
}

class NotificationService {
  async getNotifications(
    params?: GetNotificationsParams
  ): Promise<NotificationsResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.type && params.type !== "all")
      queryParams.append("type", params.type);
    if (params?.status && params.status !== "all")
      queryParams.append("status", params.status);
    if (params?.query) queryParams.append("query", params.query);
    if (params?.dateRange && params.dateRange !== "all")
      queryParams.append("dateRange", params.dateRange);

    const url = `/notifications${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    try {
      const response = await apiService.get<NotificationsResponse>(url);
      return response.data;
    } catch (error) {
      console.error("[notificationService] Get notifications error:", error);
      throw new Error(getErrorMessage("NOTIFICATION_LOAD_ERROR"));
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiService.get<{ count: number }>(
        "/notifications/unread-count"
      );
      return response.data.count;
    } catch (error) {
      console.error("[notificationService] Get unread count error:", error);
      return 0;
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      await apiService.patch(`/notifications/${id}/read`);
    } catch (error) {
      console.error("[notificationService] Mark as read error:", error);
      throw new Error(getErrorMessage("NOTIFICATION_MARK_READ_ERROR"));
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await apiService.patch("/notifications/mark-all-read");
    } catch (error) {
      console.error("[notificationService] Mark all as read error:", error);
      throw new Error("Failed to mark all notifications as read");
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      await apiService.delete(`/notifications/${id}`);
    } catch (error) {
      console.error("[notificationService] Delete notification error:", error);
      throw new Error("Failed to delete notification");
    }
  }

  async bulkDelete(ids: string[]): Promise<void> {
    try {
      await apiService.post("/notifications/bulk-delete", { ids });
    } catch (error) {
      console.error("[notificationService] Bulk delete error:", error);
      throw new Error("Failed to delete notifications");
    }
  }

  async createNotification(
    data: CreateNotificationRequest
  ): Promise<Notification> {
    try {
      const response = await apiService.post<Notification>(
        "/notifications",
        data
      );
      return response.data;
    } catch (error) {
      console.error("[notificationService] Create notification error:", error);
      throw new Error("Failed to create notification");
    }
  }

  async getNotificationById(id: string): Promise<Notification> {
    try {
      const response = await apiService.get<Notification>(
        `/notifications/${id}`
      );
      return response.data;
    } catch (error) {
      console.error(
        "[notificationService] Get notification by ID error:",
        error
      );
      throw new Error("Failed to get notification");
    }
  }

  async updateNotification(
    id: string,
    data: Partial<Notification>
  ): Promise<Notification> {
    try {
      const response = await apiService.put<Notification>(
        `/notifications/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("[notificationService] Update notification error:", error);
      throw new Error("Failed to update notification");
    }
  }

  async getNotificationSettings(): Promise<{
    browser: boolean;
    email: boolean;
    push: boolean;
  }> {
    try {
      const response = await apiService.get("/notifications/settings");
      return response.data;
    } catch (error) {
      console.error("[notificationService] Get settings error:", error);
      return { browser: true, email: false, push: false };
    }
  }

  async updateNotificationSettings(settings: {
    browser?: boolean;
    email?: boolean;
    push?: boolean;
  }): Promise<void> {
    try {
      await apiService.put("/notifications/settings", settings);
    } catch (error) {
      console.error("[notificationService] Update settings error:", error);
      throw new Error("Failed to update notification settings");
    }
  }
}

export const notificationService = new NotificationService();
