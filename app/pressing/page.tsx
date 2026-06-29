"use client";

import { useEffect, useMemo, useState } from "react";

type Logement = {
  id: string;
  nom: string;
  ville: string;
};

type MissionPressing = {
  id: string;
  logementId: string;
  dateRecuperation: string;
  heureRecuperation: string;
  dateRetour: string;
  heureRetour: string;
  pressing: string;
  statut: "À récupérer" | "Récupéré" | "En traitement" | "Livré" | "Terminé";
  draps: number;
  serviettes: number;
  housses: number;
  torchons: number;
  notes: string;
};

const missionVide: MissionPressing = {
  id: "",
  logementId: "",
  dateRecuperation: "",
  heureRecuperation: "",
  dateRetour: "",
  heureRetour: "",
  pressing: "",
  statut: "À récupérer",
  draps: 0,
  serviettes: 0,
  housses: 0,
  torchons: 0,
  notes: "",
};

export default function PressingPage() {
  const [logements, setLogements] = useState<Logement[]>([]);
  const [missions, setMissions] = useState<MissionPressing[]>([]);
  const [missionEnCours, setMissionEnCours] =
    useState<MissionPressing>(missionVide);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [filtre, setFiltre] = useState("Tous");

  useEffect(() => {
    setLogements(
      JSON.parse(localStorage.getItem("cap-serein-logements") || "[]")
    );
    setMissions(
      JSON.parse(localStorage.getItem("cap-serein-pressing") || "[]")
    );
  }, []);

  useEffect(() => {
    localStorage.setItem("cap-serein-pressing", JSON.stringify(missions));
  }, [missions]);

  const missionsFiltrees = useMemo(() => {
    return missions
      .filter((mission) => filtre === "Tous" || mission.statut === filtre)
      .sort((a, b) =>
        `${a.dateRecuperation} ${a.heureRecuperation}`.localeCompare(
          `${b.dateRecuperation} ${b.heureRecuperation}`
        )
      );
  }, [missions, filtre]);

  function nomLogement(id: string) {
    const logement = logements.find((item) => item.id === id);
    return logement ? `${logement.nom} — ${logement.ville}` : "Logement non sélectionné";
  }

  function enregistrerMission() {
    if (!missionEnCours.logementId || !missionEnCours.dateRecuperation) {
      alert("Renseigne au minimum le logement et la date de récupération.");
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

  function modifierMission(mission: MissionPressing) {
    setMissionEnCours(mission);
    setFormulaireOuvert(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function supprimerMission(id: string) {
    if (!confirm("Supprimer cette mission pressing ?")) return;
    setMissions((actuelles) => actuelles.filter((item) => item.id !== id));
  }

  function totalPieces(mission: MissionPressing) {
    return mission.draps + mission.serviettes + mission.housses + mission.torchons;
  }

  function changerStatut(id: string, statut: MissionPressing["statut"]) {
    setMissions((actuelles) =>
      actuelles.map((item) => (item.id === id ? { ...item, statut } : item))
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pressing</h1>
          <p className="mt-2 text-slate-500">
            Gérez les récupérations, retours et quantités de linge par logement.
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
        <Stat title="Missions" value={String(missions.length)} />
        <Stat
          title="À récupérer"
          value={String(missions.filter((m) => m.statut === "À récupérer").length)}
        />
        <Stat
          title="En traitement"
          value={String(missions.filter((m) => m.statut === "En traitement").length)}
        />
        <Stat
          title="Pièces de linge"
          value={String(missions.reduce((total, m) => total + totalPieces(m), 0))}
        />
      </div>

      {formulaireOuvert && (
        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {missionEnCours.id ? "Modifier la mission pressing" : "Nouvelle mission pressing"}
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
              label="Nom du pressing / sous-traitant"
              value={missionEnCours.pressing}
              onChange={(v) => setMissionEnCours({ ...missionEnCours, pressing: v })}
            />

            <Champ
              label="Date récupération"
              type="date"
              value={missionEnCours.dateRecuperation}
              onChange={(v) =>
                setMissionEnCours({ ...missionEnCours, dateRecuperation: v })
              }
            />

            <Champ
              label="Heure récupération"
              type="time"
              value={missionEnCours.heureRecuperation}
              onChange={(v) =>
                setMissionEnCours({ ...missionEnCours, heureRecuperation: v })
              }
            />

            <Champ
              label="Date retour"
              type="date"
              value={missionEnCours.dateRetour}
              onChange={(v) =>
                setMissionEnCours({ ...missionEnCours, dateRetour: v })
              }
            />

            <Champ
              label="Heure retour"
              type="time"
              value={missionEnCours.heureRetour}
              onChange={(v) =>
                setMissionEnCours({ ...missionEnCours, heureRetour: v })
              }
            />

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Statut
              </span>
              <select
                value={missionEnCours.statut}
                onChange={(e) =>
                  setMissionEnCours({
                    ...missionEnCours,
                    statut: e.target.value as MissionPressing["statut"],
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              >
                <option>À récupérer</option>
                <option>Récupéré</option>
                <option>En traitement</option>
                <option>Livré</option>
                <option>Terminé</option>
              </select>
            </label>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <h3 className="font-bold text-slate-900">Quantités de linge</h3>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <Nombre
                label="Draps"
                value={missionEnCours.draps}
                onChange={(v) => setMissionEnCours({ ...missionEnCours, draps: v })}
              />
              <Nombre
                label="Serviettes"
                value={missionEnCours.serviettes}
                onChange={(v) =>
                  setMissionEnCours({ ...missionEnCours, serviettes: v })
                }
              />
              <Nombre
                label="Housses"
                value={missionEnCours.housses}
                onChange={(v) =>
                  setMissionEnCours({ ...missionEnCours, housses: v })
                }
              />
              <Nombre
                label="Torchons"
                value={missionEnCours.torchons}
                onChange={(v) =>
                  setMissionEnCours({ ...missionEnCours, torchons: v })
                }
              />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-600">
              Total : {totalPieces(missionEnCours)} pièce(s)
            </p>
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
              placeholder="Ex : sacs à récupérer, consignes d’accès, linge taché, livraison avant 15h..."
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
            <h2 className="text-xl font-bold">Missions pressing</h2>
            <p className="text-sm text-slate-500">
              Suivi des rotations de linge.
            </p>
          </div>

          <select
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
          >
            <option>Tous</option>
            <option>À récupérer</option>
            <option>Récupéré</option>
            <option>En traitement</option>
            <option>Livré</option>
            <option>Terminé</option>
          </select>
        </div>

        <div className="mt-6 space-y-4">
          {missionsFiltrees.map((mission) => (
            <div key={mission.id} className="rounded-2xl border bg-slate-50 p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-600">
                    {mission.statut} · {totalPieces(mission)} pièce(s)
                  </p>

                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    {nomLogement(mission.logementId)}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Récupération : {mission.dateRecuperation || "Non renseignée"}{" "}
                    {mission.heureRecuperation && `à ${mission.heureRecuperation}`}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Retour : {mission.dateRetour || "Non renseigné"}{" "}
                    {mission.heureRetour && `à ${mission.heureRetour}`}
                  </p>

                  <p className="mt-3 text-sm text-slate-600">
                    Draps : {mission.draps} · Serviettes : {mission.serviettes} ·
                    Housses : {mission.housses} · Torchons : {mission.torchons}
                  </p>

                  {mission.notes && (
                    <p className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-600">
                      {mission.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => changerStatut(mission.id, "À récupérer")} className="rounded-lg border px-3 py-2 text-sm hover:bg-white">
                    À récupérer
                  </button>
                  <button onClick={() => changerStatut(mission.id, "En traitement")} className="rounded-lg border px-3 py-2 text-sm hover:bg-white">
                    En traitement
                  </button>
                  <button onClick={() => changerStatut(mission.id, "Livré")} className="rounded-lg border px-3 py-2 text-sm hover:bg-white">
                    Livré
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
              Aucune mission pressing enregistrée.
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