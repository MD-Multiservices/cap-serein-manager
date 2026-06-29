"use client";

import { useEffect, useMemo, useState } from "react";

type Mission = {
  id: string;
  titre: string;
  logement: string;
  voyageur: string;
  type:
    | "Arrivée"
    | "Départ"
    | "État des lieux"
    | "Ménage"
    | "Pressing"
    | "Remise des clés"
    | "Intervention";
  date: string;
  heure: string;
  priorite: "Normale" | "Urgente";
  statut: "À faire" | "En cours" | "Terminé";
  notes: string;
};

const missionVide: Mission = {
  id: "",
  titre: "",
  logement: "",
  voyageur: "",
  type: "Arrivée",
  date: "",
  heure: "",
  priorite: "Normale",
  statut: "À faire",
  notes: "",
};

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionEnCours, setMissionEnCours] = useState<Mission>(missionVide);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [filtre, setFiltre] = useState("Tous");

  useEffect(() => {
    setMissions(JSON.parse(localStorage.getItem("cap-serein-missions") || "[]"));
  }, []);

  useEffect(() => {
    localStorage.setItem("cap-serein-missions", JSON.stringify(missions));
  }, [missions]);

  const missionsFiltrees = useMemo(() => {
    return missions
      .filter((mission) => filtre === "Tous" || mission.statut === filtre)
      .sort((a, b) => `${a.date} ${a.heure}`.localeCompare(`${b.date} ${b.heure}`));
  }, [missions, filtre]);

  function enregistrerMission() {
    if (!missionEnCours.titre || !missionEnCours.date || !missionEnCours.heure) {
      alert("Renseigne au minimum le titre, la date et l’heure.");
      return;
    }

    if (missionEnCours.id) {
      setMissions((actuelles) =>
        actuelles.map((item) =>
          item.id === missionEnCours.id ? missionEnCours : item
        )
      );
    } else {
      setMissions((actuelles) => [
        ...actuelles,
        { ...missionEnCours, id: crypto.randomUUID() },
      ]);
    }

    setMissionEnCours(missionVide);
    setFormulaireOuvert(false);
  }

  function modifierMission(mission: Mission) {
    setMissionEnCours(mission);
    setFormulaireOuvert(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function supprimerMission(id: string) {
    if (!confirm("Supprimer cette mission ?")) return;
    setMissions((actuelles) => actuelles.filter((item) => item.id !== id));
  }

  function changerStatut(id: string, statut: Mission["statut"]) {
    setMissions((actuelles) =>
      actuelles.map((item) => (item.id === id ? { ...item, statut } : item))
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Missions</h1>
          <p className="mt-2 text-slate-500">
            Le centre de contrôle : arrivées, départs, états des lieux, ménage,
            pressing, clés et interventions.
          </p>
        </div>

        <button
          onClick={() => {
            setMissionEnCours(missionVide);
            setFormulaireOuvert(true);
          }}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          + Nouvelle mission
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Stat title="Total" value={String(missions.length)} />
        <Stat title="À faire" value={String(missions.filter((m) => m.statut === "À faire").length)} />
        <Stat title="En cours" value={String(missions.filter((m) => m.statut === "En cours").length)} />
        <Stat title="Terminées" value={String(missions.filter((m) => m.statut === "Terminé").length)} />
      </div>

      {formulaireOuvert && (
        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {missionEnCours.id ? "Modifier la mission" : "Nouvelle mission"}
            </h2>

            <button
              onClick={() => setFormulaireOuvert(false)}
              className="rounded-xl border px-4 py-2 hover:bg-slate-100"
            >
              Fermer
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Champ
              label="Titre"
              value={missionEnCours.titre}
              onChange={(v) => setMissionEnCours({ ...missionEnCours, titre: v })}
            />

            <Champ
              label="Logement"
              value={missionEnCours.logement}
              onChange={(v) => setMissionEnCours({ ...missionEnCours, logement: v })}
            />

            <Champ
              label="Voyageur"
              value={missionEnCours.voyageur}
              onChange={(v) => setMissionEnCours({ ...missionEnCours, voyageur: v })}
            />

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Type de mission
              </span>
              <select
                value={missionEnCours.type}
                onChange={(e) =>
                  setMissionEnCours({
                    ...missionEnCours,
                    type: e.target.value as Mission["type"],
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              >
                <option>Arrivée</option>
                <option>Départ</option>
                <option>État des lieux</option>
                <option>Ménage</option>
                <option>Pressing</option>
                <option>Remise des clés</option>
                <option>Intervention</option>
              </select>
            </label>

            <Champ
              label="Date"
              type="date"
              value={missionEnCours.date}
              onChange={(v) => setMissionEnCours({ ...missionEnCours, date: v })}
            />

            <Champ
              label="Heure"
              type="time"
              value={missionEnCours.heure}
              onChange={(v) => setMissionEnCours({ ...missionEnCours, heure: v })}
            />

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Priorité
              </span>
              <select
                value={missionEnCours.priorite}
                onChange={(e) =>
                  setMissionEnCours({
                    ...missionEnCours,
                    priorite: e.target.value as Mission["priorite"],
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              >
                <option>Normale</option>
                <option>Urgente</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Statut
              </span>
              <select
                value={missionEnCours.statut}
                onChange={(e) =>
                  setMissionEnCours({
                    ...missionEnCours,
                    statut: e.target.value as Mission["statut"],
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              >
                <option>À faire</option>
                <option>En cours</option>
                <option>Terminé</option>
              </select>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Notes
            </span>
            <textarea
              value={missionEnCours.notes}
              onChange={(e) =>
                setMissionEnCours({ ...missionEnCours, notes: e.target.value })
              }
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="Consignes, accès, clés, linge, ménage, propriétaire, intervention..."
            />
          </label>

          <div className="mt-6 flex gap-3">
            <button
              onClick={enregistrerMission}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Enregistrer
            </button>

            <button
              onClick={() => {
                setMissionEnCours(missionVide);
                setFormulaireOuvert(false);
              }}
              className="rounded-xl border px-6 py-3 font-semibold hover:bg-slate-100"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-white p-6 shadow">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Liste des missions</h2>
            <p className="text-sm text-slate-500">
              Toutes les actions opérationnelles à suivre.
            </p>
          </div>

          <select
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
          >
            <option>Tous</option>
            <option>À faire</option>
            <option>En cours</option>
            <option>Terminé</option>
          </select>
        </div>

        <div className="mt-6 space-y-4">
          {missionsFiltrees.map((mission) => (
            <div key={mission.id} className="rounded-2xl border bg-slate-50 p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-600">
                    {mission.type} · {mission.statut} · {mission.priorite}
                  </p>

                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    {mission.titre}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {mission.date} à {mission.heure}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    <strong>Logement :</strong>{" "}
                    {mission.logement || "Non renseigné"}
                  </p>

                  <p className="text-sm text-slate-600">
                    <strong>Voyageur :</strong>{" "}
                    {mission.voyageur || "Non renseigné"}
                  </p>

                  {mission.notes && (
                    <p className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-600">
                      {mission.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => changerStatut(mission.id, "À faire")}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-white"
                  >
                    À faire
                  </button>

                  <button
                    onClick={() => changerStatut(mission.id, "En cours")}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-white"
                  >
                    En cours
                  </button>

                  <button
                    onClick={() => changerStatut(mission.id, "Terminé")}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-white"
                  >
                    Terminé
                  </button>

                  <button
                    onClick={() => modifierMission(mission)}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    Modifier
                  </button>

                  <button
                    onClick={() => supprimerMission(mission.id)}
                    className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}

          {missionsFiltrees.length === 0 && (
            <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
              Aucune mission enregistrée.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-3 text-4xl font-bold text-slate-900">{value}</p>
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