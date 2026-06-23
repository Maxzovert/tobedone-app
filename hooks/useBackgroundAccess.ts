import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { ensureBackgroundAccess } from "@/lib/backgroundAccess";

/**
 * After login, asks the user for notification permission and (Android) battery
 * unrestricted access so reminders work when the app is in the background.
 */
export function useBackgroundAccess(enabled: boolean) {
  const asked = useRef(false);

  useEffect(() => {
    if (!enabled || Platform.OS === "web" || asked.current) return;
    asked.current = true;
    void ensureBackgroundAccess();
  }, [enabled]);
}
