import type { PhotoEtatDesLieux } from "@/types/photo";

export interface RapportEtatDesLieux {
  titre: string;
  logement: string;
  voyageur: string;
  proprietaire: string;

  dateEntree: string;
  dateSortie: string;

  photos: PhotoEtatDesLieux[];

  signatureClient?: string;

  signatureGestionnaire?: string;

  commentaires: string;
}

export function creerRapportEtatDesLieux(
  rapport: RapportEtatDesLieux
) {
  return {
    ...rapport,

    nombrePhotos: rapport.photos.length,

    genereLe: new Date().toISOString(),
  };
}