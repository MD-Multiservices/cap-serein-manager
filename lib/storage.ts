/**
 * Compatibilité transitoire pour les anciens services synchrones.
 * Aucune donnée n'est persistée dans le navigateur : les pages actives
 * utilisent Supabase comme source de vérité.
 */
const memoire = new Map<string, unknown[]>();

export const lireStorage = <T>(cle: string): T[] => {
  const valeur = memoire.get(cle);
  return Array.isArray(valeur) ? (valeur as T[]) : [];
};

export const enregistrerStorage = <T>(cle: string, donnees: T[]): void => {
  memoire.set(cle, [...donnees]);
};

export const ajouterStorage = <T extends { id: string }>(cle: string, element: T): void => {
  enregistrerStorage(cle, [...lireStorage<T>(cle), element]);
};

export const modifierStorage = <T extends { id: string }>(cle: string, element: T): void => {
  enregistrerStorage(cle, lireStorage<T>(cle).map((item) => item.id === element.id ? element : item));
};

export const supprimerStorage = (cle: string, id: string): void => {
  enregistrerStorage(cle, lireStorage<{ id: string }>(cle).filter((item) => item.id !== id));
};
