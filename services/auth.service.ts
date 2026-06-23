import { api } from "@/lib/api";

export const authService = {
  forgotPassword: (email: string) =>
    api.post<{ email: string; password: string; message: string }>(
      "/auth/forgot-password",
      { email }
    ),
};
