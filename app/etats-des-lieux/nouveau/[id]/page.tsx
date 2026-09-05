import { redirect } from "next/navigation";

export default async function AncienDetailEtatDesLieuxPage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect("/etats-des-lieux/" + encodeURIComponent(id));
}
