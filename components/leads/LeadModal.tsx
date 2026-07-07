"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { leadSchema } from "@/lib/schemas";
import { flattenZod } from "@/lib/api";
import { LEAD_SOURCES, LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/constants";
import { toDateInput } from "@/lib/utils";
import { useCreateLead, useUpdateLead } from "@/hooks/useLeads";
import type { Lead } from "@/lib/types";
import { ApiError } from "@/lib/fetcher";

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  lead?: Lead | null;
}

const empty = {
  name: "",
  phone: "",
  email: "",
  interestedIn: "",
  source: "Walk-in",
  status: "New",
  followUpDate: "",
  staff: "",
  notes: "",
};

export function LeadModal({ open, onClose, lead }: LeadModalProps) {
  const toast = useToast();
  const create = useCreateLead();
  const update = useUpdateLead();
  const isEdit = Boolean(lead);
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(
      lead
        ? {
            name: lead.name,
            phone: lead.phone,
            email: lead.email ?? "",
            interestedIn: lead.interestedIn ?? "",
            source: lead.source,
            status: lead.status,
            followUpDate: toDateInput(lead.followUpDate),
            staff: lead.staff ?? "",
            notes: lead.notes ?? "",
          }
        : empty,
    );
  }, [open, lead]);

  function set<K extends keyof typeof values>(key: K, val: string) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = leadSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(flattenZod(parsed.error));
      return;
    }
    try {
      if (isEdit && lead) {
        await update.mutateAsync({ id: lead.id, values: parsed.data });
        toast.success("Lead updated");
      } else {
        await create.mutateAsync(parsed.data);
        toast.success("Lead added");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  const busy = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit lead" : "Add lead"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="lead-form" loading={busy}>
            {isEdit ? "Save changes" : "Add lead"}
          </Button>
        </>
      }
    >
      <form id="lead-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Name"
          required
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          error={errors.name}
          placeholder="e.g. Amit Sharma"
        />
        <Input
          label="Phone"
          required
          value={values.phone}
          onChange={(e) => set("phone", e.target.value)}
          error={errors.phone}
          placeholder="+1 (555) 000-0000"
        />
        <Input
          label="Email"
          type="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          error={errors.email}
          placeholder="customer@email.com"
          className="sm:col-span-2"
        />
        <Input
          label="Interested in"
          value={values.interestedIn}
          onChange={(e) => set("interestedIn", e.target.value)}
          error={errors.interestedIn}
          placeholder="e.g. Hyundai Creta, alloy wheels"
          className="sm:col-span-2"
        />
        <Select
          label="Source"
          value={values.source}
          onChange={(e) => set("source", e.target.value)}
          options={LEAD_SOURCES.map((s) => ({ value: s, label: s }))}
        />
        <Select
          label="Status"
          value={values.status}
          onChange={(e) => set("status", e.target.value)}
          options={LEAD_STATUSES.map((s) => ({
            value: s,
            label: LEAD_STATUS_LABELS[s],
          }))}
        />
        <Input
          type="date"
          label="Follow-up date"
          value={values.followUpDate}
          onChange={(e) => set("followUpDate", e.target.value)}
          error={errors.followUpDate}
        />
        <Input
          label="Staff"
          value={values.staff}
          onChange={(e) => set("staff", e.target.value)}
          placeholder="Assigned to"
        />
        <Textarea
          label="Notes"
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="sm:col-span-2"
          placeholder="Budget, timeline, preferences…"
        />
      </form>
    </Modal>
  );
}
