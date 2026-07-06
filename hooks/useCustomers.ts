"use client";

import { useQuery } from "@tanstack/react-query";
import { getJSON } from "@/lib/fetcher";
import type { Customer } from "@/lib/types";
import { qk } from "./keys";

export function useCustomers(q?: string) {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  return useQuery({
    queryKey: [...qk.customers, q ?? ""],
    queryFn: () => getJSON<Customer[]>(`/api/customers${query}`),
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: qk.customer(id ?? ""),
    queryFn: () => getJSON<Customer>(`/api/customers/${id}`),
    enabled: Boolean(id),
  });
}
