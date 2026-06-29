"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import { lire } from "@/lib/database";

type Logement = {
  id: string;
  nom: string;
  ville: string;
  proprietaire: string;
};

export default function LogementsPage() {
  const [logements, setLogements] = useState<Logement[]>([]);
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    setLogements(lire<Logement>("logements"));
  }, []);

  const resultats = useMemo(() => {
    return logements.filter((logement) => {
      const texte = `${logement.nom} ${logement.ville} ${logement.proprietaire}`.toLowerCase();
      return texte.includes(recherche.toLowerCase());
    });
  }, [logements, recherche]);

  return (
    <div className="space-y-8">
      <PageHeader
        titre="Logements"
        description="Gérez tous les logements de votre conciergerie."
        action={
          <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">
            + Nouveau logement
          </button>
        }
      />

      <Section
        titre="Liste des logements"
        description={`${resultats.length} logement(s) affiché(s)`}
      >
        <div className="mb-6">
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un logement..."
            className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
            <div>Nom</div>
            <div>Ville</div>
            <div>Propriétaire</div>
            <div>Actions</div>
          </div>

          {resultats.length > 0 ? (
            resultats.map((logement) => (
              <div
                key={logement.id}
                className="grid grid-cols-4 items-center border-b border-slate-100 px-6 py-5 transition hover:bg-slate-50"
              >
                <div className="font-bold text-slate-900">
                  {logement.nom || "Sans nom"}
                </div>

                <div className="text-slate-600">
                  {logement.ville || "Non renseignée"}
                </div>

                <div className="text-slate-600">
                  {logement.proprietaire || "Non renseigné"}
                </div>

                <div className="flex gap-2">
                  <button className="rounded-xl bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200">
                    Modifier
                  </button>

                  <button className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100">
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-8 py-16 text-center">
              <div className="text-5xl">🏡</div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Aucun logement enregistré
              </h3>
              <p className="mt-2 text-slate-500">
                Ajoutez votre premier logement pour commencer à gérer votre activité.
              </p>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}