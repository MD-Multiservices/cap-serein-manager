"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [verification, setVerification] = useState(true);
  const [connecte, setConnecte] = useState(false);

  useEffect(() => {
    let actif = true;

    async function verifierUtilisateur() {
      // La page de connexion doit rester accessible sans session.
      if (pathname === "/connexion") {
        if (actif) {
          setConnecte(true);
          setVerification(false);
        }
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!actif) {
        return;
      }

      if (!user) {
        setConnecte(false);
        setVerification(false);
        router.replace("/connexion");
        return;
      }

      setConnecte(true);
      setVerification(false);
    }

    verifierUtilisateur();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (pathname === "/connexion") {
        return;
      }

      if (!session) {
        setConnecte(false);
        router.replace("/connexion");
      } else {
        setConnecte(true);
      }
    });

    return () => {
      actif = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (verification) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm text-slate-500">
            Vérification de la session...
          </p>
        </div>
      </div>
    );
  }

  if (!connecte && pathname !== "/connexion") {
    return null;
  }

  return <>{children}</>;
}