import { InvoiceDetailView } from "@/components/invoices/InvoiceDetailView";

export default function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <InvoiceDetailView id={params.id} />;
}
