import { CustomerDetailView } from "@/components/customers/CustomerDetailView";

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <CustomerDetailView id={params.id} />;
}
