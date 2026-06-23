import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = process.env.EXPO_PUBLIC_API_PORT ?? "3000";

function metroHost(): string | undefined {
  const hostUri = Constants.expoConfig?.hostUri;
  return hostUri?.split(":")[0];
}

/**
 * Resolves the backend URL. In dev, Expo Metro's host IP (QR code host) is used
 * first so the URL stays correct when your LAN IP changes.
 */
export function getApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) {
    if (__DEV__ && Platform.OS === "web" && process.env.EXPO_PUBLIC_USE_LOCAL_API === "true") {
      return `http://localhost:${API_PORT}`;
    }
    return fromEnv;
  }

  if (Platform.OS === "web") {
    return `http://localhost:${API_PORT}`;
  }

  const host = metroHost();
  if (host) {
    return `http://${host}:${API_PORT}`;
  }

  if (Platform.OS === "android" && !Constants.isDevice) {
    return `http://10.0.2.2:${API_PORT}`;
  }

  if (Platform.OS === "ios" && !Constants.isDevice) {
    return `http://localhost:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
}
