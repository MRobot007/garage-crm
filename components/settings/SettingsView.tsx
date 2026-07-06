"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { settingsSchema } from "@/lib/schemas";
import { flattenZod } from "@/lib/api";
import {
  useSettings,
  useUpdateSettings,
  useResetDemo,
} from "@/hooks/useSettings";
import { Spinner } from "@/components/ui/Spinner";

export function SettingsView() {
  const toast = useToast();
  const { data: settings, isLoading } = useSettings();
  const update = useUpdateSettings();
  const reset = useResetDemo();

  const [values, setValues] = useState({
    businessName: "",
    currency: "₹",
    gstPercent: "8",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (settings) {
      setValues({
        businessName: settings.businessName,
        currency: settings.currency,
        gstPercent: String(settings.gstPercent),
      });
    }
  }, [settings]);

  function set<K extends keyof typeof values>(key: K, val: string) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = settingsSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(flattenZod(parsed.error));
      return;
    }
    setErrors({});
    try {
      await update.mutateAsync(parsed.data);
      toast.success("Settings saved");
    } catch {
      toast.error("Couldn’t save settings");
    }
  }

  async function doReset() {
    try {
      await reset.mutateAsync();
      toast.success("Demo data restored");
      setConfirmReset(false);
    } catch {
      toast.error("Couldn’t reset demo data");
      setConfirmReset(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Settings"
        subtitle="Business details and tax defaults used across the CRM."
      />

      {isLoading ? (
        <div className="flex items-center gap-2 py-16 text-gray-500">
          <Spinner /> Loading settings…
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Business</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Business name"
                required
                value={values.businessName}
                onChange={(e) => set("businessName", e.target.value)}
                error={errors.businessName}
                className="sm:col-span-2"
              />
              <Input
                label="Currency symbol"
                value={values.currency}
                onChange={(e) => set("currency", e.target.value)}
                error={errors.currency}
              />
              <Input
                label="Default Sales Tax %"
                type="number"
                value={values.gstPercent}
                onChange={(e) => set("gstPercent", e.target.value)}
                error={errors.gstPercent}
                hint="Applied to new invoices by default."
              />
              <div className="sm:col-span-2">
                <Button type="submit" loading={update.isPending}>
                  Save settings
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card className="mt-6 border-amber-200">
        <CardHeader>
          <CardTitle>Demo data</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-md text-sm text-gray-600">
            Reset the database back to the sample cars, accessories, customers,
            invoices and leads. This{" "}
            <span className="font-medium text-bad">erases all current data</span>.
          </p>
          <Button
            variant="danger"
            onClick={() => setConfirmReset(true)}
            loading={reset.isPending}
          >
            Reset demo data
          </Button>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmReset}
        title="Reset all data?"
        message="This will delete every record and reload the demo dataset. This cannot be undone."
        confirmLabel="Yes, reset everything"
        loading={reset.isPending}
        onConfirm={doReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
