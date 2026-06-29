"use client";

import { useEffect, useMemo, useState } from "react";

type Logement = {
  id: string;
  nom: string;
  ville: string;
};

type EvenementPlanning = {
  id: string;
  logementId: string;
  type: "Arrivée" | "Départ" | "Ménage" | "Pressing" | "Contrôle" | "Intervention";
  date: string;
  heure: string;
  titre: string;
  statut: "À faire" | "En cours" | "Terminé";
  notes: string;
};

const evenementVide: EvenementPlanning = {
  id: "",
  logementId: "",
  type: "Arrivée",
  date: "",
  heure: "",
  titre: "",
  statut: "À faire",
  notes: "",
};

export default function PlanningPage() {
  const [logements, setLogements] = useState<Logement[]>([]);
  const [evenements, setEvenements] = useState<EvenementPlanning[]>([]);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [evenementEnCours, setEvenementEnCours] =
    useState<EvenementPlanning>(evenementVide);
  const [filtreStatut, setFiltreStatut] = useState("Tous");

  useEffect(() => {
    const sauvegardeLogements = localStorage.getItem("cap-serein-logements");
    const sauvegardePlanning = localStorage.getItem("cap-serein-planning");

    setLogements(sauvegardeLogements ? JSON.parse(sauvegardeLogements) : []);
    setEvenements(sauvegardePlanning ? JSON.parse(sauvegardePlanning) : []);
  }, []);

  useEffect(() => {
    localStorage.setItem("cap-serein-planning", JSON.stringify(evenements));
  }, [evenements]);

  const evenementsTries = useMemo(() => {
    return [...evenements]
      .filter((event) => filtreStatut === "Tous" || event.statut === filtreStatut)
      .sort((a, b) => `${a.date} ${a.heure}`.localeCompare(`${b.date} ${b.heure}`));
  }, [evenements, filtreStatut]);

  function nomLogement(id: string) {
    const logement = logements.find((item) => item.id === id);
    return logement ? `${logement.nom} — ${logement.ville}` : "Logement non sélectionné";
  }

  function enregistrerEvenement() {
    if (!evenementEnCours.date || !evenementEnCours.heure || !evenementEnCours.titre) {
      alert("Renseigne au minimum la date, l'heure et le titre.");
      return;
    }

    if (evenementEnCours.id) {
      setEvenements((actuels) =>
        actuels.map((item) =>
          item.id === evenementEnCours.id ? evenementEnCours : item
        )
      );
    } else {
      setEvenements((actuels) => [
        ...actuels,
        { ...evenementEnCours, id: crypto.randomUUID() },
      ]);
    }

    setEvenementEnCours(evenementVide);
    setFormulaireOuvert(false);
  }

  function modifierEvenement(event: EvenementPlanning) {
    setEvenementEnCours(event);
    setFormulaireOuvert(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function supprimerEvenement(id: string) {
    if (!confirm("Supprimer cet événement ?")) return;
    setEvenements((actuels) => actuels.filter((item) => item.id !== id));
  }

  function changerStatut(id: string, statut: EvenementPlanning["statut"]) {
    setEvenements((actuels) =>
      actuels.map((item) => (item.id === id ? { ...item, statut } : item))
    );
  }

  const totalAFaire = evenements.filter((item) => item.statut === "À faire").length;
  const totalEnCours = evenements.filter((item) => item.statut === "En cours").length;
  const totalTermine = evenements.filter((item) => item.statut === "Terminé").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Planning</h1>
          <p className="mt-2 text-slate-500">
            Planifiez les arrivées, départs, ménages, pressing, contrôles et interventions.
          </p>
        </div>

        <button
          onClick={() => {
            setEvenementEnCours(evenementVide);
            setFormulaireOuvert(true);
          }}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          + Nouvel événement
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Stat title="Total" value={String(evenements.length)} />
        <Stat title="À faire" value={String(totalAFaire)} />
        <Stat title="En cours" value={String(totalEnCours)} />
        <Stat title="Terminés" value={String(totalTermine)} />
      </div>

      {formulaireOuvert && (
        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {evenementEnCours.id ? "Modifier l’événement" : "Nouvel événement"}
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
              value={evenementEnCours.titre}
              onChange={(v) => setEvenementEnCours({ ...evenementEnCours, titre: v })}
            />

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Logement
              </span>
              <select
                value={evenementEnCours.logementId}
                onChange={(e) =>
                  setEvenementEnCours({
                    ...evenementEnCours,
                    logementId: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              >
                <option value="">Aucun logement</option>
                {logements.map((logement) => (
                  <option key={logement.id} value={logement.id}>
                    {logement.nom} — {logement.ville}
                  </option>
                ))}
              </select>
            </label>

            <Champ
              label="Date"
              type="date"
              value={evenementEnCours.date}
              onChange={(v) => setEvenementEnCours({ ...evenementEnCours, date: v })}
            />

            <Champ
              label="Heure"
              type="time"
              value={evenementEnCours.heure}
              onChange={(v) => setEvenementEnCours({ ...evenementEnCours, heure: v })}
            />

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Type
              </span>
              <select
                value={evenementEnCours.type}
                onChange={(e) =>
                  setEvenementEnCours({
                    ...evenementEnCours,
                    type: e.target.value as EvenementPlanning["type"],
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              >
                <option>Arrivée</option>
                <option>Départ</option>
                <option>Ménage</option>
                <option>Pressing</option>
                <option>Contrôle</option>
                <option>Intervention</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Statut
              </span>
              <select
                value={evenementEnCours.statut}
                onChange={(e) =>
                  setEvenementEnCours({
                    ...evenementEnCours,
                    statut: e.target.value as EvenementPlanning["statut"],
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
              value={evenementEnCours.notes}
              onChange={(e) =>
                setEvenementEnCours({ ...evenementEnCours, notes: e.target.value })
              }
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="Consignes, accès, linge, ménage, client, propriétaire..."
            />
          </label>

          <div className="mt-6 flex gap-3">
            <button
              onClick={enregistrerEvenement}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Enregistrer
            </button>

            <button
              onClick={() => {
                setEvenementEnCours(evenementVide);
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
            <h2 className="text-xl font-bold">Événements</h2>
            <p className="text-sm text-slate-500">
              Suivi opérationnel de la conciergerie.
            </p>
          </div>

          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
          >
            <option>Tous</option>
            <option>À faire</option>
            <option>En cours</option>
            <option>Terminé</option>
          </select>
        </div>

        <div className="mt-6 space-y-4">
          {evenementsTries.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl border bg-slate-50 p-5"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-600">
                    {event.type} · {event.statut}
                  </p>

                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    {event.titre}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {event.date} à {event.heure} · {nomLogement(event.logementId)}
                  </p>

                  {event.notes && (
                    <p className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-600">
                      {event.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => changerStatut(event.id, "À faire")}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-white"
                  >
                    À faire
                  </button>

                  <button
                    onClick={() => changerStatut(event.id, "En cours")}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-white"
                  >
                    En cours
                  </button>

                  <button
                    onClick={() => changerStatut(event.id, "Terminé")}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-white"
                  >
                    Terminé
                  </button>

                  <button
                    onClick={() => modifierEvenement(event)}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    Modifier
                  </button>

                  <button
                    onClick={() => supprimerEvenement(event.id)}
                    className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}

          {evenementsTries.length === 0 && (
            <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
              Aucun événement enregistré.
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