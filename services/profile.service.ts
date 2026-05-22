import { api } from "@/lib/api";
import { User } from "@/types";

export const profileService = {
  get: () => api.get<User>("/profile"),
  update: (data: Partial<Pick<User, "name" | "avatar" | "designation">>) =>
    api.patch<User>("/profile", data),
  uploadAvatarFromUri: async (localUri: string, mimeType = "image/jpeg") => {
    const ext = mimeType.includes("png") ? "png" : "jpg";
    const uploadRes = await api.upload(localUri, `avatar-${Date.now()}.${ext}`, mimeType);
    if (!uploadRes.success || !uploadRes.data?.url) {
      return { success: false as const, error: uploadRes.error || "Upload failed" };
    }
    return profileService.update({ avatar: uploadRes.data.url });
  },
};
