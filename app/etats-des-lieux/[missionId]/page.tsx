"use client";

import Link from "next/link";

export default function EtatDesLieuxMissionPage() {
  return (
    <div className="space-y-8">

      <header>
        <h1 className="text-3xl font-bold">
          État des lieux
        </h1>

        <p className="mt-2 text-slate-500">
          Réalisez l'état des lieux directement depuis votre téléphone.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <ActionCard
          title="📷 Photos"
          description="Prendre les photos du logement."
          href="/photos"
        />

        <ActionCard
          title="✅ Check-list"
          description="Vérifier chaque pièce."
          href="/etats-des-lieux"
        />

        <ActionCard
          title="✍️ Signature"
          description="Faire signer le client."
          href="#"
        />

        <ActionCard
          title="📄 Générer le PDF"
          description="Créer le rapport final."
          href="#"
        />

      </div>

      <div className="rounded-3xl bg-white p-8 shadow">

        <h2 className="text-2xl font-bold">
          Progression
        </h2>

        <div className="mt-6 h-5 overflow-hidden rounded-full bg-slate-200">

          <div
            className="h-full rounded-full bg-green-600"
            style={{ width: "0%" }}
          />

        </div>

        <p className="mt-4 text-sm text-slate-500">
          0 % terminé
        </p>

      </div>

    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl bg-white p-6 shadow transition hover:shadow-lg"
    >
      <h2 className="text-xl font-bold">
        {title}
      </h2>

      <p className="mt-3 text-slate-500">
        {description}
      </p>
    </Link>
  );
}