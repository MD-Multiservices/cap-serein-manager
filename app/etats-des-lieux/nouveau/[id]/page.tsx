"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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
  adresse: string;
  ville: string;
  codePostal: string;
  proprietaire: string;
  telephone: string;
  email: string;
};

export default function DetailEtatDesLieuxPage() {
  const params = useParams();
  const [etat, setEtat] = useState<EtatDesLieux | null>(null);
  const [logement, setLogement] = useState<Logement | null>(null);

  useEffect(() => {
    const sauvegardeEtats = localStorage.getItem("cap-serein-etats-des-lieux");
    const sauvegardeLogements = localStorage.getItem("cap-serein-logements");

    const etats: EtatDesLieux[] = sauvegardeEtats
      ? JSON.parse(sauvegardeEtats)
      : [];

    const logements: Logement[] = sauvegardeLogements
      ? JSON.parse(sauvegardeLogements)
      : [];

    const etatTrouve = etats.find((item) => item.id === params.id);

    if (etatTrouve) {
      setEtat(etatTrouve);
      setLogement(
        logements.find((item) => item.id === etatTrouve.logementId) || null
      );
    }
  }, [params.id]);

  if (!etat) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">État des lieux introuvable</h1>
        <Link
          href="/etats-des-lieux"
          className="mt-4 inline-block font-semibold text-blue-600"
        >
          Retour aux états des lieux
        </Link>
      </div>
    );
  }

  const photos = etat.photos || {};
  const totalPhotos = Object.values(photos).reduce(
    (total, liste) => total + liste.length,
    0
  );

  return (
    <div className="space-y-8">
      <div className="print:hidden">
        <Link href="/etats-des-lieux" className="font-semibold text-blue-600">
          ← Retour aux états des lieux
        </Link>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-blue-600">
              Rapport d’état des lieux
            </p>

            <h1 className="mt-2 text-4xl font-bold text-slate-900">
              {etat.type}
            </h1>

            <p className="mt-3 text-slate-500">
              {new Date(etat.date).toLocaleString("fr-FR")}
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="print:hidden rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Imprimer / PDF
          </button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Info title="Logement" value={logement?.nom || "Non renseigné"} />
          <Info
            title="Adresse"
            value={
              logement
                ? `${logement.adresse} ${logement.codePostal} ${logement.ville}`
                : "Non renseignée"
            }
          />
          <Info title="Photos" value={`${totalPhotos} photo(s)`} />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Info
            title="Propriétaire"
            value={logement?.proprietaire || "Non renseigné"}
          />
          <Info
            title="Téléphone"
            value={logement?.telephone || "Non renseigné"}
          />
          <Info title="Email" value={logement?.email || "Non renseigné"} />
        </div>
      </div>

      <div className="space-y-6">
        {Object.keys(etat.notes).length === 0 && totalPhotos === 0 && (
          <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow">
            Aucune remarque ni photo enregistrée.
          </div>
        )}

        {Array.from(
          new Set([...Object.keys(etat.notes), ...Object.keys(photos)])
        ).map((piece) => (
          <div key={piece} className="rounded-3xl bg-white p-6 shadow">
            <h2 className="text-2xl font-bold text-slate-900">{piece}</h2>

            {etat.notes[piece] && (
              <div className="mt-4 rounded-2xl bg-slate-50 p-5">
                <p className="whitespace-pre-wrap text-slate-700">
                  {etat.notes[piece]}
                </p>
              </div>
            )}

            {(photos[piece] || []).length > 0 && (
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {photos[piece].map((photo) => (
                  <div
                    key={photo.id}
                    className="overflow-hidden rounded-2xl border bg-slate-50"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.nom}
                      className="h-56 w-full object-cover"
                    />
                    <p className="truncate p-3 text-xs text-slate-500">
                      {photo.nom}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-8 shadow">
        <h2 className="text-2xl font-bold">Signature</h2>
        <div className="mt-5 rounded-2xl border border-dashed p-10 text-center text-slate-400">
          Signature client à ajouter à l’étape suivante.
        </div>
      </div>
    </div>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 font-bold text-slate-900">{value}</p>
    </div>
  );
}