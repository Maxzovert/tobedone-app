import { api } from "@/lib/api";
import { User } from "@/types";

export const profileService = {
  get: () => api.get<User>("/profile"),
  update: (data: Partial<Pick<User, "name" | "avatar" | "designation">>) =>
    api.patch<User>("/profile", data),
};
