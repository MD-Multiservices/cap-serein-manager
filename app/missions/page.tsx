"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";

import { supabase } from "@/lib/supabase";

import type {
  Mission,
  PrioriteMission,
  StatutMission,
  TypeMission,
} from "@/types/mission";

type Logement = {
  id: string;
  nom: string;
  ville: string;
  proprietaireId: string;
};

type Voyageur = {
  id: string;
  prenom: string;
  nom: string;
};

type LogementLocal = {
  id?: string;
  nom?: string;
  ville?: string;
  proprietaireId?: string;
};

type VoyageurLocal = {
  id?: string;
  prenom?: string;
  nom?: string;
};

type MissionSupabase = {
  id: string;

  logement_id: string | null;
  proprietaire_id: string | null;
  voyageur_id: string | null;

  type_mission: string | null;

  titre: string | null;
  description: string | null;

  date_mission: string | null;
  heure_mission: string | null;

  priorite: string | null;
  statut: string | null;

  assigne_a: string | null;

  created_at: string | null;
  updated_at: string | null;
};

type FiltreStatut =
  | "Tous"
  | StatutMission;

type FiltrePriorite =
  | "Toutes"
  | PrioriteMission;

type FiltreType =
  | "Tous"
  | TypeMission;

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
  const maintenant =
    new Date().toISOString();

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

function estUuid(
  valeur: string
): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    valeur
  );
}

function normaliserTexte(
  texte: string
): string {
  return texte
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}

function normaliserType(
  valeur: unknown
): TypeMission {
  if (
    valeur === "Arrivée" ||
    valeur === "Départ" ||
    valeur === "État des lieux entrée" ||
    valeur === "État des lieux sortie" ||
    valeur === "Remise des clés" ||
    valeur === "Récupération des clés" ||
    valeur === "Ménage" ||
    valeur === "Pressing" ||
    valeur === "Maintenance" ||
    valeur === "Intervention"
  ) {
    return valeur;
  }

  return "Intervention";
}

function normaliserStatut(
  valeur: unknown
): StatutMission {
  if (
    valeur === "À faire" ||
    valeur === "En cours" ||
    valeur === "Terminée" ||
    valeur === "Annulée"
  ) {
    return valeur;
  }

  return "À faire";
}

function normaliserPriorite(
  valeur: unknown
): PrioriteMission {
  if (
    valeur === "Basse" ||
    valeur === "Normale" ||
    valeur === "Haute" ||
    valeur === "Urgente"
  ) {
    return valeur;
  }

  return "Normale";
}

function normaliserHeure(
  valeur: unknown
): string {
  const texte = String(
    valeur || ""
  );

  if (
    /^\d{2}:\d{2}/.test(texte)
  ) {
    return texte.slice(0, 5);
  }

  return "";
}


export default function MissionsPage() {
  const [
    organizationId,
    setOrganizationId,
  ] = useState("");

  const [
    missions,
    setMissions,
  ] = useState<Mission[]>([]);

  const [
    logements,
    setLogements,
  ] = useState<Logement[]>([]);

  const [
    voyageurs,
    setVoyageurs,
  ] = useState<Voyageur[]>([]);

  const [
    missionEnCours,
    setMissionEnCours,
  ] = useState<Mission>(
    creerMissionVide()
  );

  const [
    formulaireOuvert,
    setFormulaireOuvert,
  ] = useState(false);

  const [
    donneesChargees,
    setDonneesChargees,
  ] = useState(false);

  const [
    sauvegardeEnCours,
    setSauvegardeEnCours,
  ] = useState(false);

  const [
    suppressionEnCours,
    setSuppressionEnCours,
  ] = useState("");

  const [
    statutEnCours,
    setStatutEnCours,
  ] = useState("");

  const [
    erreur,
    setErreur,
  ] = useState("");

  const [
    erreurPage,
    setErreurPage,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    recherche,
    setRecherche,
  ] = useState("");

  const [
    filtreStatut,
    setFiltreStatut,
  ] =
    useState<FiltreStatut>(
      "Tous"
    );

  const [
    filtrePriorite,
    setFiltrePriorite,
  ] =
    useState<FiltrePriorite>(
      "Toutes"
    );

  const [
    filtreType,
    setFiltreType,
  ] =
    useState<FiltreType>(
      "Tous"
    );

  useEffect(() => {
    let actif = true;

    async function initialiser() {
      try {
        setDonneesChargees(
          false
        );

        setErreurPage("");

        const {
          data: { user },
          error:
            erreurUtilisateur,
        } =
          await supabase.auth.getUser();

        if (
          erreurUtilisateur ||
          !user
        ) {
          throw new Error(
            "Votre session Supabase n’est pas disponible."
          );
        }

        const {
          data: adhesion,
          error:
            erreurAdhesion,
        } = await supabase
          .from(
            "organization_members"
          )
          .select(
            "organization_id"
          )
          .eq(
            "user_id",
            user.id
          )
          .limit(1)
          .maybeSingle();

        if (erreurAdhesion) {
          throw erreurAdhesion;
        }

        if (
          !adhesion?.organization_id
        ) {
          throw new Error(
            "Aucune organisation Cap Serein n’est associée à votre compte."
          );
        }

        if (!actif) {
          return;
        }

        const orgId =
          adhesion.organization_id;

        setOrganizationId(
          orgId
        );

        const [
          logementsDistants,
          voyageursDistants,
        ] =
          await Promise.all([
            chargerLogements(
              orgId
            ),

            chargerVoyageurs(
              orgId
            ),
          ]);

        if (!actif) {
          return;
        }

        setLogements(
          logementsDistants
        );

        setVoyageurs(
          voyageursDistants
        );

        const migrationEffectuee =
          await chargerMissions(
            orgId,
            logementsDistants,
            voyageursDistants,
            true
          );

        if (
          actif &&
          migrationEffectuee
        ) {
          setMessage(
            "Vos anciennes missions enregistrées sur cet ordinateur ont été importées dans Supabase."
          );
        }
      } catch (error) {
        console.error(error);

        if (actif) {
          setErreurPage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les missions."
          );
        }
      } finally {
        if (actif) {
          setDonneesChargees(
            true
          );
        }
      }
    }

    initialiser();

    return () => {
      actif = false;
    };
  }, []);

  async function chargerLogements(
    orgId: string
  ): Promise<Logement[]> {
    const {
      data,
      error,
    } = await supabase
      .from("logements")
      .select(
        `
          id,
          nom,
          ville,
          proprietaire_id
        `
      )
      .eq(
        "organization_id",
        orgId
      )
      .eq(
        "actif",
        true
      )
      .order(
        "nom",
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    return (
      data || []
    ).map(
      (ligne): Logement => ({
        id: String(
          ligne.id
        ),

        nom: String(
          ligne.nom || ""
        ),

        ville: String(
          ligne.ville || ""
        ),

        proprietaireId:
          String(
            ligne.proprietaire_id ||
              ""
          ),
      })
    );
  }

  async function chargerVoyageurs(
    orgId: string
  ): Promise<Voyageur[]> {
    const {
      data,
      error,
    } = await supabase
      .from("voyageurs")
      .select(
        `
          id,
          prenom,
          nom
        `
      )
      .eq(
        "organization_id",
        orgId
      )
      .order(
        "nom",
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    return (
      data || []
    ).map(
      (ligne): Voyageur => ({
        id: String(
          ligne.id
        ),

        prenom: String(
          ligne.prenom || ""
        ),

        nom: String(
          ligne.nom || ""
        ),
      })
    );
  }

  async function chargerMissions(
    orgId: string,
    logementsDistants: Logement[],
    voyageursDistants: Voyageur[],
    autoriserMigration: boolean
  ): Promise<boolean> {
    const {
      data,
      error,
    } = await supabase
      .from("missions")
      .select(
        `
          id,
          logement_id,
          proprietaire_id,
          voyageur_id,
          type_mission,
          titre,
          description,
          date_mission,
          heure_mission,
          priorite,
          statut,
          assigne_a,
          created_at,
          updated_at
        `
      )
      .eq(
        "organization_id",
        orgId
      )
      .order(
        "date_mission",
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    const lignes =
      (data ||
        []) as MissionSupabase[];

    const missionsConverties =
      lignes.map(
        (
          ligne
        ): Mission => ({
          id:
            ligne.id,

          logementId:
            String(
              ligne.logement_id ||
                ""
            ),

          proprietaireId:
            String(
              ligne.proprietaire_id ||
                ""
            ),

          voyageurId:
            String(
              ligne.voyageur_id ||
                ""
            ),

          type:
            normaliserType(
              ligne.type_mission
            ),

          titre:
            String(
              ligne.titre || ""
            ),

          description:
            String(
              ligne.description ||
                ""
            ),

          date:
            String(
              ligne.date_mission ||
                ""
            ),

          heure:
            normaliserHeure(
              ligne.heure_mission
            ),

          priorite:
            normaliserPriorite(
              ligne.priorite
            ),

          statut:
            normaliserStatut(
              ligne.statut
            ),

          assigneA:
            String(
              ligne.assigne_a ||
                ""
            ),

          createdAt:
            String(
              ligne.created_at ||
                ""
            ),

          updatedAt:
            String(
              ligne.updated_at ||
                ""
            ),
        })
      );

    setMissions(
      missionsConverties
    );

    return false;
  }

  function trouverLogementDistant(
    idLocal: string,
    logementsLocaux: LogementLocal[],
    logementsDistants: Logement[]
  ): Logement | null {
    if (!idLocal) {
      return null;
    }

    const direct =
      logementsDistants.find(
        (item) =>
          item.id === idLocal
      );

    if (direct) {
      return direct;
    }

    const local =
      logementsLocaux.find(
        (item) =>
          item.id === idLocal
      );

    if (!local) {
      return null;
    }

    const nomLocal =
      normaliserTexte(
        String(
          local.nom || ""
        )
      );

    const villeLocale =
      normaliserTexte(
        String(
          local.ville || ""
        )
      );

    const exact =
      logementsDistants.find(
        (item) =>
          normaliserTexte(
            item.nom
          ) === nomLocal &&
          normaliserTexte(
            item.ville
          ) === villeLocale
      );

    if (exact) {
      return exact;
    }

    const correspondancesNom =
      logementsDistants.filter(
        (item) =>
          normaliserTexte(
            item.nom
          ) === nomLocal
      );

    return correspondancesNom.length ===
      1
      ? correspondancesNom[0]
      : null;
  }

  function trouverVoyageurDistant(
    idLocal: string,
    voyageursLocaux: VoyageurLocal[],
    voyageursDistants: Voyageur[]
  ): Voyageur | null {
    if (!idLocal) {
      return null;
    }

    const direct =
      voyageursDistants.find(
        (item) =>
          item.id === idLocal
      );

    if (direct) {
      return direct;
    }

    const local =
      voyageursLocaux.find(
        (item) =>
          item.id === idLocal
      );

    if (!local) {
      return null;
    }

    const prenom =
      normaliserTexte(
        String(
          local.prenom || ""
        )
      );

    const nom =
      normaliserTexte(
        String(
          local.nom || ""
        )
      );

    const correspondances =
      voyageursDistants.filter(
        (item) =>
          normaliserTexte(
            item.prenom
          ) === prenom &&
          normaliserTexte(
            item.nom
          ) === nom
      );

    return correspondances.length ===
      1
      ? correspondances[0]
      : null;
  }


  const statistiques =
    useMemo(() => {
      return {
        total:
          missions.length,

        aFaire:
          missions.filter(
            (mission) =>
              mission.statut ===
              "À faire"
          ).length,

        enCours:
          missions.filter(
            (mission) =>
              mission.statut ===
              "En cours"
          ).length,

        urgentes:
          missions.filter(
            (mission) =>
              mission.priorite ===
                "Urgente" &&
              mission.statut !==
                "Terminée" &&
              mission.statut !==
                "Annulée"
          ).length,

        terminees:
          missions.filter(
            (mission) =>
              mission.statut ===
              "Terminée"
          ).length,
      };
    }, [missions]);

  const missionsFiltrees =
    useMemo(() => {
      const rechercheNormalisee =
        normaliserTexte(
          recherche
        );

      return missions
        .filter(
          (mission) => {
            if (
              filtreStatut !==
                "Tous" &&
              mission.statut !==
                filtreStatut
            ) {
              return false;
            }

            if (
              filtrePriorite !==
                "Toutes" &&
              mission.priorite !==
                filtrePriorite
            ) {
              return false;
            }

            if (
              filtreType !==
                "Tous" &&
              mission.type !==
                filtreType
            ) {
              return false;
            }

            if (
              !rechercheNormalisee
            ) {
              return true;
            }

            const logement =
              logements.find(
                (item) =>
                  item.id ===
                  mission.logementId
              );

            const voyageur =
              voyageurs.find(
                (item) =>
                  item.id ===
                  mission.voyageurId
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
                normaliserTexte(
                  String(
                    valeur || ""
                  )
                )
              )
              .join(" ");

            return contenu.includes(
              rechercheNormalisee
            );
          }
        )
        .sort((a, b) => {
          const dateA =
            `${a.date || "9999-12-31"} ${a.heure || "23:59"}`;

          const dateB =
            `${b.date || "9999-12-31"} ${b.heure || "23:59"}`;

          return dateA.localeCompare(
            dateB
          );
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

  function nomLogement(
    id: string
  ): string {
    const logement =
      logements.find(
        (item) =>
          item.id === id
      );

    if (!logement) {
      return "Aucun logement";
    }

    return logement.ville
      ? `${logement.nom} — ${logement.ville}`
      : logement.nom;
  }

  function nomVoyageur(
    id: string
  ): string {
    const voyageur =
      voyageurs.find(
        (item) =>
          item.id === id
      );

    if (!voyageur) {
      return "Aucun voyageur";
    }

    return `${voyageur.prenom} ${voyageur.nom}`.trim();
  }

  function ouvrirNouvelleMission() {
    setMissionEnCours(
      creerMissionVide()
    );

    setErreur("");
    setMessage("");

    setFormulaireOuvert(
      true
    );
  }

  function ouvrirModification(
    mission: Mission
  ) {
    setMissionEnCours({
      ...mission,
    });

    setErreur("");
    setMessage("");

    setFormulaireOuvert(
      true
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function fermerFormulaire() {
    setMissionEnCours(
      creerMissionVide()
    );

    setErreur("");

    setFormulaireOuvert(
      false
    );
  }

  function changerLogement(
    logementId: string
  ) {
    const logement =
      logements.find(
        (item) =>
          item.id === logementId
      );

    setMissionEnCours({
      ...missionEnCours,

      logementId,

      proprietaireId:
        logement?.proprietaireId ||
        "",
    });
  }

  async function enregistrerMission() {
    if (
      sauvegardeEnCours
    ) {
      return;
    }

    setErreur("");
    setErreurPage("");
    setMessage("");

    if (
      !missionEnCours.titre.trim()
    ) {
      setErreur(
        "Le titre de la mission est obligatoire."
      );

      return;
    }

    if (
      !missionEnCours.date
    ) {
      setErreur(
        "La date de la mission est obligatoire."
      );

      return;
    }

    if (
      !missionEnCours.heure
    ) {
      setErreur(
        "L’heure de la mission est obligatoire."
      );

      return;
    }

    if (
      !organizationId
    ) {
      setErreur(
        "L’organisation Cap Serein n’est pas encore chargée."
      );

      return;
    }

    setSauvegardeEnCours(
      true
    );

    try {
      const logement =
        logements.find(
          (item) =>
            item.id ===
            missionEnCours.logementId
        );

      const dateDebut =
        `${missionEnCours.date}T${missionEnCours.heure}:00`;

      const payload = {
        organization_id:
          organizationId,

        logement_id:
          missionEnCours.logementId ||
          null,

        proprietaire_id:
          logement?.proprietaireId ||
          null,

        voyageur_id:
          missionEnCours.voyageurId ||
          null,

        type_mission:
          missionEnCours.type,

        titre:
          missionEnCours.titre.trim(),

        description:
          missionEnCours.description.trim() ||
          null,

        observations:
          missionEnCours.description.trim() ||
          null,

        date_mission:
          missionEnCours.date,

        heure_mission:
          missionEnCours.heure,

        date_debut:
          dateDebut,

        priorite:
          missionEnCours.priorite,

        statut:
          missionEnCours.statut,

        assigne_a:
          missionEnCours.assigneA.trim() ||
          null,
      };

      const existe =
        Boolean(
          missionEnCours.id
        );

      if (existe) {
        const {
          error,
        } = await supabase
          .from("missions")
          .update(payload)
          .eq(
            "id",
            missionEnCours.id
          )
          .eq(
            "organization_id",
            organizationId
          );

        if (error) {
          throw error;
        }
      } else {
        const {
          error,
        } = await supabase
          .from("missions")
          .insert(payload);

        if (error) {
          throw error;
        }
      }

      await chargerMissions(
        organizationId,
        logements,
        voyageurs,
        false
      );

      fermerFormulaire();

      setMessage(
        existe
          ? "La mission a été modifiée et synchronisée."
          : "La mission a été créée et synchronisée."
      );
    } catch (error) {
      console.error(error);

      setErreur(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer la mission."
      );
    } finally {
      setSauvegardeEnCours(
        false
      );
    }
  }

  async function supprimerMission(
    mission: Mission
  ) {
    if (
      suppressionEnCours
    ) {
      return;
    }

    const confirmation =
      window.confirm(
        `Supprimer définitivement la mission « ${mission.titre} » ?`
      );

    if (!confirmation) {
      return;
    }

    if (
      !organizationId
    ) {
      setErreurPage(
        "L’organisation Cap Serein n’est pas chargée."
      );

      return;
    }

    setSuppressionEnCours(
      mission.id
    );

    setErreurPage("");
    setMessage("");

    try {
      const {
        error,
      } = await supabase
        .from("missions")
        .delete()
        .eq(
          "id",
          mission.id
        )
        .eq(
          "organization_id",
          organizationId
        );

      if (error) {
        throw error;
      }

      setMissions(
        (liste) =>
          liste.filter(
            (item) =>
              item.id !==
              mission.id
          )
      );

      setMessage(
        "La mission a été supprimée de Supabase."
      );
    } catch (error) {
      console.error(error);

      setErreurPage(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer la mission."
      );
    } finally {
      setSuppressionEnCours(
        ""
      );
    }
  }

  async function changerStatut(
    id: string,
    statut: StatutMission
  ) {
    if (
      !organizationId ||
      statutEnCours
    ) {
      return;
    }

    setStatutEnCours(
      id
    );

    setErreurPage("");
    setMessage("");

    try {
      const {
        error,
      } = await supabase
        .from("missions")
        .update({
          statut,
        })
        .eq(
          "id",
          id
        )
        .eq(
          "organization_id",
          organizationId
        );

      if (error) {
        throw error;
      }

      setMissions(
        (liste) =>
          liste.map(
            (mission) =>
              mission.id === id
                ? {
                    ...mission,
                    statut,
                    updatedAt:
                      new Date().toISOString(),
                  }
                : mission
          )
      );
    } catch (error) {
      console.error(error);

      setErreurPage(
        error instanceof Error
          ? error.message
          : "Impossible de modifier le statut."
      );
    } finally {
      setStatutEnCours(
        ""
      );
    }
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
            onClick={
              ouvrirNouvelleMission
            }
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
          >
            + Nouvelle mission
          </button>
        }
      />

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
        ☁️ Les missions sont maintenant synchronisées avec Supabase.
      </div>

      {message && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-800">
          {message}
        </div>
      )}

      {erreurPage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {erreurPage}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <CarteStatistique
          titre="Total"
          valeur={
            statistiques.total
          }
          couleur="blue"
        />

        <CarteStatistique
          titre="À faire"
          valeur={
            statistiques.aFaire
          }
          couleur="orange"
        />

        <CarteStatistique
          titre="En cours"
          valeur={
            statistiques.enCours
          }
          couleur="blue"
        />

        <CarteStatistique
          titre="Urgentes"
          valeur={
            statistiques.urgentes
          }
          couleur="red"
        />

        <CarteStatistique
          titre="Terminées"
          valeur={
            statistiques.terminees
          }
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
              value={
                missionEnCours.titre
              }
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
                value={
                  missionEnCours.type
                }
                onChange={(event) =>
                  setMissionEnCours({
                    ...missionEnCours,

                    type:
                      event.target
                        .value as TypeMission,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {typesMission.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Logement
              </span>

              <select
                value={
                  missionEnCours.logementId
                }
                onChange={(event) =>
                  changerLogement(
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">
                  Aucun logement
                </option>

                {logements.map(
                  (logement) => (
                    <option
                      key={
                        logement.id
                      }
                      value={
                        logement.id
                      }
                    >
                      {logement.nom}

                      {logement.ville
                        ? ` — ${logement.ville}`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Voyageur
              </span>

              <select
                value={
                  missionEnCours.voyageurId
                }
                onChange={(event) =>
                  setMissionEnCours({
                    ...missionEnCours,

                    voyageurId:
                      event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">
                  Aucun voyageur
                </option>

                {voyageurs.map(
                  (voyageur) => (
                    <option
                      key={
                        voyageur.id
                      }
                      value={
                        voyageur.id
                      }
                    >
                      {voyageur.prenom}{" "}
                      {voyageur.nom}
                    </option>
                  )
                )}
              </select>
            </label>

            <Champ
              label="Date"
              type="date"
              value={
                missionEnCours.date
              }
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
              value={
                missionEnCours.heure
              }
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
                value={
                  missionEnCours.priorite
                }
                onChange={(event) =>
                  setMissionEnCours({
                    ...missionEnCours,

                    priorite:
                      event.target
                        .value as PrioriteMission,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {prioritesMission.map(
                  (priorite) => (
                    <option
                      key={
                        priorite
                      }
                      value={
                        priorite
                      }
                    >
                      {priorite}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Statut
              </span>

              <select
                value={
                  missionEnCours.statut
                }
                onChange={(event) =>
                  setMissionEnCours({
                    ...missionEnCours,

                    statut:
                      event.target
                        .value as StatutMission,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {statutsMission.map(
                  (statut) => (
                    <option
                      key={
                        statut
                      }
                      value={
                        statut
                      }
                    >
                      {statut}
                    </option>
                  )
                )}
              </select>
            </label>

            <Champ
              label="Assignée à"
              value={
                missionEnCours.assigneA
              }
              onChange={(valeur) =>
                setMissionEnCours({
                  ...missionEnCours,
                  assigneA:
                    valeur,
                })
              }
            />
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Description et consignes
            </span>

            <textarea
              value={
                missionEnCours.description
              }
              onChange={(event) =>
                setMissionEnCours({
                  ...missionEnCours,

                  description:
                    event.target.value,
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
              onClick={
                enregistrerMission
              }
              disabled={
                sauvegardeEnCours
              }
              className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sauvegardeEnCours
                ? "Enregistrement..."
                : missionEnCours.id
                  ? "Enregistrer les modifications"
                  : "Enregistrer"}
            </button>

            <button
              type="button"
              onClick={
                fermerFormulaire
              }
              disabled={
                sauvegardeEnCours
              }
              className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
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
              value={
                recherche
              }
              onChange={(event) =>
                setRecherche(
                  event.target.value
                )
              }
              placeholder="Titre, logement, voyageur, intervenant..."
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <SelectFiltre
            label="Statut"
            value={
              filtreStatut
            }
            onChange={(valeur) =>
              setFiltreStatut(
                valeur as FiltreStatut
              )
            }
            options={[
              "Tous",
              ...statutsMission,
            ]}
          />

          <SelectFiltre
            label="Priorité"
            value={
              filtrePriorite
            }
            onChange={(valeur) =>
              setFiltrePriorite(
                valeur as FiltrePriorite
              )
            }
            options={[
              "Toutes",
              ...prioritesMission,
            ]}
          />

          <SelectFiltre
            label="Type"
            value={
              filtreType
            }
            onChange={(valeur) =>
              setFiltreType(
                valeur as FiltreType
              )
            }
            options={[
              "Tous",
              ...typesMission,
            ]}
          />

          <div className="flex items-end">
            <button
              type="button"
              onClick={
                reinitialiserFiltres
              }
              disabled={
                !filtresActifs
              }
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
              Chargement des missions depuis Supabase...
            </p>
          </div>
        ) : missionsFiltrees.length >
          0 ? (
          <div className="space-y-5">
            {missionsFiltrees.map(
              (mission) => (
                <CarteMission
                  key={
                    mission.id
                  }
                  mission={
                    mission
                  }
                  logement={nomLogement(
                    mission.logementId
                  )}
                  voyageur={nomVoyageur(
                    mission.voyageurId
                  )}
                  actionsDesactivees={
                    suppressionEnCours ===
                      mission.id ||
                    statutEnCours ===
                      mission.id
                  }
                  onModifier={() =>
                    ouvrirModification(
                      mission
                    )
                  }
                  onSupprimer={() =>
                    supprimerMission(
                      mission
                    )
                  }
                  onChangerStatut={(
                    statut
                  ) => {
                    void changerStatut(
                      mission.id,
                      statut
                    );
                  }}
                />
              )
            )}
          </div>
        ) : missions.length ===
          0 ? (
          <EtatVide
            icone="📋"
            titre="Aucune mission enregistrée"
            texte="Ajoutez votre première mission pour commencer à organiser votre activité."
            action={
              <button
                type="button"
                onClick={
                  ouvrirNouvelleMission
                }
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
                onClick={
                  reinitialiserFiltres
                }
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
  actionsDesactivees,
  onModifier,
  onSupprimer,
  onChangerStatut,
}: {
  mission: Mission;
  logement: string;
  voyageur: string;

  actionsDesactivees: boolean;

  onModifier: () => void;
  onSupprimer: () => void;

  onChangerStatut: (
    statut: StatutMission
  ) => void;
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

  const statutClasses: Record<
    StatutMission,
    string
  > = {
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
                mission.heure ||
                "--:--"
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
                mission.assigneA ||
                "Non renseigné"
              }
            />
          </div>

          {mission.description && (
            <p className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {
                mission.description
              }
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 xl:max-w-xs xl:justify-end">
          <button
            type="button"
            disabled={
              actionsDesactivees
            }
            onClick={() =>
              onChangerStatut(
                "À faire"
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            À faire
          </button>

          <button
            type="button"
            disabled={
              actionsDesactivees
            }
            onClick={() =>
              onChangerStatut(
                "En cours"
              )
            }
            className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-40"
          >
            En cours
          </button>

          <button
            type="button"
            disabled={
              actionsDesactivees
            }
            onClick={() =>
              onChangerStatut(
                "Terminée"
              )
            }
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
          >
            Terminée
          </button>

          <button
            type="button"
            disabled={
              actionsDesactivees
            }
            onClick={
              onModifier
            }
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-40"
          >
            Modifier
          </button>

          <button
            type="button"
            disabled={
              actionsDesactivees
            }
            onClick={
              onSupprimer
            }
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-40"
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
  couleur:
    | "blue"
    | "green"
    | "orange"
    | "red";
}) {
  const couleurs = {
    blue:
      "border-blue-200 bg-blue-50 text-blue-700",

    green:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    orange:
      "border-orange-200 bg-orange-50 text-orange-700",

    red:
      "border-red-200 bg-red-50 text-red-700",
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

  onChange: (
    value: string
  ) => void;

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
          onChange(
            event.target.value
          )
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

  onChange: (
    value: string
  ) => void;

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
          onChange(
            event.target.value
          )
        }
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      >
        {options.map(
          (option) => (
            <option
              key={
                option
              }
              value={
                option
              }
            >
              {option}
            </option>
          )
        )}
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
      <div className="text-5xl">
        {icone}
      </div>

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