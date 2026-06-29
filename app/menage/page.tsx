"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import { enregistrer, lire } from "@/lib/database";

type TypeMenage =
  | "Ménage d’entrée"
  | "Ménage de sortie"
  | "Ménage complet"
  | "Entretien"
  | "Grand nettoyage";

type StatutMenage =
  | "À planifier"
  | "Planifié"
  | "En cours"
  | "Terminé"
  | "Annulé";

type Menage = {
  id: string;
  logementId: string;
  voyageurId: string;
  type: TypeMenage;
  date: string;
  heure: string;
  duree: number;
  statut: StatutMenage;
  prestataire: string;
  cout: number;
  linge: boolean;
  controleEffectue: boolean;
  consignes: string;
  createdAt: string;
  updatedAt: string;
};

type AncienMenage = Partial<Menage> & {
  logement?: string;
  voyageur?: string;
  mission?: string;
  personne?: string;
  prix?: number;
  notes?: string;
  controle?: boolean;
};

type Logement = {
  id: string;
  nom: string;
  ville?: string;
};

type Voyageur = {
  id: string;
  prenom?: string;
  nom?: string;
};

type FiltreStatut = "Tous" | StatutMenage;
type FiltreType = "Tous" | TypeMenage;

const typesMenage: TypeMenage[] = [
  "Ménage d’entrée",
  "Ménage de sortie",
  "Ménage complet",
  "Entretien",
  "Grand nettoyage",
];

const statutsMenage: StatutMenage[] = [
  "À planifier",
  "Planifié",
  "En cours",
  "Terminé",
  "Annulé",
];

function creerIdentifiant(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `menage-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function dateLocaleISO(date = new Date()): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
}

function creerMenageVide(): Menage {
  const maintenant = new Date().toISOString();

  return {
    id: "",
    logementId: "",
    voyageurId: "",
    type: "Ménage de sortie",
    date: dateLocaleISO(),
    heure: "11:00",
    duree: 2,
    statut: "À planifier",
    prestataire: "",
    cout: 0,
    linge: false,
    controleEffectue: false,
    consignes: "",
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

function normaliserType(valeur: unknown): TypeMenage {
  const type = String(valeur || "");

  if (typesMenage.includes(type as TypeMenage)) {
    return type as TypeMenage;
  }

  if (type.toLowerCase().includes("entrée")) {
    return "Ménage d’entrée";
  }

  if (type.toLowerCase().includes("entretien")) {
    return "Entretien";
  }

  if (
    type.toLowerCase().includes("grand") ||
    type.toLowerCase().includes("profond")
  ) {
    return "Grand nettoyage";
  }

  if (type.toLowerCase().includes("complet")) {
    return "Ménage complet";
  }

  return "Ménage de sortie";
}

function normaliserStatut(valeur: unknown): StatutMenage {
  const statut = String(valeur || "");

  if (statutsMenage.includes(statut as StatutMenage)) {
    return statut as StatutMenage;
  }

  if (
    statut === "Terminée" ||
    statut === "Terminé" ||
    statut === "Fait"
  ) {
    return "Terminé";
  }

  if (statut === "En cours") {
    return "En cours";
  }

  if (statut === "Planifiée" || statut === "Prévu") {
    return "Planifié";
  }

  if (statut === "Annulée") {
    return "Annulé";
  }

  return "À planifier";
}

function normaliserMenage(item: AncienMenage): Menage {
  const maintenant = new Date().toISOString();

  return {
    ...creerMenageVide(),
    ...item,
    id: item.id || creerIdentifiant(),
    logementId: item.logementId || item.logement || "",
    voyageurId: item.voyageurId || item.voyageur || "",
    type: normaliserType(item.type || item.mission),
    statut: normaliserStatut(item.statut),
    prestataire: item.prestataire || item.personne || "",
    cout: Math.max(0, Number(item.cout || item.prix || 0)),
    duree: Math.max(0.5, Number(item.duree || 2)),
    linge: Boolean(item.linge),
    controleEffectue: Boolean(
      item.controleEffectue || item.controle
    ),
    consignes: item.consignes || item.notes || "",
    createdAt: item.createdAt || maintenant,
    updatedAt: item.updatedAt || maintenant,
  };
}

function lireAnciennesDonnees(): AncienMenage[] {
  if (typeof window === "undefined") return [];

  try {
    const contenu = window.localStorage.getItem(
      "cap-serein-menage"
    );

    if (!contenu) return [];

    const donnees = JSON.parse(contenu);

    return Array.isArray(donnees) ? donnees : [];
  } catch {
    return [];
  }
}

function formaterPrix(montant: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(montant);
}

export default function MenagePage() {
  const [menages, setMenages] = useState<Menage[]>([]);
  const [logements, setLogements] = useState<Logement[]>([]);
  const [voyageurs, setVoyageurs] = useState<Voyageur[]>([]);

  const [menageEnCours, setMenageEnCours] =
    useState<Menage>(creerMenageVide());

  const [formulaireOuvert, setFormulaireOuvert] =
    useState(false);

  const [donneesChargees, setDonneesChargees] =
    useState(false);

  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");

  const [filtreStatut, setFiltreStatut] =
    useState<FiltreStatut>("Tous");

  const [filtreType, setFiltreType] =
    useState<FiltreType>("Tous");

  const [filtreLogement, setFiltreLogement] =
    useState("Tous");

  useEffect(() => {
    const donneesActuelles =
      lire<AncienMenage>("menages");

    const anciennesDonnees = lireAnciennesDonnees();

    const donneesFusionnees = [
      ...donneesActuelles,
      ...anciennesDonnees,
    ]
      .map(normaliserMenage)
      .filter(
        (menage, index, liste) =>
          liste.findIndex(
            (item) => item.id === menage.id
          ) === index
      );

    setMenages(donneesFusionnees);
    setLogements(lire<Logement>("logements"));
    setVoyageurs(lire<Voyageur>("voyageurs"));
    setDonneesChargees(true);
  }, []);

  useEffect(() => {
    if (!donneesChargees) return;

    enregistrer("menages", menages);
  }, [menages, donneesChargees]);

  const statistiques = useMemo(() => {
    const aujourdHui = dateLocaleISO();

    const montantTotal = menages
      .filter((menage) => menage.statut !== "Annulé")
      .reduce(
        (total, menage) => total + menage.cout,
        0
      );

    return {
      total: menages.length,

      aujourdHui: menages.filter(
        (menage) =>
          menage.date === aujourdHui &&
          menage.statut !== "Annulé"
      ).length,

      aRealiser: menages.filter(
        (menage) =>
          menage.statut === "À planifier" ||
          menage.statut === "Planifié" ||
          menage.statut === "En cours"
      ).length,

      controles: menages.filter(
        (menage) =>
          menage.statut === "Terminé" &&
          !menage.controleEffectue
      ).length,

      montantTotal,
    };
  }, [menages]);

  const resultats = useMemo(() => {
    const rechercheNormalisee =
      normaliserTexte(recherche);

    return menages
      .filter((menage) => {
        if (
          filtreStatut !== "Tous" &&
          menage.statut !== filtreStatut
        ) {
          return false;
        }

        if (
          filtreType !== "Tous" &&
          menage.type !== filtreType
        ) {
          return false;
        }

        if (
          filtreLogement !== "Tous" &&
          menage.logementId !== filtreLogement
        ) {
          return false;
        }

        if (!rechercheNormalisee) return true;

        const logement = logements.find(
          (item) => item.id === menage.logementId
        );

        const voyageur = voyageurs.find(
          (item) => item.id === menage.voyageurId
        );

        const contenu = [
          menage.type,
          menage.statut,
          menage.prestataire,
          menage.date,
          menage.heure,
          menage.consignes,
          logement?.nom || "",
          logement?.ville || "",
          voyageur?.prenom || "",
          voyageur?.nom || "",
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
        const dateA = `${a.date || "9999-12-31"} ${
          a.heure || "23:59"
        }`;

        const dateB = `${b.date || "9999-12-31"} ${
          b.heure || "23:59"
        }`;

        return dateA.localeCompare(dateB);
      });
  }, [
    menages,
    logements,
    voyageurs,
    recherche,
    filtreStatut,
    filtreType,
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

  function nomVoyageur(id: string): string {
    const voyageur = voyageurs.find(
      (item) => item.id === id
    );

    if (!voyageur) return "Aucun voyageur";

    return `${voyageur.prenom || ""} ${
      voyageur.nom || ""
    }`.trim();
  }

  function ouvrirNouveauMenage() {
    setMenageEnCours(creerMenageVide());
    setErreur("");
    setFormulaireOuvert(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function ouvrirModification(menage: Menage) {
    setMenageEnCours({ ...menage });
    setErreur("");
    setFormulaireOuvert(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function fermerFormulaire() {
    setMenageEnCours(creerMenageVide());
    setErreur("");
    setFormulaireOuvert(false);
  }

  function sauvegarderMenage() {
    if (!menageEnCours.logementId) {
      setErreur("Le logement est obligatoire.");
      return;
    }

    if (!menageEnCours.date) {
      setErreur("La date est obligatoire.");
      return;
    }

    if (!menageEnCours.heure) {
      setErreur("L’heure est obligatoire.");
      return;
    }

    if (menageEnCours.duree <= 0) {
      setErreur(
        "La durée doit être supérieure à zéro."
      );
      return;
    }

    const maintenant = new Date().toISOString();

    setMenages((liste) => {
      const existe = liste.some(
        (menage) => menage.id === menageEnCours.id
      );

      const menageFinal: Menage = {
        ...menageEnCours,
        id:
          menageEnCours.id ||
          creerIdentifiant(),
        duree: Math.max(
          0.5,
          Number(menageEnCours.duree || 0.5)
        ),
        cout: Math.max(
          0,
          Number(menageEnCours.cout || 0)
        ),
        prestataire:
          menageEnCours.prestataire.trim(),
        consignes:
          menageEnCours.consignes.trim(),
        createdAt:
          existe && menageEnCours.createdAt
            ? menageEnCours.createdAt
            : maintenant,
        updatedAt: maintenant,
      };

      if (existe) {
        return liste.map((menage) =>
          menage.id === menageFinal.id
            ? menageFinal
            : menage
        );
      }

      return [menageFinal, ...liste];
    });

    fermerFormulaire();
  }

  function supprimerMenage(menage: Menage) {
    const confirmation = window.confirm(
      `Supprimer définitivement ce ménage prévu le ${menage.date} ?`
    );

    if (!confirmation) return;

    setMenages((liste) =>
      liste.filter(
        (item) => item.id !== menage.id
      )
    );
  }

  function changerStatut(
    id: string,
    statut: StatutMenage
  ) {
    const maintenant = new Date().toISOString();

    setMenages((liste) =>
      liste.map((menage) =>
        menage.id === id
          ? {
              ...menage,
              statut,
              updatedAt: maintenant,
            }
          : menage
      )
    );
  }

  function changerControle(
    id: string,
    controleEffectue: boolean
  ) {
    const maintenant = new Date().toISOString();

    setMenages((liste) =>
      liste.map((menage) =>
        menage.id === id
          ? {
              ...menage,
              controleEffectue,
              updatedAt: maintenant,
            }
          : menage
      )
    );
  }

  function reinitialiserFiltres() {
    setRecherche("");
    setFiltreStatut("Tous");
    setFiltreType("Tous");
    setFiltreLogement("Tous");
  }

  const filtresActifs =
    recherche.trim() !== "" ||
    filtreStatut !== "Tous" ||
    filtreType !== "Tous" ||
    filtreLogement !== "Tous";

  return (
    <div className="space-y-8">
      <PageHeader
        titre="Ménage"
        description="Planifiez les interventions, les prestataires, le linge et les contrôles qualité."
        action={
          <button
            type="button"
            onClick={ouvrirNouveauMenage}
            disabled={logements.length === 0}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            + Nouvelle intervention
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
              Ajoutez un logement avant de planifier
              une intervention de ménage.
            </p>
          </div>
        )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <CarteStatistique
          titre="Interventions"
          valeur={String(statistiques.total)}
          couleur="blue"
        />

        <CarteStatistique
          titre="Aujourd’hui"
          valeur={String(statistiques.aujourdHui)}
          couleur="green"
        />

        <CarteStatistique
          titre="À réaliser"
          valeur={String(statistiques.aRealiser)}
          couleur="orange"
        />

        <CarteStatistique
          titre="À contrôler"
          valeur={String(statistiques.controles)}
          couleur="red"
        />

        <CarteStatistique
          titre="Coût total"
          valeur={formaterPrix(
            statistiques.montantTotal
          )}
          couleur="slate"
        />
      </div>

      {formulaireOuvert && (
        <Section
          titre={
            menageEnCours.id
              ? "Modifier l’intervention"
              : "Nouvelle intervention"
          }
          description="Renseignez le logement, la date, le prestataire et les consignes."
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
                value={menageEnCours.logementId}
                onChange={(event) =>
                  setMenageEnCours({
                    ...menageEnCours,
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
                Voyageur associé
              </span>

              <select
                value={menageEnCours.voyageurId}
                onChange={(event) =>
                  setMenageEnCours({
                    ...menageEnCours,
                    voyageurId: event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">
                  Aucun voyageur
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
                Type d’intervention
              </span>

              <select
                value={menageEnCours.type}
                onChange={(event) =>
                  setMenageEnCours({
                    ...menageEnCours,
                    type: event.target
                      .value as TypeMenage,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {typesMenage.map((type) => (
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
                value={menageEnCours.statut}
                onChange={(event) =>
                  setMenageEnCours({
                    ...menageEnCours,
                    statut: event.target
                      .value as StatutMenage,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {statutsMenage.map((statut) => (
                  <option key={statut} value={statut}>
                    {statut}
                  </option>
                ))}
              </select>
            </label>

            <Champ
              label="Date"
              type="date"
              value={menageEnCours.date}
              onChange={(valeur) =>
                setMenageEnCours({
                  ...menageEnCours,
                  date: valeur,
                })
              }
            />

            <Champ
              label="Heure"
              type="time"
              value={menageEnCours.heure}
              onChange={(valeur) =>
                setMenageEnCours({
                  ...menageEnCours,
                  heure: valeur,
                })
              }
            />

            <ChampNombre
              label="Durée estimée en heures"
              value={menageEnCours.duree}
              min={0.5}
              step={0.5}
              onChange={(valeur) =>
                setMenageEnCours({
                  ...menageEnCours,
                  duree: valeur,
                })
              }
            />

            <ChampNombre
              label="Coût prévu"
              value={menageEnCours.cout}
              min={0}
              step={0.01}
              onChange={(valeur) =>
                setMenageEnCours({
                  ...menageEnCours,
                  cout: valeur,
                })
              }
            />

            <Champ
              label="Prestataire"
              value={menageEnCours.prestataire}
              placeholder="Nom de la personne ou société"
              onChange={(valeur) =>
                setMenageEnCours({
                  ...menageEnCours,
                  prestataire: valeur,
                })
              }
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <CaseACocher
              label="Gestion du linge incluse"
              description="Draps, serviettes ou linge de maison à récupérer ou installer."
              checked={menageEnCours.linge}
              onChange={(valeur) =>
                setMenageEnCours({
                  ...menageEnCours,
                  linge: valeur,
                })
              }
            />

            <CaseACocher
              label="Contrôle qualité effectué"
              description="Le logement a été vérifié après l’intervention."
              checked={
                menageEnCours.controleEffectue
              }
              onChange={(valeur) =>
                setMenageEnCours({
                  ...menageEnCours,
                  controleEffectue: valeur,
                })
              }
            />
          </div>

          <label className="mt-6 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Consignes
            </span>

            <textarea
              value={menageEnCours.consignes}
              onChange={(event) =>
                setMenageEnCours({
                  ...menageEnCours,
                  consignes: event.target.value,
                })
              }
              rows={6}
              placeholder="Pièces à contrôler, produits à utiliser, linge à changer, dégradations à signaler..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={sauvegarderMenage}
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
        description={`${resultats.length} intervention(s) affichée(s)`}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_210px_210px_210px_auto]">
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
              placeholder="Logement, prestataire, voyageur, consignes..."
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <SelectFiltre
            label="Statut"
            value={filtreStatut}
            options={["Tous", ...statutsMenage]}
            onChange={(valeur) =>
              setFiltreStatut(
                valeur as FiltreStatut
              )
            }
          />

          <SelectFiltre
            label="Type"
            value={filtreType}
            options={["Tous", ...typesMenage]}
            onChange={(valeur) =>
              setFiltreType(valeur as FiltreType)
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
        titre="Planning des ménages"
        description="Suivi des interventions et des contrôles qualité."
      >
        {!donneesChargees ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 font-bold text-slate-500">
              Chargement des interventions...
            </p>
          </div>
        ) : resultats.length > 0 ? (
          <div className="grid gap-6 xl:grid-cols-2">
            {resultats.map((menage) => (
              <CarteMenage
                key={menage.id}
                menage={menage}
                logement={nomLogement(
                  menage.logementId
                )}
                voyageur={nomVoyageur(
                  menage.voyageurId
                )}
                onModifier={() =>
                  ouvrirModification(menage)
                }
                onSupprimer={() =>
                  supprimerMenage(menage)
                }
                onChangerStatut={(statut) =>
                  changerStatut(menage.id, statut)
                }
                onChangerControle={(valeur) =>
                  changerControle(
                    menage.id,
                    valeur
                  )
                }
              />
            ))}
          </div>
        ) : menages.length === 0 ? (
          <EtatVide
            icone="🧹"
            titre="Aucune intervention de ménage"
            texte="Planifiez votre première intervention pour un logement."
            action={
              logements.length > 0 ? (
                <button
                  type="button"
                  onClick={ouvrirNouveauMenage}
                  className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                >
                  + Planifier un ménage
                </button>
              ) : null
            }
          />
        ) : (
          <EtatVide
            icone="🔎"
            titre="Aucun résultat"
            texte="Aucune intervention ne correspond aux filtres sélectionnés."
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

function CarteMenage({
  menage,
  logement,
  voyageur,
  onModifier,
  onSupprimer,
  onChangerStatut,
  onChangerControle,
}: {
  menage: Menage;
  logement: string;
  voyageur: string;
  onModifier: () => void;
  onSupprimer: () => void;
  onChangerStatut: (statut: StatutMenage) => void;
  onChangerControle: (valeur: boolean) => void;
}) {
  const statutClasses: Record<
    StatutMenage,
    string
  > = {
    "À planifier":
      "bg-orange-100 text-orange-700",
    Planifié: "bg-blue-100 text-blue-700",
    "En cours":
      "bg-violet-100 text-violet-700",
    Terminé:
      "bg-emerald-100 text-emerald-700",
    Annulé: "bg-slate-200 text-slate-500",
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {menage.type}
          </span>

          <h3 className="mt-4 text-xl font-black text-slate-950">
            {logement}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {menage.date || "Date non renseignée"} à{" "}
            {menage.heure || "--:--"}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${statutClasses[menage.statut]}`}
        >
          {menage.statut}
        </span>
      </div>

      <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <Info
          label="Durée estimée"
          value={`${menage.duree} h`}
        />

        <Info
          label="Prestataire"
          value={
            menage.prestataire || "Non renseigné"
          }
        />

        <Info
          label="Voyageur"
          value={voyageur}
        />

        <Info
          label="Coût prévu"
          value={formaterPrix(menage.cout)}
        />

        <Info
          label="Gestion du linge"
          value={menage.linge ? "Oui" : "Non"}
        />

        <Info
          label="Contrôle qualité"
          value={
            menage.controleEffectue
              ? "Effectué"
              : "À effectuer"
          }
        />
      </div>

      {menage.consignes && (
        <p className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          {menage.consignes}
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
          value={menage.statut}
          onChange={(event) =>
            onChangerStatut(
              event.target.value as StatutMenage
            )
          }
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-600"
        >
          {statutsMenage.map((statut) => (
            <option key={statut} value={statut}>
              {statut}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() =>
            onChangerControle(
              !menage.controleEffectue
            )
          }
          className={`rounded-xl border px-4 py-2 text-sm font-bold ${
            menage.controleEffectue
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-orange-200 bg-orange-50 text-orange-700"
          }`}
        >
          {menage.controleEffectue
            ? "Contrôle effectué"
            : "Valider le contrôle"}
        </button>

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
  valeur: string;
  couleur:
    | "blue"
    | "green"
    | "orange"
    | "red"
    | "slate";
}) {
  const couleurs = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    orange:
      "border-orange-200 bg-orange-50 text-orange-700",
    red: "border-red-200 bg-red-50 text-red-700",
    slate:
      "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <span
        className={`inline-flex rounded-2xl border px-3 py-1 text-xs font-bold ${couleurs[couleur]}`}
      >
        {titre}
      </span>

      <p className="mt-5 break-words text-3xl font-black text-slate-950">
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

function ChampNombre({
  label,
  value,
  onChange,
  min,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  step: number;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(
            Math.max(
              min,
              Number(event.target.value || min)
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

function CaseACocher({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="mt-1 h-5 w-5"
      />

      <span>
        <span className="block font-bold text-slate-900">
          {label}
        </span>

        <span className="mt-1 block text-sm leading-6 text-slate-500">
          {description}
        </span>
      </span>
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
        {value}
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