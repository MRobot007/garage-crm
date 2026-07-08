"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TableWrap, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { Badge, leadStatusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useLeads, useUpdateLeadStatus, useDeleteLead } from "@/hooks/useLeads";
import { useStaggerReveal } from "@/hooks/useStaggerReveal";
import { useMe } from "@/hooks/useMe";
import { composeEnquiryReply, buildGmailCompose } from "@/lib/order-compose";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Lead } from "@/lib/types";

export function EnquiriesView() {
  const toast = useToast();
  const [q, setQ] = useState("");

  // Enquiries are the leads that came in from the website form.
  const filters = useMemo(() => ({ source: "Website", q }), [q]);
  const { data: leads, isLoading, isError } = useLeads(filters);
  const updateStatus = useUpdateLeadStatus();
  const del = useDeleteLead();
  const { data: me } = useMe();
  const canDelete = me?.role !== "staff";

  const [toDelete, setToDelete] = useState<Lead | null>(null);
  const [replied, setReplied] = useState<Set<string>>(new Set());
  const bodyRef = useStaggerReveal<HTMLTableSectionElement>("tr", leads?.length ?? 0);

  // Replied = clicked this session, or already moved past "New".
  const isReplied = (lead: Lead) =>
    replied.has(lead.id) || lead.status !== "New";

  function requestedItem(lead: Lead): string {
    return lead.accessory || lead.interestedIn || "—";
  }

  // "Yes, we have it" → open Gmail with a ready thank-you reply to the customer.
  function replyWeHaveIt(lead: Lead) {
    if (!lead.email) return;
    const item = lead.accessory || lead.interestedIn || "";
    const { subject, body } = composeEnquiryReply({ customerName: lead.name, item });
    window.open(buildGmailCompose(lead.email, subject, body), "_blank");
    // Flip the button state instantly, and mark it Contacted so it persists.
    setReplied((prev) => new Set(prev).add(lead.id));
    if (lead.status === "New") {
      updateStatus.mutate({ id: lead.id, status: "Contacted" });
    }
    toast.success("Opening Gmail — just press Send.");
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Enquiry deleted");
      setToDelete(null);
    } catch {
      toast.error("Couldn’t delete enquiry");
      setToDelete(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Enquiries"
        subtitle="Enquiries from your website. If you have what they want, reply in one click."
      />

      <div className="mb-4 w-full sm:w-72">
        <Input
          aria-label="Search enquiries"
          placeholder="Search name, phone, request…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-16 text-gray-500">
          <Spinner /> Loading enquiries…
        </div>
      )}
      {isError && (
        <p className="py-16 text-center text-sm text-bad">Couldn’t load enquiries.</p>
      )}

      {leads && leads.length === 0 && (
        <EmptyState
          title="No website enquiries yet"
          description="When someone submits the enquiry form on your website, it shows up here."
        />
      )}

      {leads && leads.length > 0 && (
        <TableWrap>
          <THead>
            <tr>
              <TH>Customer</TH>
              <TH>Contact</TH>
              <TH>Requested</TH>
              <TH>Message</TH>
              <TH>Date</TH>
              <TH>Status</TH>
              <TH className="text-right">Reply</TH>
            </tr>
          </THead>
          <TBody ref={bodyRef}>
            {leads.map((lead) => (
              <TR key={lead.id}>
                <TD className="font-medium">{lead.name}</TD>
                <TD className="text-gray-600">
                  <div className="whitespace-nowrap">{lead.phone}</div>
                  {lead.email && (
                    <div className="truncate text-xs text-gray-500">{lead.email}</div>
                  )}
                </TD>
                <TD className="text-gray-700">{requestedItem(lead)}</TD>
                <TD className="max-w-[16rem] truncate text-gray-500" title={lead.notes ?? ""}>
                  {lead.notes || "—"}
                </TD>
                <TD className="whitespace-nowrap text-gray-600">{formatDate(lead.createdAt)}</TD>
                <TD>
                  <Badge tone={leadStatusTone(lead.status)}>
                    {LEAD_STATUS_LABELS[lead.status as LeadStatus] ?? lead.status}
                  </Badge>
                </TD>
                <TD>
                  <div className="flex items-center justify-end gap-1">
                    {!lead.email ? (
                      <span className="text-xs text-gray-400">No email given</span>
                    ) : isReplied(lead) ? (
                      <button
                        onClick={() => replyWeHaveIt(lead)}
                        title="Replied — click to email again"
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-ok hover:bg-green-50"
                      >
                        ✓ Replied
                      </button>
                    ) : (
                      <Button size="sm" onClick={() => replyWeHaveIt(lead)}>
                        ✓ We have it — email
                      </Button>
                    )}
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

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete enquiry?"
        message={`Remove the enquiry from ${toDelete?.name}? This can’t be undone.`}
        confirmLabel="Delete"
        loading={del.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
