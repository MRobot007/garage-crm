"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { userCreateSchema, userUpdateSchema } from "@/lib/schemas";
import { flattenZod } from "@/lib/api";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { useCreateUser, useUpdateUser } from "@/hooks/useUsers";
import { ApiError } from "@/lib/fetcher";
import type { CrmUser } from "@/lib/types";

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  user?: CrmUser | null;
}

const empty = { name: "", username: "", password: "", role: "staff", active: "true" };

export function UserModal({ open, onClose, user }: UserModalProps) {
  const toast = useToast();
  const create = useCreateUser();
  const update = useUpdateUser();
  const isEdit = Boolean(user);
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(
      user
        ? {
            name: user.name,
            username: user.username,
            password: "",
            role: user.role,
            active: user.active ? "true" : "false",
          }
        : empty,
    );
  }, [open, user]);

  function set<K extends keyof typeof values>(key: K, val: string) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (isEdit && user) {
        const parsed = userUpdateSchema.safeParse({
          name: values.name,
          role: values.role,
          active: values.active === "true",
          password: values.password,
        });
        if (!parsed.success) {
          setErrors(flattenZod(parsed.error));
          return;
        }
        await update.mutateAsync({ id: user.id, values: parsed.data });
        toast.success("Member updated");
      } else {
        const parsed = userCreateSchema.safeParse(values);
        if (!parsed.success) {
          setErrors(flattenZod(parsed.error));
          return;
        }
        await create.mutateAsync(parsed.data);
        toast.success("Member added");
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
      title={isEdit ? "Edit member" : "Add team member"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" loading={busy}>
            {isEdit ? "Save changes" : "Add member"}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          required
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          error={errors.name}
          placeholder="e.g. Mike Ross"
          className="sm:col-span-2"
        />
        <Input
          label="Username"
          required={!isEdit}
          value={values.username}
          onChange={(e) => set("username", e.target.value)}
          error={errors.username}
          placeholder="e.g. mike"
          disabled={isEdit}
          hint={isEdit ? "Username can't be changed" : "Used to log in"}
        />
        <Select
          label="Role"
          value={values.role}
          onChange={(e) => set("role", e.target.value)}
          options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
        />
        <Input
          type="password"
          label={isEdit ? "New password" : "Password"}
          required={!isEdit}
          value={values.password}
          onChange={(e) => set("password", e.target.value)}
          error={errors.password}
          placeholder={isEdit ? "Leave blank to keep current" : "At least 6 characters"}
          autoComplete="new-password"
        />
        {isEdit && (
          <Select
            label="Status"
            value={values.active}
            onChange={(e) => set("active", e.target.value)}
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive (can't log in)" },
            ]}
          />
        )}
      </form>
    </Modal>
  );
}
