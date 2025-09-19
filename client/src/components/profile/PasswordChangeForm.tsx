import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "../ui";
import { getValidationRule } from "../../utils/constants";

const passwordSchema = z
  .object({
    currentPassword: z.string().nonempty("Current password is required"),
    newPassword: z
      .string()
      .min(6, getValidationRule("PASSWORD", "MIN_LENGTH"))
      .max(32, getValidationRule("PASSWORD", "MAX_LENGTH")),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: getValidationRule("PASSWORD", "MISMATCH"),
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

interface PasswordChangeFormProps {
  onSubmit: (data: PasswordFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export function PasswordChangeForm({
  onSubmit,
  loading = false,
  error,
}: PasswordChangeFormProps) {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const newPassword = watch("newPassword");

  const handleFormSubmit = async (data: PasswordFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      // Error handled by parent
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "" };

    let strength = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password),
    ];

    strength = checks.filter(Boolean).length;

    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const colors = ["red", "orange", "yellow", "blue", "green"];

    return {
      strength,
      label: labels[strength - 1] || "",
      color: colors[strength - 1] || "gray",
    };
  };

  const passwordStrength = getPasswordStrength(newPassword || "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lock className="w-5 h-5 mr-2" />
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="relative">
            <Input
              {...register("currentPassword")}
              type={showPasswords.current ? "text" : "password"}
              label="Current Password *"
              placeholder="Enter your current password"
              error={errors.currentPassword?.message}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("current")}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.current ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="relative">
            <Input
              {...register("newPassword")}
              type={showPasswords.new ? "text" : "password"}
              label="New Password *"
              placeholder="Enter your new password"
              error={errors.newPassword?.message}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("new")}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.new ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {newPassword && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Password Strength:</span>
                <span
                  className={`font-medium text-${passwordStrength.color}-600`}
                >
                  {passwordStrength.label}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full bg-${passwordStrength.color}-500 transition-all duration-300`}
                  style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Password should contain:</p>
                <ul className="ml-2 space-y-1">
                  <li
                    className={
                      /^.{8,}$/.test(newPassword)
                        ? "text-green-600"
                        : "text-gray-400"
                    }
                  >
                    • At least 8 characters
                  </li>
                  <li
                    className={
                      /[a-z]/.test(newPassword)
                        ? "text-green-600"
                        : "text-gray-400"
                    }
                  >
                    • Lowercase letter
                  </li>
                  <li
                    className={
                      /[A-Z]/.test(newPassword)
                        ? "text-green-600"
                        : "text-gray-400"
                    }
                  >
                    • Uppercase letter
                  </li>
                  <li
                    className={
                      /\d/.test(newPassword)
                        ? "text-green-600"
                        : "text-gray-400"
                    }
                  >
                    • Number
                  </li>
                  <li
                    className={
                      /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
                        ? "text-green-600"
                        : "text-gray-400"
                    }
                  >
                    • Special character
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div className="relative">
            <Input
              {...register("confirmPassword")}
              type={showPasswords.confirm ? "text" : "password"}
              label="Confirm New Password *"
              placeholder="Re-enter your new password"
              error={errors.confirmPassword?.message}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirm")}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.confirm ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="text-sm text-yellow-800">
              <strong>Important:</strong> After changing your password, you will
              need to log in again on all devices.
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              className="flex items-center"
            >
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
