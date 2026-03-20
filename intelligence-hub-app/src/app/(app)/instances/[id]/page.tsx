import { redirect } from "next/navigation";

export default function InstancePage({ params }: { params: { id: string } }) {
  redirect(`/instances/${params.id}/content`);
}
