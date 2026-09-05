"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ConnexionPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [chargement, setChargement] = useState(false);
  const [verification, setVerification] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    async function verifierSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/");
        return;
      }

      setVerification(false);
    }

    verifierSession();
  }, [router]);

  async function seConnecter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErreur("");
    setChargement(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: motDePasse,
      });
      if (error) {
        const code = error.code || "";
        if (code === "invalid_credentials") {
          setErreur("Supabase refuse ces identifiants sur cette version du site (invalid_credentials). Vérifiez l’adresse e-mail et le mot de passe.");
        } else if (code === "email_not_confirmed") {
          setErreur("Votre adresse e-mail doit être confirmée avant la connexion.");
        } else if (error.status === 429) {
          setErreur("Trop de tentatives de connexion. Patientez quelques minutes avant de réessayer.");
        } else if (error.name === "AuthRetryableFetchError" || !error.status) {
          setErreur("Impossible de joindre Supabase. Vérifiez votre connexion réseau et réessayez.");
        } else if (/api.?key/i.test(error.message) || error.status === 401 || error.status === 403) {
          setErreur("La connexion est refusée par la configuration Supabase de cette version du site. Ce refus ne confirme pas un mauvais mot de passe.");
        } else {
          setErreur(`Connexion Supabase indisponible (HTTP ${error.status}${code ? `, ${code}` : ""}). Communiquez ce message pour le diagnostic.`);
        }
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setErreur("Impossible de joindre le service de connexion. Vérifiez le réseau et réessayez.");
    } finally {
      setChargement(false);
    }
  }

  if (verification) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">
            CS
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Cap Serein Manager
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Connectez-vous à votre espace de gestion
          </p>
        </div>

        <form onSubmit={seConnecter} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Adresse e-mail
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="vous@exemple.fr"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Mot de passe
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={motDePasse}
              onChange={(event) => setMotDePasse(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Votre mot de passe"
            />
          </div>

          {erreur && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {erreur}
            </div>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {chargement ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}

