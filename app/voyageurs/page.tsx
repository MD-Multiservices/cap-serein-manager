"use client";

import { useEffect, useMemo, useState } from "react";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import VoyageurCard from "@/components/voyageurs/VoyageurCard";
import VoyageurForm from "@/components/voyageurs/VoyageurForm";

import { enregistrer, lire } from "@/lib/database";

import {
  type StatutVoyageur,
  type Voyageur,
  voyageurVide,
} from "@/types/voyageur";

type Logement = {
  id: string;
  nom: string;
  ville: string;
};

type FiltreStatut = "Tous" | StatutVoyageur;

const statuts: FiltreStatut[] = [
  "Tous",
  "Réservation",
  "Arrivé",
  "Parti",
  "Annulé",
];

function creerIdentifiant() {
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

function normaliserTexte(texte: string) {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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

export default function VoyageursPage() {
  const [voyageurs, setVoyageurs] = useState<Voyageur[]>([]);
  const [logements, setLogements] = useState<Logement[]>([]);

  const [voyageurEnCours, setVoyageurEnCours] =
    useState<Voyageur | null>(null);

  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] =
    useState<FiltreStatut>("Tous");
  const [filtreLogement, setFiltreLogement] = useState("Tous");

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [erreur, setErreur] = useState("");
  const [donneesChargees, setDonneesChargees] = useState(false);

  useEffect(() => {
    setVoyageurs(lire<Voyageur>("voyageurs"));
    setLogements(lire<Logement>("logements"));
    setDonneesChargees(true);
  }, []);

  useEffect(() => {
    if (!donneesChargees) return;

    enregistrer("voyageurs", voyageurs);
  }, [voyageurs, donneesChargees]);

  const statistiques = useMemo(() => {
    return {
      total: voyageurs.length,
      reservations: voyageurs.filter(
        (voyageur) => voyageur.statut === "Réservation"
      ).length,
      arrives: voyageurs.filter(
        (voyageur) => voyageur.statut === "Arrivé"
      ).length,
      partis: voyageurs.filter(
        (voyageur) => voyageur.statut === "Parti"
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
          (item) => item.id === voyageur.logementId
        );

        const contenu = [
          voyageur.nom,
          voyageur.prenom,
          voyageur.telephone,
          voyageur.email,
          voyageur.numeroReservation,
          voyageur.plateforme,
          logement?.nom || "",
          logement?.ville || "",
        ]
          .map((valeur) => normaliserTexte(String(valeur || "")))
          .join(" ");

        return contenu.includes(rechercheNormalisee);
      })
      .sort((a, b) => {
        const dateA = Date.parse(a.arrivee || "");
        const dateB = Date.parse(b.arrivee || "");

        const timestampA = Number.isNaN(dateA) ? 0 : dateA;
        const timestampB = Number.isNaN(dateB) ? 0 : dateB;

        return timestampB - timestampA;
      });
  }, [
    voyageurs,
    logements,
    recherche,
    filtreStatut,
    filtreLogement,
  ]);

  function ouvrirNouveauVoyageur() {
    setVoyageurEnCours(creerNouveauVoyageur());
    setErreur("");
    setFormulaireOuvert(true);
  }

  function ouvrirModification(voyageur: Voyageur) {
    setVoyageurEnCours({ ...voyageur });
    setErreur("");
    setFormulaireOuvert(true);
  }

  function fermerFormulaire() {
    setVoyageurEnCours(null);
    setErreur("");
    setFormulaireOuvert(false);
  }

  function modifierVoyageur(voyageur: Voyageur) {
    setVoyageurEnCours(voyageur);

    if (erreur) {
      setErreur("");
    }
  }

  function enregistrerVoyageur() {
    if (!voyageurEnCours) return;

    if (!voyageurEnCours.prenom.trim()) {
      setErreur("Le prénom du voyageur est obligatoire.");
      return;
    }

    if (!voyageurEnCours.nom.trim()) {
      setErreur("Le nom du voyageur est obligatoire.");
      return;
    }

    if (!voyageurEnCours.logementId) {
      setErreur("Le logement est obligatoire.");
      return;
    }

    if (!voyageurEnCours.arrivee) {
      setErreur("La date d’arrivée est obligatoire.");
      return;
    }

    if (!voyageurEnCours.depart) {
      setErreur("La date de départ est obligatoire.");
      return;
    }

    const dateArrivee = Date.parse(voyageurEnCours.arrivee);
    const dateDepart = Date.parse(voyageurEnCours.depart);

    if (
      !Number.isNaN(dateArrivee) &&
      !Number.isNaN(dateDepart) &&
      dateDepart < dateArrivee
    ) {
      setErreur(
        "La date de départ ne peut pas être antérieure à la date d’arrivée."
      );
      return;
    }

    const maintenant = new Date().toISOString();

    setVoyageurs((liste) => {
      const existe = liste.some(
        (voyageur) => voyageur.id === voyageurEnCours.id
      );

      const voyageurFinal: Voyageur = {
        ...voyageurEnCours,
        prenom: voyageurEnCours.prenom.trim(),
        nom: voyageurEnCours.nom.trim(),
        telephone: voyageurEnCours.telephone.trim(),
        email: voyageurEnCours.email.trim(),
        numeroReservation:
          voyageurEnCours.numeroReservation.trim(),
        observations: voyageurEnCours.observations.trim(),
        createdAt:
          voyageurEnCours.createdAt || maintenant,
        updatedAt: maintenant,
      };

      if (existe) {
        return liste.map((voyageur) =>
          voyageur.id === voyageurFinal.id
            ? voyageurFinal
            : voyageur
        );
      }

      return [voyageurFinal, ...liste];
    });

    fermerFormulaire();
  }

  function supprimerVoyageur(id: string) {
    const voyageur = voyageurs.find((item) => item.id === id);

    if (!voyageur) return;

    const confirmation = window.confirm(
      `Supprimer définitivement la fiche de ${voyageur.prenom} ${voyageur.nom} ?`
    );

    if (!confirmation) return;

    setVoyageurs((liste) =>
      liste.filter((item) => item.id !== id)
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
    <div className="space-y-8">
      <PageHeader
        titre="Voyageurs"
        description="Centralisez les réservations, les coordonnées et le suivi des arrivées et départs."
        action={
          <button
            type="button"
            onClick={ouvrirNouveauVoyageur}
            disabled={logements.length === 0}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            + Nouveau voyageur
          </button>
        }
      />

      {logements.length === 0 && donneesChargees && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl">
              ⚠️
            </div>

            <div>
              <h2 className="font-bold text-amber-950">
                Aucun logement disponible
              </h2>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Ajoutez d’abord un logement avant de créer une
                fiche voyageur.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <CarteStatistique
          titre="Total voyageurs"
          valeur={statistiques.total}
          couleur="blue"
        />

        <CarteStatistique
          titre="Réservations"
          valeur={statistiques.reservations}
          couleur="orange"
        />

        <CarteStatistique
          titre="Sur place"
          valeur={statistiques.arrives}
          couleur="green"
        />

        <CarteStatistique
          titre="Départs terminés"
          valeur={statistiques.partis}
          couleur="slate"
        />
      </div>

      <Section
        titre="Rechercher et filtrer"
        description={`${voyageursFiltres.length} voyageur(s) affiché(s)`}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
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
              placeholder="Nom, téléphone, réservation, logement..."
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Statut
            </span>

            <select
              value={filtreStatut}
              onChange={(event) =>
                setFiltreStatut(
                  event.target.value as FiltreStatut
                )
              }
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            >
              {statuts.map((statut) => (
                <option key={statut} value={statut}>
                  {statut === "Tous"
                    ? "Tous les statuts"
                    : statut}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Logement
            </span>

            <select
              value={filtreLogement}
              onChange={(event) =>
                setFiltreLogement(event.target.value)
              }
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
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
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </Section>

      <Section
        titre="Liste des voyageurs"
        description="Réservations et séjours enregistrés."
      >
        {!donneesChargees ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-semibold text-slate-500">
              Chargement des voyageurs...
            </p>
          </div>
        ) : voyageursFiltres.length > 0 ? (
          <div className="grid gap-6 xl:grid-cols-2">
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
          <EtatVide
            icone="🧳"
            titre="Aucun voyageur enregistré"
            texte="Ajoutez votre première réservation pour préparer l’accueil et le suivi du séjour."
            action={
              logements.length > 0 ? (
                <button
                  type="button"
                  onClick={ouvrirNouveauVoyageur}
                  className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                >
                  + Ajouter un voyageur
                </button>
              ) : null
            }
          />
        ) : (
          <EtatVide
            icone="🔎"
            titre="Aucun résultat"
            texte="Aucun voyageur ne correspond aux critères sélectionnés."
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

      {formulaireOuvert && voyageurEnCours && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fermerFormulaire();
            }
          }}
        >
          <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-slate-100 shadow-2xl sm:max-w-5xl sm:rounded-3xl">
            {erreur && (
              <div className="mx-4 mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 sm:mx-6 sm:mt-6">
                {erreur}
              </div>
            )}

            <VoyageurForm
              voyageur={voyageurEnCours}
              logements={logements}
              onChange={modifierVoyageur}
              onEnregistrer={enregistrerVoyageur}
              onAnnuler={fermerFormulaire}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CarteStatistique({
  titre,
  valeur,
  couleur,
}: {
  titre: string;
  valeur: number;
  couleur: "blue" | "green" | "orange" | "slate";
}) {
  const couleurs = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    orange:
      "border-orange-200 bg-orange-50 text-orange-700",
    slate:
      "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div
        className={`inline-flex rounded-2xl border px-3 py-1 text-xs font-bold ${couleurs[couleur]}`}
      >
        {titre}
      </div>

      <p className="mt-5 text-4xl font-black text-slate-950">
        {valeur}
      </p>
    </div>
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
  action?: React.ReactNode;
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