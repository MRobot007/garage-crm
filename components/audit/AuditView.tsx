"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TableWrap, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useAudit } from "@/hooks/useAudit";
import { useStaggerReveal } from "@/hooks/useStaggerReveal";
import { ROLE_LABELS, type Role } from "@/lib/constants";

const ENTITIES = [
  "lead",
  "invoice",
  "order",
  "car",
  "accessory",
  "supplier",
  "customer",
  "user",
  "shift",
];

function actionTone(action: string): "green" | "amber" | "red" | "blue" | "neutral" {
  switch (action) {
    case "sold":
    case "payment":
    case "received":
      return "green";
    case "created":
    case "ordered":
    case "shift_start":
      return "blue";
    case "updated":
    case "shift_end":
      return "amber";
    case "deleted":
      return "red";
    default:
      return "neutral";
  }
}

function roleTone(role: string): "blue" | "amber" | "neutral" {
  if (role === "owner") return "blue";
  if (role === "manager") return "amber";
  return "neutral";
}

function dateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AuditView() {
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("all");
  const filters = useMemo(() => ({ q, entity }), [q, entity]);
  const { data: logs, isLoading, isError } = useAudit(filters);
  const bodyRef = useStaggerReveal<HTMLTableSectionElement>("tr", logs?.length ?? 0);

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        subtitle="Every action in the CRM — who did what, and when."
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-72">
          <Input
            aria-label="Search activity"
            placeholder="Search by person or action…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select
          aria-label="Filter by type"
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          className="w-44"
          options={[
            { value: "all", label: "All activity" },
            ...ENTITIES.map((x) => ({ value: x, label: x[0].toUpperCase() + x.slice(1) })),
          ]}
        />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-16 text-gray-500">
          <Spinner /> Loading activity…
        </div>
      )}
      {isError && (
        <p className="py-16 text-center text-sm text-bad">Couldn’t load the audit trail.</p>
      )}

      {logs && logs.length === 0 && (
        <EmptyState
          title="No activity yet"
          description="Actions like sales, purchases, stock changes and team edits will appear here."
        />
      )}

      {logs && logs.length > 0 && (
        <TableWrap>
          <THead>
            <tr>
              <TH>When</TH>
              <TH>Who</TH>
              <TH>Action</TH>
              <TH>Details</TH>
            </tr>
          </THead>
          <TBody ref={bodyRef}>
            {logs.map((l) => (
              <TR key={l.id}>
                <TD className="whitespace-nowrap text-gray-600">{dateTime(l.createdAt)}</TD>
                <TD className="whitespace-nowrap">
                  <span className="font-medium text-ink">{l.userName}</span>
                  <span className="ml-2">
                    <Badge tone={roleTone(l.role)}>
                      {ROLE_LABELS[l.role as Role] ?? l.role}
                    </Badge>
                  </span>
                </TD>
                <TD>
                  <Badge tone={actionTone(l.action)}>{l.action.replace("_", " ")}</Badge>
                </TD>
                <TD className="text-gray-700">{l.summary}</TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}
