"use client";

import NextImage from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import { useRemoteCollection } from "@/lib/useRemoteCollection";

type CategoriePhoto =
  | "Arrivée"
  | "Départ"
  | "État des lieux"
  | "Ménage"
  | "Incident"
  | "Travaux"
  | "Autre";

type Photo = {
  id: string;
  logementId: string;
  categorie: CategoriePhoto;
  date: string;
  titre: string;
  description: string;
  image: string;
  nomFichier: string;
  createdAt: string;
  updatedAt: string;
};

type AnciennePhoto = Partial<Photo> & {
  logement?: string;
  type?: string;
  url?: string;
  src?: string;
  dataUrl?: string;
  commentaire?: string;
  observations?: string;
};

type PhotoEnAttente = {
  id: string;
  nomFichier: string;
  image: string;
};

type Logement = {
  id: string;
  nom: string;
  ville?: string;
  adresse?: string;
};

type FiltreCategorie = "Toutes" | CategoriePhoto;


const categoriesPhoto: CategoriePhoto[] = [
  "Arrivée",
  "Départ",
  "État des lieux",
  "Ménage",
  "Incident",
  "Travaux",
  "Autre",
];

function creerIdentifiant(prefixe: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${prefixe}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function dateLocaleISO(date = new Date()): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
}

function normaliserTexte(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normaliserCategorie(
  valeur: unknown
): CategoriePhoto {
  const categorie = normaliserTexte(
    String(valeur || "")
  );

  if (categorie.includes("arrive")) {
    return "Arrivée";
  }

  if (categorie.includes("depart")) {
    return "Départ";
  }

  if (
    categorie.includes("etat") ||
    categorie.includes("lieux")
  ) {
    return "État des lieux";
  }

  if (
    categorie.includes("menage") ||
    categorie.includes("nettoyage")
  ) {
    return "Ménage";
  }

  if (
    categorie.includes("incident") ||
    categorie.includes("degat") ||
    categorie.includes("probleme")
  ) {
    return "Incident";
  }

  if (
    categorie.includes("travaux") ||
    categorie.includes("maintenance") ||
    categorie.includes("reparation")
  ) {
    return "Travaux";
  }

  return "Autre";
}




function compresserImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();

    lecteur.onerror = () => {
      reject(
        new Error(
          `Impossible de lire le fichier ${file.name}.`
        )
      );
    };

    lecteur.onload = () => {
      const image = new window.Image();

      image.onerror = () => {
        reject(
          new Error(
            `Le fichier ${file.name} n’est pas une image compatible.`
          )
        );
      };

      image.onload = () => {
        const largeurMaximale = 1600;
        const hauteurMaximale = 1200;

        let largeur = image.width;
        let hauteur = image.height;

        const ratio = Math.min(
          largeurMaximale / largeur,
          hauteurMaximale / hauteur,
          1
        );

        largeur = Math.round(largeur * ratio);
        hauteur = Math.round(hauteur * ratio);

        const canvas =
          document.createElement("canvas");

        canvas.width = largeur;
        canvas.height = hauteur;

        const contexte = canvas.getContext("2d");

        if (!contexte) {
          reject(
            new Error(
              "Impossible de préparer la photo."
            )
          );
          return;
        }

        contexte.drawImage(
          image,
          0,
          0,
          largeur,
          hauteur
        );

        resolve(
          canvas.toDataURL("image/jpeg", 0.78)
        );
      };

      image.src = String(lecteur.result);
    };

    lecteur.readAsDataURL(file);
  });
}

function dateIlYASeptJours(): number {
  const date = new Date();
  date.setDate(date.getDate() - 7);

  return date.getTime();
}

export default function PhotosPage() {
  const remote = useRemoteCollection<Photo>("photos");
  const photos = remote.items;
  const logements = (remote.references.logements || []) as unknown as Logement[];

  const [photosEnAttente, setPhotosEnAttente] =
    useState<PhotoEnAttente[]>([]);

  const [logementId, setLogementId] = useState("");
  const [categorie, setCategorie] =
    useState<CategoriePhoto>("État des lieux");

  const [datePhoto, setDatePhoto] = useState(
    dateLocaleISO()
  );

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");

  const [formulaireOuvert, setFormulaireOuvert] =
    useState(false);

  const [traitementEnCours, setTraitementEnCours] =
    useState(false);

  const donneesChargees = !remote.loading;

  const [erreur, setErreur] = useState("");
  const [erreurStockage] =
    useState("");

  const [recherche, setRecherche] = useState("");

  const [filtreCategorie, setFiltreCategorie] =
    useState<FiltreCategorie>("Toutes");

  const [filtreLogement, setFiltreLogement] =
    useState("Tous");

  const [photoAffichee, setPhotoAffichee] =
    useState<Photo | null>(null);

  

  

  useEffect(() => {
    if (!photoAffichee) return;

    function fermerAvecEchap(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPhotoAffichee(null);
      }
    }

    window.addEventListener(
      "keydown",
      fermerAvecEchap
    );

    return () => {
      window.removeEventListener(
        "keydown",
        fermerAvecEchap
      );
    };
  }, [photoAffichee]);

  const statistiques = useMemo(() => {
    const limiteRecente = dateIlYASeptJours();

    return {
      total: photos.length,

      recentes: photos.filter((photo) => {
        const date = Date.parse(photo.createdAt);

        return (
          !Number.isNaN(date) &&
          date >= limiteRecente
        );
      }).length,

      incidents: photos.filter(
        (photo) => photo.categorie === "Incident"
      ).length,

      logementsDocumentes: new Set(
        photos
          .map((photo) => photo.logementId)
          .filter(Boolean)
      ).size,
    };
  }, [photos]);

  const resultats = useMemo(() => {
    const rechercheNormalisee =
      normaliserTexte(recherche);

    return photos
      .filter((photo) => {
        if (
          filtreCategorie !== "Toutes" &&
          photo.categorie !== filtreCategorie
        ) {
          return false;
        }

        if (
          filtreLogement !== "Tous" &&
          photo.logementId !== filtreLogement
        ) {
          return false;
        }

        if (!rechercheNormalisee) return true;

        const logement = logements.find(
          (item) => item.id === photo.logementId
        );

        const contenu = [
          photo.titre,
          photo.description,
          photo.categorie,
          photo.date,
          photo.nomFichier,
          logement?.nom || "",
          logement?.ville || "",
          logement?.adresse || "",
        ]
          .map((valeur) =>
            normaliserTexte(String(valeur || ""))
          )
          .join(" ");

        return contenu.includes(
          rechercheNormalisee
        );
      })
      .sort((a, b) => {
        const dateA = `${a.date} ${a.createdAt}`;
        const dateB = `${b.date} ${b.createdAt}`;

        return dateB.localeCompare(dateA);
      });
  }, [
    photos,
    logements,
    recherche,
    filtreCategorie,
    filtreLogement,
  ]);

  function nomLogement(id: string): string {
    const logement = logements.find(
      (item) => item.id === id
    );

    if (!logement) {
      return "Logement non renseigné";
    }

    return logement.ville
      ? `${logement.nom} — ${logement.ville}`
      : logement.nom;
  }

  function ouvrirFormulaire() {
    setPhotosEnAttente([]);
    setLogementId("");
    setCategorie("État des lieux");
    setDatePhoto(dateLocaleISO());
    setTitre("");
    setDescription("");
    setErreur("");
    setFormulaireOuvert(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function fermerFormulaire() {
    setPhotosEnAttente([]);
    setLogementId("");
    setCategorie("État des lieux");
    setDatePhoto(dateLocaleISO());
    setTitre("");
    setDescription("");
    setErreur("");
    setFormulaireOuvert(false);
  }

  async function selectionnerPhotos(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const fichiers = Array.from(
      event.target.files || []
    );

    event.target.value = "";

    if (fichiers.length === 0) return;

    const images = fichiers
      .filter((fichier) =>
        fichier.type.startsWith("image/")
      )
      .slice(0, 10);

    if (images.length === 0) {
      setErreur(
        "Sélectionnez uniquement des fichiers image."
      );
      return;
    }

    setTraitementEnCours(true);
    setErreur("");

    try {
      const photosPreparees = await Promise.all(
        images.map(async (fichier) => ({
          id: creerIdentifiant("attente"),
          nomFichier: fichier.name,
          image: await compresserImage(fichier),
        }))
      );

      setPhotosEnAttente((liste) => [
        ...liste,
        ...photosPreparees,
      ]);
    } catch (cause) {
      setErreur(
        cause instanceof Error
          ? cause.message
          : "Une photo n’a pas pu être préparée."
      );
    } finally {
      setTraitementEnCours(false);
    }
  }

  function retirerPhotoEnAttente(id: string) {
    setPhotosEnAttente((liste) =>
      liste.filter((photo) => photo.id !== id)
    );
  }

  async function enregistrerPhotos() {
    if (!logementId) {
      setErreur("Le logement est obligatoire.");
      return;
    }

    if (!datePhoto) {
      setErreur("La date est obligatoire.");
      return;
    }

    if (photosEnAttente.length === 0) {
      setErreur(
        "Ajoutez au minimum une photo."
      );
      return;
    }

    const maintenant = new Date().toISOString();

    const nouvellesPhotos: Photo[] =
      photosEnAttente.map(
        (photo, index): Photo => ({
          id: photo.id,
          logementId,
          categorie,
          date: datePhoto,
          titre:
            titre.trim() ||
            (photosEnAttente.length > 1
              ? `${categorie} ${index + 1}`
              : categorie),
          description: description.trim(),
          image: photo.image,
          nomFichier: photo.nomFichier,
          createdAt: maintenant,
          updatedAt: maintenant,
        })
      );

    if (!(await remote.change((liste) => [
      ...nouvellesPhotos.filter(photo => !liste.some(existing => existing.id === photo.id)),
      ...liste,
    ]))) return;

    fermerFormulaire();
  }

  async function supprimerPhoto(photo: Photo) {
    const confirmation = window.confirm(
      `Supprimer définitivement la photo « ${
        photo.titre || photo.nomFichier
      } » ?`
    );

    if (!confirmation) return;

    if (!(await remote.change((liste) =>
      liste.filter(
        (item) => item.id !== photo.id
      )))) return;

    if (photoAffichee?.id === photo.id) {
      setPhotoAffichee(null);
    }
  }

  function reinitialiserFiltres() {
    setRecherche("");
    setFiltreCategorie("Toutes");
    setFiltreLogement("Tous");
  }

  const filtresActifs =
    recherche.trim() !== "" ||
    filtreCategorie !== "Toutes" ||
    filtreLogement !== "Tous";

  return (
    <fieldset disabled={remote.busy || remote.loading} className="min-w-0">{remote.error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{remote.error}</p>}{remote.busy && <p role="status">Enregistrement en cours…</p>}<div className="space-y-8">
      <PageHeader
        titre="Photos"
        description="Classez les photos des logements, états des lieux, ménages, incidents et travaux."
        action={
          <button
            type="button"
            onClick={ouvrirFormulaire}
            disabled={logements.length === 0}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            + Ajouter des photos
          </button>
        }
      />

      {logements.length === 0 &&
        donneesChargees && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-black text-amber-950">
              Aucun logement enregistré
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              Ajoutez un logement avant de créer son
              dossier photographique.
            </p>
          </div>
        )}

      {erreurStockage && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-black text-red-900">
            Stockage insuffisant
          </h2>

          <p className="mt-2 text-sm leading-6 text-red-700">
            {erreurStockage}
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <CarteStatistique
          titre="Photos"
          valeur={statistiques.total}
          couleur="blue"
        />

        <CarteStatistique
          titre="Ajoutées récemment"
          valeur={statistiques.recentes}
          couleur="green"
        />

        <CarteStatistique
          titre="Incidents"
          valeur={statistiques.incidents}
          couleur="red"
        />

        <CarteStatistique
          titre="Logements documentés"
          valeur={statistiques.logementsDocumentes}
          couleur="orange"
        />
      </div>

      {formulaireOuvert && (
        <Section
          titre="Ajouter des photos"
          description="Les images sont automatiquement compressées avant leur enregistrement."
        >
          {erreur && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              {erreur}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Logement
              </span>

              <select
                value={logementId}
                onChange={(event) =>
                  setLogementId(event.target.value)
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">
                  Sélectionner un logement
                </option>

                {logements.map((logement) => (
                  <option
                    key={logement.id}
                    value={logement.id}
                  >
                    {logement.nom}
                    {logement.ville
                      ? ` — ${logement.ville}`
                      : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Catégorie
              </span>

              <select
                value={categorie}
                onChange={(event) =>
                  setCategorie(
                    event.target
                      .value as CategoriePhoto
                  )
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {categoriesPhoto.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <Champ
              label="Date"
              type="date"
              value={datePhoto}
              onChange={setDatePhoto}
            />

            <Champ
              label="Titre"
              value={titre}
              placeholder="Facultatif"
              onChange={setTitre}
            />
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Description
            </span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={4}
              placeholder="Pièce concernée, dégât observé, intervention réalisée..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <div className="text-center">
              <div className="text-4xl">📷</div>

              <h3 className="mt-3 font-black text-slate-900">
                Sélectionner les photos
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Jusqu’à 10 images à la fois.
              </p>

              <label className="mt-5 inline-flex cursor-pointer rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
                {traitementEnCours
                  ? "Préparation en cours..."
                  : "Choisir des images"}

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={traitementEnCours}
                  onChange={selectionnerPhotos}
                  className="hidden"
                />
              </label>
            </div>

            {photosEnAttente.length > 0 && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {photosEnAttente.map((photo) => (
                  <div
                    key={photo.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <div className="relative aspect-[4/3]">
                      <NextImage
                        src={photo.image}
                        alt={photo.nomFichier}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>

                    <div className="p-3">
                      <p className="truncate text-xs font-bold text-slate-700">
                        {photo.nomFichier}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          retirerPhotoEnAttente(
                            photo.id
                          )
                        }
                        className="mt-3 w-full rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={enregistrerPhotos}
              disabled={
                traitementEnCours ||
                photosEnAttente.length === 0
              }
              className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Enregistrer les photos
            </button>

            <button
              type="button"
              onClick={fermerFormulaire}
              className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
          </div>
        </Section>
      )}

      <Section
        titre="Rechercher et filtrer"
        description={`${resultats.length} photo(s) affichée(s)`}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_230px_230px_auto]">
          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Rechercher
            </span>

            <input
              type="search"
              value={recherche}
              onChange={(event) =>
                setRecherche(event.target.value)
              }
              placeholder="Logement, titre, description, catégorie..."
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <SelectFiltre
            label="Catégorie"
            value={filtreCategorie}
            options={[
              "Toutes",
              ...categoriesPhoto,
            ]}
            onChange={(valeur) =>
              setFiltreCategorie(
                valeur as FiltreCategorie
              )
            }
          />

          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Logement
            </span>

            <select
              value={filtreLogement}
              onChange={(event) =>
                setFiltreLogement(event.target.value)
              }
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            >
              <option value="Tous">
                Tous les logements
              </option>

              {logements.map((logement) => (
                <option
                  key={logement.id}
                  value={logement.id}
                >
                  {logement.nom}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={reinitialiserFiltres}
              disabled={!filtresActifs}
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </Section>

      <Section
        titre="Galerie"
        description="Cliquez sur une photo pour l’afficher en grand."
      >
        {!donneesChargees ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 font-bold text-slate-500">
              Chargement des photos...
            </p>
          </div>
        ) : resultats.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {resultats.map((photo) => (
              <CartePhoto
                key={photo.id}
                photo={photo}
                logement={nomLogement(
                  photo.logementId
                )}
                onAfficher={() =>
                  setPhotoAffichee(photo)
                }
                onSupprimer={() =>
                  supprimerPhoto(photo)
                }
              />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <EtatVide
            icone="📷"
            titre="Aucune photo enregistrée"
            texte="Ajoutez les premières photos d’un logement, d’un état des lieux ou d’une intervention."
            action={
              logements.length > 0 ? (
                <button
                  type="button"
                  onClick={ouvrirFormulaire}
                  className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                >
                  + Ajouter des photos
                </button>
              ) : null
            }
          />
        ) : (
          <EtatVide
            icone="🔎"
            titre="Aucun résultat"
            texte="Aucune photo ne correspond aux filtres sélectionnés."
            action={
              <button
                type="button"
                onClick={reinitialiserFiltres}
                className="mt-6 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
              >
                Effacer les filtres
              </button>
            }
          />
        )}
      </Section>

      {photoAffichee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPhotoAffichee(null);
            }
          }}
        >
          <div className="max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-5 border-b border-slate-200 p-5">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  {photoAffichee.titre ||
                    photoAffichee.nomFichier}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {nomLogement(
                    photoAffichee.logementId
                  )}{" "}
                  · {photoAffichee.date}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPhotoAffichee(null)
                }
                className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200"
              >
                Fermer
              </button>
            </div>

            <div className="relative min-h-[65vh] bg-slate-950">
              <NextImage
                src={photoAffichee.image}
                alt={
                  photoAffichee.titre ||
                  photoAffichee.nomFichier
                }
                fill
                unoptimized
                className="object-contain"
              />
            </div>

            {photoAffichee.description && (
              <p className="whitespace-pre-wrap p-6 leading-7 text-slate-600">
                {photoAffichee.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div></fieldset>
  );
}

function CartePhoto({
  photo,
  logement,
  onAfficher,
  onSupprimer,
}: {
  photo: Photo;
  logement: string;
  onAfficher: () => void;
  onSupprimer: () => void;
}) {
  const categorieClasses: Record<
    CategoriePhoto,
    string
  > = {
    Arrivée: "bg-blue-100 text-blue-700",
    Départ: "bg-violet-100 text-violet-700",
    "État des lieux":
      "bg-cyan-100 text-cyan-700",
    Ménage:
      "bg-emerald-100 text-emerald-700",
    Incident: "bg-red-100 text-red-700",
    Travaux:
      "bg-orange-100 text-orange-700",
    Autre: "bg-slate-200 text-slate-700",
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <button
        type="button"
        onClick={onAfficher}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100"
      >
        <NextImage
          src={photo.image}
          alt={photo.titre || photo.nomFichier}
          fill
          unoptimized
          className="object-cover transition duration-300 hover:scale-105"
        />
      </button>

      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${categorieClasses[photo.categorie]}`}
          >
            {photo.categorie}
          </span>

          <span className="text-xs font-bold text-slate-400">
            {photo.date}
          </span>
        </div>

        <h3 className="mt-4 text-lg font-black text-slate-950">
          {photo.titre || photo.nomFichier}
        </h3>

        <p className="mt-1 text-sm font-semibold text-slate-500">
          {logement}
        </p>

        {photo.description && (
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
            {photo.description}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onAfficher}
            className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
          >
            Agrandir
          </button>

          <button
            type="button"
            onClick={onSupprimer}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
          >
            Supprimer
          </button>
        </div>
      </div>
    </article>
  );
}

function CarteStatistique({
  titre,
  valeur,
  couleur,
}: {
  titre: string;
  valeur: number;
  couleur: "blue" | "green" | "orange" | "red";
}) {
  const couleurs = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    orange:
      "border-orange-200 bg-orange-50 text-orange-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <span
        className={`inline-flex rounded-2xl border px-3 py-1 text-xs font-bold ${couleurs[couleur]}`}
      >
        {titre}
      </span>

      <p className="mt-5 text-4xl font-black text-slate-950">
        {valeur}
      </p>
    </div>
  );
}

function Champ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectFiltre({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function EtatVide({
  icone,
  titre,
  texte,
  action,
}: {
  icone: string;
  titre: string;
  texte: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
      <div className="text-5xl">{icone}</div>

      <h3 className="mt-5 text-xl font-black text-slate-900">
        {titre}
      </h3>

      <p className="mx-auto mt-2 max-w-lg text-slate-500">
        {texte}
      </p>

      {action}
    </div>
  );
}
