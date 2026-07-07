"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getJSON, sendJSON } from "@/lib/fetcher";
import type { CrmUser } from "@/lib/types";
import type { UserCreateValues, UserUpdateValues } from "@/lib/schemas";
import { qk } from "./keys";

export function useUsers() {
  return useQuery({
    queryKey: qk.users,
    queryFn: () => getJSON<CrmUser[]>("/api/users"),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: UserCreateValues) =>
      sendJSON<CrmUser>("/api/users", "POST", values),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserUpdateValues }) =>
      sendJSON<CrmUser>(`/api/users/${id}`, "PATCH", values),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      sendJSON<{ id: string }>(`/api/users/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }),
  });
}
