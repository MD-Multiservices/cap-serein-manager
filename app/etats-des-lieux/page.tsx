"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import {
  enregistrer,
  lire,
} from "@/lib/database";

type TypeEtatDesLieux = "entree" | "sortie";

type StatutEtatDesLieux =
  | "a_preparer"
  | "en_cours"
  | "termine"
  | "signe";

type Logement = {
  id: string;
  nom: string;
  typeLogement: string;
  superficie: number;
  nombreChambres: number;
  adresse: string;
  codePostal: string;
  ville: string;
};

type Voyageur = {
  id: string;
  nom: string;
  prenom: string;
  nomComplet: string;
  telephone: string;
  email: string;
};

type EtatDesLieux = {
  id: string;
  missionId?: string;

  logementId: string;
  logementNom: string;
  typeLogement: string;
  superficie: number;
  nombreChambres: number;
  adresseLogement: string;

  voyageurId: string;
  voyageurNom: string;
  voyageurTelephone: string;
  voyageurEmail: string;

  type: TypeEtatDesLieux;
  statut: StatutEtatDesLieux;

  date: string;
  heure: string;

  notesPreparation: string;

  dateCreation: string;
  dateModification: string;

  [cle: string]: unknown;
};

type FormulaireEtatDesLieux = {
  logementId: string;
  voyageurId: string;
  type: TypeEtatDesLieux;
  statut: StatutEtatDesLieux;
  date: string;
  heure: string;
  notesPreparation: string;
};

const statuts: {
  valeur: StatutEtatDesLieux;
  label: string;
}[] = [
  {
    valeur: "a_preparer",
    label: "À préparer",
  },
  {
    valeur: "en_cours",
    label: "En cours",
  },
  {
    valeur: "termine",
    label: "Terminé",
  },
  {
    valeur: "signe",
    label: "Signé",
  },
];

function creerIdentifiant(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `edl-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function dateAujourdhui(): string {
  const maintenant = new Date();

  const annee = maintenant.getFullYear();
  const mois = String(
    maintenant.getMonth() + 1
  ).padStart(2, "0");
  const jour = String(
    maintenant.getDate()
  ).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
}

function creerFormulaireVide(): FormulaireEtatDesLieux {
  return {
    logementId: "",
    voyageurId: "",
    type: "entree",
    statut: "a_preparer",
    date: dateAujourdhui(),
    heure: "10:00",
    notesPreparation: "",
  };
}

function texte(valeur: unknown): string {
  if (
    valeur === null ||
    valeur === undefined
  ) {
    return "";
  }

  return String(valeur);
}

function nombre(valeur: unknown): number {
  const resultat = Number(valeur || 0);

  return Number.isFinite(resultat)
    ? Math.max(0, resultat)
    : 0;
}

function normaliserStatut(
  valeur: unknown
): StatutEtatDesLieux {
  const statut = texte(valeur)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");

  if (statut === "en_cours") {
    return "en_cours";
  }

  if (
    statut === "termine" ||
    statut === "terminee"
  ) {
    return "termine";
  }

  if (
    statut === "signe" ||
    statut === "signee"
  ) {
    return "signe";
  }

  return "a_preparer";
}

function normaliserType(
  valeur: unknown
): TypeEtatDesLieux {
  const type = texte(valeur).toLowerCase();

  if (
    type.includes("sortie") ||
    type === "out"
  ) {
    return "sortie";
  }

  return "entree";
}

function nomCompletVoyageur(
  voyageur: Partial<Voyageur>
): string {
  const prenom = texte(voyageur.prenom).trim();
  const nom = texte(voyageur.nom).trim();

  const nomAssemble = [prenom, nom]
    .filter(Boolean)
    .join(" ");

  return (
    nomAssemble ||
    texte(voyageur.nomComplet).trim() ||
    "Voyageur sans nom"
  );
}

function adresseComplete(
  logement: Partial<Logement>
): string {
  const adresse = texte(
    logement.adresse
  ).trim();

  const ville = [
    texte(logement.codePostal).trim(),
    texte(logement.ville).trim(),
  ]
    .filter(Boolean)
    .join(" ");

  return [adresse, ville]
    .filter(Boolean)
    .join(", ");
}

function libelleStatut(
  statut: StatutEtatDesLieux
): string {
  return (
    statuts.find(
      (element) => element.valeur === statut
    )?.label || "À préparer"
  );
}

function classeStatut(
  statut: StatutEtatDesLieux
): string {
  if (statut === "en_cours") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (statut === "termine") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (statut === "signe") {
    return "border-violet-200 bg-violet-50 text-violet-800";
  }

  return "border-blue-200 bg-blue-50 text-blue-800";
}

function formaterDate(date: string): string {
  if (!date) {
    return "Date non définie";
  }

  const valeur = new Date(
    `${date}T12:00:00`
  );

  if (Number.isNaN(valeur.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(valeur);
}

export default function EtatsDesLieuxPage() {
  const [logements, setLogements] =
    useState<Logement[]>([]);

  const [voyageurs, setVoyageurs] =
    useState<Voyageur[]>([]);

  const [etatsDesLieux, setEtatsDesLieux] =
    useState<EtatDesLieux[]>([]);

  const [formulaire, setFormulaire] =
    useState<FormulaireEtatDesLieux>(
      creerFormulaireVide()
    );

  const [formulaireOuvert, setFormulaireOuvert] =
    useState(false);

  const [donneesChargees, setDonneesChargees] =
    useState(false);

  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] =
    useState("");

  const [filtreStatut, setFiltreStatut] =
    useState<"tous" | StatutEtatDesLieux>(
      "tous"
    );

  useEffect(() => {
    const logementsEnregistres =
      lire<Partial<Logement>>("logements").map(
        (logement): Logement => ({
          id:
            texte(logement.id) ||
            creerIdentifiant(),
          nom:
            texte(logement.nom).trim() ||
            "Logement sans nom",
          typeLogement: texte(
            logement.typeLogement
          ).trim(),
          superficie: nombre(
            logement.superficie
          ),
          nombreChambres: nombre(
            logement.nombreChambres
          ),
          adresse: texte(
            logement.adresse
          ).trim(),
          codePostal: texte(
            logement.codePostal
          ).trim(),
          ville: texte(
            logement.ville
          ).trim(),
        })
      );

    const voyageursEnregistres =
      lire<Partial<Voyageur>>("voyageurs").map(
        (voyageur): Voyageur => ({
          id:
            texte(voyageur.id) ||
            creerIdentifiant(),
          nom: texte(voyageur.nom).trim(),
          prenom: texte(
            voyageur.prenom
          ).trim(),
          nomComplet:
            nomCompletVoyageur(voyageur),
          telephone: texte(
            voyageur.telephone
          ).trim(),
          email: texte(
            voyageur.email
          ).trim(),
        })
      );

    const etatsEnregistres =
      lire<Record<string, unknown>>(
        "etatsDesLieux"
      ).map((brut): EtatDesLieux => {
        const logementId = texte(
          brut.logementId
        );

        const voyageurId = texte(
          brut.voyageurId
        );

        const logement = logementsEnregistres.find(
          (element) =>
            element.id === logementId
        );

        const voyageur = voyageursEnregistres.find(
          (element) =>
            element.id === voyageurId
        );

        const identifiant =
          texte(brut.id) ||
          texte(brut.missionId) ||
          creerIdentifiant();

        const maintenant =
          new Date().toISOString();

        return {
          ...brut,

          id: identifiant,

          missionId:
            texte(brut.missionId) ||
            identifiant,

          logementId,

          logementNom:
            texte(brut.logementNom) ||
            texte(brut.nomLogement) ||
            logement?.nom ||
            "Logement non renseigné",

          typeLogement:
            texte(brut.typeLogement) ||
            logement?.typeLogement ||
            "",

          superficie:
            nombre(brut.superficie) ||
            logement?.superficie ||
            0,

          nombreChambres:
            nombre(brut.nombreChambres) ||
            logement?.nombreChambres ||
            0,

          adresseLogement:
            texte(brut.adresseLogement) ||
            texte(brut.adresse) ||
            (logement
              ? adresseComplete(logement)
              : ""),

          voyageurId,

          voyageurNom:
            texte(brut.voyageurNom) ||
            texte(brut.nomVoyageur) ||
            (voyageur
              ? nomCompletVoyageur(voyageur)
              : "Voyageur non renseigné"),

          voyageurTelephone:
            texte(
              brut.voyageurTelephone
            ) ||
            voyageur?.telephone ||
            "",

          voyageurEmail:
            texte(brut.voyageurEmail) ||
            voyageur?.email ||
            "",

          type: normaliserType(
            brut.type ||
              brut.typeEtatDesLieux
          ),

          statut: normaliserStatut(
            brut.statut
          ),

          date:
            texte(brut.date) ||
            texte(brut.datePrevue) ||
            texte(brut.dateIntervention) ||
            dateAujourdhui(),

          heure:
            texte(brut.heure) ||
            texte(brut.heurePrevue) ||
            "10:00",

          notesPreparation:
            texte(
              brut.notesPreparation
            ) ||
            texte(brut.observations) ||
            "",

          dateCreation:
            texte(brut.dateCreation) ||
            texte(brut.createdAt) ||
            maintenant,

          dateModification:
            texte(brut.dateModification) ||
            texte(brut.updatedAt) ||
            maintenant,
        };
      });

    setLogements(logementsEnregistres);
    setVoyageurs(voyageursEnregistres);
    setEtatsDesLieux(etatsEnregistres);
    setDonneesChargees(true);
  }, []);

  useEffect(() => {
    if (!donneesChargees) {
      return;
    }

    enregistrer(
      "etatsDesLieux",
      etatsDesLieux
    );
  }, [etatsDesLieux, donneesChargees]);

  const statistiques = useMemo(() => {
    return {
      total: etatsDesLieux.length,

      aPreparer: etatsDesLieux.filter(
        (etat) =>
          etat.statut === "a_preparer"
      ).length,

      enCours: etatsDesLieux.filter(
        (etat) =>
          etat.statut === "en_cours"
      ).length,

      termines: etatsDesLieux.filter(
        (etat) =>
          etat.statut === "termine" ||
          etat.statut === "signe"
      ).length,
    };
  }, [etatsDesLieux]);

  const resultats = useMemo(() => {
    const terme = recherche
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return etatsDesLieux
      .filter((etat) => {
        if (
          filtreStatut !== "tous" &&
          etat.statut !== filtreStatut
        ) {
          return false;
        }

        if (!terme) {
          return true;
        }

        const contenu = [
          etat.logementNom,
          etat.typeLogement,
          etat.adresseLogement,
          etat.voyageurNom,
          etat.type,
          libelleStatut(etat.statut),
          etat.date,
        ]
          .join(" ")
          .toLowerCase()
          .normalize("NFD")
          .replace(
            /[\u0300-\u036f]/g,
            ""
          );

        return contenu.includes(terme);
      })
      .sort((a, b) => {
        const dateA = `${a.date}T${
          a.heure || "00:00"
        }`;

        const dateB = `${b.date}T${
          b.heure || "00:00"
        }`;

        return dateB.localeCompare(dateA);
      });
  }, [
    etatsDesLieux,
    recherche,
    filtreStatut,
  ]);

  function ouvrirFormulaire() {
    setFormulaire(creerFormulaireVide());
    setErreur("");
    setFormulaireOuvert(true);

    window.setTimeout(() => {
      document
        .getElementById(
          "formulaire-etat-des-lieux"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  function fermerFormulaire() {
    setFormulaire(creerFormulaireVide());
    setErreur("");
    setFormulaireOuvert(false);
  }

  function creerEtatDesLieux() {
    const logement = logements.find(
      (element) =>
        element.id === formulaire.logementId
    );

    if (!logement) {
      setErreur(
        "Sélectionnez un logement."
      );
      return;
    }

    const voyageur = voyageurs.find(
      (element) =>
        element.id === formulaire.voyageurId
    );

    if (!voyageur) {
      setErreur(
        "Sélectionnez un voyageur."
      );
      return;
    }

    if (!formulaire.date) {
      setErreur(
        "Sélectionnez une date."
      );
      return;
    }

    const identifiant =
      creerIdentifiant();

    const maintenant =
      new Date().toISOString();

    const nouvelEtat: EtatDesLieux = {
      id: identifiant,
      missionId: identifiant,

      logementId: logement.id,
      logementNom: logement.nom,
      typeLogement:
        logement.typeLogement,
      superficie: logement.superficie,
      nombreChambres:
        logement.nombreChambres,
      adresseLogement:
        adresseComplete(logement),

      voyageurId: voyageur.id,
      voyageurNom:
        nomCompletVoyageur(voyageur),
      voyageurTelephone:
        voyageur.telephone,
      voyageurEmail: voyageur.email,

      type: formulaire.type,
      statut: formulaire.statut,

      date: formulaire.date,
      heure: formulaire.heure,

      notesPreparation:
        formulaire.notesPreparation.trim(),

      dateCreation: maintenant,
      dateModification: maintenant,
    };

    setEtatsDesLieux((liste) => [
      nouvelEtat,
      ...liste,
    ]);

    fermerFormulaire();
  }

  function changerStatut(
    identifiant: string,
    statut: StatutEtatDesLieux
  ) {
    setEtatsDesLieux((liste) =>
      liste.map((etat) =>
        etat.id === identifiant
          ? {
              ...etat,
              statut,
              dateModification:
                new Date().toISOString(),
            }
          : etat
      )
    );
  }

  function supprimerEtatDesLieux(
    etat: EtatDesLieux
  ) {
    const confirmation = window.confirm(
      `Supprimer l’état des lieux ${etat.type === "entree" ? "d’entrée" : "de sortie"} de « ${etat.logementNom} » ?`
    );

    if (!confirmation) {
      return;
    }

    setEtatsDesLieux((liste) =>
      liste.filter(
        (element) =>
          element.id !== etat.id
      )
    );
  }

  const logementSelectionne =
    logements.find(
      (logement) =>
        logement.id ===
        formulaire.logementId
    );

  const voyageurSelectionne =
    voyageurs.find(
      (voyageur) =>
        voyageur.id ===
        formulaire.voyageurId
    );

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        titre="États des lieux"
        description="Préparez, réalisez et suivez vos états des lieux d’entrée et de sortie."
        action={
          <button
            type="button"
            onClick={ouvrirFormulaire}
            className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            + Nouvel état des lieux
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CarteStatistique
          titre="Total"
          valeur={statistiques.total}
          icone="📋"
        />

        <CarteStatistique
          titre="À préparer"
          valeur={statistiques.aPreparer}
          icone="🗓️"
        />

        <CarteStatistique
          titre="En cours"
          valeur={statistiques.enCours}
          icone="⏳"
        />

        <CarteStatistique
          titre="Terminés"
          valeur={statistiques.termines}
          icone="✅"
        />
      </div>

      {formulaireOuvert && (
        <div id="formulaire-etat-des-lieux">
          <Section
            titre="Nouvel état des lieux"
            description="Le logement et le voyageur resteront liés à toute l’intervention."
          >
            {erreur && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {erreur}
              </div>
            )}

            {logements.length === 0 ||
            voyageurs.length === 0 ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
                <h3 className="font-black">
                  Informations manquantes
                </h3>

                <p className="mt-2 text-sm leading-6">
                  Il faut avoir au moins un
                  logement et un voyageur avant
                  de créer un état des lieux.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  {logements.length === 0 && (
                    <Link
                      href="/logements#nouveau-logement"
                      className="rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-black text-white"
                    >
                      Ajouter un logement
                    </Link>
                  )}

                  {voyageurs.length === 0 && (
                    <Link
                      href="/voyageurs"
                      className="rounded-2xl bg-slate-900 px-5 py-3 text-center text-sm font-black text-white"
                    >
                      Ajouter un voyageur
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <ChampSelection
                    label="Logement"
                    value={
                      formulaire.logementId
                    }
                    onChange={(valeur) =>
                      setFormulaire({
                        ...formulaire,
                        logementId: valeur,
                      })
                    }
                  >
                    <option value="">
                      Sélectionner un logement
                    </option>

                    {logements.map(
                      (logement) => (
                        <option
                          key={logement.id}
                          value={logement.id}
                        >
                          {logement.nom}
                          {logement.typeLogement
                            ? ` — ${logement.typeLogement}`
                            : ""}
                        </option>
                      )
                    )}
                  </ChampSelection>

                  <ChampSelection
                    label="Voyageur"
                    value={
                      formulaire.voyageurId
                    }
                    onChange={(valeur) =>
                      setFormulaire({
                        ...formulaire,
                        voyageurId: valeur,
                      })
                    }
                  >
                    <option value="">
                      Sélectionner un voyageur
                    </option>

                    {voyageurs.map(
                      (voyageur) => (
                        <option
                          key={voyageur.id}
                          value={voyageur.id}
                        >
                          {nomCompletVoyageur(
                            voyageur
                          )}
                        </option>
                      )
                    )}
                  </ChampSelection>
                </div>

                {(logementSelectionne ||
                  voyageurSelectionne) && (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {logementSelectionne && (
                      <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                        <p className="text-xs font-black uppercase tracking-wider text-blue-700">
                          Logement sélectionné
                        </p>

                        <h3 className="mt-2 text-lg font-black text-blue-950">
                          {
                            logementSelectionne.nom
                          }
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-blue-800">
                          {logementSelectionne.typeLogement ||
                            "Type non renseigné"}
                          {" · "}
                          {logementSelectionne.superficie ||
                            0}{" "}
                          m²
                          {" · "}
                          {logementSelectionne.nombreChambres ||
                            0}{" "}
                          chambre(s)
                        </p>

                        <p className="mt-2 text-sm text-blue-800">
                          {adresseComplete(
                            logementSelectionne
                          ) ||
                            "Adresse non renseignée"}
                        </p>
                      </div>
                    )}

                    {voyageurSelectionne && (
                      <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5">
                        <p className="text-xs font-black uppercase tracking-wider text-violet-700">
                          Voyageur sélectionné
                        </p>

                        <h3 className="mt-2 text-lg font-black text-violet-950">
                          {nomCompletVoyageur(
                            voyageurSelectionne
                          )}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-violet-800">
                          {voyageurSelectionne.telephone ||
                            "Téléphone non renseigné"}
                        </p>

                        <p className="break-words text-sm text-violet-800">
                          {voyageurSelectionne.email ||
                            "E-mail non renseigné"}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  <ChampSelection
                    label="Type d’état des lieux"
                    value={formulaire.type}
                    onChange={(valeur) =>
                      setFormulaire({
                        ...formulaire,
                        type:
                          valeur as TypeEtatDesLieux,
                      })
                    }
                  >
                    <option value="entree">
                      État des lieux d’entrée
                    </option>

                    <option value="sortie">
                      État des lieux de sortie
                    </option>
                  </ChampSelection>

                  <ChampSelection
                    label="Statut initial"
                    value={formulaire.statut}
                    onChange={(valeur) =>
                      setFormulaire({
                        ...formulaire,
                        statut:
                          valeur as StatutEtatDesLieux,
                      })
                    }
                  >
                    {statuts.map(
                      (statut) => (
                        <option
                          key={statut.valeur}
                          value={statut.valeur}
                        >
                          {statut.label}
                        </option>
                      )
                    )}
                  </ChampSelection>

                  <Champ
                    label="Date prévue"
                    type="date"
                    value={formulaire.date}
                    onChange={(valeur) =>
                      setFormulaire({
                        ...formulaire,
                        date: valeur,
                      })
                    }
                  />

                  <Champ
                    label="Heure prévue"
                    type="time"
                    value={formulaire.heure}
                    onChange={(valeur) =>
                      setFormulaire({
                        ...formulaire,
                        heure: valeur,
                      })
                    }
                  />
                </div>

                <label className="mt-5 block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Notes de préparation
                  </span>

                  <textarea
                    rows={4}
                    value={
                      formulaire.notesPreparation
                    }
                    onChange={(event) =>
                      setFormulaire({
                        ...formulaire,
                        notesPreparation:
                          event.target.value,
                      })
                    }
                    placeholder="Informations à vérifier, consignes du propriétaire, éléments à préparer..."
                    className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={
                      creerEtatDesLieux
                    }
                    className="min-h-12 rounded-2xl bg-blue-600 px-6 py-3 font-black text-white shadow-md transition hover:bg-blue-700"
                  >
                    Créer l’état des lieux
                  </button>

                  <button
                    type="button"
                    onClick={fermerFormulaire}
                    className="min-h-12 rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                </div>
              </>
            )}
          </Section>
        </div>
      )}

      <Section
        titre="Interventions"
        description={`${resultats.length} état(s) des lieux affiché(s)`}
      >
        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            type="search"
            value={recherche}
            onChange={(event) =>
              setRecherche(
                event.target.value
              )
            }
            placeholder="Rechercher un logement, un voyageur ou une adresse..."
            className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />

          <select
            value={filtreStatut}
            onChange={(event) =>
              setFiltreStatut(
                event.target.value as
                  | "tous"
                  | StatutEtatDesLieux
              )
            }
            className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          >
            <option value="tous">
              Tous les statuts
            </option>

            {statuts.map((statut) => (
              <option
                key={statut.valeur}
                value={statut.valeur}
              >
                {statut.label}
              </option>
            ))}
          </select>
        </div>

        {!donneesChargees ? (
          <div className="rounded-3xl bg-slate-50 p-12 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 font-bold text-slate-500">
              Chargement...
            </p>
          </div>
        ) : resultats.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center">
            <div className="text-5xl">
              📋
            </div>

            <h3 className="mt-5 text-xl font-black text-slate-900">
              Aucun état des lieux
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-slate-500">
              Créez une première intervention
              en sélectionnant son logement et
              son voyageur.
            </p>

            <button
              type="button"
              onClick={ouvrirFormulaire}
              className="mt-6 min-h-12 w-full rounded-2xl bg-blue-600 px-6 py-3 font-black text-white sm:w-auto"
            >
              + Créer un état des lieux
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {resultats.map((etat) => (
              <article
                key={etat.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${classeStatut(
                            etat.statut
                          )}`}
                        >
                          {libelleStatut(
                            etat.statut
                          )}
                        </span>

                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
                          {etat.type ===
                          "entree"
                            ? "Entrée"
                            : "Sortie"}
                        </span>

                        {etat.typeLogement && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {
                              etat.typeLogement
                            }
                          </span>
                        )}

                        {etat.superficie >
                          0 && (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                            {
                              etat.superficie
                            }{" "}
                            m²
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 break-words text-xl font-black text-slate-950">
                        {etat.logementNom}
                      </h3>

                      <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                        {etat.adresseLogement ||
                          "Adresse non renseignée"}
                      </p>

                      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                        <Information
                          label="Voyageur"
                          valeur={
                            etat.voyageurNom
                          }
                        />

                        <Information
                          label="Date"
                          valeur={formaterDate(
                            etat.date
                          )}
                        />

                        <Information
                          label="Heure"
                          valeur={
                            etat.heure ||
                            "Non définie"
                          }
                        />

                        <Information
                          label="Logement"
                          valeur={
                            etat.typeLogement ||
                            "Type non renseigné"
                          }
                        />

                        <Information
                          label="Superficie"
                          valeur={
                            etat.superficie >
                            0
                              ? `${etat.superficie} m²`
                              : "Non renseignée"
                          }
                        />

                        <Information
                          label="Chambres"
                          valeur={`${etat.nombreChambres} chambre(s)`}
                        />
                      </div>

                      {etat.notesPreparation && (
                        <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                          <span className="font-black">
                            Préparation :{" "}
                          </span>

                          {
                            etat.notesPreparation
                          }
                        </div>
                      )}
                    </div>

                    <div className="w-full xl:w-64">
                      <label>
                        <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                          Changer le statut
                        </span>

                        <select
                          value={
                            etat.statut
                          }
                          onChange={(
                            event
                          ) =>
                            changerStatut(
                              etat.id,
                              event.target
                                .value as StatutEtatDesLieux
                            )
                          }
                          className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        >
                          {statuts.map(
                            (statut) => (
                              <option
                                key={
                                  statut.valeur
                                }
                                value={
                                  statut.valeur
                                }
                              >
                                {
                                  statut.label
                                }
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      <div className="mt-3 grid gap-2">
                        <Link
                          href={`/etats-des-lieux/${etat.id}`}
                          className="flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-black text-white shadow-md transition hover:bg-blue-700"
                        >
                          Ouvrir la fiche
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            supprimerEtatDesLieux(
                              etat
                            )
                          }
                          className="min-h-11 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function CarteStatistique({
  titre,
  valeur,
  icone,
}: {
  titre: string;
  valeur: number;
  icone: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            {titre}
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {valeur}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
          {icone}
        </div>
      </div>
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
  onChange: (valeur: string) => void;
  type?: string;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="min-h-12 w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function ChampSelection({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (valeur: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="min-h-12 w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  );
}

function Information({
  label,
  valeur,
}: {
  label: string;
  valeur: string;
}) {
  return (
    <p className="min-w-0 break-words">
      <span className="font-black text-slate-700">
        {label} :
      </span>{" "}
      <span className="text-slate-600">
        {valeur}
      </span>
    </p>
  );
}