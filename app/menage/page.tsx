"use client";

import { useEffect, useMemo, useState } from "react";

type Logement = {
  id: string;
  nom: string;
  ville: string;
};

type MissionMenage = {
  id: string;
  logementId: string;
  date: string;
  heure: string;
  priorite: "Normale" | "Urgente";
  statut: "À faire" | "En cours" | "Terminé";
  intervenant: string;
  checklist: {
    sols: boolean;
    cuisine: boolean;
    salleDeBain: boolean;
    wc: boolean;
    literie: boolean;
    poubelles: boolean;
    consommables: boolean;
    photosFinales: boolean;
  };
  notes: string;
};

const missionVide: MissionMenage = {
  id: "",
  logementId: "",
  date: "",
  heure: "",
  priorite: "Normale",
  statut: "À faire",
  intervenant: "",
  checklist: {
    sols: false,
    cuisine: false,
    salleDeBain: false,
    wc: false,
    literie: false,
    poubelles: false,
    consommables: false,
    photosFinales: false,
  },
  notes: "",
};

export default function MenagePage() {
  const [logements, setLogements] = useState<Logement[]>([]);
  const [missions, setMissions] = useState<MissionMenage[]>([]);
  const [missionEnCours, setMissionEnCours] = useState<MissionMenage>(missionVide);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [filtre, setFiltre] = useState("Tous");

  useEffect(() => {
    const sauvegardeLogements = localStorage.getItem("cap-serein-logements");
    const sauvegardeMissions = localStorage.getItem("cap-serein-menage");

    setLogements(sauvegardeLogements ? JSON.parse(sauvegardeLogements) : []);
    setMissions(sauvegardeMissions ? JSON.parse(sauvegardeMissions) : []);
  }, []);

  useEffect(() => {
    localStorage.setItem("cap-serein-menage", JSON.stringify(missions));
  }, [missions]);

  const missionsFiltrees = useMemo(() => {
    return [...missions]
      .filter((mission) => filtre === "Tous" || mission.statut === filtre)
      .sort((a, b) => `${a.date} ${a.heure}`.localeCompare(`${b.date} ${b.heure}`));
  }, [missions, filtre]);

  function nomLogement(id: string) {
    const logement = logements.find((item) => item.id === id);
    return logement ? `${logement.nom} — ${logement.ville}` : "Logement non sélectionné";
  }

  function enregistrerMission() {
    if (!missionEnCours.date || !missionEnCours.heure || !missionEnCours.logementId) {
      alert("Renseigne au minimum le logement, la date et l'heure.");
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

  function modifierMission(mission: MissionMenage) {
    setMissionEnCours(mission);
    setFormulaireOuvert(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function supprimerMission(id: string) {
    if (!confirm("Supprimer cette mission ménage ?")) return;
    setMissions((actuelles) => actuelles.filter((item) => item.id !== id));
  }

  function changerStatut(id: string, statut: MissionMenage["statut"]) {
    setMissions((actuelles) =>
      actuelles.map((item) => (item.id === id ? { ...item, statut } : item))
    );
  }

  function progression(mission: MissionMenage) {
    const valeurs = Object.values(mission.checklist);
    const cochees = valeurs.filter(Boolean).length;
    return Math.round((cochees / valeurs.length) * 100);
  }

  function toggleChecklist(key: keyof MissionMenage["checklist"]) {
    setMissionEnCours({
      ...missionEnCours,
      checklist: {
        ...missionEnCours.checklist,
        [key]: !missionEnCours.checklist[key],
      },
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ménage</h1>
          <p className="mt-2 text-slate-500">
            Créez, suivez et validez les missions de ménage avant les arrivées.
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
              {missionEnCours.id ? "Modifier la mission" : "Nouvelle mission ménage"}
            </h2>

            <button
              onClick={() => setFormulaireOuvert(false)}
              className="rounded-xl border px-4 py-2 hover:bg-slate-100"
            >
              Fermer
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Logement
              </span>
              <select
                value={missionEnCours.logementId}
                onChange={(e) =>
                  setMissionEnCours({ ...missionEnCours, logementId: e.target.value })
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

            <Champ
              label="Intervenant"
              value={missionEnCours.intervenant}
              onChange={(v) => setMissionEnCours({ ...missionEnCours, intervenant: v })}
            />

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
                    priorite: e.target.value as MissionMenage["priorite"],
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
                    statut: e.target.value as MissionMenage["statut"],
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

          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <h3 className="font-bold text-slate-900">Checklist ménage</h3>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Check label="Sols faits" checked={missionEnCours.checklist.sols} onClick={() => toggleChecklist("sols")} />
              <Check label="Cuisine propre" checked={missionEnCours.checklist.cuisine} onClick={() => toggleChecklist("cuisine")} />
              <Check label="Salle de bain propre" checked={missionEnCours.checklist.salleDeBain} onClick={() => toggleChecklist("salleDeBain")} />
              <Check label="WC propres" checked={missionEnCours.checklist.wc} onClick={() => toggleChecklist("wc")} />
              <Check label="Literie prête" checked={missionEnCours.checklist.literie} onClick={() => toggleChecklist("literie")} />
              <Check label="Poubelles sorties" checked={missionEnCours.checklist.poubelles} onClick={() => toggleChecklist("poubelles")} />
              <Check label="Consommables vérifiés" checked={missionEnCours.checklist.consommables} onClick={() => toggleChecklist("consommables")} />
              <Check label="Photos finales prises" checked={missionEnCours.checklist.photosFinales} onClick={() => toggleChecklist("photosFinales")} />
            </div>
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
              placeholder="Ex : changer les draps, vérifier frigo, remettre papier toilette, photos après ménage..."
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
            <h2 className="text-xl font-bold">Missions ménage</h2>
            <p className="text-sm text-slate-500">
              Suivi simple et opérationnel des prestations.
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
                    {mission.statut} · {mission.priorite}
                  </p>

                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    {nomLogement(mission.logementId)}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {mission.date} à {mission.heure} · Intervenant :{" "}
                    {mission.intervenant || "Non renseigné"}
                  </p>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${progression(mission)}%` }}
                    />
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Checklist : {progression(mission)}%
                  </p>

                  {mission.notes && (
                    <p className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-600">
                      {mission.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => changerStatut(mission.id, "À faire")} className="rounded-lg border px-3 py-2 text-sm hover:bg-white">
                    À faire
                  </button>
                  <button onClick={() => changerStatut(mission.id, "En cours")} className="rounded-lg border px-3 py-2 text-sm hover:bg-white">
                    En cours
                  </button>
                  <button onClick={() => changerStatut(mission.id, "Terminé")} className="rounded-lg border px-3 py-2 text-sm hover:bg-white">
                    Terminé
                  </button>
                  <button onClick={() => modifierMission(mission)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
                    Modifier
                  </button>
                  <button onClick={() => supprimerMission(mission.id)} className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}

          {missionsFiltrees.length === 0 && (
            <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
              Aucune mission ménage enregistrée.
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

function Check({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left font-semibold ${
        checked
          ? "border-blue-600 bg-blue-50 text-blue-700"
          : "bg-white text-slate-700 hover:bg-slate-100"
      }`}
    >
      {checked ? "✅" : "⬜"} {label}
    </button>
  );
}