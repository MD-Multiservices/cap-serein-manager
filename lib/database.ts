import { lireStorage, enregistrerStorage } from "./storage";

export const DB = {
  voyageurs: "cap-serein-voyageurs",
  logements: "cap-serein-logements",
  proprietaires: "cap-serein-proprietaires",
  missions: "cap-serein-missions",
  factures: "cap-serein-factures",
  etatsDesLieux: "cap-serein-etats-des-lieux",
  cles: "cap-serein-cles",
  menages: "cap-serein-menage",
  pressings: "cap-serein-pressing",
};

export function lire<T>(table: keyof typeof DB): T[] {
  return lireStorage<T>(DB[table]);
}

export function enregistrer<T>(table: keyof typeof DB, donnees: T[]) {
  enregistrerStorage(DB[table], donnees);
}