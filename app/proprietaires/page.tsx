"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import { lire, enregistrer } from "@/lib/database";

type Proprietaire = {
  id: string;
  nom: string;
  telephone: string;
  email: string;
  ville: string;
  statut: "Actif" | "Prospect" | "Inactif";
  notes: string;
};

const proprietaireVide: Proprietaire = {
  id: "",
  nom: "",
  telephone: "",
  email: "",
  ville: "",
  statut: "Actif",
  notes: "",
};

export default function ProprietairesPage() {
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>([]);
  const [recherche, setRecherche] = useState("");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [proprietaire, setProprietaire] = useState<Proprietaire>(proprietaireVide);

  useEffect(() => {
    setProprietaires(lire<Proprietaire>("proprietaires"));
  }, []);

  useEffect(() => {
    enregistrer("proprietaires", proprietaires);
  }, [proprietaires]);

  const resultats = useMemo(() => {
    return proprietaires.filter((item) =>
      `${item.nom} ${item.telephone} ${item.email} ${item.ville}`
        .toLowerCase()
        .includes(recherche.toLowerCase())
    );
  }, [proprietaires, recherche]);

  function sauvegarder() {
    if (!proprietaire.nom.trim()) {
      alert("Le nom du propriétaire est obligatoire.");
      return;
    }

    if (proprietaire.id) {
      setProprietaires((liste) =>
        liste.map((item) => (item.id === proprietaire.id ? proprietaire : item))
      );
    } else {
      setProprietaires((liste) => [
        ...liste,
        { ...proprietaire, id: crypto.randomUUID() },
      ]);
    }

    setProprietaire(proprietaireVide);
    setFormulaireOuvert(false);
  }

  function supprimer(id: string) {
    if (!confirm("Supprimer ce propriétaire ?")) return;
    setProprietaires((liste) => liste.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-8">
      <PageHeader
        titre="Propriétaires"
        description="Centralisez les contacts, statuts et notes de vos propriétaires."
        action={
          <button
            onClick={() => {
              setProprietaire(proprietaireVide);
              setFormulaireOuvert(true);
            }}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Nouveau propriétaire
          </button>
        }
      />

      <div className="grid gap-6 md:grid-cols-4">
        <Carte titre="Total" valeur={proprietaires.length} />
        <Carte titre="Actifs" valeur={proprietaires.filter((p) => p.statut === "Actif").length} />
        <Carte titre="Prospects" valeur={proprietaires.filter((p) => p.statut === "Prospect").length} />
        <Carte titre="Inactifs" valeur={proprietaires.filter((p) => p.statut === "Inactif").length} />
      </div>

      {formulaireOuvert && (
        <Section titre={proprietaire.id ? "Modifier le propriétaire" : "Nouveau propriétaire"}>
          <div className="grid gap-4 md:grid-cols-2">
            <Champ label="Nom / Société" value={proprietaire.nom} onChange={(v) => setProprietaire({ ...proprietaire, nom: v })} />
            <Champ label="Téléphone" value={proprietaire.telephone} onChange={(v) => setProprietaire({ ...proprietaire, telephone: v })} />
            <Champ label="Email" value={proprietaire.email} onChange={(v) => setProprietaire({ ...proprietaire, email: v })} />
            <Champ label="Ville" value={proprietaire.ville} onChange={(v) => setProprietaire({ ...proprietaire, ville: v })} />

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">Statut</span>
              <select
                value={proprietaire.statut}
                onChange={(e) =>
                  setProprietaire({
                    ...proprietaire,
                    statut: e.target.value as Proprietaire["statut"],
                  })
                }
                className="w-full rounded-2xl border border-slate-300 px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option>Actif</option>
                <option>Prospect</option>
                <option>Inactif</option>
              </select>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Notes</span>
            <textarea
              value={proprietaire.notes}
              onChange={(e) => setProprietaire({ ...proprietaire, notes: e.target.value })}
              rows={4}
              className="w-full rounded-2xl border border-slate-300 px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <div className="mt-6 flex gap-3">
            <button onClick={sauvegarder} className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700">
              Enregistrer
            </button>
            <button onClick={() => setFormulaireOuvert(false)} className="rounded-2xl border px-5 py-3 font-bold hover:bg-slate-50">
              Annuler
            </button>
          </div>
        </Section>
      )}

      <Section titre="Liste des propriétaires" description={`${resultats.length} propriétaire(s) affiché(s)`}>
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un propriétaire..."
          className="mb-6 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        />

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="grid grid-cols-5 border-b bg-slate-50 px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
            <div>Nom</div>
            <div>Téléphone</div>
            <div>Email</div>
            <div>Statut</div>
            <div>Actions</div>
          </div>

          {resultats.length > 0 ? (
            resultats.map((item) => (
              <div key={item.id} className="grid grid-cols-5 items-center border-b border-slate-100 px-6 py-5 hover:bg-slate-50">
                <div className="font-bold text-slate-900">{item.nom}</div>
                <div className="text-slate-600">{item.telephone || "—"}</div>
                <div className="text-slate-600">{item.email || "—"}</div>
                <div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    {item.statut}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setProprietaire(item); setFormulaireOuvert(true); }} className="rounded-xl bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200">
                    Modifier
                  </button>
                  <button onClick={() => supprimer(item.id)} className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100">
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-8 py-16 text-center">
              <div className="text-5xl">👥</div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">Aucun propriétaire enregistré</h3>
              <p className="mt-2 text-slate-500">Ajoutez votre premier propriétaire pour commencer.</p>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

function Carte({ titre, valeur }: { titre: string; valeur: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold uppercase text-slate-500">{titre}</p>
      <p className="mt-3 text-4xl font-black text-slate-900">{valeur}</p>
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
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}