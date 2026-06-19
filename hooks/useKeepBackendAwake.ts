import { useEffect } from "react";
import { startKeepBackendAwake } from "@/lib/keepBackendAwake";

/**
 * Pings GET /health every 5 minutes while the app is open (and on resume),
 * so Render free tier stays warm during active use.
 */
export function useKeepBackendAwake() {
  useEffect(() => startKeepBackendAwake(), []);
}
