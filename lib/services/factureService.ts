import type { Facture, LigneFacture } from "@/types/facture";
import type { Mission } from "@/types/mission";

export function creerLigne(
  designation: string,
  prix: number,
  quantite = 1,
  tva = 20
): LigneFacture {
  return {
    id: crypto.randomUUID(),
    designation,
    quantite,
    prixUnitaire: prix,
    tva,
  };
}

export function convertirMissionEnLigne(
  mission: Mission
): LigneFacture | null {
  switch (mission.type) {
    case "Arrivée":
      return creerLigne("Check-in", 25);

    case "Départ":
      return creerLigne("Check-out", 25);

    case "Ménage":
      return creerLigne("Ménage", 60);

    case "Pressing":
      return creerLigne("Pressing", 18);

    case "État des lieux sortie":
      return creerLigne("État des lieux", 20);

    default:
      return null;
  }
}

export function genererFactureDepuisMissions(
  facture: Facture,
  missions: Mission[]
): Facture {
  const lignes = missions
    .map(convertirMissionEnLigne)
    .filter((ligne): ligne is LigneFacture => ligne !== null);

  return {
    ...facture,
    lignes,
  };
}