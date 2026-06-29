"use client";

import SignaturePad from "@/components/ui/SignaturePad";

export type DonneesValidation = {
  nomOperateur: string;
  nomVoyageur: string;
  accordVoyageur: boolean;
  observationsFinales: string;

  signatureVoyageur: string;
  signatureOperateur: string;

  dateSignatureVoyageur: string;
  dateSignatureOperateur: string;
};

type ValidationSignaturesProps = {
  validation: DonneesValidation;
  voyageurNom: string;
  verrouille?: boolean;
  onChange: (
    validation: DonneesValidation
  ) => void;
};

function dateActuelle(): string {
  return new Date().toISOString();
}

function formaterDateHeure(
  valeur: string
): string {
  if (!valeur) {
    return "";
  }

  const date = new Date(valeur);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function ValidationSignatures({
  validation,
  voyageurNom,
  verrouille = false,
  onChange,
}: ValidationSignaturesProps) {
  const signatureVoyageurPresente =
    Boolean(validation.signatureVoyageur);

  const signatureOperateurPresente =
    Boolean(validation.signatureOperateur);

  const signaturesCompletes =
    signatureVoyageurPresente &&
    signatureOperateurPresente;

  function modifier(
    modification: Partial<DonneesValidation>
  ) {
    onChange({
      ...validation,
      ...modification,
    });
  }

  function enregistrerSignatureVoyageur(
    signature: string
  ) {
    modifier({
      signatureVoyageur: signature,
      dateSignatureVoyageur: signature
        ? dateActuelle()
        : "",
    });
  }

  function enregistrerSignatureOperateur(
    signature: string
  ) {
    modifier({
      signatureOperateur: signature,
      dateSignatureOperateur: signature
        ? dateActuelle()
        : "",
    });
  }

  return (
    <div className="space-y-6">
      <div
        className={`rounded-3xl border p-5 sm:p-6 ${
          signaturesCompletes
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3
              className={`text-lg font-black ${
                signaturesCompletes
                  ? "text-emerald-950"
                  : "text-amber-950"
              }`}
            >
              Validation des signatures
            </h3>

            <p
              className={`mt-2 text-sm leading-6 ${
                signaturesCompletes
                  ? "text-emerald-800"
                  : "text-amber-800"
              }`}
            >
              Les deux signatures sont
              obligatoires avant de marquer
              l’état des lieux comme signé.
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-4 py-2 text-xs font-black ${
              signaturesCompletes
                ? "bg-emerald-200 text-emerald-800"
                : "bg-amber-200 text-amber-800"
            }`}
          >
            {signaturesCompletes
              ? "✓ Signatures complètes"
              : "Signatures incomplètes"}
          </span>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label>
          <span className="mb-2 block text-sm font-black text-slate-700">
            Nom du voyageur
          </span>

          <input
            type="text"
            value={
              validation.nomVoyageur ||
              voyageurNom
            }
            disabled={verrouille}
            onChange={(event) =>
              modifier({
                nomVoyageur:
                  event.target.value,
              })
            }
            placeholder="Nom du voyageur"
            className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>

        <label>
          <span className="mb-2 block text-sm font-black text-slate-700">
            Nom de l’opérateur
          </span>

          <input
            type="text"
            value={
              validation.nomOperateur
            }
            disabled={verrouille}
            onChange={(event) =>
              modifier({
                nomOperateur:
                  event.target.value,
              })
            }
            placeholder="Nom de la personne réalisant l’état des lieux"
            className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>
      </div>

      <SignaturePad
        label="Signature du voyageur"
        description="Le voyageur signe avec son doigt sur le téléphone ou avec la souris sur ordinateur."
        value={
          validation.signatureVoyageur
        }
        onChange={
          enregistrerSignatureVoyageur
        }
        disabled={verrouille}
      />

      {validation.dateSignatureVoyageur && (
        <p className="-mt-3 text-right text-xs font-bold text-slate-500">
          Signée le{" "}
          {formaterDateHeure(
            validation.dateSignatureVoyageur
          )}
        </p>
      )}

      <SignaturePad
        label="Signature de l’opérateur"
        description="La personne ayant réalisé l’état des lieux signe également le document."
        value={
          validation.signatureOperateur
        }
        onChange={
          enregistrerSignatureOperateur
        }
        disabled={verrouille}
      />

      {validation.dateSignatureOperateur && (
        <p className="-mt-3 text-right text-xs font-bold text-slate-500">
          Signée le{" "}
          {formaterDateHeure(
            validation.dateSignatureOperateur
          )}
        </p>
      )}

      <label className="flex min-h-14 cursor-pointer items-start gap-4 rounded-2xl border border-slate-300 bg-slate-50 p-4">
        <input
          type="checkbox"
          checked={
            validation.accordVoyageur
          }
          disabled={verrouille}
          onChange={(event) =>
            modifier({
              accordVoyageur:
                event.target.checked,
            })
          }
          className="mt-1 h-5 w-5 shrink-0 accent-blue-600"
        />

        <span className="text-sm font-bold leading-6 text-slate-700">
          Le voyageur reconnaît avoir pris
          connaissance de l’état des lieux,
          des photographies et des
          observations consignées dans le
          document.
        </span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-black text-slate-700">
          Observations finales
        </span>

        <textarea
          rows={5}
          value={
            validation.observationsFinales
          }
          disabled={verrouille}
          onChange={(event) =>
            modifier({
              observationsFinales:
                event.target.value,
            })
          }
          placeholder="Réserves, désaccords ou informations complémentaires..."
          className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>

      {!signaturesCompletes && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold leading-6 text-red-700">
          La signature du voyageur et celle
          de l’opérateur doivent être
          enregistrées avant la validation
          définitive.
        </div>
      )}
    </div>
  );
}