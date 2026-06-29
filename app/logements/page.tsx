"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Logement = {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  codePostal: string;
  proprietaire: string;
  telephone: string;
  email: string;
  wifi: string;
  motDePasseWifi: string;
  boiteCles: string;
  codeBoiteCles: string;
  observations: string;
};

const logementVide: Logement = {
  id: "",
  nom: "",
  adresse: "",
  ville: "",
  codePostal: "",
  proprietaire: "",
  telephone: "",
  email: "",
  wifi: "",
  motDePasseWifi: "",
  boiteCles: "",
  codeBoiteCles: "",
  observations: "",
};

export default function LogementsPage() {
  const [logements, setLogements] = useState<Logement[]>([]);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [logementEnCours, setLogementEnCours] =
    useState<Logement>(logementVide);

  useEffect(() => {
    const sauvegarde = localStorage.getItem("cap-serein-logements");
    if (sauvegarde) {
      setLogements(JSON.parse(sauvegarde));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cap-serein-logements", JSON.stringify(logements));
  }, [logements]);

  const logementsFiltres = useMemo(() => {
    return logements.filter((logement) =>
      `${logement.nom} ${logement.ville} ${logement.proprietaire}`
        .toLowerCase()
        .includes(recherche.toLowerCase())
    );
  }, [logements, recherche]);

  function enregistrerLogement() {
    if (!logementEnCours.nom.trim()) {
      alert("Ajoute au minimum le nom du logement.");
      return;
    }

    if (logementEnCours.id) {
      setLogements((actuels) =>
        actuels.map((item) =>
          item.id === logementEnCours.id ? logementEnCours : item
        )
      );
    } else {
      setLogements((actuels) => [
        ...actuels,
        { ...logementEnCours, id: crypto.randomUUID() },
      ]);
    }

    setLogementEnCours(logementVide);
    setFormulaireOuvert(false);
  }

  function modifierLogement(logement: Logement) {
    setLogementEnCours(logement);
    setFormulaireOuvert(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function supprimerLogement(id: string) {
    if (confirm("Supprimer ce logement ?")) {
      setLogements((actuels) => actuels.filter((item) => item.id !== id));
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Gestion des logements
          </h1>
          <p className="mt-2 text-slate-500">
            Créez vos biens, gardez les accès, le Wi-Fi, les codes et les infos
            propriétaires.
          </p>
        </div>

        <button
          onClick={() => {
            setLogementEnCours(logementVide);
            setFormulaireOuvert(true);
          }}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          + Nouveau logement
        </button>
      </div>

      {formulaireOuvert && (
        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {logementEnCours.id
                ? "Modifier le logement"
                : "Ajouter un logement"}
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
              label="Nom du logement"
              value={logementEnCours.nom}
              onChange={(v) =>
                setLogementEnCours({ ...logementEnCours, nom: v })
              }
            />
            <Champ
              label="Propriétaire"
              value={logementEnCours.proprietaire}
              onChange={(v) =>
                setLogementEnCours({ ...logementEnCours, proprietaire: v })
              }
            />
            <Champ
              label="Adresse"
              value={logementEnCours.adresse}
              onChange={(v) =>
                setLogementEnCours({ ...logementEnCours, adresse: v })
              }
            />
            <Champ
              label="Ville"
              value={logementEnCours.ville}
              onChange={(v) =>
                setLogementEnCours({ ...logementEnCours, ville: v })
              }
            />
            <Champ
              label="Code postal"
              value={logementEnCours.codePostal}
              onChange={(v) =>
                setLogementEnCours({ ...logementEnCours, codePostal: v })
              }
            />
            <Champ
              label="Téléphone propriétaire"
              value={logementEnCours.telephone}
              onChange={(v) =>
                setLogementEnCours({ ...logementEnCours, telephone: v })
              }
            />
            <Champ
              label="Email propriétaire"
              value={logementEnCours.email}
              onChange={(v) =>
                setLogementEnCours({ ...logementEnCours, email: v })
              }
            />
            <Champ
              label="Nom du Wi-Fi"
              value={logementEnCours.wifi}
              onChange={(v) =>
                setLogementEnCours({ ...logementEnCours, wifi: v })
              }
            />
            <Champ
              label="Mot de passe Wi-Fi"
              value={logementEnCours.motDePasseWifi}
              onChange={(v) =>
                setLogementEnCours({
                  ...logementEnCours,
                  motDePasseWifi: v,
                })
              }
            />
            <Champ
              label="Boîte à clés / Accès"
              value={logementEnCours.boiteCles}
              onChange={(v) =>
                setLogementEnCours({ ...logementEnCours, boiteCles: v })
              }
            />
            <Champ
              label="Code boîte à clés"
              value={logementEnCours.codeBoiteCles}
              onChange={(v) =>
                setLogementEnCours({
                  ...logementEnCours,
                  codeBoiteCles: v,
                })
              }
            />
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Observations
            </span>
            <textarea
              value={logementEnCours.observations}
              onChange={(e) =>
                setLogementEnCours({
                  ...logementEnCours,
                  observations: e.target.value,
                })
              }
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="Ex : accès parking, étage, consignes propriétaire, particularités..."
            />
          </label>

          <div className="mt-6 flex gap-3">
            <button
              onClick={enregistrerLogement}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Enregistrer
            </button>

            <button
              onClick={() => {
                setLogementEnCours(logementVide);
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
            <h2 className="text-xl font-bold">Vos logements</h2>
            <p className="text-sm text-slate-500">
              {logements.length} logement(s) enregistré(s)
            </p>
          </div>

          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un logement..."
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 md:w-80"
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {logementsFiltres.map((logement) => (
            <div
              key={logement.id}
              className="rounded-2xl border bg-slate-50 p-5"
            >
              <h3 className="text-xl font-bold text-slate-900">
                {logement.nom}
              </h3>
              <p className="mt-1 text-slate-500">
                📍 {logement.adresse} {logement.codePostal} {logement.ville}
              </p>

              <div className="mt-5 space-y-2 text-sm">
                <p>
                  <strong>Propriétaire :</strong>{" "}
                  {logement.proprietaire || "Non renseigné"}
                </p>
                <p>
                  <strong>Téléphone :</strong>{" "}
                  {logement.telephone || "Non renseigné"}
                </p>
                <p>
                  <strong>Wi-Fi :</strong>{" "}
                  {logement.wifi || "Non renseigné"}
                </p>
                <p>
                  <strong>Boîte à clés :</strong>{" "}
                  {logement.boiteCles || "Non renseigné"}
                </p>
                <p>
                  <strong>Code :</strong>{" "}
                  {logement.codeBoiteCles || "Non renseigné"}
                </p>
              </div>

              {logement.observations && (
                <p className="mt-4 rounded-xl bg-white p-3 text-sm text-slate-600">
                  {logement.observations}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/logements/${logement.id}`}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                >
                  Ouvrir
                </Link>

                <button
                  onClick={() => modifierLogement(logement)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Modifier
                </button>

                <button
                  onClick={() => supprimerLogement(logement.id)}
                  className="rounded-lg border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}

          {logementsFiltres.length === 0 && (
            <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500 xl:col-span-3">
              Aucun logement trouvé. Clique sur “+ Nouveau logement” pour
              commencer.
            </div>
          )}
        </div>
      </div>
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
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
      />
    </label>
  );
}