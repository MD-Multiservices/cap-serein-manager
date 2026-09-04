"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

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

export default function AppShell({
  children,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [deconnexion, setDeconnexion] = useState(false);

  async function seDeconnecter() {
    setDeconnexion(true);

    await supabase.auth.signOut();

    router.replace("/connexion");
    router.refresh();

    setDeconnexion(false);
  }

  // La page de connexion doit apparaître seule,
  // sans menu ni interface Cap Serein.
  if (pathname === "/connexion") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100">

      <aside className="fixed left-0 top-0 flex h-screen w-72 flex-col border-r bg-white">

        <div className="border-b p-6">
          <h1 className="text-2xl font-bold">
            Cap Serein
          </h1>

          <p className="text-sm text-slate-500">
            Manager
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">

          {menu.map((item) => {
            const actif =
              pathname === item.lien ||
              (
                item.lien !== "/" &&
                pathname.startsWith(`${item.lien}/`)
              );

            return (
              <Link
                key={item.lien}
                href={item.lien}
                className={`mb-2 block rounded-xl px-4 py-3 transition ${
                  actif
                    ? "bg-blue-50 font-medium text-blue-700"
                    : "hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                {item.nom}
              </Link>
            );
          })}

        </nav>

        <div className="border-t p-4">

          <button
            type="button"
            onClick={seDeconnecter}
            disabled={deconnexion}
            className="w-full rounded-xl border border-red-200 px-4 py-3 text-left font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deconnexion
              ? "Déconnexion..."
              : "Se déconnecter"}
          </button>

        </div>

      </aside>

      <main className="ml-72 p-8">
        {children}
      </main>

    </div>
  );
}