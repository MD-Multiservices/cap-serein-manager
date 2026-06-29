"use client";

import { useEffect, useMemo, useState } from "react";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import { enregistrer, lire } from "@/lib/database";

type TypeLogement =
  | ""
  | "Studio"
  | "T1"
  | "T2"
  | "T3"
  | "T4"
  | "T5"
  | "T6 et plus"
  | "Maison"
  | "Villa"
  | "Autre";

type Logement = {
  id: string;
  nom: string;
  typeLogement: TypeLogement;
  superficie: number;
  nombreChambres: number;
  adresse: string;
  ville: string;
  codePostal: string;
  proprietaire: string;
  telephone: string;
  email: string;
  wifi: string;
  motDePasseWifi: string;
  boiteCles: string;
  codeBoiteCles: string;
  observations: string;
};

const typesLogement: Exclude<TypeLogement, "">[] = [
  "Studio",
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6 et plus",
  "Maison",
  "Villa",
  "Autre",
];

function creerLogementVide(): Logement {
  return {
    id: "",
    nom: "",
    typeLogement: "",
    superficie: 0,
    nombreChambres: 0,
    adresse: "",
    ville: "",
    codePostal: "",
    proprietaire: "",
    telephone: "",
    email: "",
    wifi: "",
    motDePasseWifi: "",
    boiteCles: "",
    codeBoiteCles: "",
    observations: "",
  };
}

function creerIdentifiant(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `logement-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normaliserTexte(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normaliserTypeLogement(
  valeur: unknown
): TypeLogement {
  const type = String(valeur || "");

  if (
    type === "Studio" ||
    type === "T1" ||
    type === "T2" ||
    type === "T3" ||
    type === "T4" ||
    type === "T5" ||
    type === "T6 et plus" ||
    type === "Maison" ||
    type === "Villa" ||
    type === "Autre"
  ) {
    return type;
  }

  return "";
}

export default function LogementsPage() {
  const [logements, setLogements] = useState<Logement[]>(
    []
  );

  const [logementEnCours, setLogementEnCours] =
    useState<Logement>(creerLogementVide());

  const [recherche, setRecherche] = useState("");
  const [formulaireOuvert, setFormulaireOuvert] =
    useState(false);

  const [donneesChargees, setDonneesChargees] =
    useState(false);

  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const logementsEnregistres =
      lire<Partial<Logement>>("logements").map(
        (logement): Logement => ({
          ...creerLogementVide(),
          ...logement,
          id: logement.id || creerIdentifiant(),
          nom: String(logement.nom || ""),
          typeLogement: normaliserTypeLogement(
            logement.typeLogement
          ),
          superficie: Math.max(
            0,
            Number(logement.superficie || 0)
          ),
          nombreChambres: Math.max(
            0,
            Number(logement.nombreChambres || 0)
          ),
          adresse: String(logement.adresse || ""),
          ville: String(logement.ville || ""),
          codePostal: String(
            logement.codePostal || ""
          ),
          proprietaire: String(
            logement.proprietaire || ""
          ),
          telephone: String(
            logement.telephone || ""
          ),
          email: String(logement.email || ""),
          wifi: String(logement.wifi || ""),
          motDePasseWifi: String(
            logement.motDePasseWifi || ""
          ),
          boiteCles: String(
            logement.boiteCles || ""
          ),
          codeBoiteCles: String(
            logement.codeBoiteCles || ""
          ),
          observations: String(
            logement.observations || ""
          ),
        })
      );

    setLogements(logementsEnregistres);
    setDonneesChargees(true);
  }, []);

  useEffect(() => {
    if (!donneesChargees) return;

    enregistrer("logements", logements);
  }, [logements, donneesChargees]);

  useEffect(() => {
    function verifierOuvertureDepuisAdresse() {
      if (
        window.location.hash ===
        "#nouveau-logement"
      ) {
        ouvrirNouveauLogement(false);
      }
    }

    verifierOuvertureDepuisAdresse();

    window.addEventListener(
      "hashchange",
      verifierOuvertureDepuisAdresse
    );

    return () => {
      window.removeEventListener(
        "hashchange",
        verifierOuvertureDepuisAdresse
      );
    };
  }, []);

  const resultats = useMemo(() => {
    const rechercheNormalisee =
      normaliserTexte(recherche);

    return logements
      .filter((logement) => {
        if (!rechercheNormalisee) return true;

        const contenu = [
          logement.nom,
          logement.typeLogement,
          String(logement.superficie),
          String(logement.nombreChambres),
          logement.adresse,
          logement.ville,
          logement.codePostal,
          logement.proprietaire,
          logement.telephone,
          logement.email,
        ]
          .map((valeur) =>
            normaliserTexte(String(valeur || ""))
          )
          .join(" ");

        return contenu.includes(
          rechercheNormalisee
        );
      })
      .sort((a, b) =>
        a.nom.localeCompare(b.nom, "fr")
      );
  }, [logements, recherche]);

  const statistiques = useMemo(() => {
    const superficieTotale = logements.reduce(
      (total, logement) =>
        total + logement.superficie,
      0
    );

    const logementsRenseignes = logements.filter(
      (logement) =>
        logement.typeLogement &&
        logement.superficie > 0
    ).length;

    return {
      total: logements.length,
      superficieTotale,
      logementsRenseignes,
      villes: new Set(
        logements
          .map((logement) => logement.ville.trim())
          .filter(Boolean)
      ).size,
    };
  }, [logements]);

  function ouvrirNouveauLogement(
    modifierAdresse = true
  ) {
    setLogementEnCours(creerLogementVide());
    setErreur("");
    setFormulaireOuvert(true);

    if (
      modifierAdresse &&
      window.location.hash !==
        "#nouveau-logement"
    ) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}#nouveau-logement`
      );
    }

    window.setTimeout(() => {
      document
        .getElementById("formulaire-logement")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  function ouvrirModification(
    logement: Logement
  ) {
    setLogementEnCours({ ...logement });
    setErreur("");
    setFormulaireOuvert(true);

    window.setTimeout(() => {
      document
        .getElementById("formulaire-logement")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  function fermerFormulaire() {
    setLogementEnCours(creerLogementVide());
    setErreur("");
    setFormulaireOuvert(false);

    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname
      );
    }
  }

  function sauvegarderLogement() {
    if (!logementEnCours.nom.trim()) {
      setErreur(
        "Le nom du logement est obligatoire."
      );
      return;
    }

    if (!logementEnCours.typeLogement) {
      setErreur(
        "Le type de logement est obligatoire."
      );
      return;
    }

    if (logementEnCours.superficie <= 0) {
      setErreur(
        "La superficie doit être supérieure à zéro."
      );
      return;
    }

    if (!logementEnCours.adresse.trim()) {
      setErreur(
        "L’adresse du logement est obligatoire."
      );
      return;
    }

    if (!logementEnCours.ville.trim()) {
      setErreur("La ville est obligatoire.");
      return;
    }

    if (
      logementEnCours.email &&
      !logementEnCours.email.includes("@")
    ) {
      setErreur(
        "L’adresse e-mail semble incorrecte."
      );
      return;
    }

    const logementFinal: Logement = {
      ...logementEnCours,
      id:
        logementEnCours.id ||
        creerIdentifiant(),
      nom: logementEnCours.nom.trim(),
      superficie: Math.max(
        0,
        Number(logementEnCours.superficie || 0)
      ),
      nombreChambres: Math.max(
        0,
        Math.round(
          Number(
            logementEnCours.nombreChambres || 0
          )
        )
      ),
      adresse: logementEnCours.adresse.trim(),
      ville: logementEnCours.ville.trim(),
      codePostal:
        logementEnCours.codePostal.trim(),
      proprietaire:
        logementEnCours.proprietaire.trim(),
      telephone:
        logementEnCours.telephone.trim(),
      email: logementEnCours.email.trim(),
      wifi: logementEnCours.wifi.trim(),
      motDePasseWifi:
        logementEnCours.motDePasseWifi.trim(),
      boiteCles:
        logementEnCours.boiteCles.trim(),
      codeBoiteCles:
        logementEnCours.codeBoiteCles.trim(),
      observations:
        logementEnCours.observations.trim(),
    };

    setLogements((liste) => {
      const existe = liste.some(
        (logement) =>
          logement.id === logementFinal.id
      );

      if (existe) {
        return liste.map((logement) =>
          logement.id === logementFinal.id
            ? logementFinal
            : logement
        );
      }

      return [logementFinal, ...liste];
    });

    fermerFormulaire();
  }

  function supprimerLogement(
    logement: Logement
  ) {
    const confirmation = window.confirm(
      `Supprimer définitivement le logement « ${logement.nom} » ?`
    );

    if (!confirmation) return;

    setLogements((liste) =>
      liste.filter(
        (item) => item.id !== logement.id
      )
    );

    if (
      logementEnCours.id === logement.id
    ) {
      fermerFormulaire();
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        titre="Logements"
        description="Gérez les logements et les informations qui seront reprises dans les états des lieux."
        action={
          <button
            type="button"
            onClick={() =>
              ouvrirNouveauLogement()
            }
            className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            + Nouveau logement
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CarteStatistique
          titre="Logements"
          valeur={String(statistiques.total)}
        />

        <CarteStatistique
          titre="Fiches complètes"
          valeur={String(
            statistiques.logementsRenseignes
          )}
        />

        <CarteStatistique
          titre="Superficie totale"
          valeur={`${statistiques.superficieTotale} m²`}
        />

        <CarteStatistique
          titre="Villes"
          valeur={String(statistiques.villes)}
        />
      </div>

      {formulaireOuvert && (
        <div id="formulaire-logement">
          <Section
            titre={
              logementEnCours.id
                ? "Modifier le logement"
                : "Nouveau logement"
            }
            description="Les caractéristiques du logement seront automatiquement reprises dans ses états des lieux."
          >
            {erreur && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {erreur}
              </div>
            )}

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4 sm:p-6">
              <h3 className="text-lg font-black text-blue-950">
                Caractéristiques du logement
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-800">
                Ces informations apparaîtront dans
                chaque état des lieux lié à ce
                logement.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Champ
                  label="Nom du logement"
                  value={logementEnCours.nom}
                  placeholder="Appartement Tamaris"
                  onChange={(valeur) =>
                    setLogementEnCours({
                      ...logementEnCours,
                      nom: valeur,
                    })
                  }
                />

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Type de logement
                  </span>

                  <select
                    value={
                      logementEnCours.typeLogement
                    }
                    onChange={(event) =>
                      setLogementEnCours({
                        ...logementEnCours,
                        typeLogement:
                          event.target
                            .value as TypeLogement,
                      })
                    }
                    className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">
                      Sélectionner
                    </option>

                    {typesLogement.map((type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <ChampNombre
                  label="Superficie"
                  value={
                    logementEnCours.superficie
                  }
                  min={0}
                  step={0.5}
                  suffixe="m²"
                  onChange={(valeur) =>
                    setLogementEnCours({
                      ...logementEnCours,
                      superficie: valeur,
                    })
                  }
                />

                <ChampNombre
                  label="Nombre de chambres"
                  value={
                    logementEnCours.nombreChambres
                  }
                  min={0}
                  step={1}
                  suffixe="chambre(s)"
                  onChange={(valeur) =>
                    setLogementEnCours({
                      ...logementEnCours,
                      nombreChambres:
                        Math.round(valeur),
                    })
                  }
                />
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <Champ
                label="Propriétaire"
                value={
                  logementEnCours.proprietaire
                }
                placeholder="Nom du propriétaire"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    proprietaire: valeur,
                  })
                }
              />

              <Champ
                label="Téléphone"
                type="tel"
                value={
                  logementEnCours.telephone
                }
                placeholder="Téléphone du propriétaire"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    telephone: valeur,
                  })
                }
              />

              <Champ
                label="Adresse e-mail"
                type="email"
                value={logementEnCours.email}
                placeholder="proprietaire@email.fr"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    email: valeur,
                  })
                }
              />

              <Champ
                label="Adresse"
                value={
                  logementEnCours.adresse
                }
                placeholder="Numéro et nom de rue"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    adresse: valeur,
                  })
                }
              />

              <Champ
                label="Code postal"
                value={
                  logementEnCours.codePostal
                }
                placeholder="83500"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    codePostal: valeur,
                  })
                }
              />

              <Champ
                label="Ville"
                value={logementEnCours.ville}
                placeholder="La Seyne-sur-Mer"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    ville: valeur,
                  })
                }
              />

              <Champ
                label="Nom du réseau Wi-Fi"
                value={logementEnCours.wifi}
                placeholder="Nom du réseau"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    wifi: valeur,
                  })
                }
              />

              <Champ
                label="Mot de passe Wi-Fi"
                value={
                  logementEnCours.motDePasseWifi
                }
                placeholder="Mot de passe"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    motDePasseWifi: valeur,
                  })
                }
              />

              <Champ
                label="Emplacement de la boîte à clés"
                value={
                  logementEnCours.boiteCles
                }
                placeholder="Portail, mur de gauche..."
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    boiteCles: valeur,
                  })
                }
              />

              <Champ
                label="Code de la boîte à clés"
                value={
                  logementEnCours.codeBoiteCles
                }
                placeholder="Code d’accès"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    codeBoiteCles: valeur,
                  })
                }
              />
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Observations
              </span>

              <textarea
                value={
                  logementEnCours.observations
                }
                onChange={(event) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    observations:
                      event.target.value,
                  })
                }
                rows={5}
                placeholder="Accès, stationnement, consignes particulières, équipements..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={sauvegarderLogement}
                className="min-h-12 w-full rounded-2xl bg-blue-600 px-6 py-3 font-black text-white shadow-md transition hover:bg-blue-700 sm:w-auto"
              >
                Enregistrer le logement
              </button>

              <button
                type="button"
                onClick={fermerFormulaire}
                className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
              >
                Annuler
              </button>
            </div>
          </Section>
        </div>
      )}

      <Section
        titre="Liste des logements"
        description={`${resultats.length} logement(s) affiché(s)`}
      >
        <input
          type="search"
          value={recherche}
          onChange={(event) =>
            setRecherche(event.target.value)
          }
          placeholder="Rechercher un logement, un type, une ville ou un propriétaire..."
          className="mb-6 min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        />

        {!donneesChargees ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-12 text-center sm:p-16">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 font-bold text-slate-500">
              Chargement des logements...
            </p>
          </div>
        ) : resultats.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {resultats.map((logement) => (
              <article
                key={logement.id}
                className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                        {logement.typeLogement ||
                          "Type non renseigné"}
                      </span>

                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        {logement.superficie > 0
                          ? `${logement.superficie} m²`
                          : "Superficie non renseignée"}
                      </span>

                      <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                        {logement.nombreChambres === 0
                          ? "Aucune chambre séparée"
                          : `${logement.nombreChambres} chambre(s)`}
                      </span>
                    </div>

                    <h3 className="mt-4 break-words text-xl font-black text-slate-950">
                      {logement.nom}
                    </h3>

                    <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                      {logement.adresse ||
                        "Adresse non renseignée"}

                      {(logement.codePostal ||
                        logement.ville) &&
                        `, ${logement.codePostal} ${logement.ville}`}
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <button
                      type="button"
                      onClick={() =>
                        ouvrirModification(
                          logement
                        )
                      }
                      className="min-h-11 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 sm:w-auto"
                    >
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        supprimerLogement(
                          logement
                        )
                      }
                      className="min-h-11 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 sm:w-auto"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                  <Info
                    label="Propriétaire"
                    valeur={
                      logement.proprietaire ||
                      "Non renseigné"
                    }
                  />

                  <Info
                    label="Téléphone"
                    valeur={
                      logement.telephone ||
                      "Non renseigné"
                    }
                  />

                  <Info
                    label="Wi-Fi"
                    valeur={
                      logement.wifi ||
                      "Non renseigné"
                    }
                  />

                  <Info
                    label="Boîte à clés"
                    valeur={
                      logement.boiteCles ||
                      "Non renseignée"
                    }
                  />
                </div>

                {logement.observations && (
                  <p className="mt-5 whitespace-pre-wrap break-words rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    {logement.observations}
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center sm:px-6 sm:py-16">
            <div className="text-5xl">🏡</div>

            <h3 className="mt-5 text-xl font-black text-slate-900">
              Aucun logement enregistré
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-slate-500">
              Ajoutez votre premier logement pour
              commencer à gérer votre activité.
            </p>

            <button
              type="button"
              onClick={() =>
                ouvrirNouveauLogement()
              }
              className="mt-6 min-h-12 w-full rounded-2xl bg-blue-600 px-6 py-3 font-black text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 sm:w-auto"
            >
              + Ajouter le premier logement
            </button>
          </div>
        )}
      </Section>
    </div>
  );
}

function CarteStatistique({
  titre,
  valeur,
}: {
  titre: string;
  valeur: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {titre}
      </p>

      <p className="mt-3 break-words text-3xl font-black text-slate-950">
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
    <label className="min-w-0">
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
        className="min-h-12 w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
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
  suffixe,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  step: number;
  suffixe: string;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <div className="flex min-h-12 overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) =>
            onChange(
              Math.max(
                min,
                Number(event.target.value || 0)
              )
            )
          }
          className="min-w-0 flex-1 bg-transparent px-5 py-3 text-slate-900 outline-none"
        />

        <span className="flex shrink-0 items-center border-l border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-500 sm:px-4 sm:text-sm">
          {suffixe}
        </span>
      </div>
    </label>
  );
}

function Info({
  label,
  valeur,
}: {
  label: string;
  valeur: string;
}) {
  return (
    <p className="min-w-0 break-words">
      <span className="font-bold text-slate-700">
        {label} :
      </span>{" "}
      <span className="text-slate-600">
        {valeur}
      </span>
    </p>
  );
}