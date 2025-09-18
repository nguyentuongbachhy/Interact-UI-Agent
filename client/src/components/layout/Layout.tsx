import { useState, type ReactNode } from "react";
import {
  Package,
  Home,
  Plus,
  Search,
  Settings,
  BarChart3,
  Tag,
} from "lucide-react";
import { Header } from "./Header";
import { Button } from "../ui";
import type { User } from "../../types";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: string | number;
}

interface LayoutProps {
  children: ReactNode;
  user?: User;
  onLogout?: () => void;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  title?: string;
  showSidebar?: boolean;
}

const defaultNavigation: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Overview",
    icon: Home,
    href: "/",
  },
  {
    id: "products",
    label: "Products",
    icon: Package,
    href: "/products",
  },
  {
    id: "add-product",
    label: "Add New Product",
    icon: Plus,
    href: "/products/new",
  },
  {
    id: "search",
    label: "Search",
    icon: Search,
    href: "/search",
  },
  {
    id: "categories",
    label: "categories",
    icon: Tag,
    href: "/categories",
  },
  {
    id: "analytics",
    label: "Statistics",
    icon: BarChart3,
    href: "/analytics",
    badge: "Pro",
  },
];

export function Layout({
  children,
  user,
  onLogout,
  currentPath = "/",
  onNavigate,
  title,
  showSidebar = true,
}: LayoutProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleMenuToggle = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleNavigate = (path: string) => {
    onNavigate?.(path);
    setShowMobileMenu(false);
  };

  const isActivePath = (href: string) => {
    if (href === "/" && currentPath === "/") return true;
    if (href !== "/" && currentPath.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        onLogout={onLogout}
        onMenuToggle={handleMenuToggle}
        showMobileMenu={showMobileMenu}
        title={title}
      />

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 lg:z-40">
              <div className="flex flex-col flex-1 bg-white border-r border-gray-200">
                <nav className="flex-1 px-3 py-6 space-y-1">
                  {defaultNavigation.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => item.href && handleNavigate(item.href)}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left transition-colors ${
                        isActivePath(item.href || "")
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <item.icon
                        className={`mr-3 flex-shrink-0 h-5 w-5 ${
                          isActivePath(item.href || "")
                            ? "text-blue-500"
                            : "text-gray-400 group-hover:text-gray-500"
                        }`}
                      />
                      {item.label}
                      {item.badge && (
                        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>

                {/* Footer section */}
                <div className="p-4 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleNavigate("/settings")}
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Settings
                  </Button>
                </div>
              </div>
            </aside>

            {/* Mobile Sidebar */}
            {showMobileMenu && (
              <>
                {/* Overlay */}
                <div
                  className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
                  onClick={() => setShowMobileMenu(false)}
                />

                {/* Sidebar panel */}
                <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white lg:hidden">
                  <div className="flex flex-col h-full pt-16">
                    <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                      {defaultNavigation.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => item.href && handleNavigate(item.href)}
                          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                            isActivePath(item.href || "")
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <item.icon
                            className={`mr-3 flex-shrink-0 h-5 w-5 ${
                              isActivePath(item.href || "")
                                ? "text-blue-500"
                                : "text-gray-400 group-hover:text-gray-500"
                            }`}
                          />
                          {item.label}
                          {item.badge && (
                            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </nav>

                    <div className="p-4 border-t border-gray-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleNavigate("/settings")}
                      >
                        <Settings className="mr-3 h-4 w-4" />
                        Settings
                      </Button>
                    </div>
                  </div>
                </aside>
              </>
            )}
          </>
        )}

        {/* Main content */}
        <main className={`flex-1 ${showSidebar ? "lg:pl-64" : ""}`}>
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
