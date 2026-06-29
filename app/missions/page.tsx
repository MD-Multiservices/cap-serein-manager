"use client";

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

const typesMission: TypeMission[] = [
  "Arrivée",
  "Départ",
  "État des lieux entrée",
  "État des lieux sortie",
  "Remise des clés",
  "Récupération des clés",
  "Ménage",
  "Pressing",
  "Maintenance",
  "Intervention",
];

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

function creerMissionVide(): Mission {
  const maintenant = new Date().toISOString();

  return {
    id: "",
    logementId: "",
    proprietaireId: "",
    voyageurId: "",
    type: "Arrivée",
    titre: "",
    description: "",
    date: "",
    heure: "",
    priorite: "Normale",
    statut: "À faire",
    assigneA: "",
    createdAt: maintenant,
    updatedAt: maintenant,
  };
}

function creerIdentifiant(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `mission-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normaliserTexte(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [logements, setLogements] = useState<Logement[]>([]);
  const [voyageurs, setVoyageurs] = useState<Voyageur[]>([]);

  const [missionEnCours, setMissionEnCours] =
    useState<Mission>(creerMissionVide());

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [donneesChargees, setDonneesChargees] = useState(false);
  const [erreur, setErreur] = useState("");

  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] =
    useState<FiltreStatut>("Tous");
  const [filtrePriorite, setFiltrePriorite] =
    useState<FiltrePriorite>("Toutes");
  const [filtreType, setFiltreType] =
    useState<FiltreType>("Tous");

  useEffect(() => {
    setMissions(lire<Mission>("missions"));
    setLogements(lire<Logement>("logements"));
    setVoyageurs(lire<Voyageur>("voyageurs"));
    setDonneesChargees(true);
  }, []);

  useEffect(() => {
    if (!donneesChargees) return;

    enregistrer("missions", missions);
  }, [missions, donneesChargees]);

  const statistiques = useMemo(() => {
    return {
      total: missions.length,
      aFaire: missions.filter(
        (mission) => mission.statut === "À faire"
      ).length,
      enCours: missions.filter(
        (mission) => mission.statut === "En cours"
      ).length,
      urgentes: missions.filter(
        (mission) =>
          mission.priorite === "Urgente" &&
          mission.statut !== "Terminée" &&
          mission.statut !== "Annulée"
      ).length,
      terminees: missions.filter(
        (mission) => mission.statut === "Terminée"
      ).length,
    };
  }, [missions]);

  const missionsFiltrees = useMemo(() => {
    const rechercheNormalisee = normaliserTexte(recherche);

    return missions
      .filter((mission) => {
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

        if (!rechercheNormalisee) return true;

        const logement = logements.find(
          (item) => item.id === mission.logementId
        );

        const voyageur = voyageurs.find(
          (item) => item.id === mission.voyageurId
        );

        const contenu = [
          mission.titre,
          mission.description,
          mission.type,
          mission.assigneA,
          mission.date,
          logement?.nom || "",
          logement?.ville || "",
          voyageur?.prenom || "",
          voyageur?.nom || "",
        ]
          .map((valeur) =>
            normaliserTexte(String(valeur || ""))
          )
          .join(" ");

        return contenu.includes(rechercheNormalisee);
      })
      .sort((a, b) => {
        const dateA = `${a.date || "9999-12-31"} ${
          a.heure || "23:59"
        }`;

        const dateB = `${b.date || "9999-12-31"} ${
          b.heure || "23:59"
        }`;

        return dateA.localeCompare(dateB);
      });
  }, [
    missions,
    logements,
    voyageurs,
    recherche,
    filtreStatut,
    filtrePriorite,
    filtreType,
  ]);

  function nomLogement(id: string): string {
    const logement = logements.find((item) => item.id === id);

    if (!logement) return "Aucun logement";

    return logement.ville
      ? `${logement.nom} — ${logement.ville}`
      : logement.nom;
  }

  function nomVoyageur(id: string): string {
    const voyageur = voyageurs.find((item) => item.id === id);

    if (!voyageur) return "Aucun voyageur";

    return `${voyageur.prenom} ${voyageur.nom}`.trim();
  }

  function ouvrirNouvelleMission() {
    setMissionEnCours(creerMissionVide());
    setErreur("");
    setFormulaireOuvert(true);
  }

  function ouvrirModification(mission: Mission) {
    setMissionEnCours({ ...mission });
    setErreur("");
    setFormulaireOuvert(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fermerFormulaire() {
    setMissionEnCours(creerMissionVide());
    setErreur("");
    setFormulaireOuvert(false);
  }

  function enregistrerMission() {
    if (!missionEnCours.titre.trim()) {
      setErreur("Le titre de la mission est obligatoire.");
      return;
    }

    if (!missionEnCours.date) {
      setErreur("La date de la mission est obligatoire.");
      return;
    }

    if (!missionEnCours.heure) {
      setErreur("L’heure de la mission est obligatoire.");
      return;
    }

    const maintenant = new Date().toISOString();

    setMissions((liste) => {
      const existe = liste.some(
        (mission) => mission.id === missionEnCours.id
      );

      const missionFinale: Mission = {
        ...missionEnCours,
        id: missionEnCours.id || creerIdentifiant(),
        titre: missionEnCours.titre.trim(),
        description: missionEnCours.description.trim(),
        assigneA: missionEnCours.assigneA.trim(),
        createdAt:
          existe && missionEnCours.createdAt
            ? missionEnCours.createdAt
            : maintenant,
        updatedAt: maintenant,
      };

      if (existe) {
        return liste.map((mission) =>
          mission.id === missionFinale.id
            ? missionFinale
            : mission
        );
      }

      return [missionFinale, ...liste];
    });

    fermerFormulaire();
  }

  function supprimerMission(mission: Mission) {
    const confirmation = window.confirm(
      `Supprimer définitivement la mission « ${mission.titre} » ?`
    );

    if (!confirmation) return;

    setMissions((liste) =>
      liste.filter((item) => item.id !== mission.id)
    );
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

  function reinitialiserFiltres() {
    setRecherche("");
    setFiltreStatut("Tous");
    setFiltrePriorite("Toutes");
    setFiltreType("Tous");
  }

  const filtresActifs =
    recherche.trim() !== "" ||
    filtreStatut !== "Tous" ||
    filtrePriorite !== "Toutes" ||
    filtreType !== "Tous";

  return (
    <div className="space-y-8">
      <PageHeader
        titre="Missions"
        description="Planifiez et suivez toutes les actions opérationnelles de votre conciergerie."
        action={
          <button
            type="button"
            onClick={ouvrirNouvelleMission}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
          >
            + Nouvelle mission
          </button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <CarteStatistique
          titre="Total"
          valeur={statistiques.total}
          couleur="blue"
        />

        <CarteStatistique
          titre="À faire"
          valeur={statistiques.aFaire}
          couleur="orange"
        />

        <CarteStatistique
          titre="En cours"
          valeur={statistiques.enCours}
          couleur="blue"
        />

        <CarteStatistique
          titre="Urgentes"
          valeur={statistiques.urgentes}
          couleur="red"
        />

        <CarteStatistique
          titre="Terminées"
          valeur={statistiques.terminees}
          couleur="green"
        />
      </div>

      {formulaireOuvert && (
        <Section
          titre={
            missionEnCours.id
              ? "Modifier la mission"
              : "Nouvelle mission"
          }
          description="Renseignez les informations utiles à la réalisation de la mission."
        >
          {erreur && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              {erreur}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <Champ
              label="Titre de la mission"
              value={missionEnCours.titre}
              onChange={(valeur) =>
                setMissionEnCours({
                  ...missionEnCours,
                  titre: valeur,
                })
              }
            />

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Type de mission
              </span>

              <select
                value={missionEnCours.type}
                onChange={(event) =>
                  setMissionEnCours({
                    ...missionEnCours,
                    type: event.target.value as TypeMission,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {typesMission.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Logement
              </span>

              <select
                value={missionEnCours.logementId}
                onChange={(event) =>
                  setMissionEnCours({
                    ...missionEnCours,
                    logementId: event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Aucun logement</option>

                {logements.map((logement) => (
                  <option key={logement.id} value={logement.id}>
                    {logement.nom}
                    {logement.ville
                      ? ` — ${logement.ville}`
                      : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Voyageur
              </span>

              <select
                value={missionEnCours.voyageurId}
                onChange={(event) =>
                  setMissionEnCours({
                    ...missionEnCours,
                    voyageurId: event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Aucun voyageur</option>

                {voyageurs.map((voyageur) => (
                  <option key={voyageur.id} value={voyageur.id}>
                    {voyageur.prenom} {voyageur.nom}
                  </option>
                ))}
              </select>
            </label>

            <Champ
              label="Date"
              type="date"
              value={missionEnCours.date}
              onChange={(valeur) =>
                setMissionEnCours({
                  ...missionEnCours,
                  date: valeur,
                })
              }
            />

            <Champ
              label="Heure"
              type="time"
              value={missionEnCours.heure}
              onChange={(valeur) =>
                setMissionEnCours({
                  ...missionEnCours,
                  heure: valeur,
                })
              }
            />

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Priorité
              </span>

              <select
                value={missionEnCours.priorite}
                onChange={(event) =>
                  setMissionEnCours({
                    ...missionEnCours,
                    priorite:
                      event.target.value as PrioriteMission,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {prioritesMission.map((priorite) => (
                  <option key={priorite} value={priorite}>
                    {priorite}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Statut
              </span>

              <select
                value={missionEnCours.statut}
                onChange={(event) =>
                  setMissionEnCours({
                    ...missionEnCours,
                    statut:
                      event.target.value as StatutMission,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {statutsMission.map((statut) => (
                  <option key={statut} value={statut}>
                    {statut}
                  </option>
                ))}
              </select>
            </label>

            <Champ
              label="Assignée à"
              value={missionEnCours.assigneA}
              onChange={(valeur) =>
                setMissionEnCours({
                  ...missionEnCours,
                  assigneA: valeur,
                })
              }
            />
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Description et consignes
            </span>

            <textarea
              value={missionEnCours.description}
              onChange={(event) =>
                setMissionEnCours({
                  ...missionEnCours,
                  description: event.target.value,
                })
              }
              rows={5}
              placeholder="Accès, clés, matériel nécessaire, consignes particulières..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={enregistrerMission}
              className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
            >
              Enregistrer
            </button>

            <button
              type="button"
              onClick={fermerFormulaire}
              className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Annuler
            </button>
          </div>
        </Section>
      )}

      <Section
        titre="Rechercher et filtrer"
        description={`${missionsFiltrees.length} mission(s) affichée(s)`}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_210px_210px_210px_auto]">
          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Rechercher
            </span>

            <input
              type="search"
              value={recherche}
              onChange={(event) =>
                setRecherche(event.target.value)
              }
              placeholder="Titre, logement, voyageur, intervenant..."
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <SelectFiltre
            label="Statut"
            value={filtreStatut}
            onChange={(valeur) =>
              setFiltreStatut(valeur as FiltreStatut)
            }
            options={[
              "Tous",
              ...statutsMission,
            ]}
          />

          <SelectFiltre
            label="Priorité"
            value={filtrePriorite}
            onChange={(valeur) =>
              setFiltrePriorite(valeur as FiltrePriorite)
            }
            options={[
              "Toutes",
              ...prioritesMission,
            ]}
          />

          <SelectFiltre
            label="Type"
            value={filtreType}
            onChange={(valeur) =>
              setFiltreType(valeur as FiltreType)
            }
            options={[
              "Tous",
              ...typesMission,
            ]}
          />

          <div className="flex items-end">
            <button
              type="button"
              onClick={reinitialiserFiltres}
              disabled={!filtresActifs}
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </Section>

      <Section
        titre="Liste des missions"
        description="Suivi des actions opérationnelles."
      >
        {!donneesChargees ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-bold text-slate-500">
              Chargement des missions...
            </p>
          </div>
        ) : missionsFiltrees.length > 0 ? (
          <div className="space-y-5">
            {missionsFiltrees.map((mission) => (
              <CarteMission
                key={mission.id}
                mission={mission}
                logement={nomLogement(mission.logementId)}
                voyageur={nomVoyageur(mission.voyageurId)}
                onModifier={() =>
                  ouvrirModification(mission)
                }
                onSupprimer={() =>
                  supprimerMission(mission)
                }
                onChangerStatut={(statut) =>
                  changerStatut(mission.id, statut)
                }
              />
            ))}
          </div>
        ) : missions.length === 0 ? (
          <EtatVide
            icone="📋"
            titre="Aucune mission enregistrée"
            texte="Ajoutez votre première mission pour commencer à organiser votre activité."
            action={
              <button
                type="button"
                onClick={ouvrirNouvelleMission}
                className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
              >
                + Créer une mission
              </button>
            }
          />
        ) : (
          <EtatVide
            icone="🔎"
            titre="Aucun résultat"
            texte="Aucune mission ne correspond aux filtres sélectionnés."
            action={
              <button
                type="button"
                onClick={reinitialiserFiltres}
                className="mt-6 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
              >
                Effacer les filtres
              </button>
            }
          />
        )}
      </Section>
    </div>
  );
}

function CarteMission({
  mission,
  logement,
  voyageur,
  onModifier,
  onSupprimer,
  onChangerStatut,
}: {
  mission: Mission;
  logement: string;
  voyageur: string;
  onModifier: () => void;
  onSupprimer: () => void;
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
      "bg-slate-200 text-slate-600",
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${statutClasses[mission.statut]}`}
            >
              {mission.statut}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold ${prioriteClasses[mission.priorite]}`}
            >
              {mission.priorite}
            </span>

            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
              {mission.type}
            </span>
          </div>

          <h3 className="mt-4 text-xl font-black text-slate-950">
            {mission.titre}
          </h3>

          <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
            <Info
              label="Date"
              value={`${mission.date} à ${
                mission.heure || "--:--"
              }`}
            />

            <Info
              label="Logement"
              value={logement}
            />

            <Info
              label="Voyageur"
              value={voyageur}
            />

            <Info
              label="Assignée à"
              value={
                mission.assigneA || "Non renseigné"
              }
            />
          </div>

          {mission.description && (
            <p className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {mission.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 xl:max-w-xs xl:justify-end">
          <button
            type="button"
            onClick={() => onChangerStatut("À faire")}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            À faire
          </button>

          <button
            type="button"
            onClick={() => onChangerStatut("En cours")}
            className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
          >
            En cours
          </button>

          <button
            type="button"
            onClick={() => onChangerStatut("Terminée")}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
          >
            Terminée
          </button>

          <button
            type="button"
            onClick={onModifier}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800"
          >
            Modifier
          </button>

          <button
            type="button"
            onClick={onSupprimer}
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
          >
            Supprimer
          </button>
        </div>
      </div>
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
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectFiltre({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
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

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <p>
      <span className="font-bold text-slate-700">
        {label} :
      </span>{" "}
      {value}
    </p>
  );
}

function EtatVide({
  icone,
  titre,
  texte,
  action,
}: {
  icone: string;
  titre: string;
  texte: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
      <div className="text-5xl">{icone}</div>

      <h3 className="mt-5 text-xl font-black text-slate-900">
        {titre}
      </h3>

      <p className="mx-auto mt-2 max-w-lg text-slate-500">
        {texte}
      </p>

      {action}
    </div>
  );
}