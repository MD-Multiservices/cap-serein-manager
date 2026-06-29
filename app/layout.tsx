import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cap Serein Manager",
  description: "Logiciel de gestion de conciergerie",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="bg-slate-100 text-slate-900 antialiased">
        <div className="flex min-h-screen bg-slate-100">
          <aside className="hidden w-72 flex-col bg-slate-950 text-white lg:flex">
            <div className="border-b border-slate-800 px-8 py-8">
              <h1 className="text-3xl font-black tracking-tight">
                Cap Serein
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-400">
                Manager Alpha 1.0
              </p>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6">
              <ul className="space-y-2">
                {menu.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-blue-600 hover:text-white"
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-slate-800 p-6 text-xs leading-5 text-slate-500">
              <strong className="text-slate-400">Version Alpha</strong>
              <br />
              © 2026 Cap Serein Manager
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
              <div className="flex h-20 items-center justify-between gap-4 px-6 lg:px-8">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    Cap Serein Manager
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Logements · voyageurs · missions · états des lieux ·
                    facturation
                  </p>
                </div>

                <Link
                  href="/logements"
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                >
                  + Nouveau logement
                </Link>
              </div>
            </header>

            <main className="flex-1 bg-slate-100 p-6 lg:p-8">
              <div className="mx-auto w-full max-w-7xl">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}