"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Logement = {
  id: string;
  nom: string;
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

export default function FicheLogementPage() {
  const params = useParams();
  const [logement, setLogement] = useState<Logement | null>(null);

  useEffect(() => {
    const sauvegarde = localStorage.getItem("cap-serein-logements");
    const logements: Logement[] = sauvegarde ? JSON.parse(sauvegarde) : [];
    const trouve = logements.find((item) => item.id === params.id);
    setLogement(trouve || null);
  }, [params.id]);

  if (!logement) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">Logement introuvable</h1>
        <Link href="/logements" className="mt-4 inline-block text-blue-600">
          Retour aux logements
        </Link>
      </div>
    );
  }

  const adresseMaps = encodeURIComponent(
    `${logement.adresse} ${logement.codePostal} ${logement.ville}`
  );

  return (
    <div className="space-y-8">
      <Link href="/logements" className="font-semibold text-blue-600">
        ← Retour aux logements
      </Link>

      <div className="rounded-3xl bg-white p-8 shadow">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-blue-600">
              Fiche logement
            </p>
            <h1 className="mt-2 text-4xl font-bold text-slate-900">
              {logement.nom}
            </h1>
            <p className="mt-3 text-slate-500">
              📍 {logement.adresse} {logement.codePostal} {logement.ville}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${adresseMaps}`}
              target="_blank"
              className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
            >
              Ouvrir Maps
            </a>

            <Link
              href={`/etats-des-lieux/nouveau?logement=${logement.id}`}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Nouvel état des lieux
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <InfoCard title="Propriétaire">
          <Info label="Nom" value={logement.proprietaire} />
          <Info label="Téléphone" value={logement.telephone} />
          <Info label="Email" value={logement.email} />
        </InfoCard>

        <InfoCard title="Accès">
          <Info label="Boîte à clés" value={logement.boiteCles} />
          <Info label="Code boîte" value={logement.codeBoiteCles} />
        </InfoCard>

        <InfoCard title="Wi-Fi">
          <Info label="Réseau" value={logement.wifi} />
          <Info label="Mot de passe" value={logement.motDePasseWifi} />
        </InfoCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow">
          <h2 className="text-2xl font-bold">Actions rapides</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Action title="📷 État des lieux entrant" text="Photos, compteurs, clés et remarques." />
            <Action title="📷 État des lieux sortant" text="Comparaison, dégâts et rapport." />
            <Action title="🧺 Mission ménage" text="Préparer une mission sous-traitant." />
            <Action title="👕 Pressing" text="Draps, serviettes et rotation linge." />
            <Action title="🔧 Travaux à prévoir" text="Créer une intervention MD Multiservices." />
            <Action title="📄 Documents" text="Rapports, factures et historique." />
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow">
          <h2 className="text-2xl font-bold">Observations</h2>
          <p className="mt-4 rounded-2xl bg-slate-50 p-5 text-slate-600">
            {logement.observations || "Aucune observation enregistrée."}
          </p>

          <h2 className="mt-8 text-2xl font-bold">Historique</h2>
          <div className="mt-4 rounded-2xl border border-dashed p-6 text-center text-slate-500">
            Aucun historique pour l’instant.
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-5 space-y-3">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm">
      <span className="font-semibold text-slate-500">{label} : </span>
      <span className="font-medium text-slate-900">
        {value || "Non renseigné"}
      </span>
    </p>
  );
}

function Action({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-5">
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}
