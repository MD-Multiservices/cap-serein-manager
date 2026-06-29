"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";

type Parametres = {
  nomEntreprise: string;
  responsable: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  siret: string;
  devise: string;
  tauxTVA: number;
  delaiPaiement: number;
  prefixeFacture: string;
  notesFacture: string;
};

type Sauvegarde = {
  application: string;
  version: number;
  dateExport: string;
  parametres: Parametres;
  donnees: Record<string, unknown>;
};

const CLE_PARAMETRES = "cap-serein-parametres";

const CLES_DONNEES = [
  "cap-serein-logements",
  "cap-serein-voyageurs",
  "cap-serein-proprietaires",
  "cap-serein-missions",
  "cap-serein-factures",
  "cap-serein-etats-des-lieux",
  "cap-serein-cles",
  "cap-serein-menages",
  "cap-serein-pressings",
  "cap-serein-photos",
];

const parametresParDefaut: Parametres = {
  nomEntreprise: "Cap Serein",
  responsable: "",
  email: "",
  telephone: "",
  adresse: "",
  codePostal: "",
  ville: "La Seyne-sur-Mer",
  siret: "",
  devise: "EUR",
  tauxTVA: 20,
  delaiPaiement: 30,
  prefixeFacture: "FAC",
  notesFacture:
    "Merci pour votre confiance. Paiement à effectuer à réception de la facture.",
};

function lireParametres(): Parametres {
  if (typeof window === "undefined") {
    return parametresParDefaut;
  }

  try {
    const contenu =
      window.localStorage.getItem(CLE_PARAMETRES);

    if (!contenu) {
      return parametresParDefaut;
    }

    const donnees = JSON.parse(
      contenu
    ) as Partial<Parametres>;

    return {
      ...parametresParDefaut,
      ...donnees,
      tauxTVA: Number(
        donnees.tauxTVA ??
          parametresParDefaut.tauxTVA
      ),
      delaiPaiement: Number(
        donnees.delaiPaiement ??
          parametresParDefaut.delaiPaiement
      ),
    };
  } catch {
    return parametresParDefaut;
  }
}

function formaterDateFichier(): string {
  const date = new Date();

  const annee = date.getFullYear();
  const mois = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const jour = String(
    date.getDate()
  ).padStart(2, "0");
  const heures = String(
    date.getHours()
  ).padStart(2, "0");
  const minutes = String(
    date.getMinutes()
  ).padStart(2, "0");

  return `${annee}-${mois}-${jour}_${heures}-${minutes}`;
}

export default function ParametresPage() {
  const [parametres, setParametres] =
    useState<Parametres>(
      parametresParDefaut
    );

  const [donneesChargees, setDonneesChargees] =
    useState(false);

  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    setParametres(lireParametres());
    setDonneesChargees(true);
  }, []);

  function afficherMessage(texte: string) {
    setMessage(texte);
    setErreur("");

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  function afficherErreur(texte: string) {
    setErreur(texte);
    setMessage("");
  }

  function enregistrerParametres() {
    if (!parametres.nomEntreprise.trim()) {
      afficherErreur(
        "Le nom de l’entreprise est obligatoire."
      );
      return;
    }

    if (
      parametres.email &&
      !parametres.email.includes("@")
    ) {
      afficherErreur(
        "L’adresse e-mail semble incorrecte."
      );
      return;
    }

    const parametresFinaux: Parametres = {
      ...parametres,
      nomEntreprise:
        parametres.nomEntreprise.trim(),
      responsable:
        parametres.responsable.trim(),
      email: parametres.email.trim(),
      telephone:
        parametres.telephone.trim(),
      adresse: parametres.adresse.trim(),
      codePostal:
        parametres.codePostal.trim(),
      ville: parametres.ville.trim(),
      siret: parametres.siret.trim(),
      prefixeFacture:
        parametres.prefixeFacture
          .trim()
          .toUpperCase(),
      tauxTVA: Math.max(
        0,
        Number(parametres.tauxTVA || 0)
      ),
      delaiPaiement: Math.max(
        0,
        Number(
          parametres.delaiPaiement || 0
        )
      ),
      notesFacture:
        parametres.notesFacture.trim(),
    };

    try {
      window.localStorage.setItem(
        CLE_PARAMETRES,
        JSON.stringify(parametresFinaux)
      );

      setParametres(parametresFinaux);

      afficherMessage(
        "Les paramètres ont bien été enregistrés."
      );
    } catch {
      afficherErreur(
        "Impossible d’enregistrer les paramètres."
      );
    }
  }

  function exporterDonnees() {
    const donnees: Record<string, unknown> = {};

    for (const cle of CLES_DONNEES) {
      const contenu =
        window.localStorage.getItem(cle);

      if (!contenu) {
        donnees[cle] = [];
        continue;
      }

      try {
        donnees[cle] = JSON.parse(contenu);
      } catch {
        donnees[cle] = contenu;
      }
    }

    const sauvegarde: Sauvegarde = {
      application: "Cap Serein Manager",
      version: 1,
      dateExport: new Date().toISOString(),
      parametres,
      donnees,
    };

    const fichier = new Blob(
      [
        JSON.stringify(
          sauvegarde,
          null,
          2
        ),
      ],
      {
        type: "application/json",
      }
    );

    const url =
      window.URL.createObjectURL(fichier);

    const lien =
      document.createElement("a");

    lien.href = url;
    lien.download = `cap-serein-sauvegarde-${formaterDateFichier()}.json`;

    document.body.appendChild(lien);
    lien.click();
    lien.remove();

    window.URL.revokeObjectURL(url);

    afficherMessage(
      "La sauvegarde a été exportée."
    );
  }

  async function importerDonnees(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const fichier = event.target.files?.[0];

    event.target.value = "";

    if (!fichier) return;

    const confirmation = window.confirm(
      "La restauration remplacera les données actuellement enregistrées. Continuer ?"
    );

    if (!confirmation) return;

    try {
      const contenu = await fichier.text();

      const sauvegarde = JSON.parse(
        contenu
      ) as Partial<Sauvegarde>;

      if (
        sauvegarde.application !==
          "Cap Serein Manager" ||
        !sauvegarde.donnees ||
        typeof sauvegarde.donnees !==
          "object"
      ) {
        afficherErreur(
          "Ce fichier n’est pas une sauvegarde valide de Cap Serein Manager."
        );
        return;
      }

      for (const cle of CLES_DONNEES) {
        const valeur =
          sauvegarde.donnees[cle];

        if (valeur === undefined) {
          continue;
        }

        window.localStorage.setItem(
          cle,
          JSON.stringify(valeur)
        );
      }

      if (sauvegarde.parametres) {
        const parametresRestaures = {
          ...parametresParDefaut,
          ...sauvegarde.parametres,
        };

        window.localStorage.setItem(
          CLE_PARAMETRES,
          JSON.stringify(
            parametresRestaures
          )
        );

        setParametres(
          parametresRestaures
        );
      }

      afficherMessage(
        "La sauvegarde a été restaurée. La page va être actualisée."
      );

      window.setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch {
      afficherErreur(
        "Le fichier sélectionné est illisible ou endommagé."
      );
    }
  }

  function reinitialiserParametres() {
    const confirmation = window.confirm(
      "Réinitialiser uniquement les paramètres de l’entreprise ? Les logements, voyageurs et autres données seront conservés."
    );

    if (!confirmation) return;

    window.localStorage.setItem(
      CLE_PARAMETRES,
      JSON.stringify(
        parametresParDefaut
      )
    );

    setParametres(
      parametresParDefaut
    );

    afficherMessage(
      "Les paramètres ont été réinitialisés."
    );
  }

  function supprimerToutesLesDonnees() {
    const premiereConfirmation =
      window.confirm(
        "Cette action supprimera définitivement les logements, voyageurs, missions, factures, photos et toutes les autres données. Continuer ?"
      );

    if (!premiereConfirmation) return;

    const texte = window.prompt(
      "Pour confirmer, écrivez exactement : SUPPRIMER"
    );

    if (texte !== "SUPPRIMER") {
      afficherErreur(
        "Suppression annulée : le texte de confirmation est incorrect."
      );
      return;
    }

    for (const cle of CLES_DONNEES) {
      window.localStorage.removeItem(cle);
    }

    window.localStorage.removeItem(
      "cap-serein-menage"
    );

    window.localStorage.removeItem(
      "cap-serein-pressing"
    );

    afficherMessage(
      "Toutes les données ont été supprimées. La page va être actualisée."
    );

    window.setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  }

  if (!donneesChargees) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

        <p className="mt-4 font-bold text-slate-500">
          Chargement des paramètres...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        titre="Paramètres"
        description="Configurez les informations de votre entreprise et gérez la sauvegarde de vos données."
        action={
          <button
            type="button"
            onClick={enregistrerParametres}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            Enregistrer
          </button>
        }
      />

      {message && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-700">
          {message}
        </div>
      )}

      {erreur && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700">
          {erreur}
        </div>
      )}

      <Section
        titre="Informations de l’entreprise"
        description="Ces informations pourront être utilisées dans vos documents et factures."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Champ
            label="Nom de l’entreprise"
            value={parametres.nomEntreprise}
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                nomEntreprise: valeur,
              })
            }
          />

          <Champ
            label="Responsable"
            value={parametres.responsable}
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                responsable: valeur,
              })
            }
          />

          <Champ
            label="SIRET"
            value={parametres.siret}
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                siret: valeur,
              })
            }
          />

          <Champ
            label="Adresse e-mail"
            type="email"
            value={parametres.email}
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                email: valeur,
              })
            }
          />

          <Champ
            label="Téléphone"
            type="tel"
            value={parametres.telephone}
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                telephone: valeur,
              })
            }
          />

          <Champ
            label="Adresse"
            value={parametres.adresse}
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                adresse: valeur,
              })
            }
          />

          <Champ
            label="Code postal"
            value={parametres.codePostal}
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                codePostal: valeur,
              })
            }
          />

          <Champ
            label="Ville"
            value={parametres.ville}
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                ville: valeur,
              })
            }
          />
        </div>
      </Section>

      <Section
        titre="Facturation"
        description="Définissez les valeurs utilisées par défaut lors de la création de vos documents."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Devise
            </span>

            <select
              value={parametres.devise}
              onChange={(event) =>
                setParametres({
                  ...parametres,
                  devise:
                    event.target.value,
                })
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            >
              <option value="EUR">
                Euro — EUR
              </option>

              <option value="CHF">
                Franc suisse — CHF
              </option>

              <option value="USD">
                Dollar américain — USD
              </option>

              <option value="GBP">
                Livre sterling — GBP
              </option>
            </select>
          </label>

          <ChampNombre
            label="TVA par défaut"
            value={parametres.tauxTVA}
            min={0}
            step={0.1}
            suffixe="%"
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                tauxTVA: valeur,
              })
            }
          />

          <ChampNombre
            label="Délai de paiement"
            value={
              parametres.delaiPaiement
            }
            min={0}
            step={1}
            suffixe="jours"
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                delaiPaiement: valeur,
              })
            }
          />

          <Champ
            label="Préfixe des factures"
            value={
              parametres.prefixeFacture
            }
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                prefixeFacture: valeur,
              })
            }
          />
        </div>

        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Notes affichées sur les factures
          </span>

          <textarea
            value={
              parametres.notesFacture
            }
            onChange={(event) =>
              setParametres({
                ...parametres,
                notesFacture:
                  event.target.value,
              })
            }
            rows={5}
            className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={enregistrerParametres}
            className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
          >
            Enregistrer les paramètres
          </button>

          <button
            type="button"
            onClick={
              reinitialiserParametres
            }
            className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 hover:bg-slate-50"
          >
            Réinitialiser les paramètres
          </button>
        </div>
      </Section>

      <Section
        titre="Sauvegarde des données"
        description="Conservez régulièrement une copie de vos informations sur votre ordinateur."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
            <div className="text-4xl">
              💾
            </div>

            <h3 className="mt-4 text-xl font-black text-blue-950">
              Exporter une sauvegarde
            </h3>

            <p className="mt-2 text-sm leading-6 text-blue-800">
              Téléchargez un fichier contenant vos logements,
              voyageurs, missions, factures, photos et autres
              données.
            </p>

            <button
              type="button"
              onClick={exporterDonnees}
              className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
            >
              Télécharger la sauvegarde
            </button>
          </div>

          <div className="rounded-3xl border border-violet-200 bg-violet-50 p-6">
            <div className="text-4xl">
              📥
            </div>

            <h3 className="mt-4 text-xl font-black text-violet-950">
              Restaurer une sauvegarde
            </h3>

            <p className="mt-2 text-sm leading-6 text-violet-800">
              Importez un fichier précédemment exporté. Les
              données actuelles seront remplacées.
            </p>

            <label className="mt-6 inline-flex cursor-pointer rounded-2xl bg-violet-600 px-5 py-3 font-bold text-white hover:bg-violet-700">
              Choisir un fichier

              <input
                type="file"
                accept=".json,application/json"
                onChange={importerDonnees}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </Section>

      <Section
        titre="Zone dangereuse"
        description="Ces actions sont irréversibles."
      >
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-xl font-black text-red-950">
            Supprimer toutes les données
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-red-800">
            Cette action supprimera les logements, propriétaires,
            voyageurs, missions, états des lieux, clés, ménages,
            prestations de pressing, factures et photos.
          </p>

          <button
            type="button"
            onClick={
              supprimerToutesLesDonnees
            }
            className="mt-6 rounded-2xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700"
          >
            Supprimer toutes les données
          </button>
        </div>
      </Section>
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
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <div className="flex overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) =>
            onChange(
              Math.max(
                min,
                Number(
                  event.target.value || min
                )
              )
            )
          }
          className="min-w-0 flex-1 bg-transparent px-5 py-3 outline-none"
        />

        <span className="flex items-center border-l border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-500">
          {suffixe}
        </span>
      </div>
    </label>
  );
}