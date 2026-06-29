"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PhotoPiece = {
  id: string;
  nom: string;
  dataUrl: string;
};

type EtatDesLieux = {
  id: string;
  logementId: string;
  type: string;
  notes: Record<string, string>;
  photos?: Record<string, PhotoPiece[]>;
  date: string;
};

type Logement = {
  id: string;
  nom: string;
  ville: string;
};

export default function EtatsDesLieuxPage() {
  const [etats, setEtats] = useState<EtatDesLieux[]>([]);
  const [logements, setLogements] = useState<Logement[]>([]);

  useEffect(() => {
    const sauvegardeEtats = localStorage.getItem("cap-serein-etats-des-lieux");
    const sauvegardeLogements = localStorage.getItem("cap-serein-logements");

    setEtats(sauvegardeEtats ? JSON.parse(sauvegardeEtats) : []);
    setLogements(sauvegardeLogements ? JSON.parse(sauvegardeLogements) : []);
  }, []);

  function nomLogement(id: string) {
    const logement = logements.find((item) => item.id === id);
    return logement
      ? `${logement.nom} — ${logement.ville}`
      : "Logement non sélectionné";
  }

  function supprimerEtat(id: string) {
    if (!confirm("Supprimer cet état des lieux ?")) return;

    const nouvelleListe = etats.filter((item) => item.id !== id);
    setEtats(nouvelleListe);
    localStorage.setItem(
      "cap-serein-etats-des-lieux",
      JSON.stringify(nouvelleListe)
    );
  }

  function compterPhotos(etat: EtatDesLieux) {
    const photos = etat.photos || {};
    return Object.values(photos).reduce(
      (total, liste) => total + liste.length,
      0
    );
  }

  function compterNotes(etat: EtatDesLieux) {
    return Object.values(etat.notes || {}).filter(Boolean).length;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            États des lieux
          </h1>
          <p className="mt-2 text-slate-500">
            Retrouvez vos rapports entrants, sortants et contrôles
            intermédiaires.
          </p>
        </div>

        <Link
          href="/etats-des-lieux/nouveau"
          className="rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white hover:bg-blue-700"
        >
          + Nouvel état des lieux
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Stat title="Total rapports" value={String(etats.length)} />
        <Stat
          title="Entrants"
          value={String(etats.filter((item) => item.type === "Entrant").length)}
        />
        <Stat
          title="Sortants"
          value={String(etats.filter((item) => item.type === "Sortant").length)}
        />
        <Stat
          title="Photos"
          value={String(etats.reduce((total, etat) => total + compterPhotos(etat), 0))}
        />
      </div>

      <div className="rounded-3xl bg-white p-6 shadow">
        <h2 className="text-xl font-bold">Rapports enregistrés</h2>

        <div className="mt-6 space-y-4">
          {etats.map((etat) => {
            const nombreNotes = compterNotes(etat);
            const nombrePhotos = compterPhotos(etat);

            return (
              <div
                key={etat.id}
                className="flex flex-col gap-4 rounded-2xl border bg-slate-50 p-5 xl:flex-row xl:items-center xl:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-blue-600">
                    {etat.type}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    {nomLogement(etat.logementId)}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(etat.date).toLocaleString("fr-FR")} ·{" "}
                    {nombreNotes} zone(s) renseignée(s) · {nombrePhotos}{" "}
                    photo(s)
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/etats-des-lieux/${etat.id}`}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                  >
                    Ouvrir
                  </Link>

                  <Link
                    href={`/etats-des-lieux/${etat.id}`}
                    className="rounded-lg border px-4 py-2 hover:bg-white"
                  >
                    PDF
                  </Link>

                  <button
                    onClick={() => supprimerEtat(etat.id)}
                    className="rounded-lg border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}

          {etats.length === 0 && (
            <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
              Aucun état des lieux enregistré pour l’instant.
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