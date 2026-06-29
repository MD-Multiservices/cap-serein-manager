import type { Voyageur } from "@/types/voyageur";

type Logement = {
  id: string;
  nom: string;
  ville: string;
};

type VoyageurCardProps = {
  voyageur: Voyageur;
  logements: Logement[];
  onModifier: (voyageur: Voyageur) => void;
  onSupprimer: (id: string) => void;
};

export default function VoyageurCard({
  voyageur,
  logements,
  onModifier,
  onSupprimer,
}: VoyageurCardProps) {
  const logement = logements.find((item) => item.id === voyageur.logementId);

  const statutClass =
    voyageur.statut === "Arrivé"
      ? "bg-emerald-100 text-emerald-700"
      : voyageur.statut === "Parti"
      ? "bg-slate-200 text-slate-700"
      : voyageur.statut === "Annulé"
      ? "bg-red-100 text-red-700"
      : "bg-blue-100 text-blue-700";

  return (
    <div className="rounded-2xl border bg-slate-50 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statutClass}`}
          >
            {voyageur.statut}
          </span>

          <h3 className="mt-3 text-xl font-bold text-slate-900">
            {voyageur.prenom} {voyageur.nom}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {logement
              ? `${logement.nom} — ${logement.ville}`
              : "Logement non sélectionné"}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {voyageur.arrivee || "Arrivée non renseignée"} à{" "}
            {voyageur.heureArrivee || "--:--"} →{" "}
            {voyageur.depart || "Départ non renseigné"} à{" "}
            {voyageur.heureDepart || "--:--"}
          </p>
        </div>

        <div className="text-left xl:text-right">
          <p className="text-sm font-semibold text-blue-600">
            {voyageur.plateforme || "Direct"}
          </p>

          {voyageur.numeroReservation && (
            <p className="mt-1 text-xs text-slate-500">
              Réservation : {voyageur.numeroReservation}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
        <Info label="Adultes" value={String(voyageur.adultes)} />
        <Info label="Enfants" value={String(voyageur.enfants)} />
        <Info label="Animaux" value={String(voyageur.animaux)} />
        <Info label="Téléphone" value={voyageur.telephone || "Non renseigné"} />
        <Info label="Email" value={voyageur.email || "Non renseigné"} />
        <Info label="Langue" value={voyageur.langue || "Non renseignée"} />
      </div>

      {voyageur.caution && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-700">
          Caution à vérifier / enregistrée.
        </p>
      )}

      {voyageur.observations && (
        <p className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm text-slate-600">
          {voyageur.observations}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {voyageur.telephone && (
          <a
            href={`tel:${voyageur.telephone}`}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
          >
            Appeler
          </a>
        )}

        {voyageur.email && (
          <a
            href={`mailto:${voyageur.email}`}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-white"
          >
            Email
          </a>
        )}

        <button
          onClick={() => onModifier(voyageur)}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
        >
          Modifier
        </button>

        <button
          onClick={() => onSupprimer(voyageur.id)}
          className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <strong>{label} :</strong> {value}
    </p>
  );
}