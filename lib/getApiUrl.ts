import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = process.env.EXPO_PUBLIC_API_PORT ?? "3000";

function metroHost(): string | undefined {
  const hostUri = Constants.expoConfig?.hostUri;
  return hostUri?.split(":")[0];
}

function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname, port } = new URL(url);
    const local = hostname === "localhost" || hostname === "127.0.0.1";
    if (!local) return false;
    return !port || port === API_PORT;
  } catch {
    return /localhost|127\.0\.0\.1/.test(url);
  }
}

function lanApiUrl(host: string) {
  return `http://${host}:${API_PORT}`;
}

/**
 * Resolves the backend URL. In dev, Expo Metro's host IP (QR code host) is used
 * first so the URL stays correct when your LAN IP changes.
 */
export function getApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) {
    if (__DEV__ && Platform.OS === "web" && process.env.EXPO_PUBLIC_USE_LOCAL_API === "true") {
      return lanApiUrl("localhost");
    }

    // localhost in .env is for web/simulator — on a real phone use the PC's LAN IP
    if (__DEV__ && Platform.OS !== "web" && isLocalhostUrl(fromEnv)) {
      const host = metroHost();
      if (host && host !== "localhost" && host !== "127.0.0.1") {
        return lanApiUrl(host);
      }
    }

    return fromEnv;
  }

  if (Platform.OS === "web") {
    return lanApiUrl("localhost");
  }

  const host = metroHost();
  if (host) {
    return lanApiUrl(host);
  }

  if (Platform.OS === "android" && !Constants.isDevice) {
    return lanApiUrl("10.0.2.2");
  }

  if (Platform.OS === "ios" && !Constants.isDevice) {
    return lanApiUrl("localhost");
  }

  return lanApiUrl("localhost");
}
