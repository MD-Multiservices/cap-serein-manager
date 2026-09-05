import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export const supabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey
);

/*
 * Important pour Next.js / Vercel :
 *
 * Les pages "use client" sont quand même évaluées pendant le build SSR.
 * On ne doit donc pas faire échouer tout le build au moment de l'import
 * si les variables d'environnement d'un environnement Preview ne sont
 * pas encore injectées.
 *
 * En environnement correctement configuré, le vrai client Supabase est
 * utilisé. Sinon on crée uniquement un client de secours pour permettre
 * le prerender ; les appels réseau échoueront ensuite proprement jusqu'à
 * ce que les variables Vercel soient configurées.
 */
const buildSafeUrl =
  supabaseUrl || "https://placeholder.supabase.co";

const buildSafeKey =
  supabasePublishableKey || "build-placeholder-key";

export const supabase: SupabaseClient = createClient(
  buildSafeUrl,
  buildSafeKey
);
