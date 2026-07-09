import { QueryClient, keepPreviousData } from "@tanstack/react-query";

// Single factory so server and client construct identical defaults.
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000, // 1 min — CRM data changes rarely between clicks
        gcTime: 10 * 60_000,
        // Keep showing the last data while a refetch (filter/search change,
        // route revisit) runs — no spinner flash, so the UI feels instant.
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
