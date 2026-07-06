import { Suspense } from "react";
import { InvoicesView } from "@/components/invoices/InvoicesView";
import { Spinner } from "@/components/ui/Spinner";

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 py-16 text-gray-500">
          <Spinner /> Loading…
        </div>
      }
    >
      <InvoicesView />
    </Suspense>
  );
}
