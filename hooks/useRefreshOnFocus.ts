import { useCallback } from "react";
import { useFocusEffect } from "expo-router";

/** Refetch data each time the screen gains focus (e.g. tab switch). */
export function useRefreshOnFocus(refetch: () => void) {
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
}
