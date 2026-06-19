import { AppState, AppStateStatus } from "react-native";
import { getApiUrl } from "@/lib/getApiUrl";

/** Match GitHub Actions keep-render-awake (every 5 min). */
export const KEEP_AWAKE_INTERVAL_MS = 5 * 60 * 1000;

export async function pingBackendHealth(): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    await fetch(`${getApiUrl()}/health`, {
      method: "GET",
      signal: controller.signal,
    });
  } catch {
    /* ignore — Render may still be waking */
  } finally {
    clearTimeout(timeout);
  }
}

export function startKeepBackendAwake(): () => void {
  void pingBackendHealth();

  const interval = setInterval(() => {
    if (AppState.currentState === "active") {
      void pingBackendHealth();
    }
  }, KEEP_AWAKE_INTERVAL_MS);

  const onAppState = (state: AppStateStatus) => {
    if (state === "active") {
      void pingBackendHealth();
    }
  };

  const sub = AppState.addEventListener("change", onAppState);

  return () => {
    clearInterval(interval);
    sub.remove();
  };
}
