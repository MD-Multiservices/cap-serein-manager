"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import StatCard from "@/components/ui/StatCard";
import { lire } from "@/lib/database";

type Mission = {
  id: string;
  titre?: string;
  type?: string;
  date?: string;
  heure?: string;
  statut?: string;
  priorite?: string;
};

type Voyageur = {
  id: string;
  nom?: string;
  prenom?: string;
  arrivee?: string;
  depart?: string;
  heureArrivee?: string;
  heureDepart?: string;
};

type Facture = {
  id: string;
  statut?: string;
};

export default function DashboardPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [voyageurs, setVoyageurs] = useState<Voyageur[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [logements, setLogements] = useState<unknown[]>([]);
  const [proprietaires, setProprietaires] = useState<unknown[]>([]);

  useEffect(() => {
    setMissions(lire<Mission>("missions"));
    setVoyageurs(lire<Voyageur>("voyageurs"));
    setFactures(lire<Facture>("factures"));
    setLogements(lire<unknown>("logements"));
    setProprietaires(lire<unknown>("proprietaires"));
  }, []);

  const aujourdHui = new Date().toISOString().slice(0, 10);

  const missionsAujourdhui = useMemo(
    () => missions.filter((mission) => mission.date === aujourdHui),
    [missions, aujourdHui]
  );

  const arriveesAujourdhui = voyageurs.filter(
    (voyageur) => voyageur.arrivee === aujourdHui
  );

  const departsAujourdhui = voyageurs.filter(
    (voyageur) => voyageur.depart === aujourdHui
  );

  const missionsUrgentes = missions.filter(
    (mission) =>
      mission.priorite === "Urgente" || mission.statut === "À faire"
  );

  const facturesImpayees = factures.filter(
    (facture) =>
      facture.statut === "Envoyée" || facture.statut === "En retard"
  );

  return (
    <div className="space-y-8">
      <PageHeader
        titre="Tableau de bord"
        description="Vue globale de votre conciergerie : arrivées, départs, missions, factures et activité."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <StatCard titre="Logements" valeur={logements.length} couleur="blue" />
        <StatCard titre="Voyageurs" valeur={voyageurs.length} couleur="green" />
        <StatCard titre="Missions" valeur={missions.length} couleur="orange" />
        <StatCard titre="Propriétaires" valeur={proprietaires.length} couleur="blue" />
        <StatCard titre="Factures" valeur={factures.length} couleur="red" />
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <Section
          titre="📅 Aujourd'hui"
          description="Arrivées, départs et missions prévues ce jour."
        >
          <div className="space-y-4">
            {arriveesAujourdhui.map((voyageur) => (
              <Ligne
                key={`arrivee-${voyageur.id}`}
                badge="Arrivée"
                titre={`${voyageur.prenom || ""} ${voyageur.nom || ""}`}
                detail={voyageur.heureArrivee || "Heure non renseignée"}
              />
            ))}

            {departsAujourdhui.map((voyageur) => (
              <Ligne
                key={`depart-${voyageur.id}`}
                badge="Départ"
                titre={`${voyageur.prenom || ""} ${voyageur.nom || ""}`}
                detail={voyageur.heureDepart || "Heure non renseignée"}
              />
            ))}

            {missionsAujourdhui.map((mission) => (
              <Ligne
                key={mission.id}
                badge={mission.type || "Mission"}
                titre={mission.titre || "Mission sans titre"}
                detail={`${mission.heure || "--:--"} · ${mission.statut || "À faire"}`}
              />
            ))}

            {arriveesAujourdhui.length === 0 &&
              departsAujourdhui.length === 0 &&
              missionsAujourdhui.length === 0 && (
                <Vide message="Aucune action prévue aujourd'hui." />
              )}
          </div>
        </Section>

        <Section
          titre="🚨 Priorités"
          description="Ce qui demande votre attention rapidement."
        >
          <div className="space-y-4">
            {missionsUrgentes.slice(0, 5).map((mission) => (
              <Ligne
                key={mission.id}
                badge={mission.priorite || "À faire"}
                titre={mission.titre || "Mission sans titre"}
                detail={`${mission.date || "Date non renseignée"} · ${
                  mission.heure || "--:--"
                }`}
              />
            ))}

            {missionsUrgentes.length === 0 && (
              <Vide message="Aucune mission prioritaire." />
            )}
          </div>
        </Section>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <Section titre="🧺 Ménage & pressing">
          <div className="grid gap-4 md:grid-cols-2">
            <MiniCard titre="Missions ménage" valeur={missions.filter((m) => m.type === "Ménage").length} />
            <MiniCard titre="Missions pressing" valeur={missions.filter((m) => m.type === "Pressing").length} />
          </div>
        </Section>

        <Section titre="💶 Facturation">
          <div className="grid gap-4 md:grid-cols-2">
            <MiniCard titre="Factures totales" valeur={factures.length} />
            <MiniCard titre="À encaisser" valeur={facturesImpayees.length} />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Ligne({
  badge,
  titre,
  detail,
}: {
  badge: string;
  titre: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
          {badge}
        </span>
        <p className="mt-2 font-bold text-slate-900">{titre}</p>
        <p className="text-sm text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function MiniCard({ titre, valeur }: { titre: string; valeur: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-semibold text-slate-500">{titre}</p>
      <p className="mt-3 text-3xl font-black text-slate-900">{valeur}</p>
    </div>
  );
}

function Vide({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
      {message}
    </div>
  );
}