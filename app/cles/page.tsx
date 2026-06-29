"use client";

import { useEffect, useMemo, useState } from "react";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import { enregistrer, lire } from "@/lib/database";

type TypeCle =
  | "Jeu principal"
  | "Double"
  | "Boîte à clés"
  | "Badge"
  | "Télécommande"
  | "Autre";

type StatutCle =
  | "Disponible"
  | "Remise au voyageur"
  | "Confiée à un prestataire"
  | "Perdue"
  | "À remplacer";

type Cle = {
  id: string;
  logementId: string;
  nom: string;
  type: TypeCle;
  quantite: number;
  statut: StatutCle;
  detenteur: string;
  emplacement: string;
  code: string;
  dateSortie: string;
  dateRetourPrevue: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type AncienneCle = Partial<Cle> & {
  logement?: string;
  nombre?: number;
  etat?: string;
  personne?: string;
  dateRemise?: string;
  dateRetour?: string;
  observation?: string;
};

type Logement = {
  id: string;
  nom: string;
  ville?: string;
};

type FiltreStatut = "Tous" | StatutCle;
type FiltreType = "Tous" | TypeCle;

const typesCle: TypeCle[] = [
  "Jeu principal",
  "Double",
  "Boîte à clés",
  "Badge",
  "Télécommande",
  "Autre",
];

const statutsCle: StatutCle[] = [
  "Disponible",
  "Remise au voyageur",
  "Confiée à un prestataire",
  "Perdue",
  "À remplacer",
];

function creerIdentifiant(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `cle-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function creerCleVide(): Cle {
  const maintenant = new Date().toISOString();

  return {
    id: "",
    logementId: "",
    nom: "",
    type: "Jeu principal",
    quantite: 1,
    statut: "Disponible",
    detenteur: "",
    emplacement: "",
    code: "",
    dateSortie: "",
    dateRetourPrevue: "",
    notes: "",
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

function normaliserStatut(valeur: unknown): StatutCle {
  const statut = String(valeur || "");

  if (
    statut === "Remise" ||
    statut === "Prêtée" ||
    statut === "Prêté" ||
    statut === "Chez le voyageur"
  ) {
    return "Remise au voyageur";
  }

  if (
    statut === "Prestataire" ||
    statut === "Confiée" ||
    statut === "Confié"
  ) {
    return "Confiée à un prestataire";
  }

  if (statut === "Perdue" || statut === "Perdu") {
    return "Perdue";
  }

  if (
    statut === "À remplacer" ||
    statut === "A remplacer"
  ) {
    return "À remplacer";
  }

  return "Disponible";
}

function normaliserCle(item: AncienneCle): Cle {
  const maintenant = new Date().toISOString();

  return {
    ...creerCleVide(),
    ...item,
    id: item.id || creerIdentifiant(),
    logementId:
      item.logementId || item.logement || "",
    nom: item.nom || "Jeu de clés",
    type: typesCle.includes(item.type as TypeCle)
      ? (item.type as TypeCle)
      : "Jeu principal",
    quantite: Math.max(
      1,
      Number(item.quantite || item.nombre || 1)
    ),
    statut: normaliserStatut(
      item.statut || item.etat
    ),
    detenteur:
      item.detenteur || item.personne || "",
    emplacement: item.emplacement || "",
    code: item.code || "",
    dateSortie:
      item.dateSortie || item.dateRemise || "",
    dateRetourPrevue:
      item.dateRetourPrevue || item.dateRetour || "",
    notes:
      item.notes || item.observation || "",
    createdAt: item.createdAt || maintenant,
    updatedAt: item.updatedAt || maintenant,
  };
}

export default function ClesPage() {
  const [cles, setCles] = useState<Cle[]>([]);
  const [logements, setLogements] = useState<
    Logement[]
  >([]);

  const [cleEnCours, setCleEnCours] =
    useState<Cle>(creerCleVide());

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
    setCles(
      lire<AncienneCle>("cles").map(normaliserCle)
    );

    setLogements(lire<Logement>("logements"));
    setDonneesChargees(true);
  }, []);

  useEffect(() => {
    if (!donneesChargees) return;

    enregistrer("cles", cles);
  }, [cles, donneesChargees]);

  const statistiques = useMemo(() => {
    const total = cles.reduce(
      (somme, cle) => somme + cle.quantite,
      0
    );

    const disponibles = cles
      .filter((cle) => cle.statut === "Disponible")
      .reduce(
        (somme, cle) => somme + cle.quantite,
        0
      );

    const enCirculation = cles
      .filter(
        (cle) =>
          cle.statut === "Remise au voyageur" ||
          cle.statut ===
            "Confiée à un prestataire"
      )
      .reduce(
        (somme, cle) => somme + cle.quantite,
        0
      );

    const alertes = cles
      .filter(
        (cle) =>
          cle.statut === "Perdue" ||
          cle.statut === "À remplacer"
      )
      .reduce(
        (somme, cle) => somme + cle.quantite,
        0
      );

    return {
      total,
      disponibles,
      enCirculation,
      alertes,
    };
  }, [cles]);

  const resultats = useMemo(() => {
    const rechercheNormalisee =
      normaliserTexte(recherche);

    return cles
      .filter((cle) => {
        if (
          filtreStatut !== "Tous" &&
          cle.statut !== filtreStatut
        ) {
          return false;
        }

        if (
          filtreType !== "Tous" &&
          cle.type !== filtreType
        ) {
          return false;
        }

        if (
          filtreLogement !== "Tous" &&
          cle.logementId !== filtreLogement
        ) {
          return false;
        }

        if (!rechercheNormalisee) return true;

        const logement = logements.find(
          (item) => item.id === cle.logementId
        );

        const contenu = [
          cle.nom,
          cle.type,
          cle.statut,
          cle.detenteur,
          cle.emplacement,
          cle.code,
          cle.notes,
          logement?.nom || "",
          logement?.ville || "",
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
        const priorites: Record<StatutCle, number> = {
          Perdue: 0,
          "À remplacer": 1,
          "Remise au voyageur": 2,
          "Confiée à un prestataire": 3,
          Disponible: 4,
        };

        const comparaison =
          priorites[a.statut] -
          priorites[b.statut];

        if (comparaison !== 0) {
          return comparaison;
        }

        return nomLogementParListe(
          a.logementId,
          logements
        ).localeCompare(
          nomLogementParListe(
            b.logementId,
            logements
          )
        );
      });
  }, [
    cles,
    logements,
    recherche,
    filtreStatut,
    filtreType,
    filtreLogement,
  ]);

  function nomLogement(id: string): string {
    return nomLogementParListe(id, logements);
  }

  function ouvrirNouvelleCle() {
    setCleEnCours(creerCleVide());
    setErreur("");
    setFormulaireOuvert(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function ouvrirModification(cle: Cle) {
    setCleEnCours({ ...cle });
    setErreur("");
    setFormulaireOuvert(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function fermerFormulaire() {
    setCleEnCours(creerCleVide());
    setErreur("");
    setFormulaireOuvert(false);
  }

  function sauvegarderCle() {
    if (!cleEnCours.logementId) {
      setErreur("Le logement est obligatoire.");
      return;
    }

    if (!cleEnCours.nom.trim()) {
      setErreur(
        "Le nom du jeu de clés est obligatoire."
      );
      return;
    }

    if (cleEnCours.quantite < 1) {
      setErreur(
        "La quantité doit être supérieure à zéro."
      );
      return;
    }

    if (
      cleEnCours.statut !== "Disponible" &&
      !cleEnCours.detenteur.trim()
    ) {
      setErreur(
        "Indiquez la personne qui détient les clés."
      );
      return;
    }

    const maintenant = new Date().toISOString();

    setCles((liste) => {
      const existe = liste.some(
        (cle) => cle.id === cleEnCours.id
      );

      const cleFinale: Cle = {
        ...cleEnCours,
        id:
          cleEnCours.id ||
          creerIdentifiant(),
        nom: cleEnCours.nom.trim(),
        quantite: Math.max(
          1,
          Number(cleEnCours.quantite || 1)
        ),
        detenteur:
          cleEnCours.detenteur.trim(),
        emplacement:
          cleEnCours.emplacement.trim(),
        code: cleEnCours.code.trim(),
        notes: cleEnCours.notes.trim(),
        createdAt:
          existe && cleEnCours.createdAt
            ? cleEnCours.createdAt
            : maintenant,
        updatedAt: maintenant,
      };

      if (existe) {
        return liste.map((cle) =>
          cle.id === cleFinale.id
            ? cleFinale
            : cle
        );
      }

      return [cleFinale, ...liste];
    });

    fermerFormulaire();
  }

  function supprimerCle(cle: Cle) {
    const confirmation = window.confirm(
      `Supprimer définitivement « ${cle.nom} » ?`
    );

    if (!confirmation) return;

    setCles((liste) =>
      liste.filter(
        (item) => item.id !== cle.id
      )
    );
  }

  function changerStatut(
    id: string,
    statut: StatutCle
  ) {
    const maintenant = new Date().toISOString();

    setCles((liste) =>
      liste.map((cle) =>
        cle.id === id
          ? {
              ...cle,
              statut,
              detenteur:
                statut === "Disponible"
                  ? ""
                  : cle.detenteur,
              dateSortie:
                statut === "Disponible"
                  ? ""
                  : cle.dateSortie,
              dateRetourPrevue:
                statut === "Disponible"
                  ? ""
                  : cle.dateRetourPrevue,
              updatedAt: maintenant,
            }
          : cle
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
        titre="Gestion des clés"
        description="Suivez les jeux de clés, badges, télécommandes, détenteurs et retours prévus."
        action={
          <button
            type="button"
            onClick={ouvrirNouvelleCle}
            disabled={logements.length === 0}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            + Nouveau jeu de clés
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
              Ajoutez un logement avant d’enregistrer
              ses clés, badges ou télécommandes.
            </p>
          </div>
        )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <CarteStatistique
          titre="Total"
          valeur={statistiques.total}
          couleur="blue"
        />

        <CarteStatistique
          titre="Disponibles"
          valeur={statistiques.disponibles}
          couleur="green"
        />

        <CarteStatistique
          titre="En circulation"
          valeur={statistiques.enCirculation}
          couleur="orange"
        />

        <CarteStatistique
          titre="Alertes"
          valeur={statistiques.alertes}
          couleur="red"
        />
      </div>

      {formulaireOuvert && (
        <Section
          titre={
            cleEnCours.id
              ? "Modifier le jeu de clés"
              : "Nouveau jeu de clés"
          }
          description="Enregistrez le type de clé, son emplacement et son détenteur actuel."
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
                value={cleEnCours.logementId}
                onChange={(event) =>
                  setCleEnCours({
                    ...cleEnCours,
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

            <Champ
              label="Nom du jeu"
              value={cleEnCours.nom}
              placeholder="Exemple : jeu principal"
              onChange={(valeur) =>
                setCleEnCours({
                  ...cleEnCours,
                  nom: valeur,
                })
              }
            />

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Type
              </span>

              <select
                value={cleEnCours.type}
                onChange={(event) =>
                  setCleEnCours({
                    ...cleEnCours,
                    type: event.target.value as TypeCle,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {typesCle.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <ChampNombre
              label="Quantité"
              value={cleEnCours.quantite}
              onChange={(valeur) =>
                setCleEnCours({
                  ...cleEnCours,
                  quantite: valeur,
                })
              }
            />

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Statut
              </span>

              <select
                value={cleEnCours.statut}
                onChange={(event) =>
                  setCleEnCours({
                    ...cleEnCours,
                    statut:
                      event.target.value as StatutCle,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {statutsCle.map((statut) => (
                  <option
                    key={statut}
                    value={statut}
                  >
                    {statut}
                  </option>
                ))}
              </select>
            </label>

            <Champ
              label="Détenteur actuel"
              value={cleEnCours.detenteur}
              placeholder="Voyageur, prestataire..."
              onChange={(valeur) =>
                setCleEnCours({
                  ...cleEnCours,
                  detenteur: valeur,
                })
              }
            />

            <Champ
              label="Emplacement habituel"
              value={cleEnCours.emplacement}
              placeholder="Bureau, coffre, boîte à clés..."
              onChange={(valeur) =>
                setCleEnCours({
                  ...cleEnCours,
                  emplacement: valeur,
                })
              }
            />

            <Champ
              label="Code de la boîte"
              value={cleEnCours.code}
              placeholder="Code éventuel"
              onChange={(valeur) =>
                setCleEnCours({
                  ...cleEnCours,
                  code: valeur,
                })
              }
            />

            <Champ
              label="Date de sortie"
              type="date"
              value={cleEnCours.dateSortie}
              onChange={(valeur) =>
                setCleEnCours({
                  ...cleEnCours,
                  dateSortie: valeur,
                })
              }
            />

            <Champ
              label="Retour prévu"
              type="date"
              value={cleEnCours.dateRetourPrevue}
              onChange={(valeur) =>
                setCleEnCours({
                  ...cleEnCours,
                  dateRetourPrevue: valeur,
                })
              }
            />
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Notes
            </span>

            <textarea
              value={cleEnCours.notes}
              onChange={(event) =>
                setCleEnCours({
                  ...cleEnCours,
                  notes: event.target.value,
                })
              }
              rows={4}
              placeholder="Consignes, particularités, état du badge ou de la télécommande..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={sauvegarderCle}
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
        description={`${resultats.length} élément(s) affiché(s)`}
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
              placeholder="Logement, détenteur, emplacement, code..."
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <SelectFiltre
            label="Statut"
            value={filtreStatut}
            options={["Tous", ...statutsCle]}
            onChange={(valeur) =>
              setFiltreStatut(
                valeur as FiltreStatut
              )
            }
          />

          <SelectFiltre
            label="Type"
            value={filtreType}
            options={["Tous", ...typesCle]}
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
        titre="Inventaire des clés"
        description="Disponibilités, détenteurs et retours prévus."
      >
        {!donneesChargees ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 font-bold text-slate-500">
              Chargement des clés...
            </p>
          </div>
        ) : resultats.length > 0 ? (
          <div className="grid gap-6 xl:grid-cols-2">
            {resultats.map((cle) => (
              <CarteCle
                key={cle.id}
                cle={cle}
                logement={nomLogement(
                  cle.logementId
                )}
                onModifier={() =>
                  ouvrirModification(cle)
                }
                onSupprimer={() =>
                  supprimerCle(cle)
                }
                onChangerStatut={(statut) =>
                  changerStatut(cle.id, statut)
                }
              />
            ))}
          </div>
        ) : cles.length === 0 ? (
          <EtatVide
            icone="🔑"
            titre="Aucune clé enregistrée"
            texte="Ajoutez les clés, badges et télécommandes associés à vos logements."
            action={
              logements.length > 0 ? (
                <button
                  type="button"
                  onClick={ouvrirNouvelleCle}
                  className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                >
                  + Ajouter un jeu de clés
                </button>
              ) : null
            }
          />
        ) : (
          <EtatVide
            icone="🔎"
            titre="Aucun résultat"
            texte="Aucun élément ne correspond aux filtres sélectionnés."
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

function nomLogementParListe(
  id: string,
  logements: Logement[]
): string {
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

function CarteCle({
  cle,
  logement,
  onModifier,
  onSupprimer,
  onChangerStatut,
}: {
  cle: Cle;
  logement: string;
  onModifier: () => void;
  onSupprimer: () => void;
  onChangerStatut: (statut: StatutCle) => void;
}) {
  const statutClasses: Record<StatutCle, string> = {
    Disponible:
      "bg-emerald-100 text-emerald-700",
    "Remise au voyageur":
      "bg-blue-100 text-blue-700",
    "Confiée à un prestataire":
      "bg-violet-100 text-violet-700",
    Perdue: "bg-red-100 text-red-700",
    "À remplacer":
      "bg-orange-100 text-orange-700",
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {cle.type}
          </span>

          <h3 className="mt-4 text-xl font-black text-slate-950">
            {cle.nom}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {logement}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${statutClasses[cle.statut]}`}
        >
          {cle.statut}
        </span>
      </div>

      <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <Info
          label="Quantité"
          value={String(cle.quantite)}
        />

        <Info
          label="Détenteur"
          value={cle.detenteur || "Aucun"}
        />

        <Info
          label="Emplacement"
          value={
            cle.emplacement || "Non renseigné"
          }
        />

        <Info
          label="Code"
          value={cle.code || "Aucun"}
        />

        <Info
          label="Date de sortie"
          value={cle.dateSortie || "—"}
        />

        <Info
          label="Retour prévu"
          value={cle.dateRetourPrevue || "—"}
        />
      </div>

      {cle.notes && (
        <p className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          {cle.notes}
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
          value={cle.statut}
          onChange={(event) =>
            onChangerStatut(
              event.target.value as StatutCle
            )
          }
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-600"
        >
          {statutsCle.map((statut) => (
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
        min={1}
        step={1}
        value={value}
        onChange={(event) =>
          onChange(
            Math.max(
              1,
              Number(event.target.value || 1)
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