import { QueryClient } from "@tanstack/react-query";

/**
 * Global React Query client configuration
 * Handles server state management, caching, and synchronization
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * Retry failed queries up to 2 times
       * Skip retries on 4xx errors (client errors)
       */
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) {
          return false; // Don't retry client errors
        }
        return failureCount < 2; // Retry up to 2 times for server errors
      },

      /**
       * Cache time: Keep cached data for 5 minutes
       */
      gcTime: 5 * 60 * 1000,

      /**
       * Stale time: Consider data fresh for 1 minute
       * After this, data is "stale" but still used from cache
       */
      staleTime: 1 * 60 * 1000,

      /**
       * Disable automatic refetch on window focus
       * Set to false to reduce unnecessary API calls
       */
      refetchOnWindowFocus: false,

      /**
       * Refetch stale/invalidated data when component mounts
       * This ensures fresh data after mutations (e.g., delete tenant)
       */
      refetchOnMount: true,

      /**
       * Disable automatic refetch when internet reconnects
       */
      refetchOnReconnect: false,
    },

    mutations: {
      /**
       * Retry mutations up to 1 time on network errors
       */
      retry: 1,
    },
  },
});

/**
 * Utility: Reset all query caches
 * Useful for logout flows
 */
export function resetQueryCache() {
  queryClient.clear();
}

/**
 * Utility: Invalidate specific query by key
 * Forces refetch on next access
 */
export function invalidateQuery(queryKey: string[]) {
  queryClient.invalidateQueries({ queryKey });
}
