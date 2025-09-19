import { useRef, useState } from "react";
import { Camera, User, Upload, X } from "lucide-react";
import { Button } from "../ui";
import type { User as UserType } from "../../types";

interface AvatarUploadProps {
  user: UserType;
  onUpload?: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  loading?: boolean;
}

export function AvatarUpload({
  user,
  onUpload,
  onRemove,
  loading = false,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      await onUpload?.(file);
      setPreviewUrl(null);
    } catch (error) {
      setPreviewUrl(null);
    }
  };

  const handleRemove = async () => {
    if (confirm("Are you sure you want to remove your avatar?")) {
      try {
        await onRemove?.();
      } catch (error) {
        console.error("Failed to remove avatar:", error);
      }
    }
  };

  const displayImage = previewUrl || user.avatar;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
          {displayImage ? (
            <img
              src={displayImage}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <User className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 flex items-center justify-center">
          <Camera
            className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
            onClick={handleFileSelect}
          />
        </div>
      </div>

      <div className="flex space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleFileSelect}
          disabled={loading}
          className="flex items-center"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Photo
        </Button>

        {user.avatar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={loading}
            className="flex items-center text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <p className="text-xs text-gray-500 text-center max-w-xs">
        Recommended: Square image, at least 200x200px. Max file size: 5MB
      </p>
    </div>
  );
}
