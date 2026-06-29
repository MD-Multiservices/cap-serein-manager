"use client";

import { useEffect, useMemo, useState } from "react";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";

import { enregistrer, lire } from "@/lib/database";

type TypeEtatDesLieux = "Entrée" | "Sortie";

type StatutEtatDesLieux =
  | "À préparer"
  | "En cours"
  | "Terminé"
  | "Signé";

type NiveauEtat =
  | "Non vérifié"
  | "Neuf"
  | "Bon état"
  | "État moyen"
  | "Mauvais état";

type EtatDesLieux = {
  id: string;
  logementId: string;
  voyageurId: string;
  type: TypeEtatDesLieux;
  date: string;
  heure: string;
  statut: StatutEtatDesLieux;
  etatGeneral: NiveauEtat;
  proprete: NiveauEtat;
  compteurElectricite: string;
  compteurEau: string;
  compteurGaz: string;
  nombreCles: number;
  observations: string;
  createdAt: string;
  updatedAt: string;
};

type Logement = {
  id: string;
  nom: string;
  adresse?: string;
  ville?: string;
};

type Voyageur = {
  id: string;
  prenom: string;
  nom: string;
};

type FiltreType = "Tous" | TypeEtatDesLieux;
type FiltreStatut = "Tous" | StatutEtatDesLieux;

const typesEtatDesLieux: TypeEtatDesLieux[] = [
  "Entrée",
  "Sortie",
];

const statutsEtatDesLieux: StatutEtatDesLieux[] = [
  "À préparer",
  "En cours",
  "Terminé",
  "Signé",
];

const niveauxEtat: NiveauEtat[] = [
  "Non vérifié",
  "Neuf",
  "Bon état",
  "État moyen",
  "Mauvais état",
];

function creerIdentifiant(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `etat-des-lieux-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function dateLocaleISO(): string {
  const date = new Date();

  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
}

function creerEtatDesLieuxVide(): EtatDesLieux {
  const maintenant = new Date().toISOString();

  return {
    id: "",
    logementId: "",
    voyageurId: "",
    type: "Entrée",
    date: dateLocaleISO(),
    heure: "10:00",
    statut: "À préparer",
    etatGeneral: "Non vérifié",
    proprete: "Non vérifié",
    compteurElectricite: "",
    compteurEau: "",
    compteurGaz: "",
    nombreCles: 0,
    observations: "",
    createdAt: maintenant,
    updatedAt: maintenant,
  };
}

function normaliserTexte(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normaliserEtatDesLieux(
  item: EtatDesLieux
): EtatDesLieux {
  const ancienType = String(item.type);
  const ancienStatut = String(item.statut);

  let type: TypeEtatDesLieux = "Entrée";

  if (
    ancienType === "Sortie" ||
    ancienType === "Sortant"
  ) {
    type = "Sortie";
  }

  let statut: StatutEtatDesLieux = "À préparer";

  if (ancienStatut === "En cours") {
    statut = "En cours";
  }

  if (
    ancienStatut === "Terminé" ||
    ancienStatut === "Terminée"
  ) {
    statut = "Terminé";
  }

  if (ancienStatut === "Signé") {
    statut = "Signé";
  }

  return {
    ...creerEtatDesLieuxVide(),
    ...item,
    type,
    statut,
    nombreCles: Number(item.nombreCles || 0),
    etatGeneral:
      item.etatGeneral || "Non vérifié",
    proprete: item.proprete || "Non vérifié",
  };
}

export default function EtatsDesLieuxPage() {
  const [etatsDesLieux, setEtatsDesLieux] = useState<
    EtatDesLieux[]
  >([]);

  const [logements, setLogements] = useState<Logement[]>([]);
  const [voyageurs, setVoyageurs] = useState<Voyageur[]>([]);

  const [etatEnCours, setEtatEnCours] =
    useState<EtatDesLieux>(creerEtatDesLieuxVide());

  const [formulaireOuvert, setFormulaireOuvert] =
    useState(false);

  const [donneesChargees, setDonneesChargees] =
    useState(false);

  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");

  const [filtreType, setFiltreType] =
    useState<FiltreType>("Tous");

  const [filtreStatut, setFiltreStatut] =
    useState<FiltreStatut>("Tous");

  useEffect(() => {
    setEtatsDesLieux(
      lire<EtatDesLieux>("etatsDesLieux").map(
        normaliserEtatDesLieux
      )
    );

    setLogements(lire<Logement>("logements"));
    setVoyageurs(lire<Voyageur>("voyageurs"));
    setDonneesChargees(true);
  }, []);

  useEffect(() => {
    if (!donneesChargees) return;

    enregistrer("etatsDesLieux", etatsDesLieux);
  }, [etatsDesLieux, donneesChargees]);

  const statistiques = useMemo(() => {
    return {
      total: etatsDesLieux.length,

      aPreparer: etatsDesLieux.filter(
        (etat) => etat.statut === "À préparer"
      ).length,

      enCours: etatsDesLieux.filter(
        (etat) => etat.statut === "En cours"
      ).length,

      termines: etatsDesLieux.filter(
        (etat) =>
          etat.statut === "Terminé" ||
          etat.statut === "Signé"
      ).length,

      sorties: etatsDesLieux.filter(
        (etat) => etat.type === "Sortie"
      ).length,
    };
  }, [etatsDesLieux]);

  const resultats = useMemo(() => {
    const rechercheNormalisee =
      normaliserTexte(recherche);

    return etatsDesLieux
      .filter((etat) => {
        if (
          filtreType !== "Tous" &&
          etat.type !== filtreType
        ) {
          return false;
        }

        if (
          filtreStatut !== "Tous" &&
          etat.statut !== filtreStatut
        ) {
          return false;
        }

        if (!rechercheNormalisee) return true;

        const logement = logements.find(
          (item) => item.id === etat.logementId
        );

        const voyageur = voyageurs.find(
          (item) => item.id === etat.voyageurId
        );

        const contenu = [
          etat.type,
          etat.statut,
          etat.date,
          logement?.nom || "",
          logement?.adresse || "",
          logement?.ville || "",
          voyageur?.prenom || "",
          voyageur?.nom || "",
          etat.observations,
        ]
          .map((valeur) =>
            normaliserTexte(String(valeur || ""))
          )
          .join(" ");

        return contenu.includes(rechercheNormalisee);
      })
      .sort((a, b) => {
        const dateA = `${a.date || "0000-00-00"} ${
          a.heure || "00:00"
        }`;

        const dateB = `${b.date || "0000-00-00"} ${
          b.heure || "00:00"
        }`;

        return dateB.localeCompare(dateA);
      });
  }, [
    etatsDesLieux,
    logements,
    voyageurs,
    recherche,
    filtreType,
    filtreStatut,
  ]);

  function nomLogement(id: string): string {
    const logement = logements.find(
      (item) => item.id === id
    );

    if (!logement) return "Logement non renseigné";

    return logement.ville
      ? `${logement.nom} — ${logement.ville}`
      : logement.nom;
  }

  function nomVoyageur(id: string): string {
    const voyageur = voyageurs.find(
      (item) => item.id === id
    );

    if (!voyageur) return "Voyageur non renseigné";

    return `${voyageur.prenom || ""} ${
      voyageur.nom || ""
    }`.trim();
  }

  function ouvrirNouvelEtatDesLieux() {
    setEtatEnCours(creerEtatDesLieuxVide());
    setErreur("");
    setFormulaireOuvert(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function ouvrirModification(etat: EtatDesLieux) {
    setEtatEnCours({ ...etat });
    setErreur("");
    setFormulaireOuvert(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function fermerFormulaire() {
    setEtatEnCours(creerEtatDesLieuxVide());
    setErreur("");
    setFormulaireOuvert(false);
  }

  function sauvegarderEtatDesLieux() {
    if (!etatEnCours.logementId) {
      setErreur("Le logement est obligatoire.");
      return;
    }

    if (!etatEnCours.voyageurId) {
      setErreur("Le voyageur est obligatoire.");
      return;
    }

    if (!etatEnCours.date) {
      setErreur("La date est obligatoire.");
      return;
    }

    if (!etatEnCours.heure) {
      setErreur("L’heure est obligatoire.");
      return;
    }

    const maintenant = new Date().toISOString();

    setEtatsDesLieux((liste) => {
      const existe = liste.some(
        (etat) => etat.id === etatEnCours.id
      );

      const etatFinal: EtatDesLieux = {
        ...etatEnCours,
        id:
          etatEnCours.id ||
          creerIdentifiant(),
        nombreCles: Math.max(
          0,
          Number(etatEnCours.nombreCles || 0)
        ),
        observations:
          etatEnCours.observations.trim(),
        createdAt:
          existe && etatEnCours.createdAt
            ? etatEnCours.createdAt
            : maintenant,
        updatedAt: maintenant,
      };

      if (existe) {
        return liste.map((etat) =>
          etat.id === etatFinal.id
            ? etatFinal
            : etat
        );
      }

      return [etatFinal, ...liste];
    });

    fermerFormulaire();
  }

  function supprimerEtatDesLieux(
    etat: EtatDesLieux
  ) {
    const confirmation = window.confirm(
      `Supprimer définitivement cet état des lieux de ${etat.type.toLowerCase()} ?`
    );

    if (!confirmation) return;

    setEtatsDesLieux((liste) =>
      liste.filter((item) => item.id !== etat.id)
    );
  }

  function changerStatut(
    id: string,
    statut: StatutEtatDesLieux
  ) {
    const maintenant = new Date().toISOString();

    setEtatsDesLieux((liste) =>
      liste.map((etat) =>
        etat.id === id
          ? {
              ...etat,
              statut,
              updatedAt: maintenant,
            }
          : etat
      )
    );
  }

  function reinitialiserFiltres() {
    setRecherche("");
    setFiltreType("Tous");
    setFiltreStatut("Tous");
  }

  const filtresActifs =
    recherche.trim() !== "" ||
    filtreType !== "Tous" ||
    filtreStatut !== "Tous";

  return (
    <div className="space-y-8">
      <PageHeader
        titre="États des lieux"
        description="Préparez et suivez les états des lieux d’entrée et de sortie de chaque logement."
        action={
          <button
            type="button"
            onClick={ouvrirNouvelEtatDesLieux}
            disabled={
              logements.length === 0 ||
              voyageurs.length === 0
            }
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            + Nouvel état des lieux
          </button>
        }
      />

      {(logements.length === 0 ||
        voyageurs.length === 0) &&
        donneesChargees && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-black text-amber-950">
              Informations manquantes
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              Vous devez avoir au minimum un logement et un
              voyageur enregistrés avant de créer un état des
              lieux.
            </p>
          </div>
        )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <CarteStatistique
          titre="Total"
          valeur={statistiques.total}
          couleur="blue"
        />

        <CarteStatistique
          titre="À préparer"
          valeur={statistiques.aPreparer}
          couleur="orange"
        />

        <CarteStatistique
          titre="En cours"
          valeur={statistiques.enCours}
          couleur="blue"
        />

        <CarteStatistique
          titre="Terminés"
          valeur={statistiques.termines}
          couleur="green"
        />

        <CarteStatistique
          titre="Sorties"
          valeur={statistiques.sorties}
          couleur="red"
        />
      </div>

      {formulaireOuvert && (
        <Section
          titre={
            etatEnCours.id
              ? "Modifier l’état des lieux"
              : "Nouvel état des lieux"
          }
          description="Renseignez le logement, le voyageur, les relevés et l’état général."
        >
          {erreur && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              {erreur}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Type
              </span>

              <select
                value={etatEnCours.type}
                onChange={(event) =>
                  setEtatEnCours({
                    ...etatEnCours,
                    type: event.target
                      .value as TypeEtatDesLieux,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {typesEtatDesLieux.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Statut
              </span>

              <select
                value={etatEnCours.statut}
                onChange={(event) =>
                  setEtatEnCours({
                    ...etatEnCours,
                    statut: event.target
                      .value as StatutEtatDesLieux,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {statutsEtatDesLieux.map((statut) => (
                  <option key={statut} value={statut}>
                    {statut}
                  </option>
                ))}
              </select>
            </label>

            <Champ
              label="Date"
              type="date"
              value={etatEnCours.date}
              onChange={(valeur) =>
                setEtatEnCours({
                  ...etatEnCours,
                  date: valeur,
                })
              }
            />

            <Champ
              label="Heure"
              type="time"
              value={etatEnCours.heure}
              onChange={(valeur) =>
                setEtatEnCours({
                  ...etatEnCours,
                  heure: valeur,
                })
              }
            />

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Logement
              </span>

              <select
                value={etatEnCours.logementId}
                onChange={(event) =>
                  setEtatEnCours({
                    ...etatEnCours,
                    logementId: event.target.value,
                  })
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
                Voyageur
              </span>

              <select
                value={etatEnCours.voyageurId}
                onChange={(event) =>
                  setEtatEnCours({
                    ...etatEnCours,
                    voyageurId: event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">
                  Sélectionner un voyageur
                </option>

                {voyageurs.map((voyageur) => (
                  <option
                    key={voyageur.id}
                    value={voyageur.id}
                  >
                    {voyageur.prenom} {voyageur.nom}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                État général
              </span>

              <select
                value={etatEnCours.etatGeneral}
                onChange={(event) =>
                  setEtatEnCours({
                    ...etatEnCours,
                    etatGeneral:
                      event.target.value as NiveauEtat,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {niveauxEtat.map((niveau) => (
                  <option key={niveau} value={niveau}>
                    {niveau}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Propreté
              </span>

              <select
                value={etatEnCours.proprete}
                onChange={(event) =>
                  setEtatEnCours({
                    ...etatEnCours,
                    proprete:
                      event.target.value as NiveauEtat,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {niveauxEtat.map((niveau) => (
                  <option key={niveau} value={niveau}>
                    {niveau}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-black text-slate-900">
              Compteurs et clés
            </h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <Champ
                label="Compteur électrique"
                value={etatEnCours.compteurElectricite}
                onChange={(valeur) =>
                  setEtatEnCours({
                    ...etatEnCours,
                    compteurElectricite: valeur,
                  })
                }
              />

              <Champ
                label="Compteur d’eau"
                value={etatEnCours.compteurEau}
                onChange={(valeur) =>
                  setEtatEnCours({
                    ...etatEnCours,
                    compteurEau: valeur,
                  })
                }
              />

              <Champ
                label="Compteur de gaz"
                value={etatEnCours.compteurGaz}
                onChange={(valeur) =>
                  setEtatEnCours({
                    ...etatEnCours,
                    compteurGaz: valeur,
                  })
                }
              />

              <ChampNombre
                label="Nombre de clés"
                value={etatEnCours.nombreCles}
                onChange={(valeur) =>
                  setEtatEnCours({
                    ...etatEnCours,
                    nombreCles: valeur,
                  })
                }
              />
            </div>
          </div>

          <label className="mt-6 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Observations générales
            </span>

            <textarea
              value={etatEnCours.observations}
              onChange={(event) =>
                setEtatEnCours({
                  ...etatEnCours,
                  observations: event.target.value,
                })
              }
              rows={6}
              placeholder="Dégradations, éléments manquants, réserves, remarques particulières..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={sauvegarderEtatDesLieux}
              className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
            >
              Enregistrer
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
        description={`${resultats.length} état(s) des lieux affiché(s)`}
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
              placeholder="Logement, voyageur, date, observation..."
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <SelectFiltre
            label="Type"
            value={filtreType}
            options={["Tous", ...typesEtatDesLieux]}
            onChange={(valeur) =>
              setFiltreType(valeur as FiltreType)
            }
          />

          <SelectFiltre
            label="Statut"
            value={filtreStatut}
            options={["Tous", ...statutsEtatDesLieux]}
            onChange={(valeur) =>
              setFiltreStatut(valeur as FiltreStatut)
            }
          />

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
        titre="Liste des états des lieux"
        description="Suivi des entrées, sorties, relevés et signatures."
      >
        {!donneesChargees ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 font-bold text-slate-500">
              Chargement des états des lieux...
            </p>
          </div>
        ) : resultats.length > 0 ? (
          <div className="grid gap-6 xl:grid-cols-2">
            {resultats.map((etat) => (
              <CarteEtatDesLieux
                key={etat.id}
                etat={etat}
                logement={nomLogement(
                  etat.logementId
                )}
                voyageur={nomVoyageur(
                  etat.voyageurId
                )}
                onModifier={() =>
                  ouvrirModification(etat)
                }
                onSupprimer={() =>
                  supprimerEtatDesLieux(etat)
                }
                onChangerStatut={(statut) =>
                  changerStatut(etat.id, statut)
                }
              />
            ))}
          </div>
        ) : etatsDesLieux.length === 0 ? (
          <EtatVide
            icone="📋"
            titre="Aucun état des lieux"
            texte="Créez votre premier état des lieux d’entrée ou de sortie."
            action={
              logements.length > 0 &&
              voyageurs.length > 0 ? (
                <button
                  type="button"
                  onClick={ouvrirNouvelEtatDesLieux}
                  className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                >
                  + Créer un état des lieux
                </button>
              ) : null
            }
          />
        ) : (
          <EtatVide
            icone="🔎"
            titre="Aucun résultat"
            texte="Aucun état des lieux ne correspond aux filtres sélectionnés."
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
    </div>
  );
}

function CarteEtatDesLieux({
  etat,
  logement,
  voyageur,
  onModifier,
  onSupprimer,
  onChangerStatut,
}: {
  etat: EtatDesLieux;
  logement: string;
  voyageur: string;
  onModifier: () => void;
  onSupprimer: () => void;
  onChangerStatut: (
    statut: StatutEtatDesLieux
  ) => void;
}) {
  const statutClasses: Record<
    StatutEtatDesLieux,
    string
  > = {
    "À préparer":
      "bg-orange-100 text-orange-700",
    "En cours":
      "bg-blue-100 text-blue-700",
    Terminé:
      "bg-emerald-100 text-emerald-700",
    Signé:
      "bg-violet-100 text-violet-700",
  };

  const typeClasses: Record<
    TypeEtatDesLieux,
    string
  > = {
    Entrée:
      "border-blue-200 bg-blue-50 text-blue-700",
    Sortie:
      "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${typeClasses[etat.type]}`}
          >
            État des lieux de {etat.type.toLowerCase()}
          </span>

          <h3 className="mt-4 text-xl font-black text-slate-950">
            {logement}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {etat.date || "Date non renseignée"} à{" "}
            {etat.heure || "--:--"}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${statutClasses[etat.statut]}`}
        >
          {etat.statut}
        </span>
      </div>

      <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <Info
          label="Voyageur"
          value={voyageur}
        />

        <Info
          label="Nombre de clés"
          value={String(etat.nombreCles)}
        />

        <Info
          label="État général"
          value={etat.etatGeneral}
        />

        <Info
          label="Propreté"
          value={etat.proprete}
        />
      </div>

      {(etat.compteurElectricite ||
        etat.compteurEau ||
        etat.compteurGaz) && (
        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            Relevés des compteurs
          </p>

          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <Info
              label="Électricité"
              value={
                etat.compteurElectricite || "—"
              }
            />

            <Info
              label="Eau"
              value={etat.compteurEau || "—"}
            />

            <Info
              label="Gaz"
              value={etat.compteurGaz || "—"}
            />
          </div>
        </div>
      )}

      {etat.observations && (
        <p className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          {etat.observations}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onModifier}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
        >
          Modifier
        </button>

        <select
          value={etat.statut}
          onChange={(event) =>
            onChangerStatut(
              event.target
                .value as StatutEtatDesLieux
            )
          }
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-600"
        >
          {statutsEtatDesLieux.map((statut) => (
            <option key={statut} value={statut}>
              {statut}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onSupprimer}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
        >
          Supprimer
        </button>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function ChampNombre({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(event) =>
          onChange(
            Math.max(
              0,
              Number(event.target.value || 0)
            )
          )
        }
        className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
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

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <p>
      <span className="font-bold text-slate-700">
        {label} :
      </span>{" "}
      <span className="text-slate-600">
        {value || "—"}
      </span>
    </p>
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