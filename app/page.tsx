import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        titre="Tableau de bord"
        description="Bienvenue sur Cap Serein Manager."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard titre="Arrivées aujourd'hui" valeur={0} couleur="green" />
        <StatCard titre="Départs aujourd'hui" valeur={0} couleur="orange" />
        <StatCard titre="Missions ouvertes" valeur={0} couleur="blue" />
        <StatCard titre="CA du mois" valeur="0 €" couleur="red" />
      </div>

      <div className="grid gap-8 xl:grid-cols-2">

        <Section titre="📅 Aujourd'hui">

          <div className="rounded-xl border border-dashed p-8 text-center text-slate-500">
            Aucune arrivée ou départ aujourd'hui.
          </div>

        </Section>

        <Section titre="🚨 Missions prioritaires">

          <div className="rounded-xl border border-dashed p-8 text-center text-slate-500">
            Aucune mission urgente.
          </div>

        </Section>

      </div>

      <div className="grid gap-8 xl:grid-cols-2">

        <Section titre="🧺 Ménage">

          <div className="rounded-xl border border-dashed p-8 text-center text-slate-500">
            Aucun ménage programmé.
          </div>

        </Section>

        <Section titre="👕 Pressing">

          <div className="rounded-xl border border-dashed p-8 text-center text-slate-500">
            Aucun pressing prévu.
          </div>

        </Section>

      </div>

      <Section titre="📈 Activité">

        <div className="grid gap-6 md:grid-cols-4">

          <StatCard titre="Logements" valeur={0} />
          <StatCard titre="Voyageurs" valeur={0} />
          <StatCard titre="Propriétaires" valeur={0} />
          <StatCard titre="Factures" valeur={0} />

        </div>

      </Section>

    </div>
  );
}