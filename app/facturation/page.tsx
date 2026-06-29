export default function FacturationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Facturation</h1>
        <p className="mt-2 text-slate-500">
          Module de devis, factures, acomptes et paiements.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card title="Documents" value="0" />
        <Card title="Brouillons" value="0" />
        <Card title="Payées" value="0" />
        <Card title="Impayées" value="0" />
      </div>

      <div className="rounded-3xl bg-white p-8 shadow">
        <h2 className="text-2xl font-bold">Facturation V1</h2>
        <p className="mt-3 text-slate-600">
          La structure est prête. Prochaine étape : connecter les factures aux
          voyageurs, logements, missions, ménage et pressing.
        </p>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-3 text-4xl font-bold text-slate-900">{value}</p>
    </div>
  );
}