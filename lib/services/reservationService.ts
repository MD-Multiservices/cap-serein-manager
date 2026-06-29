import type { Voyageur } from "@/types/voyageur";
import type { Mission } from "@/types/mission";
import { creerMissionsSejour } from "./missionService";

export interface ReservationComplete {
  voyageur: Voyageur;
  missions: Mission[];
}

export function creerReservation(
  voyageur: Voyageur
): ReservationComplete {

  const missions = creerMissionsSejour(voyageur);

  return {
    voyageur,
    missions,
  };

}