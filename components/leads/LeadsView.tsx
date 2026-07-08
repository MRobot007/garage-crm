"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  TableWrap,
  THead,
  TH,
  TBody,
  TR,
  TD,
} from "@/components/ui/Table";
import { Badge, leadStatusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { LeadModal } from "./LeadModal";
import {
  useLeads,
  useUpdateLeadStatus,
  useDeleteLead,
} from "@/hooks/useLeads";
import { useStaggerReveal } from "@/hooks/useStaggerReveal";
import { useMe } from "@/hooks/useMe";
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
} from "@/lib/constants";
import { formatDate, isDueOrOverdue } from "@/lib/utils";
import type { Lead } from "@/lib/types";

export function LeadsView() {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [q, setQ] = useState("");

  const filters = useMemo(() => ({ status, source, q }), [status, source, q]);
  const { data: leads, isLoading, isError } = useLeads(filters);

  const updateStatus = useUpdateLeadStatus();
  const del = useDeleteLead();
  const { data: me } = useMe();
  const canDelete = me?.role !== "staff";

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [toDelete, setToDelete] = useState<Lead | null>(null);

  const bodyRef = useStaggerReveal<HTMLTableSectionElement>(
    "tr",
    leads?.length ?? 0,
  );

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(lead: Lead) {
    setEditing(lead);
    setModalOpen(true);
  }

  async function onStatusChange(lead: Lead, next: string) {
    try {
      await updateStatus.mutateAsync({ id: lead.id, status: next });
    } catch {
      toast.error("Couldn’t update status");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Lead deleted");
      setToDelete(null);
    } catch {
      toast.error("Couldn’t delete lead");
    }
  }

  function convertToSale(lead: Lead) {
    const params = new URLSearchParams({
      new: "1",
      name: lead.name,
      phone: lead.phone,
    });
    if (lead.email) params.set("email", lead.email);
    if (lead.accessory) params.set("accessory", lead.accessory);
    router.push(`/invoices?${params.toString()}`);
  }

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Your sales pipeline — from first enquiry to a closed deal."
        actions={<Button onClick={openAdd}>+ Add lead</Button>}
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64">
          <Input
            aria-label="Search leads"
            placeholder="Search name, phone, interest…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-40"
          options={[
            { value: "all", label: "All statuses" },
            ...LEAD_STATUSES.map((s) => ({ value: s, label: LEAD_STATUS_LABELS[s] })),
          ]}
        />
        <Select
          aria-label="Filter by source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-40"
          options={[
            { value: "all", label: "All sources" },
            ...LEAD_SOURCES.map((s) => ({ value: s, label: s })),
          ]}
        />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-16 text-gray-500">
          <Spinner /> Loading leads…
        </div>
      )}
      {isError && (
        <p className="py-16 text-center text-sm text-bad">Couldn’t load leads.</p>
      )}

      {leads && leads.length === 0 && (
        <EmptyState
          title="No leads yet"
          description="Add your first enquiry to start tracking the pipeline."
          actionLabel="+ Add lead"
          onAction={openAdd}
        />
      )}

      {leads && leads.length > 0 && (
        <TableWrap>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Phone</TH>
              <TH>Interested in</TH>
              <TH>Source</TH>
              <TH>Status</TH>
              <TH>Follow-up</TH>
              <TH>Staff</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody ref={bodyRef}>
            {leads.map((lead) => (
              <TR key={lead.id}>
                <TD className="font-medium">{lead.name}</TD>
                <TD className="whitespace-nowrap text-gray-600">{lead.phone}</TD>
                <TD className="text-gray-600">{lead.interestedIn || "—"}</TD>
                <TD>
                  <Badge tone="neutral">{lead.source}</Badge>
                </TD>
                <TD>
                  <Select
                    aria-label={`Status for ${lead.name}`}
                    value={lead.status}
                    onChange={(e) => onStatusChange(lead, e.target.value)}
                    className="h-8 w-36 text-[13px]"
                    options={LEAD_STATUSES.map((s) => ({
                      value: s,
                      label: LEAD_STATUS_LABELS[s],
                    }))}
                  />
                </TD>
                <TD className="whitespace-nowrap">
                  {lead.followUpDate ? (
                    <span
                      className={
                        isDueOrOverdue(lead.followUpDate) &&
                        !["Won", "Lost"].includes(lead.status)
                          ? "font-medium text-warn"
                          : "text-gray-600"
                      }
                    >
                      {formatDate(lead.followUpDate)}
                    </span>
                  ) : (
                    "—"
                  )}
                </TD>
                <TD className="text-gray-600">{lead.staff || "—"}</TD>
                <TD>
                  <div className="flex items-center justify-end gap-1">
                    {lead.status === "Won" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => convertToSale(lead)}
                      >
                        Convert to sale
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => openEdit(lead)}>
                      Edit
                    </Button>
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-bad hover:bg-red-50"
                        onClick={() => setToDelete(lead)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}

      <LeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        lead={editing}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete lead?"
        message={`This will permanently remove ${toDelete?.name}. This can’t be undone.`}
        confirmLabel="Delete"
        loading={del.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
