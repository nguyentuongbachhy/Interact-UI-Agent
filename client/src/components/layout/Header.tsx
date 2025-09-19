import { useState } from "react";
import {
  Package,
  User as Avatar,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
} from "lucide-react";
import { Button } from "../ui";
import { NotificationBell } from "../notification";
import type { User } from "../../types";

interface HeaderProps {
  user?: User;
  onLogout?: () => void;
  onMenuToggle?: () => void;
  showMobileMenu?: boolean;
  title?: string;
  onNavigate?: (path: string) => void;
}

export function Header({
  user,
  onLogout,
  onMenuToggle,
  showMobileMenu = false,
  title = "Product Manager",
  onNavigate,
}: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleUserMenuToggle = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout?.();
  };

  const handleNavigateToProfile = () => {
    setShowUserMenu(false);
    onNavigate?.("/profile");
  };

  const handleNavigateToSettings = () => {
    setShowUserMenu(false);
    onNavigate?.("/settings");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="mr-3 lg:hidden"
          onClick={onMenuToggle}
        >
          {showMobileMenu ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        {/* Logo and title */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
            <Package className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 hidden sm:block">
            {title}
          </h1>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          {/* Search button (mobile) */}
          <Button variant="ghost" size="sm" className="sm:hidden">
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          {user && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUserMenuToggle}
                className="flex items-center space-x-2 pl-1"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full overflow-hidden">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Avatar className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {user.name}
                </span>
              </Button>

              {/* User dropdown menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 overflow-hidden overflow-ellipsis whitespace-nowrap ">
                          {user.email}
                        </p>
                      </div>

                      <button
                        onClick={handleNavigateToProfile}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Avatar className="mr-3 h-4 w-4" />
                        Profile
                      </button>

                      <button
                        onClick={handleNavigateToSettings}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="mr-3 h-4 w-4" />
                        Settings
                      </button>

                      <hr className="my-1" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="border-t px-4 py-3 sm:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search product..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </header>
  );
}
