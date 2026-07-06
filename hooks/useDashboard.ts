"use client";

import { useQuery } from "@tanstack/react-query";
import { getJSON } from "@/lib/fetcher";
import type { DashboardData } from "@/lib/types";
import { qk } from "./keys";

export function useDashboard() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: () => getJSON<DashboardData>("/api/dashboard"),
  });
}
