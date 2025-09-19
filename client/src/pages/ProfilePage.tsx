import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, User, Lock, Settings, RefreshCw } from "lucide-react";
import { Button } from "../components/ui";
import { ProfileForm, PasswordChangeForm } from "../components/profile";
import { useProfile } from "../hooks/useProfile";
import { ROUTES } from "../utils";

type TabType = "profile" | "password" | "settings";

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const {
    user,
    isLoading,
    error,
    updateProfile,
    changePassword,
    uploadAvatar,
    removeAvatar,
    clearError,
  } = useProfile();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const tabs = [
    {
      id: "profile" as TabType,
      label: "Personal Information",
      icon: User,
    },
    {
      id: "password" as TabType,
      label: "Change Password",
      icon: Lock,
    },
    {
      id: "settings" as TabType,
      label: "Account Settings",
      icon: Settings,
    },
  ];

  const handleAvatarUpload = async (file: File) => {
    await uploadAvatar(file);
  };

  const handleAvatarRemove = async () => {
    await removeAvatar();
  };

  return (
    <div className="space-y-6">
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link
          to={ROUTES.HOME}
          className="hover:text-gray-700 transition-colors"
        >
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Profile</span>
      </nav>

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
              <User className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                <p className="text-gray-600 mt-1">
                  Manage your account information
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearError}
          className="flex items-center"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "profile" && (
            <ProfileForm
              user={user}
              onSubmit={updateProfile}
              onAvatarUpload={handleAvatarUpload}
              onAvatarRemove={handleAvatarRemove}
              loading={isLoading}
              error={error ?? undefined}
            />
          )}

          {activeTab === "password" && (
            <PasswordChangeForm
              onSubmit={changePassword}
              loading={isLoading}
              error={error ?? undefined}
            />
          )}

          {activeTab === "settings" && (
            <div className="text-center py-12">
              <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Account Settings
              </h3>
              <p className="text-gray-600 mb-4">
                Advanced account settings will be available soon
              </p>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Account Status
                  </h4>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Data Export
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Download a copy of your data
                  </p>
                  <Button variant="secondary" size="sm" disabled>
                    Export Data
                  </Button>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-red-900 mb-2">Danger Zone</h4>
                  <p className="text-sm text-red-700 mb-2">
                    Permanently delete your account and all data
                  </p>
                  <Button variant="danger" size="sm" disabled>
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
