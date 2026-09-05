"use client";

import { useEffect, useState } from "react";
import { lireParametres } from "@/lib/settingsSupabase";
import { supabase } from "@/lib/supabase";
import { obtenirOrganisationCourante } from "@/lib/organization";

import {
  genererEtatDesLieuxPdf,
  telechargerPdf,
  type EtatDesLieuxPdf,
  type InformationsEntreprisePdf,
  type ResultatGenerationPdf,
} from "@/lib/genererEtatDesLieuxPdf";

type EtatAvecLogement = EtatDesLieuxPdf & {
  logementId?: string;
};

type CoordonneesEnvoi = {
  emailProprietaire: string;
  emailVoyageur: string;
  emailEntreprise: string;
};

type ActionsPdfProps = {
  etat: EtatAvecLogement;
};


function texte(
  valeur: unknown
): string {
  if (
    valeur === null ||
    valeur === undefined
  ) {
    return "";
  }

  return String(valeur).trim();
}


async function trouverInformationsEntreprise(): Promise<InformationsEntreprisePdf> {
  const p = await lireParametres();
  return { nom: p.nomEntreprise, email: p.email, telephone: p.telephone,
    adresse: [p.adresse, p.codePostal, p.ville].filter(Boolean).join(" "), logoUrl: "/logo-cap-serein.jpg" };
}
async function trouverCoordonneesEnvoi(etat: EtatAvecLogement, entreprise: InformationsEntreprisePdf): Promise<CoordonneesEnvoi> {
  const org = await obtenirOrganisationCourante();
  let emailProprietaire = "";
  if (etat.logementId) {
    const logement = await supabase.from("logements").select("proprietaire_id").eq("organization_id", org).eq("id", etat.logementId).maybeSingle();
    if (logement.error) throw logement.error;
    if (logement.data?.proprietaire_id) {
      const p = await supabase.from("proprietaires").select("email").eq("organization_id", org).eq("id", logement.data.proprietaire_id).maybeSingle();
      if (p.error) throw p.error;
      emailProprietaire = p.data?.email || "";
    }
  }
  return { emailProprietaire, emailVoyageur: texte(etat.voyageurEmail), emailEntreprise: entreprise.email };
}

function emailsUniques(
  emails: string[]
): string[] {
  const resultats = new Set<string>();

  emails.forEach((email) => {
    const valeur =
      email.trim().toLowerCase();

    if (valeur) {
      resultats.add(valeur);
    }
  });

  return Array.from(resultats);
}

function formaterDateMail(
  valeur: string
): string {
  if (!valeur) {
    return "";
  }

  const date = new Date(
    valeur.includes("T")
      ? valeur
      : `${valeur}T12:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return valeur;
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

export default function ActionsPdf({
  etat,
}: ActionsPdfProps) {
  const [
    resultatPdf,
    setResultatPdf,
  ] =
    useState<ResultatGenerationPdf | null>(
      null
    );

  const [
    generationEnCours,
    setGenerationEnCours,
  ] = useState(false);

  const [
    erreur,
    setErreur,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    panneauOuvert,
    setPanneauOuvert,
  ] = useState(false);

  const documentSigne =
    etat.statut === "signe" &&
    Boolean(
      etat.validation
        .signatureVoyageur
    ) &&
    Boolean(
      etat.validation
        .signatureOperateur
    );

  async function creerPdf(): Promise<ResultatGenerationPdf | null> {
    setGenerationEnCours(true);
    setErreur("");
    setMessage("");

    try {
      const entreprise =
        await trouverInformationsEntreprise();

      const resultat =
        await genererEtatDesLieuxPdf(
          etat,
          entreprise
        );

      setResultatPdf(resultat);
      setPanneauOuvert(true);

      return resultat;
    } catch (cause) {
      setErreur(
        cause instanceof Error
          ? cause.message
          : "Impossible de générer le PDF."
      );

      return null;
    } finally {
      setGenerationEnCours(false);
    }
  }

  async function obtenirPdf(): Promise<ResultatGenerationPdf | null> {
    if (resultatPdf) {
      return resultatPdf;
    }

    return creerPdf();
  }

  async function telechargerDocument() {
    const resultat =
      await obtenirPdf();

    if (!resultat) {
      return;
    }

    telechargerPdf(
      resultat.blob,
      resultat.nomFichier
    );

    setMessage(
      "Le PDF a été téléchargé sur votre appareil."
    );
  }

  async function partagerDocument() {
    const resultat =
      await obtenirPdf();

    if (!resultat) {
      return;
    }

    const fichier = new File(
      [resultat.blob],
      resultat.nomFichier,
      {
        type: "application/pdf",
      }
    );

    const donneesPartage = {
      title:
        etat.type === "sortie"
          ? "État des lieux de sortie"
          : "État des lieux d’entrée",

      text: `${etat.logementNom} — ${formaterDateMail(
        etat.date
      )}`,

      files: [fichier],
    };

    try {
      if (
        typeof navigator.share ===
          "function" &&
        (!navigator.canShare ||
          navigator.canShare({
            files: [fichier],
          }))
      ) {
        await navigator.share(
          donneesPartage
        );

        setMessage(
          "Le menu de partage a été ouvert."
        );

        return;
      }

      telechargerPdf(
        resultat.blob,
        resultat.nomFichier
      );

      setMessage(
        "Le partage direct n’est pas disponible sur ce navigateur. Le PDF a été téléchargé."
      );
    } catch (cause) {
      if (
        cause instanceof DOMException &&
        cause.name === "AbortError"
      ) {
        return;
      }

      setErreur(
        "Impossible d’ouvrir le partage. Le PDF peut toujours être téléchargé."
      );
    }
  }

  async function preparerEmail() {
    const resultat =
      await obtenirPdf();

    if (!resultat) {
      return;
    }

    telechargerPdf(
      resultat.blob,
      resultat.nomFichier
    );

    const entreprise =
      await trouverInformationsEntreprise();

    const coordonnees =
      await trouverCoordonneesEnvoi(
        etat,
        entreprise
      );

    const destinatairePrincipal =
      coordonnees.emailProprietaire ||
      coordonnees.emailVoyageur ||
      coordonnees.emailEntreprise;

    const copies = emailsUniques([
      coordonnees.emailVoyageur,
      coordonnees.emailEntreprise,
    ]).filter(
      (email) =>
        email !==
        destinatairePrincipal.toLowerCase()
    );

    const typeDocument =
      etat.type === "sortie"
        ? "sortie"
        : "entrée";

    const objetMail =
      `État des lieux de ${typeDocument} – ${etat.logementNom} – ${formaterDateMail(
        etat.date
      )}`;

    const corpsMail = [
      "Bonjour,",
      "",
      `Veuillez trouver en pièce jointe l’état des lieux de ${typeDocument} concernant le logement « ${etat.logementNom} ».`,
      "",
      `Voyageur : ${etat.voyageurNom}`,
      `Date : ${formaterDateMail(
        etat.date
      )}`,
      `Référence : ${
        etat.missionId ||
        etat.id
      }`,
      "",
      "Le document a été signé par le voyageur et par l’opérateur.",
      "",
      "Important : le PDF vient d’être téléchargé sur votre appareil. Pensez à l’ajouter en pièce jointe avant l’envoi.",
      "",
      "Cordialement,",
      entreprise.nom || "Cap Serein",
    ].join("\n");

    const parametres = [
      `subject=${encodeURIComponent(
        objetMail
      )}`,
      `body=${encodeURIComponent(
        corpsMail
      )}`,
    ];

    if (copies.length > 0) {
      parametres.push(
        `cc=${encodeURIComponent(
          copies.join(",")
        )}`
      );
    }

    const adresseMail =
      `mailto:${encodeURIComponent(
        destinatairePrincipal
      )}?${parametres.join("&")}`;

    setMessage(
      "Le PDF a été téléchargé. Ajoutez-le en pièce jointe dans l’e-mail qui va s’ouvrir."
    );

    window.setTimeout(() => {
      window.location.href =
        adresseMail;
    }, 500);
  }

  const [coordonnees, setCoordonnees] = useState<CoordonneesEnvoi>({
    emailProprietaire: "", emailVoyageur: etat.voyageurEmail, emailEntreprise: "",
  });
  useEffect(() => {
    let actif = true;
    trouverInformationsEntreprise().then(entreprise => trouverCoordonneesEnvoi(etat, entreprise))
      .then(valeur => { if (actif) setCoordonnees(valeur); })
      .catch(cause => { if (actif) setErreur(cause instanceof Error ? cause.message : "Coordonnées indisponibles."); });
    return () => { actif = false; };
  }, [etat]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">
            Document final
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Générez le compte rendu signé,
            téléchargez-le, partagez-le depuis
            votre téléphone ou préparez
            l’e-mail destiné aux différentes
            parties.
          </p>
        </div>

        <button
          type="button"
          onClick={creerPdf}
          disabled={
            !documentSigne ||
            generationEnCours
          }
          className="min-h-14 w-full rounded-2xl bg-blue-600 px-6 py-3 font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 xl:w-auto"
        >
          {generationEnCours
            ? "Génération en cours..."
            : resultatPdf
              ? "Régénérer le PDF"
              : "Générer le PDF"}
        </button>
      </div>

      {!documentSigne && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold leading-6 text-amber-800">
          Le PDF sera disponible lorsque
          l’état des lieux aura été signé par
          le voyageur et par l’opérateur.
        </div>
      )}

      {erreur && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold leading-6 text-red-700">
          {erreur}
        </div>
      )}

      {message && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold leading-6 text-emerald-800">
          {message}
        </div>
      )}

      {panneauOuvert &&
        resultatPdf && (
          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-black text-emerald-950">
                  ✓ PDF généré avec succès
                </h3>

                <p className="mt-2 break-all text-sm text-emerald-800">
                  {resultatPdf.nomFichier}
                </p>
              </div>

              <span className="w-fit rounded-full bg-emerald-200 px-4 py-2 text-xs font-black text-emerald-800">
                Document prêt
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <button
                type="button"
                onClick={
                  telechargerDocument
                }
                className="min-h-14 rounded-2xl bg-slate-900 px-5 py-3 font-black text-white"
              >
                ⬇ Télécharger le PDF
              </button>

              <button
                type="button"
                onClick={
                  partagerDocument
                }
                className="min-h-14 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white"
              >
                📤 Partager le PDF
              </button>

              <button
                type="button"
                onClick={() => { void preparerEmail().catch(cause => setErreur(cause instanceof Error ? cause.message : "Impossible de préparer l’e-mail.")); }}
                className="min-h-14 rounded-2xl bg-violet-600 px-5 py-3 font-black text-white sm:col-span-2 xl:col-span-1"
              >
                ✉ Préparer l’e-mail
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-white p-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Destinataires détectés
              </p>

              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p className="break-words">
                  <span className="font-black">
                    Propriétaire :
                  </span>{" "}
                  {coordonnees.emailProprietaire ||
                    "E-mail non renseigné"}
                </p>

                <p className="break-words">
                  <span className="font-black">
                    Voyageur :
                  </span>{" "}
                  {coordonnees.emailVoyageur ||
                    "E-mail non renseigné"}
                </p>

                <p className="break-words">
                  <span className="font-black">
                    Cap Serein :
                  </span>{" "}
                  {coordonnees.emailEntreprise ||
                    "E-mail non renseigné dans Paramètres"}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs font-medium leading-5 text-emerald-800">
              Le navigateur ne peut pas joindre
              automatiquement un fichier à un
              e-mail. Le bouton e-mail télécharge
              donc d’abord le PDF, puis ouvre un
              message prérempli.
            </p>
          </div>
        )}
    </section>
  );
}
