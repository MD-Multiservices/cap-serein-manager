export type TypeDocument = "Devis" | "Facture" | "Acompte" | "Avoir";
export type StatutFacture = "Brouillon" | "Envoyée" | "Payée" | "Partiellement payée" | "En retard" | "Annulée";

export interface LigneFacture {
  id: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  tva: number;
}

export interface Facture {
  id: string;
  numero: string;
  type: TypeDocument;
  proprietaireId: string;
  logementId: string;
  voyageurId: string;
  date: string;
  echeance: string;
  lignes: LigneFacture[];
  remise: number;
  acompte: number;
  statut: StatutFacture;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const factureVide: Facture = {
  id: "",
  numero: "",
  type: "Facture",
  proprietaireId: "",
  logementId: "",
  voyageurId: "",
  date: "",
  echeance: "",
  lignes: [],
  remise: 0,
  acompte: 0,
  statut: "Brouillon",
  notes: "",
  createdAt: "",
  updatedAt: "",
};
