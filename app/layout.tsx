import type { Metadata, Viewport } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "Cap Serein Manager",
  description:
    "Logiciel de gestion pour conciergerie et locations saisonnières.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const menu = [
  {
    href: "/",
    label: "Tableau de bord",
    icone: "🏠",
  },
  {
    href: "/logements",
    label: "Logements",
    icone: "🏡",
  },
  {
    href: "/voyageurs",
    label: "Voyageurs",
    icone: "🧳",
  },
  {
    href: "/proprietaires",
    label: "Propriétaires",
    icone: "👥",
  },
  {
    href: "/planning",
    label: "Planning",
    icone: "🗓️",
  },
  {
    href: "/missions",
    label: "Missions",
    icone: "📋",
  },
  {
    href: "/etats-des-lieux",
    label: "États des lieux",
    icone: "📷",
  },
  {
    href: "/photos",
    label: "Photos",
    icone: "📸",
  },
  {
    href: "/cles",
    label: "Clés",
    icone: "🔑",
  },
  {
    href: "/menage",
    label: "Ménage",
    icone: "🧹",
  },
  {
    href: "/pressing",
    label: "Pressing",
    icone: "👕",
  },
  {
    href: "/facturation",
    label: "Facturation",
    icone: "💶",
  },
  {
    href: "/parametres",
    label: "Paramètres",
    icone: "⚙️",
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen bg-slate-100 lg:flex">
          <aside className="border-b border-slate-800 bg-slate-950 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-800 px-7 py-7">
              <Link href="/" className="block">
                <div className="text-2xl font-black tracking-tight">
                  Cap Serein
                </div>

                <div className="mt-2 text-xs font-semibold text-slate-400">
                  Manager Alpha 1.0
                </div>
              </Link>
            </div>

            <nav className="grid gap-1 px-4 py-5 sm:grid-cols-2 lg:block lg:space-y-1">
              {menu.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-800 hover:text-white"
                >
                  <span className="flex h-7 w-7 items-center justify-center">
                    {item.icone}
                  </span>

                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="border-t border-slate-800 px-7 py-5 text-xs text-slate-500 lg:absolute lg:inset-x-0 lg:bottom-0">
              <p className="font-bold text-slate-400">
                Version Alpha
              </p>

              <p className="mt-2">
                © 2026 Cap Serein Manager
              </p>
            </div>
          </aside>

          <div className="min-w-0 flex-1 lg:ml-64">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
              <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-5 px-5 py-4 sm:px-7 lg:px-10">
                <div className="min-w-0">
                  <Link
                    href="/"
                    className="block truncate text-xl font-black text-slate-950"
                  >
                    Cap Serein Manager
                  </Link>

                  <p className="mt-1 hidden truncate text-xs font-medium text-slate-500 sm:block">
                    Logements · voyageurs · missions · états des lieux · facturation
                  </p>
                </div>

                <Link
                  href="/logements#nouveau-logement"
                  className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200"
                >
                  <span className="mr-2 text-lg leading-none">
                    +
                  </span>

                  Nouveau logement
                </Link>
              </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}