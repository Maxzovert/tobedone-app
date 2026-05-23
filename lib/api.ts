import { ApiResponse } from "@/types";

export type ApiResult<T> = ApiResponse<T> & { httpStatus?: number };
import { getApiUrl } from "./getApiUrl";
import { getStoredToken, setStoredToken } from "./authStorage";

let authToken: string | null = null;

export async function loadToken() {
  authToken = await getStoredToken();
  return authToken;
}

export async function setToken(token: string | null) {
  authToken = token;
  await setStoredToken(token);
}

export { getApiUrl };

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  try {
    const res = await fetch(`${getApiUrl()}/api${path}`, {
      ...options,
      headers,
    });

    const json = (await res.json()) as ApiResponse<T>;
    return { ...json, httpStatus: res.status };
  } catch {
    return {
      success: false,
      httpStatus: 0,
      error: `Cannot reach API at ${getApiUrl()}. Start the backend (npm run dev in /backend) and allow port 3000 in Windows Firewall if using a physical phone.`,
    };
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: async (
    uri: string,
    name: string,
    type: string,
    fields?: Record<string, string>
  ) => {
    const formData = new FormData();
    formData.append("file", {
      uri,
      name,
      type,
    } as unknown as Blob);
    if (fields) {
      for (const [key, value] of Object.entries(fields)) {
        formData.append(key, value);
      }
    }

    const headers: Record<string, string> = {};
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    try {
      const res = await fetch(`${getApiUrl()}/api/upload`, {
        method: "POST",
        headers,
        body: formData,
      });
      return (await res.json()) as ApiResponse<{ url: string }>;
    } catch {
      return {
        success: false,
        error: `Cannot reach API at ${getApiUrl()}. Start the backend (npm run dev in /backend) and allow port 3000 in Windows Firewall if using a physical phone.`,
      };
    }
  },
};
