"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import { enregistrer, lire } from "@/lib/database";

type TypePressing =
  | "Collecte du linge"
  | "Lavage"
  | "Repassage"
  | "Blanchisserie complète"
  | "Livraison du linge"
  | "Autre";

type StatutPressing =
  | "À planifier"
  | "Collecte prévue"
  | "En traitement"
  | "Prêt"
  | "Livré"
  | "Annulé";

type Pressing = {
  id: string;
  logementId: string;
  voyageurId: string;
  type: TypePressing;
  dateCollecte: string;
  heureCollecte: string;
  dateRetour: string;
  heureRetour: string;
  statut: StatutPressing;
  prestataire: string;
  nombreSacs: number;
  draps: number;
  serviettes: number;
  autresArticles: string;
  cout: number;
  paiementEffectue: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type AncienPressing = Partial<Pressing> & {
  logement?: string;
  voyageur?: string;
  date?: string;
  heure?: string;
  retour?: string;
  heureLivraison?: string;
  personne?: string;
  prix?: number;
  sacs?: number;
  linge?: string;
  observations?: string;
  paye?: boolean;
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

type FiltreStatut = "Tous" | StatutPressing;
type FiltreType = "Tous" | TypePressing;

const typesPressing: TypePressing[] = [
  "Collecte du linge",
  "Lavage",
  "Repassage",
  "Blanchisserie complète",
  "Livraison du linge",
  "Autre",
];

const statutsPressing: StatutPressing[] = [
  "À planifier",
  "Collecte prévue",
  "En traitement",
  "Prêt",
  "Livré",
  "Annulé",
];

function creerIdentifiant(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `pressing-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function dateLocaleISO(date = new Date()): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
}

function creerPressingVide(): Pressing {
  const maintenant = new Date().toISOString();
  const dateRetour = new Date();

  dateRetour.setDate(dateRetour.getDate() + 2);

  return {
    id: "",
    logementId: "",
    voyageurId: "",
    type: "Blanchisserie complète",
    dateCollecte: dateLocaleISO(),
    heureCollecte: "10:00",
    dateRetour: dateLocaleISO(dateRetour),
    heureRetour: "16:00",
    statut: "À planifier",
    prestataire: "",
    nombreSacs: 1,
    draps: 0,
    serviettes: 0,
    autresArticles: "",
    cout: 0,
    paiementEffectue: false,
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

function normaliserType(valeur: unknown): TypePressing {
  const type = String(valeur || "");

  if (typesPressing.includes(type as TypePressing)) {
    return type as TypePressing;
  }

  const typeNormalise = normaliserTexte(type);

  if (typeNormalise.includes("collecte")) {
    return "Collecte du linge";
  }

  if (typeNormalise.includes("lavage")) {
    return "Lavage";
  }

  if (typeNormalise.includes("repassage")) {
    return "Repassage";
  }

  if (
    typeNormalise.includes("livraison") ||
    typeNormalise.includes("retour")
  ) {
    return "Livraison du linge";
  }

  if (
    typeNormalise.includes("blanchisserie") ||
    typeNormalise.includes("complet")
  ) {
    return "Blanchisserie complète";
  }

  return "Autre";
}

function normaliserStatut(valeur: unknown): StatutPressing {
  const statut = String(valeur || "");

  if (statutsPressing.includes(statut as StatutPressing)) {
    return statut as StatutPressing;
  }

  const statutNormalise = normaliserTexte(statut);

  if (
    statutNormalise.includes("collecte") ||
    statutNormalise.includes("prevu") ||
    statutNormalise.includes("planifie")
  ) {
    return "Collecte prévue";
  }

  if (
    statutNormalise.includes("traitement") ||
    statutNormalise.includes("cours")
  ) {
    return "En traitement";
  }

  if (statutNormalise.includes("pret")) {
    return "Prêt";
  }

  if (
    statutNormalise.includes("livre") ||
    statutNormalise.includes("termine")
  ) {
    return "Livré";
  }

  if (statutNormalise.includes("annul")) {
    return "Annulé";
  }

  return "À planifier";
}

function normaliserPressing(
  item: AncienPressing
): Pressing {
  const maintenant = new Date().toISOString();

  return {
    ...creerPressingVide(),
    ...item,
    id: item.id || creerIdentifiant(),
    logementId:
      item.logementId || item.logement || "",
    voyageurId:
      item.voyageurId || item.voyageur || "",
    type: normaliserType(item.type || item.linge),
    dateCollecte:
      item.dateCollecte || item.date || "",
    heureCollecte:
      item.heureCollecte || item.heure || "10:00",
    dateRetour:
      item.dateRetour || item.retour || "",
    heureRetour:
      item.heureRetour ||
      item.heureLivraison ||
      "16:00",
    statut: normaliserStatut(item.statut),
    prestataire:
      item.prestataire || item.personne || "",
    nombreSacs: Math.max(
      1,
      Number(item.nombreSacs || item.sacs || 1)
    ),
    draps: Math.max(0, Number(item.draps || 0)),
    serviettes: Math.max(
      0,
      Number(item.serviettes || 0)
    ),
    autresArticles: item.autresArticles || "",
    cout: Math.max(
      0,
      Number(item.cout || item.prix || 0)
    ),
    paiementEffectue: Boolean(
      item.paiementEffectue || item.paye
    ),
    notes:
      item.notes || item.observations || "",
    createdAt: item.createdAt || maintenant,
    updatedAt: item.updatedAt || maintenant,
  };
}

function lireAnciennesDonnees(): AncienPressing[] {
  if (typeof window === "undefined") return [];

  try {
    const contenu = window.localStorage.getItem(
      "cap-serein-pressing"
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

export default function PressingPage() {
  const [pressings, setPressings] = useState<Pressing[]>(
    []
  );

  const [logements, setLogements] = useState<
    Logement[]
  >([]);

  const [voyageurs, setVoyageurs] = useState<
    Voyageur[]
  >([]);

  const [pressingEnCours, setPressingEnCours] =
    useState<Pressing>(creerPressingVide());

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
      lire<AncienPressing>("pressings");

    const anciennesDonnees = lireAnciennesDonnees();

    const donneesFusionnees = [
      ...donneesActuelles,
      ...anciennesDonnees,
    ]
      .map(normaliserPressing)
      .filter(
        (pressing, index, liste) =>
          liste.findIndex(
            (item) => item.id === pressing.id
          ) === index
      );

    setPressings(donneesFusionnees);
    setLogements(lire<Logement>("logements"));
    setVoyageurs(lire<Voyageur>("voyageurs"));
    setDonneesChargees(true);
  }, []);

  useEffect(() => {
    if (!donneesChargees) return;

    enregistrer("pressings", pressings);
  }, [pressings, donneesChargees]);

  const statistiques = useMemo(() => {
    const aujourdHui = dateLocaleISO();

    const coutTotal = pressings
      .filter(
        (pressing) => pressing.statut !== "Annulé"
      )
      .reduce(
        (total, pressing) => total + pressing.cout,
        0
      );

    const montantImpaye = pressings
      .filter(
        (pressing) =>
          pressing.statut !== "Annulé" &&
          !pressing.paiementEffectue
      )
      .reduce(
        (total, pressing) => total + pressing.cout,
        0
      );

    return {
      total: pressings.length,

      collectesAujourdhui: pressings.filter(
        (pressing) =>
          pressing.dateCollecte === aujourdHui &&
          pressing.statut !== "Annulé" &&
          pressing.statut !== "Livré"
      ).length,

      enTraitement: pressings.filter(
        (pressing) =>
          pressing.statut === "Collecte prévue" ||
          pressing.statut === "En traitement"
      ).length,

      prets: pressings.filter(
        (pressing) => pressing.statut === "Prêt"
      ).length,

      coutTotal,
      montantImpaye,
    };
  }, [pressings]);

  const resultats = useMemo(() => {
    const rechercheNormalisee =
      normaliserTexte(recherche);

    return pressings
      .filter((pressing) => {
        if (
          filtreStatut !== "Tous" &&
          pressing.statut !== filtreStatut
        ) {
          return false;
        }

        if (
          filtreType !== "Tous" &&
          pressing.type !== filtreType
        ) {
          return false;
        }

        if (
          filtreLogement !== "Tous" &&
          pressing.logementId !== filtreLogement
        ) {
          return false;
        }

        if (!rechercheNormalisee) return true;

        const logement = logements.find(
          (item) => item.id === pressing.logementId
        );

        const voyageur = voyageurs.find(
          (item) => item.id === pressing.voyageurId
        );

        const contenu = [
          pressing.type,
          pressing.statut,
          pressing.prestataire,
          pressing.dateCollecte,
          pressing.dateRetour,
          pressing.autresArticles,
          pressing.notes,
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
        const dateA = `${
          a.dateCollecte || "9999-12-31"
        } ${a.heureCollecte || "23:59"}`;

        const dateB = `${
          b.dateCollecte || "9999-12-31"
        } ${b.heureCollecte || "23:59"}`;

        return dateA.localeCompare(dateB);
      });
  }, [
    pressings,
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

  function ouvrirNouveauPressing() {
    setPressingEnCours(creerPressingVide());
    setErreur("");
    setFormulaireOuvert(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function ouvrirModification(pressing: Pressing) {
    setPressingEnCours({ ...pressing });
    setErreur("");
    setFormulaireOuvert(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function fermerFormulaire() {
    setPressingEnCours(creerPressingVide());
    setErreur("");
    setFormulaireOuvert(false);
  }

  function sauvegarderPressing() {
    if (!pressingEnCours.logementId) {
      setErreur("Le logement est obligatoire.");
      return;
    }

    if (!pressingEnCours.dateCollecte) {
      setErreur(
        "La date de collecte est obligatoire."
      );
      return;
    }

    if (!pressingEnCours.heureCollecte) {
      setErreur(
        "L’heure de collecte est obligatoire."
      );
      return;
    }

    if (
      pressingEnCours.dateRetour &&
      pressingEnCours.dateRetour <
        pressingEnCours.dateCollecte
    ) {
      setErreur(
        "La date de retour ne peut pas être antérieure à la date de collecte."
      );
      return;
    }

    if (pressingEnCours.nombreSacs < 1) {
      setErreur(
        "Le nombre de sacs doit être supérieur à zéro."
      );
      return;
    }

    const maintenant = new Date().toISOString();

    setPressings((liste) => {
      const existe = liste.some(
        (pressing) =>
          pressing.id === pressingEnCours.id
      );

      const pressingFinal: Pressing = {
        ...pressingEnCours,
        id:
          pressingEnCours.id ||
          creerIdentifiant(),
        prestataire:
          pressingEnCours.prestataire.trim(),
        nombreSacs: Math.max(
          1,
          Number(
            pressingEnCours.nombreSacs || 1
          )
        ),
        draps: Math.max(
          0,
          Number(pressingEnCours.draps || 0)
        ),
        serviettes: Math.max(
          0,
          Number(
            pressingEnCours.serviettes || 0
          )
        ),
        cout: Math.max(
          0,
          Number(pressingEnCours.cout || 0)
        ),
        autresArticles:
          pressingEnCours.autresArticles.trim(),
        notes: pressingEnCours.notes.trim(),
        createdAt:
          existe && pressingEnCours.createdAt
            ? pressingEnCours.createdAt
            : maintenant,
        updatedAt: maintenant,
      };

      if (existe) {
        return liste.map((pressing) =>
          pressing.id === pressingFinal.id
            ? pressingFinal
            : pressing
        );
      }

      return [pressingFinal, ...liste];
    });

    fermerFormulaire();
  }

  function supprimerPressing(pressing: Pressing) {
    const confirmation = window.confirm(
      `Supprimer définitivement cette prestation prévue le ${pressing.dateCollecte} ?`
    );

    if (!confirmation) return;

    setPressings((liste) =>
      liste.filter(
        (item) => item.id !== pressing.id
      )
    );
  }

  function changerStatut(
    id: string,
    statut: StatutPressing
  ) {
    const maintenant = new Date().toISOString();

    setPressings((liste) =>
      liste.map((pressing) =>
        pressing.id === id
          ? {
              ...pressing,
              statut,
              updatedAt: maintenant,
            }
          : pressing
      )
    );
  }

  function changerPaiement(
    id: string,
    paiementEffectue: boolean
  ) {
    const maintenant = new Date().toISOString();

    setPressings((liste) =>
      liste.map((pressing) =>
        pressing.id === id
          ? {
              ...pressing,
              paiementEffectue,
              updatedAt: maintenant,
            }
          : pressing
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
        titre="Pressing"
        description="Suivez les collectes, le traitement, les retours de linge, les prestataires et les paiements."
        action={
          <button
            type="button"
            onClick={ouvrirNouveauPressing}
            disabled={logements.length === 0}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            + Nouvelle prestation
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
              une prestation de pressing.
            </p>
          </div>
        )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-6">
        <CarteStatistique
          titre="Prestations"
          valeur={String(statistiques.total)}
          couleur="blue"
        />

        <CarteStatistique
          titre="Collectes du jour"
          valeur={String(
            statistiques.collectesAujourdhui
          )}
          couleur="orange"
        />

        <CarteStatistique
          titre="En traitement"
          valeur={String(
            statistiques.enTraitement
          )}
          couleur="blue"
        />

        <CarteStatistique
          titre="Prêtes"
          valeur={String(statistiques.prets)}
          couleur="green"
        />

        <CarteStatistique
          titre="Coût total"
          valeur={formaterPrix(
            statistiques.coutTotal
          )}
          couleur="slate"
        />

        <CarteStatistique
          titre="À régler"
          valeur={formaterPrix(
            statistiques.montantImpaye
          )}
          couleur="red"
        />
      </div>

      {formulaireOuvert && (
        <Section
          titre={
            pressingEnCours.id
              ? "Modifier la prestation"
              : "Nouvelle prestation"
          }
          description="Renseignez les dates, le linge confié, le prestataire et le coût."
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
                value={pressingEnCours.logementId}
                onChange={(event) =>
                  setPressingEnCours({
                    ...pressingEnCours,
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
                value={pressingEnCours.voyageurId}
                onChange={(event) =>
                  setPressingEnCours({
                    ...pressingEnCours,
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
                Type de prestation
              </span>

              <select
                value={pressingEnCours.type}
                onChange={(event) =>
                  setPressingEnCours({
                    ...pressingEnCours,
                    type: event.target
                      .value as TypePressing,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {typesPressing.map((type) => (
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
                value={pressingEnCours.statut}
                onChange={(event) =>
                  setPressingEnCours({
                    ...pressingEnCours,
                    statut: event.target
                      .value as StatutPressing,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {statutsPressing.map((statut) => (
                  <option key={statut} value={statut}>
                    {statut}
                  </option>
                ))}
              </select>
            </label>

            <Champ
              label="Date de collecte"
              type="date"
              value={pressingEnCours.dateCollecte}
              onChange={(valeur) =>
                setPressingEnCours({
                  ...pressingEnCours,
                  dateCollecte: valeur,
                })
              }
            />

            <Champ
              label="Heure de collecte"
              type="time"
              value={pressingEnCours.heureCollecte}
              onChange={(valeur) =>
                setPressingEnCours({
                  ...pressingEnCours,
                  heureCollecte: valeur,
                })
              }
            />

            <Champ
              label="Date de retour prévue"
              type="date"
              value={pressingEnCours.dateRetour}
              onChange={(valeur) =>
                setPressingEnCours({
                  ...pressingEnCours,
                  dateRetour: valeur,
                })
              }
            />

            <Champ
              label="Heure de retour"
              type="time"
              value={pressingEnCours.heureRetour}
              onChange={(valeur) =>
                setPressingEnCours({
                  ...pressingEnCours,
                  heureRetour: valeur,
                })
              }
            />

            <Champ
              label="Prestataire"
              value={pressingEnCours.prestataire}
              placeholder="Nom de la blanchisserie"
              onChange={(valeur) =>
                setPressingEnCours({
                  ...pressingEnCours,
                  prestataire: valeur,
                })
              }
            />

            <ChampNombre
              label="Nombre de sacs"
              value={pressingEnCours.nombreSacs}
              min={1}
              step={1}
              onChange={(valeur) =>
                setPressingEnCours({
                  ...pressingEnCours,
                  nombreSacs: valeur,
                })
              }
            />

            <ChampNombre
              label="Nombre de draps"
              value={pressingEnCours.draps}
              min={0}
              step={1}
              onChange={(valeur) =>
                setPressingEnCours({
                  ...pressingEnCours,
                  draps: valeur,
                })
              }
            />

            <ChampNombre
              label="Nombre de serviettes"
              value={pressingEnCours.serviettes}
              min={0}
              step={1}
              onChange={(valeur) =>
                setPressingEnCours({
                  ...pressingEnCours,
                  serviettes: valeur,
                })
              }
            />

            <ChampNombre
              label="Coût prévu"
              value={pressingEnCours.cout}
              min={0}
              step={0.01}
              onChange={(valeur) =>
                setPressingEnCours({
                  ...pressingEnCours,
                  cout: valeur,
                })
              }
            />
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Autres articles
              </span>

              <textarea
                value={
                  pressingEnCours.autresArticles
                }
                onChange={(event) =>
                  setPressingEnCours({
                    ...pressingEnCours,
                    autresArticles:
                      event.target.value,
                  })
                }
                rows={5}
                placeholder="Housses, torchons, tapis de bain, couvertures..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Notes et consignes
              </span>

              <textarea
                value={pressingEnCours.notes}
                onChange={(event) =>
                  setPressingEnCours({
                    ...pressingEnCours,
                    notes: event.target.value,
                  })
                }
                rows={5}
                placeholder="Taches particulières, traitement spécial, urgence, lieu de dépôt..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="mt-6">
            <CaseACocher
              label="Paiement effectué"
              description="La prestation a été réglée au prestataire."
              checked={
                pressingEnCours.paiementEffectue
              }
              onChange={(valeur) =>
                setPressingEnCours({
                  ...pressingEnCours,
                  paiementEffectue: valeur,
                })
              }
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={sauvegarderPressing}
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
        description={`${resultats.length} prestation(s) affichée(s)`}
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
              placeholder="Logement, prestataire, voyageur, linge..."
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <SelectFiltre
            label="Statut"
            value={filtreStatut}
            options={["Tous", ...statutsPressing]}
            onChange={(valeur) =>
              setFiltreStatut(
                valeur as FiltreStatut
              )
            }
          />

          <SelectFiltre
            label="Type"
            value={filtreType}
            options={["Tous", ...typesPressing]}
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
        titre="Suivi du pressing"
        description="Collectes, traitements, retours et règlements."
      >
        {!donneesChargees ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 font-bold text-slate-500">
              Chargement des prestations...
            </p>
          </div>
        ) : resultats.length > 0 ? (
          <div className="grid gap-6 xl:grid-cols-2">
            {resultats.map((pressing) => (
              <CartePressing
                key={pressing.id}
                pressing={pressing}
                logement={nomLogement(
                  pressing.logementId
                )}
                voyageur={nomVoyageur(
                  pressing.voyageurId
                )}
                onModifier={() =>
                  ouvrirModification(pressing)
                }
                onSupprimer={() =>
                  supprimerPressing(pressing)
                }
                onChangerStatut={(statut) =>
                  changerStatut(
                    pressing.id,
                    statut
                  )
                }
                onChangerPaiement={(valeur) =>
                  changerPaiement(
                    pressing.id,
                    valeur
                  )
                }
              />
            ))}
          </div>
        ) : pressings.length === 0 ? (
          <EtatVide
            icone="👕"
            titre="Aucune prestation de pressing"
            texte="Planifiez votre première collecte ou prestation de blanchisserie."
            action={
              logements.length > 0 ? (
                <button
                  type="button"
                  onClick={ouvrirNouveauPressing}
                  className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                >
                  + Planifier une prestation
                </button>
              ) : null
            }
          />
        ) : (
          <EtatVide
            icone="🔎"
            titre="Aucun résultat"
            texte="Aucune prestation ne correspond aux filtres sélectionnés."
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

function CartePressing({
  pressing,
  logement,
  voyageur,
  onModifier,
  onSupprimer,
  onChangerStatut,
  onChangerPaiement,
}: {
  pressing: Pressing;
  logement: string;
  voyageur: string;
  onModifier: () => void;
  onSupprimer: () => void;
  onChangerStatut: (
    statut: StatutPressing
  ) => void;
  onChangerPaiement: (valeur: boolean) => void;
}) {
  const statutClasses: Record<
    StatutPressing,
    string
  > = {
    "À planifier":
      "bg-orange-100 text-orange-700",
    "Collecte prévue":
      "bg-blue-100 text-blue-700",
    "En traitement":
      "bg-violet-100 text-violet-700",
    Prêt: "bg-cyan-100 text-cyan-700",
    Livré:
      "bg-emerald-100 text-emerald-700",
    Annulé: "bg-slate-200 text-slate-500",
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {pressing.type}
          </span>

          <h3 className="mt-4 text-xl font-black text-slate-950">
            {logement}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Collecte le{" "}
            {pressing.dateCollecte ||
              "date non renseignée"}{" "}
            à {pressing.heureCollecte || "--:--"}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${statutClasses[pressing.statut]}`}
        >
          {pressing.statut}
        </span>
      </div>

      <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <Info
          label="Retour prévu"
          value={
            pressing.dateRetour
              ? `${pressing.dateRetour} à ${
                  pressing.heureRetour || "--:--"
                }`
              : "Non renseigné"
          }
        />

        <Info
          label="Prestataire"
          value={
            pressing.prestataire ||
            "Non renseigné"
          }
        />

        <Info
          label="Voyageur"
          value={voyageur}
        />

        <Info
          label="Nombre de sacs"
          value={String(pressing.nombreSacs)}
        />

        <Info
          label="Draps"
          value={String(pressing.draps)}
        />

        <Info
          label="Serviettes"
          value={String(pressing.serviettes)}
        />

        <Info
          label="Coût"
          value={formaterPrix(pressing.cout)}
        />

        <Info
          label="Paiement"
          value={
            pressing.paiementEffectue
              ? "Effectué"
              : "À régler"
          }
        />
      </div>

      {pressing.autresArticles && (
        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            Autres articles
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {pressing.autresArticles}
          </p>
        </div>
      )}

      {pressing.notes && (
        <p className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          {pressing.notes}
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
          value={pressing.statut}
          onChange={(event) =>
            onChangerStatut(
              event.target
                .value as StatutPressing
            )
          }
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-600"
        >
          {statutsPressing.map((statut) => (
            <option key={statut} value={statut}>
              {statut}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() =>
            onChangerPaiement(
              !pressing.paiementEffectue
            )
          }
          className={`rounded-xl border px-4 py-2 text-sm font-bold ${
            pressing.paiementEffectue
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-orange-200 bg-orange-50 text-orange-700"
          }`}
        >
          {pressing.paiementEffectue
            ? "Paiement effectué"
            : "Marquer comme payé"}
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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <span
        className={`inline-flex rounded-2xl border px-3 py-1 text-xs font-bold ${couleurs[couleur]}`}
      >
        {titre}
      </span>

      <p className="mt-5 break-words text-2xl font-black text-slate-950">
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