"use client";

import { useEffect, useMemo, useState } from "react";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";

import { enregistrer, lire } from "@/lib/database";
import {
  creerNumeroFacture,
  formaterPrix,
  resteAPayer,
  totalHT,
  totalTVA,
} from "@/lib/facture";

import type {
  Facture,
  LigneFacture,
  StatutFacture,
  TypeDocument,
} from "@/types/facture";

type Proprietaire = {
  id: string;
  nom: string;
};

type Logement = {
  id: string;
  nom: string;
  ville?: string;
};

type Voyageur = {
  id: string;
  prenom: string;
  nom: string;
};

type FiltreType = "Tous" | TypeDocument;
type FiltreStatut = "Tous" | StatutFacture;

const typesDocument: TypeDocument[] = [
  "Devis",
  "Facture",
  "Acompte",
  "Avoir",
];

const statutsFacture: StatutFacture[] = [
  "Brouillon",
  "Envoyée",
  "Payée",
  "En retard",
  "Annulée",
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

function dateEcheanceParDefaut(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);

  return dateLocaleISO(date);
}

function creerLigneVide(): LigneFacture {
  return {
    id: creerIdentifiant("ligne"),
    designation: "",
    quantite: 1,
    prixUnitaire: 0,
    tva: 20,
  };
}

function creerFactureVide(): Facture {
  const maintenant = new Date().toISOString();

  return {
    id: "",
    numero: creerNumeroFacture(),
    type: "Facture",
    proprietaireId: "",
    logementId: "",
    voyageurId: "",
    date: dateLocaleISO(),
    echeance: dateEcheanceParDefaut(),
    lignes: [creerLigneVide()],
    remise: 0,
    acompte: 0,
    statut: "Brouillon",
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

function totalDocument(facture: Facture): number {
  return Math.max(
    0,
    totalHT(facture.lignes) +
      totalTVA(facture.lignes) -
      facture.remise
  );
}

export default function FacturationPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>([]);
  const [logements, setLogements] = useState<Logement[]>([]);
  const [voyageurs, setVoyageurs] = useState<Voyageur[]>([]);

  const [factureEnCours, setFactureEnCours] =
    useState<Facture>(creerFactureVide());

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [donneesChargees, setDonneesChargees] = useState(false);
  const [erreur, setErreur] = useState("");

  const [recherche, setRecherche] = useState("");
  const [filtreType, setFiltreType] = useState<FiltreType>("Tous");
  const [filtreStatut, setFiltreStatut] =
    useState<FiltreStatut>("Tous");

  useEffect(() => {
    const facturesEnregistrees = lire<Facture>("factures").map(
      (facture) => ({
        ...facture,
        lignes: Array.isArray(facture.lignes)
          ? facture.lignes
          : [],
        remise: Number(facture.remise || 0),
        acompte: Number(facture.acompte || 0),
      })
    );

    setFactures(facturesEnregistrees);
    setProprietaires(lire<Proprietaire>("proprietaires"));
    setLogements(lire<Logement>("logements"));
    setVoyageurs(lire<Voyageur>("voyageurs"));
    setDonneesChargees(true);
  }, []);

  useEffect(() => {
    if (!donneesChargees) return;

    enregistrer("factures", factures);
  }, [factures, donneesChargees]);

  const statistiques = useMemo(() => {
    const maintenant = new Date();
    const moisActuel = maintenant.getMonth();
    const anneeActuelle = maintenant.getFullYear();

    const payeesCeMois = factures.filter((facture) => {
      if (facture.statut !== "Payée" || !facture.date) {
        return false;
      }

      const dateFacture = new Date(`${facture.date}T12:00:00`);

      return (
        dateFacture.getMonth() === moisActuel &&
        dateFacture.getFullYear() === anneeActuelle
      );
    });

    const aEncaisser = factures.filter(
      (facture) =>
        facture.statut === "Envoyée" ||
        facture.statut === "En retard"
    );

    return {
      total: factures.length,
      brouillons: factures.filter(
        (facture) => facture.statut === "Brouillon"
      ).length,
      payees: factures.filter(
        (facture) => facture.statut === "Payée"
      ).length,
      enRetard: factures.filter(
        (facture) => facture.statut === "En retard"
      ).length,
      chiffreAffaires: payeesCeMois.reduce(
        (total, facture) => total + totalDocument(facture),
        0
      ),
      resteAEncaisser: aEncaisser.reduce(
        (total, facture) =>
          total + Math.max(0, resteAPayer(facture)),
        0
      ),
    };
  }, [factures]);

  const facturesFiltrees = useMemo(() => {
    const rechercheNormalisee = normaliserTexte(recherche);

    return factures
      .filter((facture) => {
        if (
          filtreType !== "Tous" &&
          facture.type !== filtreType
        ) {
          return false;
        }

        if (
          filtreStatut !== "Tous" &&
          facture.statut !== filtreStatut
        ) {
          return false;
        }

        if (!rechercheNormalisee) return true;

        const proprietaire = proprietaires.find(
          (item) => item.id === facture.proprietaireId
        );

        const logement = logements.find(
          (item) => item.id === facture.logementId
        );

        const voyageur = voyageurs.find(
          (item) => item.id === facture.voyageurId
        );

        const contenu = [
          facture.numero,
          facture.type,
          facture.statut,
          facture.date,
          proprietaire?.nom || "",
          logement?.nom || "",
          logement?.ville || "",
          voyageur?.prenom || "",
          voyageur?.nom || "",
        ]
          .map((valeur) =>
            normaliserTexte(String(valeur || ""))
          )
          .join(" ");

        return contenu.includes(rechercheNormalisee);
      })
      .sort((a, b) => {
        const dateA = a.date || "0000-00-00";
        const dateB = b.date || "0000-00-00";

        return dateB.localeCompare(dateA);
      });
  }, [
    factures,
    filtreType,
    filtreStatut,
    recherche,
    proprietaires,
    logements,
    voyageurs,
  ]);

  function nomProprietaire(id: string): string {
    return (
      proprietaires.find((item) => item.id === id)?.nom ||
      "Non renseigné"
    );
  }

  function nomLogement(id: string): string {
    const logement = logements.find((item) => item.id === id);

    if (!logement) return "Non renseigné";

    return logement.ville
      ? `${logement.nom} — ${logement.ville}`
      : logement.nom;
  }

  function nomVoyageur(id: string): string {
    const voyageur = voyageurs.find((item) => item.id === id);

    if (!voyageur) return "Non renseigné";

    return `${voyageur.prenom} ${voyageur.nom}`.trim();
  }

  function ouvrirNouvelleFacture() {
    setFactureEnCours(creerFactureVide());
    setErreur("");
    setFormulaireOuvert(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function ouvrirModification(facture: Facture) {
    setFactureEnCours({
      ...facture,
      lignes:
        facture.lignes.length > 0
          ? facture.lignes.map((ligne) => ({ ...ligne }))
          : [creerLigneVide()],
    });

    setErreur("");
    setFormulaireOuvert(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fermerFormulaire() {
    setFactureEnCours(creerFactureVide());
    setErreur("");
    setFormulaireOuvert(false);
  }

  function ajouterLigne() {
    setFactureEnCours((facture) => ({
      ...facture,
      lignes: [...facture.lignes, creerLigneVide()],
    }));
  }

  function modifierLigne(
    id: string,
    modification: Partial<LigneFacture>
  ) {
    setFactureEnCours((facture) => ({
      ...facture,
      lignes: facture.lignes.map((ligne) =>
        ligne.id === id
          ? {
              ...ligne,
              ...modification,
            }
          : ligne
      ),
    }));
  }

  function supprimerLigne(id: string) {
    setFactureEnCours((facture) => {
      const lignesRestantes = facture.lignes.filter(
        (ligne) => ligne.id !== id
      );

      return {
        ...facture,
        lignes:
          lignesRestantes.length > 0
            ? lignesRestantes
            : [creerLigneVide()],
      };
    });
  }

  function enregistrerFacture() {
    if (!factureEnCours.numero.trim()) {
      setErreur("Le numéro du document est obligatoire.");
      return;
    }

    if (!factureEnCours.date) {
      setErreur("La date du document est obligatoire.");
      return;
    }

    if (!factureEnCours.proprietaireId) {
      setErreur("Le propriétaire est obligatoire.");
      return;
    }

    const lignesValides = factureEnCours.lignes
      .filter(
        (ligne) =>
          ligne.designation.trim() &&
          ligne.quantite > 0
      )
      .map((ligne) => ({
        ...ligne,
        designation: ligne.designation.trim(),
        quantite: Math.max(0, Number(ligne.quantite || 0)),
        prixUnitaire: Math.max(
          0,
          Number(ligne.prixUnitaire || 0)
        ),
        tva: Math.max(0, Number(ligne.tva || 0)),
      }));

    if (lignesValides.length === 0) {
      setErreur(
        "Ajoutez au minimum une prestation avec une désignation."
      );
      return;
    }

    const maintenant = new Date().toISOString();

    setFactures((liste) => {
      const existe = liste.some(
        (facture) => facture.id === factureEnCours.id
      );

      const factureFinale: Facture = {
        ...factureEnCours,
        id:
          factureEnCours.id ||
          creerIdentifiant("facture"),
        numero: factureEnCours.numero.trim(),
        lignes: lignesValides,
        remise: Math.max(
          0,
          Number(factureEnCours.remise || 0)
        ),
        acompte: Math.max(
          0,
          Number(factureEnCours.acompte || 0)
        ),
        notes: factureEnCours.notes.trim(),
        createdAt:
          existe && factureEnCours.createdAt
            ? factureEnCours.createdAt
            : maintenant,
        updatedAt: maintenant,
      };

      if (existe) {
        return liste.map((facture) =>
          facture.id === factureFinale.id
            ? factureFinale
            : facture
        );
      }

      return [factureFinale, ...liste];
    });

    fermerFormulaire();
  }

  function supprimerFacture(facture: Facture) {
    const confirmation = window.confirm(
      `Supprimer définitivement ${facture.type.toLowerCase()} ${facture.numero} ?`
    );

    if (!confirmation) return;

    setFactures((liste) =>
      liste.filter((item) => item.id !== facture.id)
    );
  }

  function changerStatut(
    id: string,
    statut: StatutFacture
  ) {
    const maintenant = new Date().toISOString();

    setFactures((liste) =>
      liste.map((facture) =>
        facture.id === id
          ? {
              ...facture,
              statut,
              updatedAt: maintenant,
            }
          : facture
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

  const montantHT = totalHT(factureEnCours.lignes);
  const montantTVA = totalTVA(factureEnCours.lignes);
  const montantTotal = totalDocument(factureEnCours);
  const montantRestant = Math.max(
    0,
    resteAPayer(factureEnCours)
  );

  return (
    <div className="space-y-8">
      <PageHeader
        titre="Facturation"
        description="Créez et suivez vos devis, factures, acomptes, règlements et échéances."
        action={
          <button
            type="button"
            onClick={ouvrirNouvelleFacture}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
          >
            + Nouveau document
          </button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-6">
        <CarteStatistique
          titre="Documents"
          valeur={String(statistiques.total)}
          couleur="blue"
        />

        <CarteStatistique
          titre="Brouillons"
          valeur={String(statistiques.brouillons)}
          couleur="slate"
        />

        <CarteStatistique
          titre="Payées"
          valeur={String(statistiques.payees)}
          couleur="green"
        />

        <CarteStatistique
          titre="En retard"
          valeur={String(statistiques.enRetard)}
          couleur="red"
        />

        <CarteStatistique
          titre="CA du mois"
          valeur={formaterPrix(
            statistiques.chiffreAffaires
          )}
          couleur="blue"
        />

        <CarteStatistique
          titre="À encaisser"
          valeur={formaterPrix(
            statistiques.resteAEncaisser
          )}
          couleur="orange"
        />
      </div>

      {formulaireOuvert && (
        <Section
          titre={
            factureEnCours.id
              ? "Modifier le document"
              : "Nouveau document"
          }
          description="Renseignez le client, les prestations et les conditions de règlement."
        >
          {erreur && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              {erreur}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Champ
              label="Numéro"
              value={factureEnCours.numero}
              onChange={(valeur) =>
                setFactureEnCours({
                  ...factureEnCours,
                  numero: valeur,
                })
              }
            />

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Type de document
              </span>

              <select
                value={factureEnCours.type}
                onChange={(event) =>
                  setFactureEnCours({
                    ...factureEnCours,
                    type: event.target
                      .value as TypeDocument,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {typesDocument.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <Champ
              label="Date"
              type="date"
              value={factureEnCours.date}
              onChange={(valeur) =>
                setFactureEnCours({
                  ...factureEnCours,
                  date: valeur,
                })
              }
            />

            <Champ
              label="Échéance"
              type="date"
              value={factureEnCours.echeance}
              onChange={(valeur) =>
                setFactureEnCours({
                  ...factureEnCours,
                  echeance: valeur,
                })
              }
            />

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Propriétaire
              </span>

              <select
                value={factureEnCours.proprietaireId}
                onChange={(event) =>
                  setFactureEnCours({
                    ...factureEnCours,
                    proprietaireId: event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">
                  Sélectionner un propriétaire
                </option>

                {proprietaires.map((proprietaire) => (
                  <option
                    key={proprietaire.id}
                    value={proprietaire.id}
                  >
                    {proprietaire.nom}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Logement
              </span>

              <select
                value={factureEnCours.logementId}
                onChange={(event) =>
                  setFactureEnCours({
                    ...factureEnCours,
                    logementId: event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Aucun logement</option>

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
                value={factureEnCours.voyageurId}
                onChange={(event) =>
                  setFactureEnCours({
                    ...factureEnCours,
                    voyageurId: event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Aucun voyageur</option>

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
                Statut
              </span>

              <select
                value={factureEnCours.statut}
                onChange={(event) =>
                  setFactureEnCours({
                    ...factureEnCours,
                    statut: event.target
                      .value as StatutFacture,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {statutsFacture.map((statut) => (
                  <option key={statut} value={statut}>
                    {statut}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Prestations
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Ajoutez les lignes facturées au client.
                </p>
              </div>

              <button
                type="button"
                onClick={ajouterLigne}
                className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
              >
                + Ajouter une ligne
              </button>
            </div>

            <div className="space-y-4 p-5">
              {factureEnCours.lignes.map(
                (ligne, index) => (
                  <div
                    key={ligne.id}
                    className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[minmax(240px,1fr)_120px_160px_120px_120px]"
                  >
                    <Champ
                      label={`Désignation ${index + 1}`}
                      value={ligne.designation}
                      onChange={(valeur) =>
                        modifierLigne(ligne.id, {
                          designation: valeur,
                        })
                      }
                    />

                    <ChampNombre
                      label="Quantité"
                      value={ligne.quantite}
                      min={0}
                      step={1}
                      onChange={(valeur) =>
                        modifierLigne(ligne.id, {
                          quantite: valeur,
                        })
                      }
                    />

                    <ChampNombre
                      label="Prix unitaire"
                      value={ligne.prixUnitaire}
                      min={0}
                      step={0.01}
                      onChange={(valeur) =>
                        modifierLigne(ligne.id, {
                          prixUnitaire: valeur,
                        })
                      }
                    />

                    <ChampNombre
                      label="TVA %"
                      value={ligne.tva}
                      min={0}
                      step={0.1}
                      onChange={(valeur) =>
                        modifierLigne(ligne.id, {
                          tva: valeur,
                        })
                      }
                    />

                    <div>
                      <span className="mb-2 block text-sm font-bold text-slate-700">
                        Actions
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          supprimerLigne(ligne.id)
                        }
                        className="min-h-12 w-full rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-bold text-red-700 hover:bg-red-100"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Notes et conditions
                </span>

                <textarea
                  value={factureEnCours.notes}
                  onChange={(event) =>
                    setFactureEnCours({
                      ...factureEnCours,
                      notes: event.target.value,
                    })
                  }
                  rows={7}
                  placeholder="Modalités de paiement, informations utiles, remerciements..."
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <ChampNombre
                  label="Remise en euros"
                  value={factureEnCours.remise}
                  min={0}
                  step={0.01}
                  onChange={(valeur) =>
                    setFactureEnCours({
                      ...factureEnCours,
                      remise: valeur,
                    })
                  }
                />

                <ChampNombre
                  label="Acompte déjà versé"
                  value={factureEnCours.acompte}
                  min={0}
                  step={0.01}
                  onChange={(valeur) =>
                    setFactureEnCours({
                      ...factureEnCours,
                      acompte: valeur,
                    })
                  }
                />
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-6 text-white">
              <h3 className="text-xl font-black">
                Récapitulatif
              </h3>

              <div className="mt-6 space-y-4 text-sm">
                <LigneTotal
                  label="Total HT"
                  valeur={formaterPrix(montantHT)}
                />

                <LigneTotal
                  label="TVA"
                  valeur={formaterPrix(montantTVA)}
                />

                <LigneTotal
                  label="Remise"
                  valeur={`- ${formaterPrix(
                    factureEnCours.remise
                  )}`}
                />

                <LigneTotal
                  label="Total TTC"
                  valeur={formaterPrix(montantTotal)}
                  important
                />

                <LigneTotal
                  label="Acompte"
                  valeur={`- ${formaterPrix(
                    factureEnCours.acompte
                  )}`}
                />

                <div className="border-t border-slate-700 pt-5">
                  <LigneTotal
                    label="Reste à payer"
                    valeur={formaterPrix(montantRestant)}
                    important
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={enregistrerFacture}
              className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
            >
              Enregistrer le document
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
        description={`${facturesFiltrees.length} document(s) affiché(s)`}
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
              placeholder="Numéro, propriétaire, logement, voyageur..."
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <SelectFiltre
            label="Type"
            value={filtreType}
            options={["Tous", ...typesDocument]}
            onChange={(valeur) =>
              setFiltreType(valeur as FiltreType)
            }
          />

          <SelectFiltre
            label="Statut"
            value={filtreStatut}
            options={["Tous", ...statutsFacture]}
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
        titre="Documents enregistrés"
        description="Suivi de vos devis, factures, acomptes et avoirs."
      >
        {!donneesChargees ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            <p className="mt-4 font-bold text-slate-500">
              Chargement des documents...
            </p>
          </div>
        ) : facturesFiltrees.length > 0 ? (
          <div className="grid gap-6 xl:grid-cols-2">
            {facturesFiltrees.map((facture) => (
              <CarteFacture
                key={facture.id}
                facture={facture}
                proprietaire={nomProprietaire(
                  facture.proprietaireId
                )}
                logement={nomLogement(
                  facture.logementId
                )}
                voyageur={nomVoyageur(
                  facture.voyageurId
                )}
                onModifier={() =>
                  ouvrirModification(facture)
                }
                onSupprimer={() =>
                  supprimerFacture(facture)
                }
                onChangerStatut={(statut) =>
                  changerStatut(facture.id, statut)
                }
              />
            ))}
          </div>
        ) : factures.length === 0 ? (
          <EtatVide
            icone="💶"
            titre="Aucun document enregistré"
            texte="Créez votre premier devis ou votre première facture."
            action={
              <button
                type="button"
                onClick={ouvrirNouvelleFacture}
                className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
              >
                + Créer un document
              </button>
            }
          />
        ) : (
          <EtatVide
            icone="🔎"
            titre="Aucun résultat"
            texte="Aucun document ne correspond aux filtres sélectionnés."
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

function CarteFacture({
  facture,
  proprietaire,
  logement,
  voyageur,
  onModifier,
  onSupprimer,
  onChangerStatut,
}: {
  facture: Facture;
  proprietaire: string;
  logement: string;
  voyageur: string;
  onModifier: () => void;
  onSupprimer: () => void;
  onChangerStatut: (statut: StatutFacture) => void;
}) {
  const statutClasses: Record<StatutFacture, string> = {
    Brouillon: "bg-slate-100 text-slate-700",
    Envoyée: "bg-blue-100 text-blue-700",
    Payée: "bg-emerald-100 text-emerald-700",
    "En retard": "bg-red-100 text-red-700",
    Annulée: "bg-slate-200 text-slate-500",
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
            {facture.type}
          </span>

          <h3 className="mt-4 text-xl font-black text-slate-950">
            {facture.numero}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Émise le {facture.date || "—"} · Échéance{" "}
            {facture.echeance || "—"}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${statutClasses[facture.statut]}`}
        >
          {facture.statut}
        </span>
      </div>

      <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <Info label="Propriétaire" value={proprietaire} />
        <Info label="Logement" value={logement} />
        <Info label="Voyageur" value={voyageur} />
        <Info
          label="Prestations"
          value={`${facture.lignes.length} ligne(s)`}
        />
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-500">
              Total du document
            </p>

            <p className="mt-2 text-2xl font-black text-slate-950">
              {formaterPrix(totalDocument(facture))}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-bold text-slate-500">
              Reste à payer
            </p>

            <p className="mt-2 text-2xl font-black text-blue-700">
              {formaterPrix(
                Math.max(0, resteAPayer(facture))
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onModifier}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
        >
          Modifier
        </button>

        <button
          type="button"
          onClick={() => onChangerStatut("Envoyée")}
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
        >
          Envoyée
        </button>

        <button
          type="button"
          onClick={() => onChangerStatut("Payée")}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
        >
          Payée
        </button>

        <button
          type="button"
          onClick={() => onChangerStatut("En retard")}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
        >
          En retard
        </button>

        <button
          type="button"
          onClick={onSupprimer}
          className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
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
  couleur: "blue" | "green" | "orange" | "red" | "slate";
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
        className={`inline-flex rounded-xl border px-3 py-1 text-xs font-bold ${couleurs[couleur]}`}
      >
        {titre}
      </span>

      <p className="mt-4 break-words text-2xl font-black text-slate-950">
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
          onChange(Number(event.target.value || 0))
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

function LigneTotal({
  label,
  valeur,
  important = false,
}: {
  label: string;
  valeur: string;
  important?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        important ? "text-lg" : ""
      }`}
    >
      <span
        className={
          important
            ? "font-black text-white"
            : "text-slate-400"
        }
      >
        {label}
      </span>

      <strong>{valeur}</strong>
    </div>
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
      <span className="text-slate-600">{value}</span>
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