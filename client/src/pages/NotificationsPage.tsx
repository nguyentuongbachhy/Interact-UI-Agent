import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, RefreshCw, Settings, Trash2 } from "lucide-react";
import { Button } from "../components/ui";
import {
  NotificationList,
  NotificationFilters,
  type NotificationFilterOptions,
} from "../components/notification";
import { useNotifications } from "../hooks";
import { ROUTES } from "../utils";

const NotificationsPage: React.FC = () => {
  const {
    notifications,
    allNotifications,
    unreadCount,
    isLoading,
    error,
    totalCount,
    currentPage,
    pageSize,
    filters,
    filteredCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    bulkDelete,
    handleNotificationAction,
    setPage,
    setFilters,
    resetFilters,
    refetch,
  } = useNotifications();

  const handleFiltersChange = (newFilters: NotificationFilterOptions) => {
    setFilters(newFilters);
  };

  const handleBulkDeleteAll = async () => {
    const allIds = allNotifications.map((n) => n.id);
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa TẤT CẢ ${allIds.length} thông báo?\nHành động này không thể hoàn tác.`
    );

    if (confirmed) {
      bulkDelete(allIds);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <Link
            to={ROUTES.HOME}
            className="hover:text-gray-700 transition-colors"
          >
            Home
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Notification</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <Link to={ROUTES.HOME}>
              <Button variant="ghost" size="sm" className="flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>

            <div>
              <div className="flex items-center space-x-3">
                <Bell className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Notification
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage all your notifications
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
              className="flex items-center"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            {totalCount > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkDeleteAll}
                className="flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete all
              </Button>
            )}

            <Button variant="ghost" size="sm" className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-blue-600">
              {unreadCount}
            </div>
            <div className="text-sm text-gray-600">Unread</div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-green-600">
              {totalCount - unreadCount}
            </div>
            <div className="text-sm text-gray-600">Read</div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-purple-600">
              {filteredCount}
            </div>
            <div className="text-sm text-gray-600">Currently display</div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading notification
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Button variant="secondary" size="sm" onClick={refetch}>
                  Try again
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <NotificationFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={resetFilters}
        totalCount={totalCount}
        filteredCount={filteredCount}
      />

      {/* Notifications List */}
      <NotificationList
        notifications={notifications}
        loading={isLoading}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
        onAction={handleNotificationAction}
        onBulkDelete={bulkDelete}
        totalCount={filteredCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      {/* Bottom Actions */}
      {totalCount > 0 && !isLoading && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Manage notification
            </h3>
            <p className="text-gray-600 mb-4">
              You can configure how to receive notifications in the settings.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="secondary"
                onClick={() => {
                  // Navigate to notification settings
                  console.log("Navigate to notification settings");
                }}
                className="flex items-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                Set up notifications
              </Button>

              {unreadCount > 0 && (
                <Button
                  variant="primary"
                  onClick={markAllAsRead}
                  className="flex items-center"
                >
                  Mark {unreadCount} notifications as read
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Tips for using notifications
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="space-y-1 list-disc list-inside">
                <li>Use filters to quickly search for notifications</li>
                <li>Click on the notifications to take related actions</li>
                <li>
                  Use bulk actions to manage multiple notifications at once
                </li>
                <li>Notifications are grouped by time for easier tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
