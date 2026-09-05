import { supabase } from "./supabase";
import { dateLocaleISO, joindreDateHeure, separerDateHeure } from "./organization";

export type Row = Record<string, unknown>;
export type Collection = "menages" | "pressings" | "factures" | "photos";
const str = (v: unknown) => v == null ? "" : String(v);
const num = (v: unknown) => Number(v || 0);
const object = (v: unknown): Row => v && typeof v === "object" && !Array.isArray(v) ? v as Row : {};
const menageStatuts: Record<string, string> = { a_faire: "À planifier", en_cours: "En cours", termine: "Terminé", annule: "Annulé" };
const pressingStatuts: Record<string, string> = { a_deposer: "À planifier", depose: "En traitement", pret: "Prêt", recupere: "Livré", annule: "Annulé" };
const factureStatuts: Record<string, string> = { brouillon: "Brouillon", emise: "Envoyée", payee: "Payée", partiellement_payee: "Partiellement payée", annulee: "Annulée" };
function code(map: Record<string, string>, value: unknown): string {
  const found = Object.entries(map).find(([, label]) => label === value);
  if (!found) throw new Error("Statut non reconnu : " + str(value));
  return found[0];
}

/** Pagination explicite : un export ou une liste ne doit pas être tronqué à 1000 lignes. */
export async function lireTable(table: string, org: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from(table).select("*").eq("organization_id", org)
      .order(table === "organization_settings" ? "organization_id" : "id").range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}

export function decoder(table: Collection, r: Row): Row {
  const base = { id: str(r.id), logementId: str(r.logement_id), voyageurId: str(r.voyageur_id),
    createdAt: str(r.created_at), updatedAt: str(r.updated_at) };
  if (table === "menages") {
    const date = separerDateHeure(str(r.date_prevue));
    return { ...base, type: r.type_menage, date: date.date, heure: date.heure, duree: num(r.duree_heures),
      statut: menageStatuts[str(r.statut)], prestataire: str(r.prestataire), cout: num(r.montant),
      linge: Boolean(r.linge), controleEffectue: Boolean(r.controle_effectue), consignes: str(r.observations) };
  }
  if (table === "pressings") {
    const depot = separerDateHeure(str(r.date_depot)), retour = separerDateHeure(str(r.date_recuperation_prevue));
    const articles = Array.isArray(r.articles) ? r.articles.map(object) : [];
    const quantity = (type: string) => articles.filter(a => a.type === type || a.nom === type || a.designation === type)
      .reduce((sum, a) => sum + num(a.quantite), 0);
    return { ...base, type: r.type_prestation, dateCollecte: depot.date, heureCollecte: depot.heure,
      dateRetour: retour.date, heureRetour: retour.heure, statut: pressingStatuts[str(r.statut)],
      prestataire: str(r.prestataire), nombreSacs: num(r.nombre_sacs), draps: quantity("draps"),
      serviettes: quantity("serviettes"), autresArticles: articles.filter(a => a.type === "autres").map(a => str(a.description)).join("\n"),
      cout: num(r.montant), paiementEffectue: Boolean(r.paiement_effectue), notes: str(r.observations),
      articlesOriginaux: articles };
  }
  if (table === "factures") return { ...base, numero: str(r.numero), type: r.type_document,
    proprietaireId: str(r.proprietaire_id), date: str(r.date_facture), echeance: str(r.date_echeance),
    lignes: (Array.isArray(r.lignes) ? r.lignes : []).map(value => { const l = object(value); return {
      id: str(l.id), designation: str(l.designation), quantite: num(l.quantite), prixUnitaire: num(l.prix_unitaire_ht), tva: num(l.taux_tva) };
    }), remise: num(r.remise), acompte: num(r.montant_paye),
    statut: r.statut === "emise" && r.date_echeance && str(r.date_echeance) < dateLocaleISO() ? "En retard" : factureStatuts[str(r.statut)], notes: str(r.observations) };
  return { ...base, categorie: r.categorie, date: r.date_photo, titre: str(r.titre), description: str(r.description),
    image: str(r.image), nomFichier: str(r.nom_fichier), storagePath: str(r.storage_path) };
}

export function encoder(table: Collection, r: Row): Row {
  const base = { logement_id: r.logementId || null, voyageur_id: r.voyageurId || null };
  if (table === "menages") return { ...base, type_menage: r.type, date_prevue: joindreDateHeure(str(r.date), str(r.heure)),
    duree_heures: num(r.duree), statut: code(menageStatuts, r.statut), prestataire: r.prestataire,
    montant: num(r.cout), linge: r.linge, controle_effectue: r.controleEffectue, observations: r.consignes };
  if (table === "pressings") return { ...base, type_prestation: r.type,
    date_depot: joindreDateHeure(str(r.dateCollecte), str(r.heureCollecte)),
    date_recuperation_prevue: joindreDateHeure(str(r.dateRetour), str(r.heureRetour)),
    statut: code(pressingStatuts, r.statut), prestataire: r.prestataire, nombre_sacs: num(r.nombreSacs),
    articles: [
      ...(Array.isArray(r.articlesOriginaux) ? r.articlesOriginaux.map(object).filter(a => !["draps", "serviettes", "autres"].includes(str(a.type || a.nom || a.designation))) : []),
      { type: "draps", quantite: num(r.draps) }, { type: "serviettes", quantite: num(r.serviettes) },
      { type: "autres", description: str(r.autresArticles) }],
    montant: num(r.cout), paiement_effectue: r.paiementEffectue, observations: r.notes };
  if (table === "factures") return { ...base, numero: r.numero, type_document: r.type, proprietaire_id: r.proprietaireId || null,
    date_facture: r.date, date_echeance: r.echeance || null, remise: num(r.remise), montant_paye: num(r.acompte),
    statut: code(factureStatuts, r.statut === "En retard" ? "Envoyée" : r.statut), observations: r.notes,
    lignes: (Array.isArray(r.lignes) ? r.lignes : []).map(value => { const l = object(value); return {
      id: l.id, designation: l.designation, quantite: num(l.quantite), prix_unitaire_ht: num(l.prixUnitaire), taux_tva: num(l.tva) }; }) };
  return { logement_id: r.logementId, categorie: r.categorie, date_photo: r.date, titre: r.titre,
    description: r.description, nom_fichier: r.nomFichier, storage_path: r.storagePath };
}

export async function chargerCollection(table: Collection, org: string): Promise<Row[]> {
  const rows = await lireTable(table, org);
  if (table === "factures") {
    const lignes = await lireTable("facture_lignes", org);
    return rows.map(r => decoder(table, { ...r, lignes: lignes.filter(l => l.facture_id === r.id).sort((a,b) => num(a.ordre)-num(b.ordre)) }));
  }
  if (table === "photos") {
    return Promise.all(rows.map(async r => {
      const { data, error } = await supabase.storage.from("galerie-media").createSignedUrl(str(r.storage_path), 3600);
      if (error) throw error;
      return decoder(table, { ...r, image: data.signedUrl });
    }));
  }
  return rows.map(r => decoder(table, r));
}

export async function sauvegarderElement(table: Collection, org: string, row: Row, existe: boolean) {
  if (table === "factures") {
    const { error } = await supabase.rpc("sauvegarder_facture", { p_organization_id: org, p_id: row.id,
      p_document: encoder(table, row), p_creation: !existe, p_updated_at: existe ? row.versionDistante || row.updatedAt : null });
    if (error) throw error;
    return;
  }
  // Les FK simples du schéma ne garantissent pas à elles seules l'organisation de la référence.
  for (const [field, target] of [["logementId", "logements"], ["voyageurId", "voyageurs"]]) {
    if (!row[field]) continue;
    const { data, error } = await supabase.from(target).select("id").eq("organization_id", org).eq("id", row[field]).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Le logement ou le voyageur n’appartient pas à votre organisation.");
  }
  let path = str(row.storagePath);
  if (table === "photos" && !existe) {
    path = org + "/" + str(row.id) + ".jpg";
    const blob = await (await fetch(str(row.image))).blob();
    const { error } = await supabase.storage.from("galerie-media").upload(path, blob, { contentType: "image/jpeg", upsert: false });
    if (error) throw error;
  }
  const payload = { ...encoder(table, { ...row, storagePath: path }), updated_at: new Date().toISOString() };
  const query = existe ? supabase.from(table).update(payload).eq("organization_id", org).eq("id", row.id)
    .eq("updated_at", row.versionDistante || row.updatedAt)
    : supabase.from(table).insert({ ...payload, id: row.id, organization_id: org });
  const { data, error } = await query.select("id").single();
  if (error || !data) {
    if (table === "photos" && !existe) await supabase.storage.from("galerie-media").remove([path]);
    throw error || new Error("Enregistrement refusé ou modifié depuis un autre appareil. Rechargez les données.");
  }
}

export async function supprimerElement(table: Collection, org: string, row: Row) {
  const { data, error } = await supabase.from(table).delete().eq("organization_id", org).eq("id", row.id)
    .eq("updated_at", row.updatedAt).select("id").single();
  if (error || !data) throw error || new Error("Suppression refusée ou données modifiées. Rechargez la page.");
  if (table === "photos" && row.storagePath) {
    const result = await supabase.storage.from("galerie-media").remove([str(row.storagePath)]);
    if (result.error) throw new Error("La photo a été retirée de la galerie, mais son fichier n’a pas pu être supprimé : " + result.error.message);
  }
}
