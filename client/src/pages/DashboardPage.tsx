import React from "react";
import { Link } from "react-router-dom";
import { Package, Plus, Search, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from "../components/ui";
import { useDashboard, useProductStats } from "../hooks";
import { ROUTES, formatCurrency, formatNumber } from "../utils";

const DashboardPage: React.FC = () => {
  const { recentProducts, isLoading } = useDashboard();
  const stats = useProductStats();

  const quickStats = [
    {
      title: "Total product",
      value: formatNumber(stats.total),
      icon: Package,
      color: "blue",
      description: "Total products in stock",
    },
    {
      title: "In stock",
      value: formatNumber(stats.inStock),
      icon: TrendingUp,
      color: "green",
      description: "The product is available",
    },
    {
      title: "Out of stock",
      value: formatNumber(stats.outOfStock),
      icon: Package,
      color: "red",
      description: "The product needs to be restocked.",
    },
    {
      title: "Total price",
      value: formatCurrency(stats.totalValue),
      icon: TrendingUp,
      color: "purple",
      description: "Total inventory pricing",
    },
  ];

  const quickActions = [
    {
      title: "Add product",
      description: "Add new product to inventory",
      icon: Plus,
      to: ROUTES.PRODUCT_NEW,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Search",
      description: "Search product",
      icon: Search,
      to: ROUTES.SEARCH,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "List of products",
      description: "View all",
      icon: Package,
      to: ROUTES.PRODUCTS,
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of the product management system
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <Card
            key={stat.title}
            className="hover:shadow-md transition-shadow px-1 py-3"
          >
            <CardContent className="">
              <div className="flex items-center">
                <div
                  className={`flex-shrink-0 p-3 rounded-lg ${
                    stat.color === "blue"
                      ? "bg-blue-100 text-blue-600"
                      : stat.color === "green"
                      ? "bg-green-100 text-green-600"
                      : stat.color === "red"
                      ? "bg-red-100 text-red-600"
                      : "bg-purple-100 text-purple-600"
                  }`}
                >
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.to}
                className="group block p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <div
                    className={`flex-shrink-0 p-3 rounded-lg text-white transition-colors ${action.color}`}
                  >
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-gray-700">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent products</CardTitle>
            <Link to={ROUTES.PRODUCTS}>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-200 h-16 w-16 rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="bg-gray-200 h-4 w-3/4 rounded" />
                      <div className="bg-gray-200 h-4 w-1/2 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No products available
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by adding the first product.
              </p>
              <div className="mt-6">
                <Link to={ROUTES.PRODUCT_NEW}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add product
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(product.price)} • SL: {product.quantity}
                    </p>
                    {product.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                        {product.category}
                      </span>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <Link
                      to={`/products/${product.id}`}
                      className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {stats.lowStock > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Low stock warning
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You have {stats.lowStock} products with low quantity (below
                    5).
                    <Link
                      to={ROUTES.PRODUCTS}
                      className="font-medium underline"
                    >
                      View list
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
