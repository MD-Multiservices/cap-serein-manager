import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cap Serein Manager",
  description: "Logiciel de gestion de conciergerie",
};

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

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="bg-slate-100">
        <div className="flex min-h-screen">
          <aside className="hidden w-72 flex-col bg-slate-900 text-white lg:flex">
            <div className="border-b border-slate-800 px-8 py-8">
              <h1 className="text-3xl font-bold">Cap Serein</h1>
              <p className="mt-2 text-sm text-slate-400">Manager v1.0</p>
            </div>

            <nav className="flex-1 px-4 py-6">
              <ul className="space-y-2">
                {menu.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-200 transition hover:bg-slate-800 hover:text-white"
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-slate-800 p-6 text-xs text-slate-500">
              © 2026
              <br />
              Cap Serein Manager
            </div>
          </aside>

          <div className="flex flex-1 flex-col">
            <header className="border-b bg-white">
              <div className="flex h-20 items-center justify-between px-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Cap Serein Manager
                  </h2>
                  <p className="text-sm text-slate-500">
                    Logements · voyageurs · missions · états des lieux ·
                    facturation
                  </p>
                </div>

                <Link
                  href="/logements"
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  + Nouveau logement
                </Link>
              </div>
            </header>

            <main className="flex-1 p-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}