import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "../ui";
import { AvatarUpload } from "./AvatarUpload";
import type { User } from "../../types";
import { getValidationRule } from "../../utils/constants";

const profileSchema = z.object({
  name: z
    .string()
    .min(2, getValidationRule("NAME", "MIN_LENGTH"))
    .max(50, getValidationRule("NAME", "MAX_LENGTH")),
  email: z
    .email(getValidationRule("EMAIL", "INVALID"))
    .nonempty(getValidationRule("EMAIL", "REQUIRED")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: User;
  onSubmit: (data: ProfileFormData) => Promise<void>;
  onAvatarUpload?: (file: File) => Promise<void>;
  onAvatarRemove?: () => Promise<void>;
  loading?: boolean;
  error?: string;
}

export function ProfileForm({
  user,
  onSubmit,
  onAvatarUpload,
  onAvatarRemove,
  loading = false,
  error,
}: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            user={user}
            onUpload={onAvatarUpload}
            onRemove={onAvatarRemove}
            loading={loading}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register("name")}
              label="Full Name *"
              placeholder="Enter your full name"
              error={errors.name?.message}
              disabled={loading}
            />

            <Input
              {...register("email")}
              type="email"
              label="Email Address *"
              placeholder="Enter your email"
              error={errors.email?.message}
              disabled={loading}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Updated
                </label>
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                  {new Date(user.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                loading={loading}
                disabled={loading || !isDirty}
                className="flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
