"use client";

import { ReactNode } from "react";
import Link from "next/link";

type Props = {
  children: ReactNode;
};

const menu = [
  { nom: "Dashboard", lien: "/" },
  { nom: "Logements", lien: "/logements" },
  { nom: "Voyageurs", lien: "/voyageurs" },
  { nom: "Propriétaires", lien: "/proprietaires" },
  { nom: "Planning", lien: "/planning" },
  { nom: "Missions", lien: "/missions" },
  { nom: "États des lieux", lien: "/etats-des-lieux" },
  { nom: "Photos", lien: "/photos" },
  { nom: "Clés", lien: "/cles" },
  { nom: "Ménage", lien: "/menage" },
  { nom: "Pressing", lien: "/pressing" },
  { nom: "Facturation", lien: "/facturation" },
  { nom: "Paramètres", lien: "/parametres" },
];

export default function AppLayout({
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-slate-100">

      <aside className="fixed left-0 top-0 h-screen w-72 overflow-y-auto border-r bg-white">

        <div className="border-b p-6">

          <h1 className="text-2xl font-bold">
            Cap Serein
          </h1>

          <p className="text-sm text-slate-500">
            Manager
          </p>

        </div>

        <nav className="p-4">

          {menu.map((item) => (
            <Link
              key={item.lien}
              href={item.lien}
              className="mb-2 block rounded-xl px-4 py-3 transition hover:bg-blue-50 hover:text-blue-700"
            >
              {item.nom}
            </Link>
          ))}

        </nav>

      </aside>

      <main className="ml-72 p-8">
        {children}
      </main>

    </div>
  );
}