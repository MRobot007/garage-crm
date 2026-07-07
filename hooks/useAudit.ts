"use client";

import { useQuery } from "@tanstack/react-query";
import { getJSON } from "@/lib/fetcher";
import type { AuditEntry } from "@/lib/types";
import { qk } from "./keys";

export interface AuditFilters {
  entity?: string;
  q?: string;
}

export function useAudit(filters: AuditFilters = {}) {
  const params = new URLSearchParams();
  if (filters.entity && filters.entity !== "all") params.set("entity", filters.entity);
  if (filters.q) params.set("q", filters.q);
  const qs = params.toString();
  return useQuery({
    queryKey: [...qk.audit, filters],
    queryFn: () => getJSON<AuditEntry[]>(`/api/audit${qs ? `?${qs}` : ""}`),
  });
}
