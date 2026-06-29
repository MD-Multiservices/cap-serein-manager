"use client";

import { useEffect, useMemo, useState } from "react";

type Proprietaire = {
  id: string;
  nom: string;
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  codePostal: string;
  iban: string;
  statut: "Actif" | "Prospect" | "Inactif";
  notes: string;
};

const proprietaireVide: Proprietaire = {
  id: "",
  nom: "",
  telephone: "",
  email: "",
  adresse: "",
  ville: "",
  codePostal: "",
  iban: "",
  statut: "Actif",
  notes: "",
};

export default function ProprietairesPage() {
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>([]);
  const [proprietaireEnCours, setProprietaireEnCours] =
    useState<Proprietaire>(proprietaireVide);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("Tous");

  useEffect(() => {
    setProprietaires(
      JSON.parse(localStorage.getItem("cap-serein-proprietaires") || "[]")
    );
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "cap-serein-proprietaires",
      JSON.stringify(proprietaires)
    );
  }, [proprietaires]);

  const proprietairesFiltres = useMemo(() => {
    return proprietaires.filter((proprietaire) => {
      const correspondRecherche = `${proprietaire.nom} ${proprietaire.email} ${proprietaire.telephone} ${proprietaire.ville}`
        .toLowerCase()
        .includes(recherche.toLowerCase());

      const correspondStatut =
        filtre === "Tous" || proprietaire.statut === filtre;

      return correspondRecherche && correspondStatut;
    });
  }, [proprietaires, recherche, filtre]);

  function enregistrerProprietaire() {
    if (!proprietaireEnCours.nom.trim()) {
      alert("Renseigne au minimum le nom du propriétaire.");
      return;
    }

    if (proprietaireEnCours.id) {
      setProprietaires((actuels) =>
        actuels.map((item) =>
          item.id === proprietaireEnCours.id ? proprietaireEnCours : item
        )
      );
    } else {
      setProprietaires((actuels) => [
        ...actuels,
        { ...proprietaireEnCours, id: crypto.randomUUID() },
      ]);
    }

    setProprietaireEnCours(proprietaireVide);
    setFormulaireOuvert(false);
  }

  function modifierProprietaire(proprietaire: Proprietaire) {
    setProprietaireEnCours(proprietaire);
    setFormulaireOuvert(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function supprimerProprietaire(id: string) {
    if (!confirm("Supprimer ce propriétaire ?")) return;
    setProprietaires((actuels) => actuels.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Propriétaires</h1>
          <p className="mt-2 text-slate-500">
            Centralisez les contacts, coordonnées, statuts et notes de vos propriétaires.
          </p>
        </div>

        <button
          onClick={() => {
            setProprietaireEnCours(proprietaireVide);
            setFormulaireOuvert(true);
          }}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          + Nouveau propriétaire
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Stat title="Total" value={String(proprietaires.length)} />
        <Stat
          title="Actifs"
          value={String(proprietaires.filter((p) => p.statut === "Actif").length)}
        />
        <Stat
          title="Prospects"
          value={String(proprietaires.filter((p) => p.statut === "Prospect").length)}
        />
        <Stat
          title="Inactifs"
          value={String(proprietaires.filter((p) => p.statut === "Inactif").length)}
        />
      </div>

      {formulaireOuvert && (
        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {proprietaireEnCours.id
                ? "Modifier le propriétaire"
                : "Nouveau propriétaire"}
            </h2>

            <button
              onClick={() => setFormulaireOuvert(false)}
              className="rounded-xl border px-4 py-2 hover:bg-slate-100"
            >
              Fermer
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Champ
              label="Nom complet / Société"
              value={proprietaireEnCours.nom}
              onChange={(v) =>
                setProprietaireEnCours({ ...proprietaireEnCours, nom: v })
              }
            />

            <Champ
              label="Téléphone"
              value={proprietaireEnCours.telephone}
              onChange={(v) =>
                setProprietaireEnCours({
                  ...proprietaireEnCours,
                  telephone: v,
                })
              }
            />

            <Champ
              label="Email"
              value={proprietaireEnCours.email}
              onChange={(v) =>
                setProprietaireEnCours({ ...proprietaireEnCours, email: v })
              }
            />

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Statut
              </span>
              <select
                value={proprietaireEnCours.statut}
                onChange={(e) =>
                  setProprietaireEnCours({
                    ...proprietaireEnCours,
                    statut: e.target.value as Proprietaire["statut"],
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              >
                <option>Actif</option>
                <option>Prospect</option>
                <option>Inactif</option>
              </select>
            </label>

            <Champ
              label="Adresse"
              value={proprietaireEnCours.adresse}
              onChange={(v) =>
                setProprietaireEnCours({ ...proprietaireEnCours, adresse: v })
              }
            />

            <Champ
              label="Ville"
              value={proprietaireEnCours.ville}
              onChange={(v) =>
                setProprietaireEnCours({ ...proprietaireEnCours, ville: v })
              }
            />

            <Champ
              label="Code postal"
              value={proprietaireEnCours.codePostal}
              onChange={(v) =>
                setProprietaireEnCours({
                  ...proprietaireEnCours,
                  codePostal: v,
                })
              }
            />

            <Champ
              label="IBAN / Infos paiement"
              value={proprietaireEnCours.iban}
              onChange={(v) =>
                setProprietaireEnCours({ ...proprietaireEnCours, iban: v })
              }
            />
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Notes
            </span>
            <textarea
              value={proprietaireEnCours.notes}
              onChange={(e) =>
                setProprietaireEnCours({
                  ...proprietaireEnCours,
                  notes: e.target.value,
                })
              }
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="Ex : préférences, consignes, disponibilité, modalités de paiement..."
            />
          </label>

          <div className="mt-6 flex gap-3">
            <button
              onClick={enregistrerProprietaire}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Enregistrer
            </button>

            <button
              onClick={() => {
                setProprietaireEnCours(proprietaireVide);
                setFormulaireOuvert(false);
              }}
              className="rounded-xl border px-6 py-3 font-semibold hover:bg-slate-100"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-white p-6 shadow">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-bold">Liste des propriétaires</h2>
            <p className="text-sm text-slate-500">
              Contacts et informations utiles.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher..."
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 md:w-72"
            />

            <select
              value={filtre}
              onChange={(e) => setFiltre(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
            >
              <option>Tous</option>
              <option>Actif</option>
              <option>Prospect</option>
              <option>Inactif</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {proprietairesFiltres.map((proprietaire) => (
            <div
              key={proprietaire.id}
              className="rounded-2xl border bg-slate-50 p-5"
            >
              <p className="text-sm font-semibold text-blue-600">
                {proprietaire.statut}
              </p>

              <h3 className="mt-1 text-xl font-bold text-slate-900">
                {proprietaire.nom}
              </h3>

              <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                <p>
                  <strong>Téléphone :</strong>{" "}
                  {proprietaire.telephone || "Non renseigné"}
                </p>
                <p>
                  <strong>Email :</strong>{" "}
                  {proprietaire.email || "Non renseigné"}
                </p>
                <p>
                  <strong>Ville :</strong>{" "}
                  {proprietaire.ville || "Non renseignée"}
                </p>
                <p>
                  <strong>Code postal :</strong>{" "}
                  {proprietaire.codePostal || "Non renseigné"}
                </p>
              </div>

              {proprietaire.adresse && (
                <p className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-600">
                  {proprietaire.adresse}
                </p>
              )}

              {proprietaire.notes && (
                <p className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-600">
                  {proprietaire.notes}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {proprietaire.telephone && (
                  <a
                    href={`tel:${proprietaire.telephone}`}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
                  >
                    Appeler
                  </a>
                )}

                {proprietaire.email && (
                  <a
                    href={`mailto:${proprietaire.email}`}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-white"
                  >
                    Email
                  </a>
                )}

                <button
                  onClick={() => modifierProprietaire(proprietaire)}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                >
                  Modifier
                </button>

                <button
                  onClick={() => supprimerProprietaire(proprietaire.id)}
                  className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}

          {proprietairesFiltres.length === 0 && (
            <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500 xl:col-span-2">
              Aucun propriétaire enregistré.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-3 text-4xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Champ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
      />
    </label>
  );
}