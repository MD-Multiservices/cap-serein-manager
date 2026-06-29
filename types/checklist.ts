export interface ChecklistItem {
  id: string;

  piece: string;

  titre: string;

  obligatoire: boolean;

  photosMinimum: number;

  termine: boolean;
}

export interface ChecklistEtatDesLieux {
  id: string;

  missionId: string;

  logementId: string;

  voyageurId: string;

  items: ChecklistItem[];
}

export const checklistStandard: ChecklistItem[] = [
  {
    id: crypto.randomUUID(),
    piece: "Entrée",
    titre: "Photographier l'entrée",
    obligatoire: true,
    photosMinimum: 2,
    termine: false,
  },

  {
    id: crypto.randomUUID(),
    piece: "Salon",
    titre: "Photographier le salon",
    obligatoire: true,
    photosMinimum: 4,
    termine: false,
  },

  {
    id: crypto.randomUUID(),
    piece: "Cuisine",
    titre: "Photographier la cuisine",
    obligatoire: true,
    photosMinimum: 4,
    termine: false,
  },

  {
    id: crypto.randomUUID(),
    piece: "Chambre",
    titre: "Photographier la chambre",
    obligatoire: true,
    photosMinimum: 3,
    termine: false,
  },

  {
    id: crypto.randomUUID(),
    piece: "Salle de bain",
    titre: "Photographier la salle de bain",
    obligatoire: true,
    photosMinimum: 3,
    termine: false,
  },

  {
    id: crypto.randomUUID(),
    piece: "WC",
    titre: "Photographier les WC",
    obligatoire: true,
    photosMinimum: 2,
    termine: false,
  },
];