import type { Voyageur } from "@/types/voyageur";

type Logement = {
  id: string;
  nom: string;
  ville: string;
};

type VoyageurFormProps = {
  voyageur: Voyageur;
  logements: Logement[];
  onChange: (voyageur: Voyageur) => void;
  onEnregistrer: () => void;
  onAnnuler: () => void;
};

export default function VoyageurForm({
  voyageur,
  logements,
  onChange,
  onEnregistrer,
  onAnnuler,
}: VoyageurFormProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {voyageur.id ? "Modifier le voyageur" : "Nouveau voyageur"}
        </h2>

        <button
          onClick={onAnnuler}
          className="rounded-xl border px-4 py-2 hover:bg-slate-100"
        >
          Fermer
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Champ
          label="Prénom"
          value={voyageur.prenom}
          onChange={(v) => onChange({ ...voyageur, prenom: v })}
        />

        <Champ
          label="Nom"
          value={voyageur.nom}
          onChange={(v) => onChange({ ...voyageur, nom: v })}
        />

        <Champ
          label="Téléphone"
          value={voyageur.telephone}
          onChange={(v) => onChange({ ...voyageur, telephone: v })}
        />

        <Champ
          label="Email"
          value={voyageur.email}
          onChange={(v) => onChange({ ...voyageur, email: v })}
        />

        <label>
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Logement
          </span>
          <select
            value={voyageur.logementId}
            onChange={(e) =>
              onChange({ ...voyageur, logementId: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
          >
            <option value="">Sélectionner un logement</option>
            {logements.map((logement) => (
              <option key={logement.id} value={logement.id}>
                {logement.nom} — {logement.ville}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Statut
          </span>
          <select
            value={voyageur.statut}
            onChange={(e) =>
              onChange({
                ...voyageur,
                statut: e.target.value as Voyageur["statut"],
              })
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
          >
            <option>Réservation</option>
            <option>Arrivé</option>
            <option>Parti</option>
            <option>Annulé</option>
          </select>
        </label>

        <Champ
          label="Date d'arrivée"
          type="date"
          value={voyageur.arrivee}
          onChange={(v) => onChange({ ...voyageur, arrivee: v })}
        />

        <Champ
          label="Heure d'arrivée"
          type="time"
          value={voyageur.heureArrivee}
          onChange={(v) => onChange({ ...voyageur, heureArrivee: v })}
        />

        <Champ
          label="Date de départ"
          type="date"
          value={voyageur.depart}
          onChange={(v) => onChange({ ...voyageur, depart: v })}
        />

        <Champ
          label="Heure de départ"
          type="time"
          value={voyageur.heureDepart}
          onChange={(v) => onChange({ ...voyageur, heureDepart: v })}
        />

        <Nombre
          label="Adultes"
          value={voyageur.adultes}
          onChange={(v) => onChange({ ...voyageur, adultes: v })}
        />

        <Nombre
          label="Enfants"
          value={voyageur.enfants}
          onChange={(v) => onChange({ ...voyageur, enfants: v })}
        />

        <Nombre
          label="Animaux"
          value={voyageur.animaux}
          onChange={(v) => onChange({ ...voyageur, animaux: v })}
        />

        <Champ
          label="Langue"
          value={voyageur.langue}
          onChange={(v) => onChange({ ...voyageur, langue: v })}
        />

        <Champ
          label="Plateforme"
          value={voyageur.plateforme}
          onChange={(v) => onChange({ ...voyageur, plateforme: v })}
        />

        <Champ
          label="Numéro de réservation"
          value={voyageur.numeroReservation}
          onChange={(v) => onChange({ ...voyageur, numeroReservation: v })}
        />
      </div>

      <button
        type="button"
        onClick={() => onChange({ ...voyageur, caution: !voyageur.caution })}
        className={`mt-5 rounded-xl border px-4 py-3 font-semibold ${
          voyageur.caution
            ? "border-amber-500 bg-amber-50 text-amber-700"
            : "hover:bg-slate-100"
        }`}
      >
        {voyageur.caution ? "✅ Caution enregistrée" : "⬜ Caution à vérifier"}
      </button>

      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">
          Observations
        </span>
        <textarea
          value={voyageur.observations}
          onChange={(e) =>
            onChange({ ...voyageur, observations: e.target.value })
          }
          rows={4}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
          placeholder="Ex : arrivée tardive, demande spéciale, bébé, animal, place de parking..."
        />
      </label>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onEnregistrer}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Enregistrer
        </button>

        <button
          onClick={onAnnuler}
          className="rounded-xl border px-6 py-3 font-semibold hover:bg-slate-100"
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
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
      />
    </label>
  );
}

function Nombre({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
      />
    </label>
  );
}