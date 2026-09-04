"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/lib/supabase";

type ElementMenu = {
  href: string;
  label: string;
  icone: string;
};

const menu: ElementMenu[] = [
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

const navigationMobile: ElementMenu[] = [
  {
    href: "/",
    label: "Accueil",
    icone: "🏠",
  },
  {
    href: "/logements",
    label: "Logements",
    icone: "🏡",
  },
  {
    href: "/etats-des-lieux",
    label: "États",
    icone: "📸",
  },
  {
    href: "/missions",
    label: "Missions",
    icone: "📋",
  },
];

function lienActif(
  pathname: string,
  href: string
): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

function trouverTitre(pathname: string): string {
  const element = menu.find(
    (item) =>
      item.href !== "/" &&
      pathname.startsWith(item.href)
  );

  return element?.label || "Tableau de bord";
}

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [menuMobileOuvert, setMenuMobileOuvert] =
    useState(false);

  const [deconnexionEnCours, setDeconnexionEnCours] =
    useState(false);

  useEffect(() => {
    setMenuMobileOuvert(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuMobileOuvert) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuMobileOuvert]);

  async function seDeconnecter() {
    if (deconnexionEnCours) {
      return;
    }

    setDeconnexionEnCours(true);
    setMenuMobileOuvert(false);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(
        "Erreur pendant la déconnexion :",
        error
      );

      setDeconnexionEnCours(false);
      return;
    }

    router.replace("/connexion");
    router.refresh();
  }

  if (pathname === "/connexion") {
    return <>{children}</>;
  }

  const titrePage = trouverTitre(pathname);

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-800 bg-slate-950 text-white lg:flex">
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

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {menu.map((item) => {
            const actif = lienActif(
              pathname,
              item.href
            );

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  actif ? "page" : undefined
                }
                className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  actif
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/40"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center text-lg">
                  {item.icone}
                </span>

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 px-4 py-4">
          <button
            type="button"
            onClick={seDeconnecter}
            disabled={deconnexionEnCours}
            className="flex min-h-11 w-full items-center justify-center rounded-2xl border border-red-900/60 bg-red-950/30 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-950/60 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deconnexionEnCours
              ? "Déconnexion..."
              : "Se déconnecter"}
          </button>

          <div className="px-3 pt-4 text-xs text-slate-500">
            <p className="font-bold text-slate-400">
              Version Alpha
            </p>

            <p className="mt-2">
              © 2026 Cap Serein Manager
            </p>
          </div>
        </div>
      </aside>

      {menuMobileOuvert && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() =>
              setMenuMobileOuvert(false)
            }
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          <aside className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-slate-950 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-5">
              <Link
                href="/"
                className="block"
                onClick={() =>
                  setMenuMobileOuvert(false)
                }
              >
                <div className="text-xl font-black">
                  Cap Serein
                </div>

                <div className="mt-1 text-xs font-semibold text-slate-400">
                  Manager Alpha 1.0
                </div>
              </Link>

              <button
                type="button"
                onClick={() =>
                  setMenuMobileOuvert(false)
                }
                aria-label="Fermer"
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-xl font-black text-white"
              >
                ×
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
              {menu.map((item) => {
                const actif = lienActif(
                  pathname,
                  item.href
                );

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={
                      actif ? "page" : undefined
                    }
                    className={`flex min-h-14 items-center gap-4 rounded-2xl px-4 py-3 text-base font-bold transition ${
                      actif
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center text-xl">
                      {item.icone}
                    </span>

                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="space-y-3 border-t border-slate-800 p-4">
              <Link
                href="/logements#nouveau-logement"
                className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 font-black text-white shadow-lg"
              >
                + Nouveau logement
              </Link>

              <button
                type="button"
                onClick={seDeconnecter}
                disabled={deconnexionEnCours}
                className="flex min-h-14 w-full items-center justify-center rounded-2xl border border-red-900/60 bg-red-950/30 px-5 py-3 font-black text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deconnexionEnCours
                  ? "Déconnexion..."
                  : "Se déconnecter"}
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex min-h-16 max-w-[1600px] items-center gap-3 px-3 sm:px-6 lg:px-10">
            <button
              type="button"
              onClick={() =>
                setMenuMobileOuvert(true)
              }
              aria-label="Ouvrir le menu"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-black text-slate-900 shadow-sm lg:hidden"
            >
              ☰
            </button>

            <div className="min-w-0 flex-1">
              <Link
                href="/"
                className="block truncate text-base font-black text-slate-950 sm:text-xl"
              >
                {titrePage}
              </Link>

              <p className="mt-0.5 hidden truncate text-xs font-medium text-slate-500 sm:block">
                Cap Serein Manager
              </p>
            </div>

            <Link
              href="/logements#nouveau-logement"
              aria-label="Créer un nouveau logement"
              className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 px-3 text-lg font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 sm:h-auto sm:px-5 sm:py-3 sm:text-sm"
            >
              <span className="sm:mr-2">+</span>

              <span className="hidden sm:inline">
                Nouveau logement
              </span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-3 py-5 pb-28 sm:px-6 sm:py-8 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navigationMobile.map((item) => {
            const actif = lienActif(
              pathname,
              item.href
            );

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  actif ? "page" : undefined
                }
                className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-1 py-2 text-[10px] font-black transition ${
                  actif
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500"
                }`}
              >
                <span className="text-xl leading-none">
                  {item.icone}
                </span>

                <span className="mt-1">
                  {item.label}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() =>
              setMenuMobileOuvert(true)
            }
            className="flex min-h-14 flex-col items-center justify-center rounded-2xl px-1 py-2 text-[10px] font-black text-slate-500"
          >
            <span className="text-xl leading-none">
              ☰
            </span>

            <span className="mt-1">
              Plus
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}