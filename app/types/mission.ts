export type TypeMission =
  | "Arrivée"
  | "Départ"
  | "État des lieux entrée"
  | "État des lieux sortie"
  | "Remise des clés"
  | "Récupération des clés"
  | "Ménage"
  | "Pressing"
  | "Maintenance"
  | "Intervention";

export type StatutMission =
  | "À faire"
  | "En cours"
  | "Terminée"
  | "Annulée";

export type PrioriteMission =
  | "Basse"
  | "Normale"
  | "Haute"
  | "Urgente";

export interface Mission {
  id: string;

  logementId: string;

  proprietaireId: string;

  voyageurId: string;

  type: TypeMission;

  titre: string;

  description: string;

  date: string;

  heure: string;

  priorite: PrioriteMission;

  statut: StatutMission;

  assigneA: string;

  createdAt: string;

  updatedAt: string;
}

export const missionVide: Mission = {
  id: "",

  logementId: "",

  proprietaireId: "",

  voyageurId: "",

  type: "Arrivée",

  titre: "",

  description: "",

  date: "",

  heure: "",

  priorite: "Normale",

  statut: "À faire",

  assigneA: "",

  createdAt: "",

  updatedAt: "",
};