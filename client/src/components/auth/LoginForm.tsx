import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "../ui";

import { getValidationRule } from "../../utils/constants";

const loginSchema = z.object({
  email: z
    .email(getValidationRule("EMAIL", "INVALID"))
    .nonempty(getValidationRule("EMAIL", "REQUIRED")),
  password: z
    .string()
    .min(6, getValidationRule("PASSWORD", "MIN_LENGTH"))
    .max(32, getValidationRule("PASSWORD", "MAX_LENGTH")),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  onSwitchToRegister?: () => void;
}

export function LoginForm({
  onSubmit,
  loading,
  error,
  onSwitchToRegister,
}: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            autoComplete="current-password"
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
            Login
          </Button>

          {onSwitchToRegister && (
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Do not have an account?{" "}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Register
                </button>
              </span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
