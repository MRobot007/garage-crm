import { SupplierDetailView } from "@/components/suppliers/SupplierDetailView";

export default function SupplierDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <SupplierDetailView id={params.id} />;
}
