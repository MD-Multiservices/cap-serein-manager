import { supabase } from "./supabase";
import { obtenirOrganisationCourante } from "./organization";

export type Parametres = {
  nomEntreprise: string; responsable: string; email: string; telephone: string; adresse: string;
  codePostal: string; ville: string; siret: string; devise: string; tauxTVA: number;
  delaiPaiement: number; prefixeFacture: string; notesFacture: string;
};
export const parametresParDefaut: Parametres = {
  nomEntreprise: "Cap Serein", responsable: "", email: "", telephone: "", adresse: "", codePostal: "",
  ville: "La Seyne-sur-Mer", siret: "", devise: "EUR", tauxTVA: 0, delaiPaiement: 30,
  prefixeFacture: "FAC", notesFacture: "Merci pour votre confiance.",
};
const columns: Record<keyof Parametres, string> = {
  nomEntreprise: "nom_entreprise", responsable: "responsable", email: "email", telephone: "telephone",
  adresse: "adresse", codePostal: "code_postal", ville: "ville", siret: "siret", devise: "devise",
  tauxTVA: "taux_tva", delaiPaiement: "delai_paiement", prefixeFacture: "prefixe_facture", notesFacture: "notes_facture",
};
export async function lireParametres(): Promise<Parametres> {
  const org = await obtenirOrganisationCourante();
  const { data, error } = await supabase.from("organization_settings").select("*").eq("organization_id", org).maybeSingle();
  if (error) throw error;
  if (!data) return { ...parametresParDefaut };
  return Object.fromEntries(Object.entries(columns).map(([key, column]) => [key,
    data[column] ?? parametresParDefaut[key as keyof Parametres]])) as Parametres;
}
export async function ecrireParametres(values: Parametres) {
  const org = await obtenirOrganisationCourante();
  const payload = Object.fromEntries(Object.entries(columns).map(([key, column]) => [column, values[key as keyof Parametres]]));
  const { error } = await supabase.from("organization_settings").upsert({ ...payload, organization_id: org,
    updated_at: new Date().toISOString() }, { onConflict: "organization_id" }).select("organization_id").single();
  if (error) throw error;
}
