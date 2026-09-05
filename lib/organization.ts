"use client";

import { supabase } from "@/lib/supabase";

export async function obtenirOrganisationCourante(): Promise<string> {
  const {
    data: { user },
    error: erreurUtilisateur,
  } = await supabase.auth.getUser();

  if (erreurUtilisateur || !user) {
    throw new Error("Votre session Supabase n’est pas disponible.");
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.organization_id) {
    throw new Error("Aucune organisation Cap Serein n’est associée à votre compte.");
  }

  return String(data.organization_id);
}

export function messageErreurSupabase(erreur: unknown): string {
  if (erreur instanceof Error) {
    return erreur.message;
  }

  if (
    erreur &&
    typeof erreur === "object" &&
    "message" in erreur
  ) {
    return String(
      (erreur as { message?: unknown }).message ||
        "Erreur Supabase inconnue."
    );
  }

  return "Erreur Supabase inconnue.";
}

export function dateLocaleISO(date = new Date()): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}

export function joindreDateHeure(
  date: string,
  heure = "00:00"
): string | null {
  if (!date) {
    return null;
  }

  const dateLocale = new Date(`${date}T${heure || "00:00"}:00`);

  if (Number.isNaN(dateLocale.getTime())) {
    return null;
  }

  return dateLocale.toISOString();
}

export function separerDateHeure(
  valeur: string | null | undefined
): { date: string; heure: string } {
  if (!valeur) {
    return { date: "", heure: "" };
  }

  const date = new Date(valeur);

  if (Number.isNaN(date.getTime())) {
    return {
      date: String(valeur).slice(0, 10),
      heure: "",
    };
  }

  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  const heures = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return {
    date: `${annee}-${mois}-${jour}`,
    heure: `${heures}:${minutes}`,
  };
}

export function formaterPrix(
  montant: number,
  devise = "EUR"
): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: devise || "EUR",
  }).format(Number.isFinite(montant) ? montant : 0);
}
