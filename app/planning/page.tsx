"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";

import { enregistrer, lire } from "@/lib/database";

import type {
  Mission,
  PrioriteMission,
  StatutMission,
  TypeMission,
} from "@/types/mission";

type Logement = {
  id: string;
  nom: string;
  ville?: string;
};

type Voyageur = {
  id: string;
  prenom: string;
  nom: string;
};

type FiltreStatut = "Tous" | StatutMission;
type FiltrePriorite = "Toutes" | PrioriteMission;
type FiltreType = "Tous" | TypeMission;

const statutsMission: StatutMission[] = [
  "À faire",
  "En cours",
  "Terminée",
  "Annulée",
];

const prioritesMission: PrioriteMission[] = [
  "Basse",
  "Normale",
  "Haute",
  "Urgente",
];

function dateLocaleISO(date: Date): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
}

function ajouterJours(date: Date, nombre: number): Date {
  const nouvelleDate = new Date(date);
  nouvelleDate.setDate(nouvelleDate.getDate() + nombre);

  return nouvelleDate;
}

function debutDeSemaine(date: Date): Date {
  const resultat = new Date(date);
  const jour = resultat.getDay();
  const decalage = jour === 0 ? -6 : 1 - jour;

  resultat.setDate(resultat.getDate() + decalage);
  resultat.setHours(12, 0, 0, 0);

  return resultat;
}

function formaterJour(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
  }).format(date);
}

function formaterDateCourte(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formaterPeriode(debut: Date, fin: Date): string {
  return `${new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
  }).format(debut)} – ${new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(fin)}`;
}

function normaliserMission(mission: Mission): Mission {
  const ancienStatut = String(mission.statut);

  return {
    ...mission,
    statut:
      ancienStatut === "Terminé"
        ? "Terminée"
        : mission.statut,
  };
}

export default function PlanningPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [logements, setLogements] = useState<Logement[]>([]);
  const [voyageurs, setVoyageurs] = useState<Voyageur[]>([]);

  const [dateReference, setDateReference] = useState(
    debutDeSemaine(new Date())
  );

  const [filtreStatut, setFiltreStatut] =
    useState<FiltreStatut>("Tous");

  const [filtrePriorite, setFiltrePriorite] =
    useState<FiltrePriorite>("Toutes");

  const [filtreType, setFiltreType] =
    useState<FiltreType>("Tous");

  const [donneesChargees, setDonneesChargees] =
    useState(false);

  useEffect(() => {
    setMissions(
      lire<Mission>("missions").map(normaliserMission)
    );

    setLogements(lire<Logement>("logements"));
    setVoyageurs(lire<Voyageur>("voyageurs"));
    setDonneesChargees(true);
  }, []);

  useEffect(() => {
    if (!donneesChargees) return;

    enregistrer("missions", missions);
  }, [missions, donneesChargees]);

  const joursSemaine = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) =>
      ajouterJours(dateReference, index)
    );
  }, [dateReference]);

  const finSemaine = joursSemaine[6];
  const aujourdHui = dateLocaleISO(new Date());

  const typesDisponibles = useMemo(() => {
    return Array.from(
      new Set(missions.map((mission) => mission.type))
    ).sort();
  }, [missions]);

  const missionsFiltrees = useMemo(() => {
    return missions.filter((mission) => {
      if (
        filtreStatut !== "Tous" &&
        mission.statut !== filtreStatut
      ) {
        return false;
      }

      if (
        filtrePriorite !== "Toutes" &&
        mission.priorite !== filtrePriorite
      ) {
        return false;
      }

      if (
        filtreType !== "Tous" &&
        mission.type !== filtreType
      ) {
        return false;
      }

      return true;
    });
  }, [
    missions,
    filtreStatut,
    filtrePriorite,
    filtreType,
  ]);

  const statistiques = useMemo(() => {
    const debut = dateLocaleISO(dateReference);
    const fin = dateLocaleISO(finSemaine);

    const missionsSemaine = missions.filter(
      (mission) =>
        mission.date >= debut && mission.date <= fin
    );

    return {
      semaine: missionsSemaine.length,

      aujourdHui: missions.filter(
        (mission) => mission.date === aujourdHui
      ).length,

      urgentes: missionsSemaine.filter(
        (mission) =>
          mission.priorite === "Urgente" &&
          mission.statut !== "Terminée" &&
          mission.statut !== "Annulée"
      ).length,

      aRealiser: missionsSemaine.filter(
        (mission) =>
          mission.statut === "À faire" ||
          mission.statut === "En cours"
      ).length,
    };
  }, [missions, dateReference, finSemaine, aujourdHui]);

  function missionsDuJour(date: Date): Mission[] {
    const dateISO = dateLocaleISO(date);

    return missionsFiltrees
      .filter((mission) => mission.date === dateISO)
      .sort((a, b) =>
        (a.heure || "23:59").localeCompare(
          b.heure || "23:59"
        )
      );
  }

  function nomLogement(id: string): string {
    const logement = logements.find(
      (item) => item.id === id
    );

    if (!logement) return "Sans logement";

    return logement.nom || "Logement sans nom";
  }

  function nomVoyageur(id: string): string {
    const voyageur = voyageurs.find(
      (item) => item.id === id
    );

    if (!voyageur) return "";

    return `${voyageur.prenom || ""} ${
      voyageur.nom || ""
    }`.trim();
  }

  function changerStatut(
    id: string,
    statut: StatutMission
  ) {
    const maintenant = new Date().toISOString();

    setMissions((liste) =>
      liste.map((mission) =>
        mission.id === id
          ? {
              ...mission,
              statut,
              updatedAt: maintenant,
            }
          : mission
      )
    );
  }

  function semainePrecedente() {
    setDateReference((date) =>
      ajouterJours(date, -7)
    );
  }

  function semaineSuivante() {
    setDateReference((date) =>
      ajouterJours(date, 7)
    );
  }

  function revenirAujourdhui() {
    setDateReference(debutDeSemaine(new Date()));
  }

  function reinitialiserFiltres() {
    setFiltreStatut("Tous");
    setFiltrePriorite("Toutes");
    setFiltreType("Tous");
  }

  const filtresActifs =
    filtreStatut !== "Tous" ||
    filtrePriorite !== "Toutes" ||
    filtreType !== "Tous";

  return (
    <div className="space-y-8">
      <PageHeader
        titre="Planning"
        description="Visualisez et organisez toutes les missions de la semaine."
        action={
          <Link
            href="/missions"
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Nouvelle mission
          </Link>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <CarteStatistique
          titre="Cette semaine"
          valeur={statistiques.semaine}
          couleur="blue"
        />

        <CarteStatistique
          titre="Aujourd'hui"
          valeur={statistiques.aujourdHui}
          couleur="green"
        />

        <CarteStatistique
          titre="À réaliser"
          valeur={statistiques.aRealiser}
          couleur="orange"
        />

        <CarteStatistique
          titre="Urgentes"
          valeur={statistiques.urgentes}
          couleur="red"
        />
      </div>

      <Section
        titre="Navigation"
        description={formaterPeriode(
          dateReference,
          finSemaine
        )}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={semainePrecedente}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              ← Semaine précédente
            </button>

            <button
              type="button"
              onClick={revenirAujourdhui}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Aujourd'hui
            </button>

            <button
              type="button"
              onClick={semaineSuivante}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Semaine suivante →
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SelectFiltre
              label="Statut"
              value={filtreStatut}
              onChange={(valeur) =>
                setFiltreStatut(
                  valeur as FiltreStatut
                )
              }
              options={["Tous", ...statutsMission]}
            />

            <SelectFiltre
              label="Priorité"
              value={filtrePriorite}
              onChange={(valeur) =>
                setFiltrePriorite(
                  valeur as FiltrePriorite
                )
              }
              options={["Toutes", ...prioritesMission]}
            />

            <SelectFiltre
              label="Type"
              value={filtreType}
              onChange={(valeur) =>
                setFiltreType(valeur as FiltreType)
              }
              options={[
                "Tous",
                ...typesDisponibles,
              ]}
            />
          </div>
        </div>

        {filtresActifs && (
          <button
            type="button"
            onClick={reinitialiserFiltres}
            className="mt-4 text-sm font-bold text-blue-700 hover:text-blue-800"
          >
            Réinitialiser tous les filtres
          </button>
        )}
      </Section>

      <Section
        titre="Semaine"
        description="Les missions sont classées par jour et par heure."
      >
        {!donneesChargees ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 font-bold text-slate-500">
              Chargement du planning...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-3">
            <div className="grid min-w-[1680px] grid-cols-7 gap-4">
              {joursSemaine.map((date) => {
                const dateISO = dateLocaleISO(date);
                const estAujourdhui =
                  dateISO === aujourdHui;
                const missionsJour =
                  missionsDuJour(date);

                return (
                  <div
                    key={dateISO}
                    className={`min-h-[500px] rounded-3xl border p-4 ${
                      estAujourdhui
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p
                          className={`capitalize font-black ${
                            estAujourdhui
                              ? "text-blue-800"
                              : "text-slate-900"
                          }`}
                        >
                          {formaterJour(date)}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {formaterDateCourte(date)}
                        </p>
                      </div>

                      <span
                        className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-black ${
                          estAujourdhui
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-600"
                        }`}
                      >
                        {missionsJour.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {missionsJour.length > 0 ? (
                        missionsJour.map((mission) => (
                          <CartePlanning
                            key={mission.id}
                            mission={mission}
                            logement={nomLogement(
                              mission.logementId
                            )}
                            voyageur={nomVoyageur(
                              mission.voyageurId
                            )}
                            onChangerStatut={(statut) =>
                              changerStatut(
                                mission.id,
                                statut
                              )
                            }
                          />
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center">
                          <p className="text-sm font-semibold text-slate-400">
                            Aucune mission
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

function CartePlanning({
  mission,
  logement,
  voyageur,
  onChangerStatut,
}: {
  mission: Mission;
  logement: string;
  voyageur: string;
  onChangerStatut: (statut: StatutMission) => void;
}) {
  const prioriteClasses: Record<
    PrioriteMission,
    string
  > = {
    Basse:
      "border-slate-200 bg-slate-100 text-slate-700",
    Normale:
      "border-blue-200 bg-blue-50 text-blue-700",
    Haute:
      "border-orange-200 bg-orange-50 text-orange-700",
    Urgente:
      "border-red-200 bg-red-50 text-red-700",
  };

  const statutClasses: Record<StatutMission, string> = {
    "À faire":
      "bg-orange-100 text-orange-700",
    "En cours":
      "bg-blue-100 text-blue-700",
    Terminée:
      "bg-emerald-100 text-emerald-700",
    Annulée:
      "bg-slate-200 text-slate-500",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-black ${statutClasses[mission.statut]}`}
        >
          {mission.statut}
        </span>

        <span
          className={`rounded-full border px-2 py-1 text-[10px] font-black ${prioriteClasses[mission.priorite]}`}
        >
          {mission.priorite}
        </span>
      </div>

      <p className="mt-3 text-sm font-black text-slate-950">
        {mission.heure || "--:--"} · {mission.titre}
      </p>

      <p className="mt-2 text-xs font-semibold text-violet-700">
        {mission.type}
      </p>

      <div className="mt-3 space-y-1 text-xs text-slate-500">
        <p className="truncate">🏠 {logement}</p>

        {voyageur && (
          <p className="truncate">👤 {voyageur}</p>
        )}

        {mission.assigneA && (
          <p className="truncate">
            🧑‍🔧 {mission.assigneA}
          </p>
        )}
      </div>

      {mission.description && (
        <p className="mt-3 line-clamp-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          {mission.description}
        </p>
      )}

      <select
        value={mission.statut}
        onChange={(event) =>
          onChangerStatut(
            event.target.value as StatutMission
          )
        }
        className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-600"
      >
        {statutsMission.map((statut) => (
          <option key={statut} value={statut}>
            {statut}
          </option>
        ))}
      </select>
    </article>
  );
}

function CarteStatistique({
  titre,
  valeur,
  couleur,
}: {
  titre: string;
  valeur: number;
  couleur: "blue" | "green" | "orange" | "red";
}) {
  const couleurs = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    orange:
      "border-orange-200 bg-orange-50 text-orange-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <span
        className={`inline-flex rounded-2xl border px-3 py-1 text-xs font-bold ${couleurs[couleur]}`}
      >
        {titre}
      </span>

      <p className="mt-5 text-4xl font-black text-slate-950">
        {valeur}
      </p>
    </div>
  );
}

function SelectFiltre({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold text-slate-600">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="min-h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}