import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "../ui";

import { getValidationRule } from "../../utils/constants";

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, getValidationRule("NAME", "MIN_LENGTH"))
      .max(50, getValidationRule("NAME", "MAX_LENGTH")),
    email: z
      .email(getValidationRule("EMAIL", "INVALID"))
      .nonempty(getValidationRule("EMAIL", "REQUIRED")),
    password: z
      .string()
      .min(6, getValidationRule("PASSWORD", "MIN_LENGTH"))
      .max(32, getValidationRule("PASSWORD", "MAX_LENGTH")),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: getValidationRule("PASSWORD", "MISMATCH"),
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSubmit: (data: Omit<RegisterFormData, "confirmPassword">) => Promise<void>;
  loading?: boolean;
  error?: string;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({
  onSubmit,
  loading,
  error,
  onSwitchToLogin,
}: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const handleFormSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...submitData } = data;
    return onSubmit(submitData);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Register</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Input
            {...register("name")}
            type="text"
            label="Fullname"
            placeholder="Enter your fullname"
            error={errors.name?.message}
            autoComplete="name"
          />

          <Input
            {...register("email")}
            type="email"
            label="Email"
            placeholder="Enter your email"
            error={errors.email?.message}
            autoComplete="email"
          />

          <Input
            {...register("password")}
            type="password"
            label="Password"
            placeholder="Enter your password"
            error={errors.password?.message}
            autoComplete="new-password"
          />

          <Input
            {...register("confirmPassword")}
            type="password"
            label="Confirm Password"
            placeholder="Re-enter your password"
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
          />

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            Register
          </Button>

          {onSwitchToLogin && (
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Login now
                </button>
              </span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
