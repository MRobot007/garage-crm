"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { TableWrap, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { UserModal } from "./UserModal";
import { useUsers, useDeleteUser } from "@/hooks/useUsers";
import { useMe } from "@/hooks/useMe";
import { useStaggerReveal } from "@/hooks/useStaggerReveal";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { ApiError } from "@/lib/fetcher";
import type { CrmUser } from "@/lib/types";

function roleTone(role: string): "blue" | "amber" | "neutral" {
  if (role === "owner") return "blue";
  if (role === "manager") return "amber";
  return "neutral";
}

export function TeamView() {
  const toast = useToast();
  const { data: me } = useMe();
  const { data: users, isLoading, isError } = useUsers();
  const del = useDeleteUser();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CrmUser | null>(null);
  const [toDelete, setToDelete] = useState<CrmUser | null>(null);

  const bodyRef = useStaggerReveal<HTMLTableSectionElement>("tr", users?.length ?? 0);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Member removed");
      setToDelete(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn’t remove member");
      setToDelete(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Team Members"
        subtitle="Add your staff and managers and control what each of them can do."
        actions={
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            + Add member
          </Button>
        }
      />

      {isLoading && (
        <div className="flex items-center gap-2 py-16 text-gray-500">
          <Spinner /> Loading team…
        </div>
      )}
      {isError && (
        <p className="py-16 text-center text-sm text-bad">Couldn’t load team members.</p>
      )}

      {users && users.length === 0 && (
        <EmptyState
          title="No team members yet"
          description="Add your first staff or manager account."
          actionLabel="+ Add member"
          onAction={() => { setEditing(null); setModalOpen(true); }}
        />
      )}

      {users && users.length > 0 && (
        <TableWrap>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Username</TH>
              <TH>Role</TH>
              <TH>Status</TH>
              <TH>Added</TH>
              <TH>Sales CSV</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody ref={bodyRef}>
            {users.map((u) => (
              <TR key={u.id}>
                <TD className="font-medium">
                  {u.name}
                  {me?.id === u.id && (
                    <span className="ml-2 text-xs text-gray-400">(you)</span>
                  )}
                </TD>
                <TD className="text-gray-600">{u.username}</TD>
                <TD>
                  <Badge tone={roleTone(u.role)}>
                    {ROLE_LABELS[u.role as Role] ?? u.role}
                  </Badge>
                </TD>
                <TD>
                  {u.active ? (
                    <Badge tone="green">Active</Badge>
                  ) : (
                    <Badge tone="red">Inactive</Badge>
                  )}
                </TD>
                <TD className="whitespace-nowrap text-gray-600">{formatDate(u.createdAt)}</TD>
                <TD>
                  <a
                    href={`/api/users/${u.id}/export`}
                    download
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-brand transition-colors hover:bg-brand/10"
                    title={`Download ${u.name}'s sales as CSV`}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </TD>
                <TD>
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(u); setModalOpen(true); }}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-bad hover:bg-red-50 disabled:opacity-40"
                      disabled={me?.id === u.id}
                      title={me?.id === u.id ? "You can't remove yourself" : undefined}
                      onClick={() => setToDelete(u)}
                    >
                      Delete
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}

      <UserModal open={modalOpen} onClose={() => setModalOpen(false)} user={editing} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Remove member?"
        message={`Remove ${toDelete?.name}'s account? They will no longer be able to log in.`}
        confirmLabel="Remove"
        loading={del.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
