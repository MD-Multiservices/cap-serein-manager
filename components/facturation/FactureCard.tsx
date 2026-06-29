import type { Facture } from "@/types/facture";
import {
  totalHT,
  totalTVA,
  totalTTC,
  resteAPayer,
  formaterPrix,
} from "@/lib/facture";

type Props = {
  facture: Facture;
  onModifier: (facture: Facture) => void;
  onSupprimer: (id: string) => void;
};

export default function FactureCard({
  facture,
  onModifier,
  onSupprimer,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            {facture.type}
          </p>

          <h3 className="mt-1 text-xl font-bold">
            {facture.numero || "Sans numéro"}
          </h3>

          <p className="text-sm text-slate-500">
            {facture.date}
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">
          {facture.statut}
        </span>
      </div>

      <div className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Total HT</span>
          <strong>{formaterPrix(totalHT(facture.lignes))}</strong>
        </div>

        <div className="flex justify-between">
          <span>TVA</span>
          <strong>{formaterPrix(totalTVA(facture.lignes))}</strong>
        </div>

        <div className="flex justify-between">
          <span>Remise</span>
          <strong>
            - {formaterPrix(facture.remise)}
          </strong>
        </div>

        <div className="flex justify-between">
          <span>Acompte</span>
          <strong>
            - {formaterPrix(facture.acompte)}
          </strong>
        </div>

        <hr />

        <div className="flex justify-between text-lg">
          <strong>Reste à payer</strong>

          <strong className="text-blue-700">
            {formaterPrix(resteAPayer(facture))}
          </strong>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => onModifier(facture)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Modifier
        </button>

        <button
          onClick={() => onSupprimer(facture.id)}
          className="rounded-lg border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}