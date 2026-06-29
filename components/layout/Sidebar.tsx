"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { href: "/", icon: "🏠", label: "Tableau de bord" },
  { href: "/logements", icon: "🏡", label: "Logements" },
  { href: "/voyageurs", icon: "🧳", label: "Voyageurs" },
  { href: "/proprietaires", icon: "👥", label: "Propriétaires" },
  { href: "/planning", icon: "📅", label: "Planning" },
  { href: "/missions", icon: "📋", label: "Missions" },
  { href: "/etats-des-lieux", icon: "📷", label: "États des lieux" },
  { href: "/photos", icon: "📸", label: "Photos" },
  { href: "/cles", icon: "🔑", label: "Clés" },
  { href: "/menage", icon: "🧺", label: "Ménage" },
  { href: "/pressing", icon: "👕", label: "Pressing" },
  { href: "/facturation", icon: "💶", label: "Facturation" },
  { href: "/parametres", icon: "⚙️", label: "Paramètres" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 flex-col bg-slate-900 text-white lg:flex">
      <div className="border-b border-slate-800 px-8 py-8">
        <h1 className="text-3xl font-bold">
          Cap Serein
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Manager v1.0
        </p>
      </div>

      <nav className="flex-1 px-4 py-6">

        <ul className="space-y-2">

          {menu.map((item) => {

            const actif =
              pathname === item.href ||
              (item.href !== "/" &&
                pathname.startsWith(item.href));

            return (
              <li key={item.href}>

                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition

                  ${
                    actif
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="text-xl">
                    {item.icon}
                  </span>

                  <span className="font-medium">
                    {item.label}
                  </span>

                </Link>

              </li>
            );

          })}

        </ul>

      </nav>

      <div className="border-t border-slate-800 p-6 text-xs text-slate-500">
        © 2026

        <br />

        Cap Serein Manager
      </div>
    </aside>
  );
}