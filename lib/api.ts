import { ApiResponse } from "@/types";

export type ApiResult<T> = ApiResponse<T> & { httpStatus?: number };
import { getApiUrl } from "./getApiUrl";
import { getStoredToken, setStoredToken } from "./authStorage";

let authToken: string | null = null;

/** Load token from storage, or use a token you already read (e.g. hydrate). */
export async function loadToken(existing?: string | null) {
  authToken = existing ?? (await getStoredToken());
  return authToken;
}

export async function setToken(token: string | null) {
  authToken = token;
  await setStoredToken(token);
}

export { getApiUrl };

type RequestOptions = RequestInit & { timeoutMs?: number };

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResult<T>> {
  const { timeoutMs, ...fetchOptions } = options;
  const method = (fetchOptions.method ?? "GET").toUpperCase();
  const hasBody = fetchOptions.body != null && fetchOptions.body !== "";
  const headers: Record<string, string> = {
    ...(hasBody || method === "POST" || method === "PATCH" || method === "PUT"
      ? { "Content-Type": "application/json" }
      : {}),
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const controller = timeoutMs ? new AbortController() : null;
  const timeoutId =
    controller && timeoutMs
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;

  try {
    const res = await fetch(`${getApiUrl()}/api${path}`, {
      ...fetchOptions,
      headers,
      signal: controller?.signal,
    });

    let json: ApiResponse<T> | null = null;
    try {
      const text = await res.text();
      if (!text) {
        if (res.ok) {
          return { success: true, httpStatus: res.status };
        }
        return {
          success: false,
          httpStatus: res.status,
          error:
            res.status === 404
              ? "This feature is not available on the server yet. Deploy the latest backend."
              : `Server returned ${res.status} with an empty response.`,
        };
      }
      json = JSON.parse(text) as ApiResponse<T>;
    } catch {
      return {
        success: false,
        httpStatus: res.status,
        error:
          res.status === 404
            ? "Endpoint not found. Deploy the latest backend to Render."
            : `Invalid server response (${res.status}).`,
      };
    }

    if (res.ok) {
      if (json.success === false) {
        return {
          success: false,
          error: json.error ?? `Request failed (${res.status})`,
          httpStatus: res.status,
        };
      }
      return {
        success: true,
        data: json.data !== undefined ? json.data : (json as unknown as T),
        httpStatus: res.status,
      };
    }

    return {
      success: false,
      error: json.error ?? `Request failed (${res.status})`,
      httpStatus: res.status,
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return {
        success: false,
        httpStatus: 0,
        error: "Request timed out. The server may be waking up — try again.",
      };
    }
    return {
      success: false,
      httpStatus: 0,
      error: `Cannot reach API at ${getApiUrl()}. Start the backend (npm run dev in /backend) and allow port 3000 in Windows Firewall if using a physical phone.`,
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, options),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  /** POST fallback when DELETE is blocked by a proxy or device network stack. */
  postEmpty: <T>(path: string) =>
    request<T>(path, { method: "POST", body: JSON.stringify({}) }),
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
