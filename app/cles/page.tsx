"use client";

import { useEffect, useMemo, useState } from "react";

type Logement = {
  id: string;
  nom: string;
  ville: string;
};

type JeuCles = {
  id: string;
  logementId: string;
  nom: string;
  type: "Clés" | "Badge" | "Télécommande" | "Boîte à clés" | "Autre";
  quantite: number;
  emplacement: string;
  code: string;
  statut: "Disponible" | "Remis au voyageur" | "Chez propriétaire" | "Chez sous-traitant" | "Perdu";
  detenteur: string;
  notes: string;
};

const cleVide: JeuCles = {
  id: "",
  logementId: "",
  nom: "",
  type: "Clés",
  quantite: 1,
  emplacement: "",
  code: "",
  statut: "Disponible",
  detenteur: "",
  notes: "",
};

export default function ClesPage() {
  const [logements, setLogements] = useState<Logement[]>([]);
  const [cles, setCles] = useState<JeuCles[]>([]);
  const [cleEnCours, setCleEnCours] = useState<JeuCles>(cleVide);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [filtre, setFiltre] = useState("Tous");

  useEffect(() => {
    setLogements(JSON.parse(localStorage.getItem("cap-serein-logements") || "[]"));
    setCles(JSON.parse(localStorage.getItem("cap-serein-cles") || "[]"));
  }, []);

  useEffect(() => {
    localStorage.setItem("cap-serein-cles", JSON.stringify(cles));
  }, [cles]);

  const clesFiltrees = useMemo(() => {
    return cles.filter((cle) => filtre === "Tous" || cle.statut === filtre);
  }, [cles, filtre]);

  function nomLogement(id: string) {
    const logement = logements.find((item) => item.id === id);
    return logement ? `${logement.nom} — ${logement.ville}` : "Logement non sélectionné";
  }

  function enregistrerCle() {
    if (!cleEnCours.logementId || !cleEnCours.nom) {
      alert("Renseigne au minimum le logement et le nom du jeu de clés.");
      return;
    }

    if (cleEnCours.id) {
      setCles((actuelles) =>
        actuelles.map((item) => (item.id === cleEnCours.id ? cleEnCours : item))
      );
    } else {
      setCles((actuelles) => [
        ...actuelles,
        { ...cleEnCours, id: crypto.randomUUID() },
      ]);
    }

    setCleEnCours(cleVide);
    setFormulaireOuvert(false);
  }

  function modifierCle(cle: JeuCles) {
    setCleEnCours(cle);
    setFormulaireOuvert(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function supprimerCle(id: string) {
    if (!confirm("Supprimer cet élément ?")) return;
    setCles((actuelles) => actuelles.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clés & accès</h1>
          <p className="mt-2 text-slate-500">
            Suivez les clés, badges, télécommandes, boîtes à clés, codes et détenteurs.
          </p>
        </div>

        <button
          onClick={() => {
            setCleEnCours(cleVide);
            setFormulaireOuvert(true);
          }}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          + Ajouter un accès
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Stat title="Total" value={String(cles.length)} />
        <Stat title="Disponibles" value={String(cles.filter((c) => c.statut === "Disponible").length)} />
        <Stat title="Remis voyageur" value={String(cles.filter((c) => c.statut === "Remis au voyageur").length)} />
        <Stat title="Perdus" value={String(cles.filter((c) => c.statut === "Perdu").length)} />
      </div>

      {formulaireOuvert && (
        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {cleEnCours.id ? "Modifier l’accès" : "Ajouter un accès"}
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
                value={cleEnCours.logementId}
                onChange={(e) => setCleEnCours({ ...cleEnCours, logementId: e.target.value })}
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

            <Champ label="Nom" value={cleEnCours.nom} onChange={(v) => setCleEnCours({ ...cleEnCours, nom: v })} />

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">Type</span>
              <select
                value={cleEnCours.type}
                onChange={(e) => setCleEnCours({ ...cleEnCours, type: e.target.value as JeuCles["type"] })}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              >
                <option>Clés</option>
                <option>Badge</option>
                <option>Télécommande</option>
                <option>Boîte à clés</option>
                <option>Autre</option>
              </select>
            </label>

            <Nombre label="Quantité" value={cleEnCours.quantite} onChange={(v) => setCleEnCours({ ...cleEnCours, quantite: v })} />

            <Champ label="Emplacement" value={cleEnCours.emplacement} onChange={(v) => setCleEnCours({ ...cleEnCours, emplacement: v })} />
            <Champ label="Code / digicode" value={cleEnCours.code} onChange={(v) => setCleEnCours({ ...cleEnCours, code: v })} />
            <Champ label="Détenteur actuel" value={cleEnCours.detenteur} onChange={(v) => setCleEnCours({ ...cleEnCours, detenteur: v })} />

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">Statut</span>
              <select
                value={cleEnCours.statut}
                onChange={(e) => setCleEnCours({ ...cleEnCours, statut: e.target.value as JeuCles["statut"] })}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              >
                <option>Disponible</option>
                <option>Remis au voyageur</option>
                <option>Chez propriétaire</option>
                <option>Chez sous-traitant</option>
                <option>Perdu</option>
              </select>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Notes</span>
            <textarea
              value={cleEnCours.notes}
              onChange={(e) => setCleEnCours({ ...cleEnCours, notes: e.target.value })}
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="Ex : boîte à clés à droite du portail, code à changer après chaque séjour..."
            />
          </label>

          <div className="mt-6 flex gap-3">
            <button
              onClick={enregistrerCle}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Enregistrer
            </button>

            <button
              onClick={() => {
                setCleEnCours(cleVide);
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
            <h2 className="text-xl font-bold">Liste des accès</h2>
            <p className="text-sm text-slate-500">
              Centralisation des clés et codes par logement.
            </p>
          </div>

          <select
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
          >
            <option>Tous</option>
            <option>Disponible</option>
            <option>Remis au voyageur</option>
            <option>Chez propriétaire</option>
            <option>Chez sous-traitant</option>
            <option>Perdu</option>
          </select>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {clesFiltrees.map((cle) => (
            <div key={cle.id} className="rounded-2xl border bg-slate-50 p-5">
              <p className="text-sm font-semibold text-blue-600">
                {cle.type} · {cle.statut}
              </p>

              <h3 className="mt-1 text-xl font-bold text-slate-900">{cle.nom}</h3>

              <p className="mt-1 text-sm text-slate-500">
                {nomLogement(cle.logementId)}
              </p>

              <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                <p><strong>Quantité :</strong> {cle.quantite}</p>
                <p><strong>Détenteur :</strong> {cle.detenteur || "Non renseigné"}</p>
                <p><strong>Emplacement :</strong> {cle.emplacement || "Non renseigné"}</p>
                <p><strong>Code :</strong> {cle.code || "Non renseigné"}</p>
              </div>

              {cle.notes && (
                <p className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-600">
                  {cle.notes}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => modifierCle(cle)}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                >
                  Modifier
                </button>

                <button
                  onClick={() => supprimerCle(cle.id)}
                  className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}

          {clesFiltrees.length === 0 && (
            <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500 xl:col-span-2">
              Aucun accès enregistré.
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
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
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
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