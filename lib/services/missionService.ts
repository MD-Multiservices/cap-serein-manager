import type { Mission } from "@/types/mission";
import type { Voyageur } from "@/types/voyageur";

export function creerMission(
  type: Mission["type"],
  voyageur: Voyageur,
  titre: string,
  description: string,
  date: string,
  heure: string
): Mission {
  const maintenant = new Date().toISOString();

  return {
    id: crypto.randomUUID(),

    logementId: voyageur.logementId,

    proprietaireId: "",

    voyageurId: voyageur.id,

    type,

    titre,

    description,

    date,

    heure,

    priorite: "Normale",

    statut: "À faire",

    assigneA: "",

    createdAt: maintenant,

    updatedAt: maintenant,
  };
}

export function creerMissionsSejour(
  voyageur: Voyageur
): Mission[] {
  return [
    creerMission(
      "Arrivée",
      voyageur,
      `Arrivée - ${voyageur.prenom} ${voyageur.nom}`,
      "Accueil du voyageur",
      voyageur.arrivee,
      voyageur.heureArrivee
    ),

    creerMission(
      "Départ",
      voyageur,
      `Départ - ${voyageur.prenom} ${voyageur.nom}`,
      "Départ du voyageur",
      voyageur.depart,
      voyageur.heureDepart
    ),

    creerMission(
      "Ménage",
      voyageur,
      "Ménage",
      "Nettoyage complet",
      voyageur.depart,
      "11:00"
    ),

    creerMission(
      "Pressing",
      voyageur,
      "Pressing",
      "Collecte du linge",
      voyageur.depart,
      "11:30"
    ),

    creerMission(
      "État des lieux sortie",
      voyageur,
      "État des lieux",
      "État des lieux de sortie",
      voyageur.depart,
      voyageur.heureDepart
    ),
  ];
}