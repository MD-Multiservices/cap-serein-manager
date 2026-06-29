"use client";

import { Facture } from "@/types/facture";

type Props = {
  facture: Facture;
  onChange: (facture: Facture) => void;
  onEnregistrer: () => void;
  onAnnuler: () => void;
};

export default function FactureForm({
  facture,
  onChange,
  onEnregistrer,
  onAnnuler,
}: Props) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">

      <h2 className="mb-6 text-2xl font-bold">
        {facture.id ? "Modifier la facture" : "Nouvelle facture"}
      </h2>

      <div className="grid gap-4 md:grid-cols-2">

        <Champ
          label="Numéro"
          value={facture.numero}
          onChange={(v) =>
            onChange({
              ...facture,
              numero: v,
            })
          }
        />

        <label>
          <span className="mb-2 block text-sm font-semibold">
            Type
          </span>

          <select
            value={facture.type}
            onChange={(e) =>
              onChange({
                ...facture,
                type: e.target.value as Facture["type"],
              })
            }
            className="w-full rounded-xl border px-4 py-3"
          >
            <option>Facture</option>
            <option>Devis</option>
            <option>Acompte</option>
            <option>Avoir</option>
          </select>
        </label>

        <Champ
          label="Date"
          type="date"
          value={facture.date}
          onChange={(v) =>
            onChange({
              ...facture,
              date: v,
            })
          }
        />

        <Champ
          label="Échéance"
          type="date"
          value={facture.echeance}
          onChange={(v) =>
            onChange({
              ...facture,
              echeance: v,
            })
          }
        />

        <Champ
          label="Remise (€)"
          type="number"
          value={String(facture.remise)}
          onChange={(v) =>
            onChange({
              ...facture,
              remise: Number(v),
            })
          }
        />

        <Champ
          label="Acompte (€)"
          type="number"
          value={String(facture.acompte)}
          onChange={(v) =>
            onChange({
              ...facture,
              acompte: Number(v),
            })
          }
        />

        <label className="md:col-span-2">

          <span className="mb-2 block text-sm font-semibold">
            Statut
          </span>

          <select
            value={facture.statut}
            onChange={(e) =>
              onChange({
                ...facture,
                statut: e.target.value as Facture["statut"],
              })
            }
            className="w-full rounded-xl border px-4 py-3"
          >
            <option>Brouillon</option>
            <option>Envoyée</option>
            <option>Payée</option>
            <option>En retard</option>
            <option>Annulée</option>
          </select>

        </label>

      </div>

      <label className="mt-5 block">

        <span className="mb-2 block text-sm font-semibold">
          Notes
        </span>

        <textarea
          rows={5}
          value={facture.notes}
          onChange={(e) =>
            onChange({
              ...facture,
              notes: e.target.value,
            })
          }
          className="w-full rounded-xl border px-4 py-3"
        />

      </label>

      <div className="mt-6 flex gap-3">

        <button
          onClick={onEnregistrer}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
        >
          Enregistrer
        </button>

        <button
          onClick={onAnnuler}
          className="rounded-xl border px-6 py-3"
        >
          Annuler
        </button>

      </div>

    </div>
  );
}

function Champ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label>

      <span className="mb-2 block text-sm font-semibold">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-4 py-3"
      />

    </label>
  );
}