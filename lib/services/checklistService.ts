import type {
  ChecklistEtatDesLieux,
  ChecklistItem,
} from "@/types/checklist";

import type { PhotoEtatDesLieux } from "@/types/photo";

export function compterPhotos(
  photos: PhotoEtatDesLieux[],
  piece: string
) {
  return photos.filter((photo) => photo.piece === piece).length;
}

export function mettreAJourChecklist(
  checklist: ChecklistEtatDesLieux,
  photos: PhotoEtatDesLieux[]
): ChecklistEtatDesLieux {
  return {
    ...checklist,

    items: checklist.items.map((item) => ({
      ...item,

      termine:
        compterPhotos(photos, item.piece) >= item.photosMinimum,
    })),
  };
}

export function calculerProgression(
  checklist: ChecklistEtatDesLieux
): number {
  if (checklist.items.length === 0) return 0;

  const termines = checklist.items.filter(
    (item) => item.termine
  ).length;

  return Math.round(
    (termines / checklist.items.length) * 100
  );
}

export function estComplete(
  checklist: ChecklistEtatDesLieux
): boolean {
  return checklist.items.every(
    (item) => item.termine
  );
}