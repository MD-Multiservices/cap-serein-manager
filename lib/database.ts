import { enregistrerStorage, lireStorage } from "./storage";

export const DB = {
  voyageurs: "voyageurs",
  logements: "logements",
  proprietaires: "proprietaires",
  missions: "missions",
  factures: "factures",
  etatsDesLieux: "etats-des-lieux",
  cles: "cles",
  menages: "menages",
  pressings: "pressings",
} as const;

/** @deprecated Les écrans de l'application utilisent désormais Supabase. */
export const lire = <T>(table: keyof typeof DB): T[] => lireStorage<T>(DB[table]);

/** @deprecated Les écrans de l'application utilisent désormais Supabase. */
export const enregistrer = <T>(table: keyof typeof DB, donnees: T[]): void => {
  enregistrerStorage(DB[table], donnees);
};
