export default function ParametresPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Paramètres</h1>
        <p className="mt-2 text-slate-500">
          Réglages généraux de Cap Serein Manager.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow">
        <h2 className="text-2xl font-bold">Informations entreprise</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Champ label="Nom commercial" value="Cap Serein 83" />
          <Champ label="Téléphone" value="" />
          <Champ label="Email" value="" />
          <Champ label="Zone d’intervention" value="La Seyne-sur-Mer et alentours" />
        </div>
      </div>
    </div>
  );
}

function Champ({ label, value }: { label: string; value: string }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <input
        defaultValue={value}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
      />
    </label>
  );
}