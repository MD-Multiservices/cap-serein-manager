export function lireStorage<T>(cle: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const donnees = localStorage.getItem(cle);

    if (!donnees) return [];

    return JSON.parse(donnees);
  } catch {
    return [];
  }
}

export function enregistrerStorage<T>(cle: string, donnees: T[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(cle, JSON.stringify(donnees));
}

export function ajouterStorage<T extends { id: string }>(
  cle: string,
  element: T
) {
  const liste = lireStorage<T>(cle);

  liste.push(element);

  enregistrerStorage(cle, liste);
}

export function modifierStorage<T extends { id: string }>(
  cle: string,
  element: T
) {
  const liste = lireStorage<T>(cle);

  const nouvelleListe = liste.map((item) =>
    item.id === element.id ? element : item
  );

  enregistrerStorage(cle, nouvelleListe);
}

export function supprimerStorage(
  cle: string,
  id: string
) {
  const liste = lireStorage<any>(cle);

  enregistrerStorage(
    cle,
    liste.filter((item) => item.id !== id)
  );
}