export type PieceLogement =
  | "Entrée"
  | "Salon"
  | "Cuisine"
  | "Chambre 1"
  | "Chambre 2"
  | "Salle de bain"
  | "WC"
  | "Balcon"
  | "Terrasse"
  | "Garage"
  | "Extérieur"
  | "Autre";

export interface PhotoEtatDesLieux {
  id: string;
  missionId: string;
  logementId: string;
  voyageurId: string;
  piece: PieceLogement;
  nom: string;
  commentaire: string;
  url: string;
  date: string;
  avantApres: "Avant" | "Après";
}