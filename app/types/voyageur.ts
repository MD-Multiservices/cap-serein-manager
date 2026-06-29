export type StatutVoyageur =
  | "Réservation"
  | "Arrivé"
  | "Parti"
  | "Annulé";

export interface Voyageur {
  id: string;

  logementId: string;

  nom: string;
  prenom: string;

  telephone: string;
  email: string;

  adultes: number;
  enfants: number;
  animaux: number;

  arrivee: string;
  depart: string;

  heureArrivee: string;
  heureDepart: string;

  langue: string;

  plateforme: string;

  numeroReservation: string;

  caution: boolean;

  statut: StatutVoyageur;

  observations: string;

  createdAt: string;

  updatedAt: string;
}

export const voyageurVide: Voyageur = {
  id: "",

  logementId: "",

  nom: "",
  prenom: "",

  telephone: "",
  email: "",

  adultes: 1,
  enfants: 0,
  animaux: 0,

  arrivee: "",
  depart: "",

  heureArrivee: "16:00",
  heureDepart: "10:00",

  langue: "Français",

  plateforme: "Direct",

  numeroReservation: "",

  caution: false,

  statut: "Réservation",

  observations: "",

  createdAt: "",
  updatedAt: "",
};