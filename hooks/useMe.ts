"use client";

import { useQuery } from "@tanstack/react-query";
import { getJSON } from "@/lib/fetcher";
import type { Me } from "@/lib/types";
import { qk } from "./keys";

/** The currently logged-in user (role drives what nav/pages they can access). */
export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: () => getJSON<Me>("/api/auth/me"),
    staleTime: 5 * 60_000,
    retry: false,
  });
}
