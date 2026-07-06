import { CarDetailView } from "@/components/cars/CarDetailView";

export default function CarDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <CarDetailView id={params.id} />;
}
