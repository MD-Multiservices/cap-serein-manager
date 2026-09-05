import type { Facture, LigneFacture } from "@/types/facture";

export function totalHT(lignes: LigneFacture[]): number {
  return lignes.reduce(
    (total, ligne) =>
      total + ligne.quantite * ligne.prixUnitaire,
    0
  );
}

export function totalTVA(lignes: LigneFacture[]): number {
  return lignes.reduce((total, ligne) => {
    const ht = ligne.quantite * ligne.prixUnitaire;

    return total + (ht * ligne.tva) / 100;
  }, 0);
}

export function totalTTC(lignes: LigneFacture[]): number {
  return totalHT(lignes) + totalTVA(lignes);
}

export function appliquerRemise(
  montant: number,
  remise: number
): number {
  return montant - remise;
}

export function resteAPayer(
  facture: Facture
): number {
  const total =
    appliquerRemise(
      totalTTC(facture.lignes),
      facture.remise
    );

  return Math.max(0, total - facture.acompte);
}

export function formaterPrix(
  montant: number
): string {
  return montant.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
}

export function creerNumeroFacture(): string {
  const maintenant = new Date();

  const annee = maintenant.getFullYear();

  const mois = String(
    maintenant.getMonth() + 1
  ).padStart(2, "0");

  const jour = String(
    maintenant.getDate()
  ).padStart(2, "0");

  const heure = String(
    maintenant.getHours()
  ).padStart(2, "0");

  const minute = String(
    maintenant.getMinutes()
  ).padStart(2, "0");

  return `FAC-${annee}${mois}${jour}-${heure}${minute}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
