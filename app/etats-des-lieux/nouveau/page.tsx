import { redirect } from "next/navigation";

export default async function NouvelEtatDesLieuxPage({ searchParams }: {
  searchParams: Promise<{ logement?: string }>;
}) {
  const { logement } = await searchParams;
  const query = new URLSearchParams({ nouveau: "1" });
  if (logement) query.set("logement", logement);
  redirect("/etats-des-lieux?" + query);
}
