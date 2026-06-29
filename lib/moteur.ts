import type { Mission } from "@/types/mission";
import type { Voyageur } from "@/types/voyageur";

export function creerMissionDepuisVoyageur(
  voyageur: Voyageur
): Mission[] {
  const maintenant = new Date().toISOString();

  return [
    {
      id: crypto.randomUUID(),
      logementId: voyageur.logementId,
      proprietaireId: "",
      voyageurId: voyageur.id,

      type: "Arrivée",

      titre: `Arrivée - ${voyageur.prenom} ${voyageur.nom}`,

      description: "Accueil du voyageur",

      date: voyageur.arrivee,

      heure: voyageur.heureArrivee,

      priorite: "Normale",

      statut: "À faire",

      assigneA: "",

      createdAt: maintenant,

      updatedAt: maintenant,
    },

    {
      id: crypto.randomUUID(),
      logementId: voyageur.logementId,
      proprietaireId: "",
      voyageurId: voyageur.id,

      type: "Départ",

      titre: `Départ - ${voyageur.prenom} ${voyageur.nom}`,

      description: "Départ du voyageur",

      date: voyageur.depart,

      heure: voyageur.heureDepart,

      priorite: "Normale",

      statut: "À faire",

      assigneA: "",

      createdAt: maintenant,

      updatedAt: maintenant,
    },

    {
      id: crypto.randomUUID(),
      logementId: voyageur.logementId,
      proprietaireId: "",
      voyageurId: voyageur.id,

      type: "Ménage",

      titre: `Ménage après départ`,

      description: "Nettoyage complet",

      date: voyageur.depart,

      heure: "11:00",

      priorite: "Normale",

      statut: "À faire",

      assigneA: "",

      createdAt: maintenant,

      updatedAt: maintenant,
    },

    {
      id: crypto.randomUUID(),
      logementId: voyageur.logementId,
      proprietaireId: "",
      voyageurId: voyageur.id,

      type: "Pressing",

      titre: `Pressing`,

      description: "Collecte et retour du linge",

      date: voyageur.depart,

      heure: "11:30",

      priorite: "Normale",

      statut: "À faire",

      assigneA: "",

      createdAt: maintenant,

      updatedAt: maintenant,
    },

    {
      id: crypto.randomUUID(),
      logementId: voyageur.logementId,
      proprietaireId: "",
      voyageurId: voyageur.id,

      type: "État des lieux sortie",

      titre: "État des lieux",

      description: "État des lieux de sortie",

      date: voyageur.depart,

      heure: voyageur.heureDepart,

      priorite: "Normale",

      statut: "À faire",

      assigneA: "",

      createdAt: maintenant,

      updatedAt: maintenant,
    },
  ];
}