"use client";

import { useEffect, useMemo, useState } from "react";
import VoyageurCard from "@/components/voyageurs/VoyageurCard";
import VoyageurForm from "@/components/voyageurs/VoyageurForm";
import {
  enregistrerStorage,
  lireStorage,
} from "@/lib/storage";
import {
  type StatutVoyageur,
  type Voyageur,
  voyageurVide,
} from "@/types/voyageur";

const CLE_STORAGE_VOYAGEURS = "cap-serein-voyageurs";
const CLE_STORAGE_LOGEMENTS = "cap-serein-logements";

type LogementOption = {
  id: string;
  nom: string;
  ville: string;
};

type FiltreStatut = "Tous" | StatutVoyageur;

const STATUTS: FiltreStatut[] = [
  "Tous",
  "Réservation",
  "Arrivé",
  "Parti",
  "Annulé",
];

function creerIdentifiant(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `voyageur-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normaliserTexte(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function obtenirTimestamp(date: string): number {
  const timestamp = Date.parse(date);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function creerNouveauVoyageur(): Voyageur {
  const maintenant = new Date().toISOString();

  return {
    ...voyageurVide,
    id: creerIdentifiant(),
    createdAt: maintenant,
    updatedAt: maintenant,
  };
}

function Statistique({
  titre,
  valeur,
  description,
  icone,
}: {
  titre: string;
  valeur: number;
  description: string;
  icone: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{titre}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {valeur}
          </p>

          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          {icone}
        </div>
      </div>
    </article>
  );
}

function IconeVoyageurs() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 0 0 3.742-.479 3 3 0 0 0-4.682-2.72M18 18.72v-.001c0-1.108-.285-2.15-.785-3.057M18 18.72v.1A11.29 11.29 0 0 1 12 20.4c-2.04 0-3.954-.54-5.607-1.484v-.1c0-1.108.285-2.15.785-3.057m9.822-.097a5.997 5.997 0 0 0-10 0m10 0a5.997 5.997 0 0 1-10 0m0 0a3 3 0 0 0-4.682 2.72 9.094 9.094 0 0 0 3.742.479M15 7.2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
      />
    </svg>
  );
}

function IconeReservation() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3.75 9h16.5m-15.75-4.5h15a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5V6a1.5 1.5 0 0 1 1.5-1.5Z"
      />
    </svg>
  );
}

function IconeArrivee() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4.5 12.75 6 6 9-13.5"
      />
    </svg>
  );
}

function IconeDepart() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3-3H9m0 0 3-3m-3 3 3 3"
      />
    </svg>
  );
}

export default function VoyageursPage() {
  const [voyageurs, setVoyageurs] = useState<Voyageur[]>([]);
  const [logements, setLogements] = useState<LogementOption[]>([]);
  const [voyageurEnCours, setVoyageurEnCours] =
    useState<Voyageur | null>(null);

  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] =
    useState<FiltreStatut>("Tous");
  const [filtreLogement, setFiltreLogement] = useState("Tous");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [erreurFormulaire, setErreurFormulaire] = useState("");
  const [donneesChargees, setDonneesChargees] = useState(false);

  useEffect(() => {
    const voyageursEnregistres =
      lireStorage<Voyageur>(CLE_STORAGE_VOYAGEURS);

    const logementsEnregistres =
      lireStorage<LogementOption>(CLE_STORAGE_LOGEMENTS);

    setVoyageurs(voyageursEnregistres);
    setLogements(logementsEnregistres);
    setDonneesChargees(true);
  }, []);

  useEffect(() => {
    if (!donneesChargees) {
      return;
    }

    enregistrerStorage<Voyageur>(
      CLE_STORAGE_VOYAGEURS,
      voyageurs,
    );
  }, [voyageurs, donneesChargees]);

  const statistiques = useMemo(() => {
    return {
      total: voyageurs.length,
      reservations: voyageurs.filter(
        (voyageur) => voyageur.statut === "Réservation",
      ).length,
      arrives: voyageurs.filter(
        (voyageur) => voyageur.statut === "Arrivé",
      ).length,
      partis: voyageurs.filter(
        (voyageur) => voyageur.statut === "Parti",
      ).length,
    };
  }, [voyageurs]);

  const voyageursFiltres = useMemo(() => {
    const rechercheNormalisee = normaliserTexte(recherche);

    return voyageurs
      .filter((voyageur) => {
        if (
          filtreStatut !== "Tous" &&
          voyageur.statut !== filtreStatut
        ) {
          return false;
        }

        if (
          filtreLogement !== "Tous" &&
          voyageur.logementId !== filtreLogement
        ) {
          return false;
        }

        if (!rechercheNormalisee) {
          return true;
        }

        const logement = logements.find(
          (element) => element.id === voyageur.logementId,
        );

        const contenuRecherche = [
          voyageur.nom,
          voyageur.prenom,
          voyageur.telephone,
          voyageur.email,
          voyageur.numeroReservation,
          voyageur.plateforme,
          logement?.nom ?? "",
          logement?.ville ?? "",
        ]
          .map((valeur) => normaliserTexte(String(valeur ?? "")))
          .join(" ");

        return contenuRecherche.includes(rechercheNormalisee);
      })
      .sort((a, b) => {
        const dateA = obtenirTimestamp(a.arrivee);
        const dateB = obtenirTimestamp(b.arrivee);

        if (dateA !== dateB) {
          return dateB - dateA;
        }

        return `${a.nom} ${a.prenom}`.localeCompare(
          `${b.nom} ${b.prenom}`,
          "fr",
        );
      });
  }, [
    filtreLogement,
    filtreStatut,
    logements,
    recherche,
    voyageurs,
  ]);

  function ouvrirNouveauVoyageur() {
    setVoyageurEnCours(creerNouveauVoyageur());
    setErreurFormulaire("");
    setFormulaireOuvert(true);
  }

  function ouvrirModification(voyageur: Voyageur) {
    setVoyageurEnCours({ ...voyageur });
    setErreurFormulaire("");
    setFormulaireOuvert(true);
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false);
    setVoyageurEnCours(null);
    setErreurFormulaire("");
  }

  function mettreAJourVoyageur(voyageur: Voyageur) {
    setVoyageurEnCours(voyageur);

    if (erreurFormulaire) {
      setErreurFormulaire("");
    }
  }

  function enregistrerVoyageur() {
    if (!voyageurEnCours) {
      return;
    }

    if (!voyageurEnCours.nom.trim()) {
      setErreurFormulaire("Le nom du voyageur est obligatoire.");
      return;
    }

    if (!voyageurEnCours.prenom.trim()) {
      setErreurFormulaire("Le prénom du voyageur est obligatoire.");
      return;
    }

    if (!voyageurEnCours.logementId) {
      setErreurFormulaire("Le logement est obligatoire.");
      return;
    }

    if (!voyageurEnCours.arrivee) {
      setErreurFormulaire("La date d’arrivée est obligatoire.");
      return;
    }

    if (!voyageurEnCours.depart) {
      setErreurFormulaire("La date de départ est obligatoire.");
      return;
    }

    const dateArrivee = obtenirTimestamp(voyageurEnCours.arrivee);
    const dateDepart = obtenirTimestamp(voyageurEnCours.depart);

    if (
      dateArrivee > 0 &&
      dateDepart > 0 &&
      dateDepart < dateArrivee
    ) {
      setErreurFormulaire(
        "La date de départ ne peut pas être antérieure à la date d’arrivée.",
      );
      return;
    }

    const maintenant = new Date().toISOString();

    setVoyageurs((voyageursActuels) => {
      const existeDeja = voyageursActuels.some(
        (voyageur) => voyageur.id === voyageurEnCours.id,
      );

      const voyageurFinal: Voyageur = {
        ...voyageurEnCours,
        nom: voyageurEnCours.nom.trim(),
        prenom: voyageurEnCours.prenom.trim(),
        telephone: voyageurEnCours.telephone.trim(),
        email: voyageurEnCours.email.trim(),
        numeroReservation:
          voyageurEnCours.numeroReservation.trim(),
        observations: voyageurEnCours.observations.trim(),
        createdAt: existeDeja
          ? voyageurEnCours.createdAt
          : voyageurEnCours.createdAt || maintenant,
        updatedAt: maintenant,
      };

      if (existeDeja) {
        return voyageursActuels.map((voyageur) =>
          voyageur.id === voyageurFinal.id
            ? voyageurFinal
            : voyageur,
        );
      }

      return [voyageurFinal, ...voyageursActuels];
    });

    fermerFormulaire();
  }

  function supprimerVoyageur(id: string) {
    const voyageur = voyageurs.find(
      (element) => element.id === id,
    );

    if (!voyageur) {
      return;
    }

    const confirmation = window.confirm(
      `Supprimer définitivement la fiche de ${voyageur.prenom} ${voyageur.nom} ?`,
    );

    if (!confirmation) {
      return;
    }

    setVoyageurs((voyageursActuels) =>
      voyageursActuels.filter(
        (element) => element.id !== id,
      ),
    );

    if (voyageurEnCours?.id === id) {
      fermerFormulaire();
    }
  }

  function reinitialiserFiltres() {
    setRecherche("");
    setFiltreStatut("Tous");
    setFiltreLogement("Tous");
  }

  const filtresActifs =
    recherche.trim() !== "" ||
    filtreStatut !== "Tous" ||
    filtreLogement !== "Tous";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              Gestion opérationnelle
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Voyageurs
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Centralisez les réservations, les coordonnées, les
              séjours et le suivi des arrivées et départs.
            </p>
          </div>

          <button
            type="button"
            onClick={ouvrirNouveauVoyageur}
            disabled={logements.length === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>

            Ajouter un voyageur
          </button>
        </header>

        {logements.length === 0 && donneesChargees && (
          <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
              </div>

              <div>
                <h2 className="font-semibold text-amber-950">
                  Aucun logement disponible
                </h2>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Un logement doit être enregistré dans le module
                  Logements avant de pouvoir créer une fiche voyageur.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Statistique
            titre="Total voyageurs"
            valeur={statistiques.total}
            description="Toutes les fiches enregistrées"
            icone={<IconeVoyageurs />}
          />

          <Statistique
            titre="Réservations"
            valeur={statistiques.reservations}
            description="Séjours à venir ou en attente"
            icone={<IconeReservation />}
          />

          <Statistique
            titre="Sur place"
            valeur={statistiques.arrives}
            description="Voyageurs actuellement arrivés"
            icone={<IconeArrivee />}
          />

          <Statistique
            titre="Départs terminés"
            valeur={statistiques.partis}
            description="Séjours clôturés"
            icone={<IconeDepart />}
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Rechercher
              </span>

              <div className="relative">
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.35-4.35m1.35-5.4a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"
                  />
                </svg>

                <input
                  type="search"
                  value={recherche}
                  onChange={(event) =>
                    setRecherche(event.target.value)
                  }
                  placeholder="Nom, téléphone, réservation, logement..."
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Statut
              </span>

              <select
                value={filtreStatut}
                onChange={(event) =>
                  setFiltreStatut(
                    event.target.value as FiltreStatut,
                  )
                }
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {STATUTS.map((statut) => (
                  <option key={statut} value={statut}>
                    {statut === "Tous"
                      ? "Tous les statuts"
                      : statut}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Logement
              </span>

              <select
                value={filtreLogement}
                onChange={(event) =>
                  setFiltreLogement(event.target.value)
                }
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Tous">Tous les logements</option>

                {logements.map((logement) => (
                  <option key={logement.id} value={logement.id}>
                    {logement.nom}
                    {logement.ville
                      ? ` — ${logement.ville}`
                      : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={reinitialiserFiltres}
                disabled={!filtresActifs}
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">
                {voyageursFiltres.length}
              </span>{" "}
              {voyageursFiltres.length > 1
                ? "voyageurs affichés"
                : "voyageur affiché"}
            </p>

            {filtresActifs && (
              <p className="text-xs font-medium text-blue-700">
                Filtres actifs
              </p>
            )}
          </div>
        </section>

        <section className="mt-6">
          {!donneesChargees ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-700" />

              <p className="mt-4 text-sm font-medium text-slate-600">
                Chargement des voyageurs...
              </p>
            </div>
          ) : voyageursFiltres.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {voyageursFiltres.map((voyageur) => (
                <VoyageurCard
                  key={voyageur.id}
                  voyageur={voyageur}
                  logements={logements}
                  onModifier={ouvrirModification}
                  onSupprimer={supprimerVoyageur}
                />
              ))}
            </div>
          ) : voyageurs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <IconeVoyageurs />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-slate-900">
                Aucun voyageur enregistré
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Ajoutez votre première réservation pour centraliser
                les informations du séjour et préparer l’accueil des
                voyageurs.
              </p>

              {logements.length > 0 && (
                <button
                  type="button"
                  onClick={ouvrirNouveauVoyageur}
                  className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                >
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>

                  Ajouter un voyageur
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.35-4.35m1.35-5.4a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"
                  />
                </svg>
              </div>

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                Aucun résultat
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Aucun voyageur ne correspond aux critères
                sélectionnés.
              </p>

              <button
                type="button"
                onClick={reinitialiserFiltres}
                className="mt-5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Effacer les filtres
              </button>
            </div>
          )}
        </section>
      </div>

      {formulaireOuvert && voyageurEnCours && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={
            voyageurs.some(
              (voyageur) => voyageur.id === voyageurEnCours.id,
            )
              ? "Modifier un voyageur"
              : "Ajouter un voyageur"
          }
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fermerFormulaire();
            }
          }}
        >
          <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-5xl sm:rounded-3xl">
            {erreurFormulaire && (
              <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 sm:mx-6 sm:mt-6">
                {erreurFormulaire}
              </div>
            )}

            <VoyageurForm
              voyageur={voyageurEnCours}
              logements={logements}
              onChange={mettreAJourVoyageur}
              onEnregistrer={enregistrerVoyageur}
              onAnnuler={fermerFormulaire}
            />
          </div>
        </div>
      )}
    </main>
  );
}