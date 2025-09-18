import React from "react";
import { useParams } from "react-router-dom";
import { Package, Search, Tag, BarChart3, Settings, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui";

// Product Detail Page
export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Package className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Chi tiết sản phẩm
          </h1>
          <p className="text-gray-600">ID: {id}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Trang chi tiết sản phẩm
            </h3>
            <p className="text-gray-600 mt-2">Tính năng đang được phát triển</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Search Page
export const SearchPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Search className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tìm kiếm</h1>
          <p className="text-gray-600">Tìm kiếm sản phẩm nâng cao</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Trang tìm kiếm
            </h3>
            <p className="text-gray-600 mt-2">Tính năng đang được phát triển</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Categories Page
export const CategoriesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Tag className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh mục</h1>
          <p className="text-gray-600">Quản lý danh mục sản phẩm</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Trang danh mục
            </h3>
            <p className="text-gray-600 mt-2">Tính năng đang được phát triển</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Analytics Page
export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <BarChart3 className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thống kê</h1>
          <p className="text-gray-600">Báo cáo và phân tích dữ liệu</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Trang thống kê
            </h3>
            <p className="text-gray-600 mt-2">Tính năng đang được phát triển</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Settings Page
export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Settings className="h-8 w-8 text-gray-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
          <p className="text-gray-600">Cấu hình hệ thống</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt chung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngôn ngữ
                </label>
                <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giao diện
                </label>
                <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                  <option value="light">Sáng</option>
                  <option value="dark">Tối</option>
                  <option value="auto">Tự động</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông báo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Thông báo email
                </span>
                <input type="checkbox" className="rounded border-gray-300" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Thông báo push
                </span>
                <input type="checkbox" className="rounded border-gray-300" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Thông báo tồn kho thấp
                </span>
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  defaultChecked
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Profile Page
export const ProfilePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <User className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
          <p className="text-gray-600">Quản lý thông tin tài khoản</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Nhập họ và tên"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Nhập email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ảnh đại diện</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="w-12 h-12 text-gray-400" />
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Thay đổi ảnh
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Export default components for lazy loading
export default {
  ProductDetailPage,
  SearchPage,
  CategoriesPage,
  AnalyticsPage,
  SettingsPage,
  ProfilePage,
};
