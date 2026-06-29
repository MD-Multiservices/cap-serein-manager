import type { PhotoEtatDesLieux } from "@/types/photo";

export function creerPhoto(
  missionId: string,
  logementId: string,
 voyageurId: string,
  piece: PhotoEtatDesLieux["piece"],
  avantApres: PhotoEtatDesLieux["avantApres"],
  url: string
): PhotoEtatDesLieux {
  return {
    id: crypto.randomUUID(),

    missionId,

    logementId,

    voyageurId,

    piece,

    avantApres,

    nom: `${piece}-${Date.now()}`,

    commentaire: "",

    url,

    date: new Date().toISOString(),
  };
}

export function photosParPiece(
  photos: PhotoEtatDesLieux[],
  piece: PhotoEtatDesLieux["piece"]
) {
  return photos.filter((photo) => photo.piece === piece);
}

export function photosAvant(
  photos: PhotoEtatDesLieux[]
) {
  return photos.filter((photo) => photo.avantApres === "Avant");
}

export function photosApres(
  photos: PhotoEtatDesLieux[]
) {
  return photos.filter((photo) => photo.avantApres === "Après");
}

export function supprimerPhoto(
  photos: PhotoEtatDesLieux[],
  id: string
) {
  return photos.filter((photo) => photo.id !== id);
}