import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { authService } from "../services";
import { useAppStore } from "../store";
import type { User } from "../types";

interface UseProfileReturn {
  user: User | null;
  isLoading: boolean;
  isUpdating: boolean;
  isChangingPassword: boolean;
  isUploadingAvatar: boolean;
  error: string | null;

  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  clearError: () => void;
}

export function useProfile(): UseProfileReturn {
  const { user, updateUser } = useAuth();
  const { showToast } = useAppStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(
    async (data: Partial<User>) => {
      if (!user) return;

      setIsUpdating(true);
      setError(null);

      try {
        const updatedUser = await authService.updateProfile(data);
        updateUser(updatedUser);
        showToast("Profile updated successfully", "success");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update profile";
        setError(message);
        showToast(message, "error");
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [user, updateUser, showToast]
  );

  const changePassword = useCallback(
    async (data: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => {
      setIsChangingPassword(true);
      setError(null);

      try {
        await authService.changePassword(data);
        showToast("Password changed successfully", "success");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to change password";
        setError(message);
        showToast(message, "error");
        throw err;
      } finally {
        setIsChangingPassword(false);
      }
    },
    [showToast]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user) return;

      setIsUploadingAvatar(true);
      setError(null);

      try {
        const { avatarUrl } = await authService.uploadAvatar(file);
        const updatedUser = { ...user, avatar: avatarUrl };
        updateUser(updatedUser);
        showToast("Avatar uploaded successfully", "success");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to upload avatar";
        setError(message);
        showToast(message, "error");
        throw err;
      } finally {
        setIsUploadingAvatar(false);
      }
    },
    [user, updateUser, showToast]
  );

  const removeAvatar = useCallback(async () => {
    if (!user) return;

    setIsUploadingAvatar(true);
    setError(null);

    try {
      await authService.removeAvatar();
      const updatedUser = { ...user, avatar: undefined };
      updateUser(updatedUser);
      showToast("Avatar removed successfully", "success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove avatar";
      setError(message);
      showToast(message, "error");
      throw err;
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [user, updateUser, showToast]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isLoading: isUpdating || isChangingPassword || isUploadingAvatar,
    isUpdating,
    isChangingPassword,
    isUploadingAvatar,
    error,
    updateProfile,
    changePassword,
    uploadAvatar,
    removeAvatar,
    clearError,
  };
}
