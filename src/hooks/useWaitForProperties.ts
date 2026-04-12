import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";

/**
 * Hook that waits for both authentication AND property loading to complete.
 * Prevents race conditions where routing happens before data is ready.
 *
 * Returns:
 * - isReady: boolean - true when both auth and properties are loaded
 * - hasProperties: boolean - true if user has at least one property
 * - isLoading: boolean - true while still loading
 */
export function useWaitForProperties() {
  const { user, loading: authLoading } = useAuth();
  const { properties, loading: propLoading } = useProperty();
  const { isDemo } = useDemo();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // In demo mode, always ready
    if (isDemo) {
      setIsReady(true);
      return;
    }

    // Ready when:
    // 1. Auth is loaded (either user exists or not)
    // 2. Properties are loaded (either exist or empty array)
    const isAuthLoaded = !authLoading;
    const arePropertiesLoaded = !propLoading;

    if (isAuthLoaded && arePropertiesLoaded) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [authLoading, propLoading, isDemo]);

  return {
    isReady,
    hasProperties: properties && properties.length > 0,
    isLoading: authLoading || propLoading,
    user,
    properties,
  };
}
