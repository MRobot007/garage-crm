"use client";

import { useQuery } from "@tanstack/react-query";
import { getJSON } from "@/lib/fetcher";
import type { ReportsData } from "@/lib/types";
import { qk } from "./keys";

export function useReports() {
  return useQuery({
    queryKey: qk.reports,
    queryFn: () => getJSON<ReportsData>("/api/reports"),
  });
}
