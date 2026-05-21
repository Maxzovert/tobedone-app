import * as SecureStore from "expo-secure-store";
import { ApiResponse } from "@/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

let authToken: string | null = null;

export async function loadToken() {
  authToken = await SecureStore.getItemAsync("auth_token");
  return authToken;
}

export async function setToken(token: string | null) {
  authToken = token;
  if (token) {
    await SecureStore.setItemAsync("auth_token", token);
  } else {
    await SecureStore.deleteItemAsync("auth_token");
  }
}

export function getApiUrl() {
  return API_URL;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
  });

  const json = (await res.json()) as ApiResponse<T>;
  return json;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: async (uri: string, name: string, type: string) => {
    const formData = new FormData();
    formData.append("file", {
      uri,
      name,
      type,
    } as unknown as Blob);

    const headers: Record<string, string> = {};
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    const res = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
    return (await res.json()) as ApiResponse<{ url: string }>;
  },
};
