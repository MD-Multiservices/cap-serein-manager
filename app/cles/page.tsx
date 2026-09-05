"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import { supabase } from "@/lib/supabase";

type TypeCle =
  | "Jeu principal"
  | "Double"
  | "Boîte à clés"
  | "Badge"
  | "Télécommande"
  | "Autre";

type StatutCle =
  | "Disponible"
  | "Remise au voyageur"
  | "Confiée à un prestataire"
  | "Perdue"
  | "À remplacer";

type Cle = {
  id: string;
  logementId: string;
  nom: string;
  type: TypeCle;
  quantite: number;
  numero: string;
  statut: StatutCle;
  detenteur: string;
  emplacement: string;
  code: string;
  dateSortie: string;
  dateRetourPrevue: string;
  notes: string;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
};

type MouvementCle = {
  id: string;
  cleId: string;
  missionId: string;
  voyageurId: string;
  typeMouvement: string;
  quantite: number;
  dateMouvement: string;
  observations: string;
  createdAt: string;
};

type Logement = {
  id: string;
  nom: string;
  ville: string;
};

type Voyageur = {
  id: string;
  prenom: string;
  nom: string;
};

type Mission = {
  id: string;
  titre: string;
  date: string;
  logementId: string;
  voyageurId: string;
};

type FiltreStatut =
  | "Tous"
  | StatutCle;

type FiltreType =
  | "Tous"
  | TypeCle;

type FiltreActif =
  | "Actives"
  | "Archivées"
  | "Toutes";

type TypeMouvementForm =
  | "Remise au voyageur"
  | "Confiée à un prestataire"
  | "Retour"
  | "Perdue"
  | "À remplacer"
  | "Autre";

type FormMouvement = {
  typeMouvement: TypeMouvementForm;
  quantite: number;
  voyageurId: string;
  missionId: string;
  detenteur: string;
  dateRetourPrevue: string;
  observations: string;
};

const typesCle: TypeCle[] = [
  "Jeu principal",
  "Double",
  "Boîte à clés",
  "Badge",
  "Télécommande",
  "Autre",
];

const statutsCle: StatutCle[] = [
  "Disponible",
  "Remise au voyageur",
  "Confiée à un prestataire",
  "Perdue",
  "À remplacer",
];

const typesMouvement: TypeMouvementForm[] = [
  "Remise au voyageur",
  "Confiée à un prestataire",
  "Retour",
  "Perdue",
  "À remplacer",
  "Autre",
];

function texte(
  valeur: unknown
): string {
  if (
    valeur === null ||
    valeur === undefined
  ) {
    return "";
  }

  return String(
    valeur
  );
}

function nombre(
  valeur: unknown
): number {
  const resultat =
    Number(
      valeur || 0
    );

  return Number.isFinite(
    resultat
  )
    ? Math.max(
        0,
        resultat
      )
    : 0;
}

function normaliserTexte(
  valeur: string
): string {
  return valeur
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}

function normaliserTypeCle(
  valeur: unknown
): TypeCle {
  if (
    valeur === "Jeu principal" ||
    valeur === "Double" ||
    valeur === "Boîte à clés" ||
    valeur === "Badge" ||
    valeur === "Télécommande" ||
    valeur === "Autre"
  ) {
    return valeur;
  }

  return "Jeu principal";
}

function normaliserStatutCle(
  valeur: unknown
): StatutCle {
  if (
    valeur === "Disponible" ||
    valeur === "Remise au voyageur" ||
    valeur ===
      "Confiée à un prestataire" ||
    valeur === "Perdue" ||
    valeur === "À remplacer"
  ) {
    return valeur;
  }

  return "Disponible";
}

function codeMouvementSupabase(
  typeMouvement: TypeMouvementForm
):
  | "remise"
  | "restitution"
  | "ajout"
  | "retrait"
  | "autre" {
  if (
    typeMouvement === "Remise au voyageur" ||
    typeMouvement ===
      "Confiée à un prestataire"
  ) {
    return "remise";
  }

  if (
    typeMouvement === "Retour"
  ) {
    return "restitution";
  }

  if (
    typeMouvement === "Perdue" ||
    typeMouvement === "À remplacer"
  ) {
    return "retrait";
  }

  return "autre";
}

function libelleMouvementSupabase(
  valeur: unknown
): string {
  const code =
    texte(
      valeur
    );

  if (code === "remise") {
    return "Remise";
  }

  if (
    code === "restitution"
  ) {
    return "Retour";
  }

  if (code === "ajout") {
    return "Ajout";
  }

  if (code === "retrait") {
    return "Retrait";
  }

  if (code === "autre") {
    return "Autre";
  }

  return code || "Mouvement";
}

function dateSeulement(
  valeur: unknown
): string {
  const resultat =
    texte(
      valeur
    );

  return resultat
    ? resultat.slice(
        0,
        10
      )
    : "";
}

function formaterDateHeure(
  valeur: string
): string {
  if (!valeur) {
    return "—";
  }

  const date =
    new Date(
      valeur
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return valeur;
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    date
  );
}

function messageErreur(
  erreur: unknown
): string {
  if (
    erreur instanceof Error
  ) {
    return erreur.message;
  }

  if (
    erreur &&
    typeof erreur ===
      "object" &&
    "message" in erreur
  ) {
    return texte(
      (
        erreur as {
          message?: unknown;
        }
      ).message
    );
  }

  return "Erreur Supabase inconnue.";
}

function creerCleVide():
  Cle {
  const maintenant =
    new Date()
      .toISOString();

  return {
    id: "",
    logementId: "",
    nom: "",
    type: "Jeu principal",
    quantite: 1,
    numero: "",
    statut: "Disponible",
    detenteur: "",
    emplacement: "",
    code: "",
    dateSortie: "",
    dateRetourPrevue: "",
    notes: "",
    actif: true,
    createdAt:
      maintenant,
    updatedAt:
      maintenant,
  };
}

function creerMouvementVide():
  FormMouvement {
  return {
    typeMouvement:
      "Remise au voyageur",
    quantite: 1,
    voyageurId: "",
    missionId: "",
    detenteur: "",
    dateRetourPrevue: "",
    observations: "",
  };
}

function nomVoyageur(
  voyageur?: Voyageur
): string {
  if (!voyageur) {
    return "";
  }

  return [
    voyageur.prenom,
    voyageur.nom,
  ]
    .filter(
      Boolean
    )
    .join(
      " "
    )
    .trim();
}

function estEnCirculation(
  statut: StatutCle
): boolean {
  return (
    statut ===
      "Remise au voyageur" ||
    statut ===
      "Confiée à un prestataire"
  );
}

function estRetourEnRetard(
  cle: Cle
): boolean {
  if (
    !estEnCirculation(
      cle.statut
    ) ||
    !cle.dateRetourPrevue
  ) {
    return false;
  }

  const aujourdHui =
    new Date();

  aujourdHui.setHours(
    0,
    0,
    0,
    0
  );

  const retour =
    new Date(
      `${cle.dateRetourPrevue}T00:00:00`
    );

  return (
    !Number.isNaN(
      retour.getTime()
    ) &&
    retour <
      aujourdHui
  );
}

export default function ClesPage() {
  const [
    organizationId,
    setOrganizationId,
  ] = useState(
    ""
  );

  const [
    cles,
    setCles,
  ] =
    useState<Cle[]>(
      []
    );

  const [
    mouvements,
    setMouvements,
  ] =
    useState<
      MouvementCle[]
    >([]);

  const [
    logements,
    setLogements,
  ] =
    useState<
      Logement[]
    >([]);

  const [
    voyageurs,
    setVoyageurs,
  ] =
    useState<
      Voyageur[]
    >([]);

  const [
    missions,
    setMissions,
  ] =
    useState<
      Mission[]
    >([]);

  const [
    cleEnCours,
    setCleEnCours,
  ] =
    useState<Cle>(
      creerCleVide()
    );

  const [
    formulaireOuvert,
    setFormulaireOuvert,
  ] =
    useState(
      false
    );

  const [
    mouvementCleId,
    setMouvementCleId,
  ] =
    useState(
      ""
    );

  const [
    mouvementEnCours,
    setMouvementEnCours,
  ] =
    useState<FormMouvement>(
      creerMouvementVide()
    );

  const [
    historiqueOuvert,
    setHistoriqueOuvert,
  ] =
    useState(
      ""
    );

  const [
    donneesChargees,
    setDonneesChargees,
  ] =
    useState(
      false
    );

  const [
    traitement,
    setTraitement,
  ] =
    useState(
      false
    );

  const [
    erreur,
    setErreur,
  ] =
    useState(
      ""
    );

  const [
    message,
    setMessage,
  ] =
    useState(
      ""
    );

  const [
    recherche,
    setRecherche,
  ] =
    useState(
      ""
    );

  const [
    filtreStatut,
    setFiltreStatut,
  ] =
    useState<FiltreStatut>(
      "Tous"
    );

  const [
    filtreType,
    setFiltreType,
  ] =
    useState<FiltreType>(
      "Tous"
    );

  const [
    filtreLogement,
    setFiltreLogement,
  ] =
    useState(
      "Tous"
    );

  const [
    filtreActif,
    setFiltreActif,
  ] =
    useState<FiltreActif>(
      "Actives"
    );

  useEffect(() => {
    let actif =
      true;

    async function charger() {
      setDonneesChargees(
        false
      );

      setErreur(
        ""
      );

      try {
        const {
          data: {
            user,
          },
          error:
            erreurUtilisateur,
        } =
          await supabase.auth.getUser();

        if (
          erreurUtilisateur ||
          !user
        ) {
          throw new Error(
            "Session Supabase indisponible."
          );
        }

        const {
          data:
            adhesion,
          error:
            erreurAdhesion,
        } =
          await supabase
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
            .limit(
              1
            )
            .maybeSingle();

        if (
          erreurAdhesion
        ) {
          throw erreurAdhesion;
        }

        if (
          !adhesion?.organization_id
        ) {
          throw new Error(
            "Aucune organisation associée à ce compte."
          );
        }

        const orgId =
          String(
            adhesion.organization_id
          );

        const [
          resultatCles,
          resultatMouvements,
          resultatLogements,
          resultatVoyageurs,
          resultatMissions,
        ] =
          await Promise.all([
            supabase
              .from(
                "cles"
              )
              .select(
                `
                  id,
                  logement_id,
                  libelle,
                  quantite,
                  numero,
                  emplacement,
                  observations,
                  actif,
                  type_cle,
                  statut,
                  detenteur,
                  code,
                  date_sortie,
                  date_retour_prevue,
                  created_at,
                  updated_at
                `
              )
              .eq(
                "organization_id",
                orgId
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              ),

            supabase
              .from(
                "mouvements_cles"
              )
              .select(
                `
                  id,
                  cle_id,
                  mission_id,
                  voyageur_id,
                  type_mouvement,
                  quantite,
                  date_mouvement,
                  observations,
                  created_at
                `
              )
              .eq(
                "organization_id",
                orgId
              )
              .order(
                "date_mouvement",
                {
                  ascending:
                    false,
                }
              ),

            supabase
              .from(
                "logements"
              )
              .select(
                "id, nom, ville"
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
                  ascending:
                    true,
                }
              ),

            supabase
              .from(
                "voyageurs"
              )
              .select(
                "id, prenom, nom"
              )
              .eq(
                "organization_id",
                orgId
              )
              .order(
                "nom",
                {
                  ascending:
                    true,
                }
              ),

            supabase
              .from(
                "missions"
              )
              .select(
                `
                  id,
                  titre,
                  date_mission,
                  logement_id,
                  voyageur_id
                `
              )
              .eq(
                "organization_id",
                orgId
              )
              .order(
                "date_mission",
                {
                  ascending:
                    false,
                }
              )
              .limit(
                200
              ),
          ]);

        if (
          resultatCles.error
        ) {
          throw resultatCles.error;
        }

        if (
          resultatMouvements.error
        ) {
          throw resultatMouvements.error;
        }

        if (
          resultatLogements.error
        ) {
          throw resultatLogements.error;
        }

        if (
          resultatVoyageurs.error
        ) {
          throw resultatVoyageurs.error;
        }

        if (
          resultatMissions.error
        ) {
          throw resultatMissions.error;
        }

        if (!actif) {
          return;
        }

        setOrganizationId(
          orgId
        );

        setCles(
          (
            resultatCles.data ||
            []
          ).map(
            (
              ligne
            ): Cle => ({
              id:
                String(
                  ligne.id
                ),

              logementId:
                texte(
                  ligne.logement_id
                ),

              nom:
                texte(
                  ligne.libelle
                ) ||
                "Jeu de clés",

              type:
                normaliserTypeCle(
                  ligne.type_cle
                ),

              quantite:
                Math.max(
                  1,
                  nombre(
                    ligne.quantite
                  )
                ),

              numero:
                texte(
                  ligne.numero
                ),

              statut:
                normaliserStatutCle(
                  ligne.statut
                ),

              detenteur:
                texte(
                  ligne.detenteur
                ),

              emplacement:
                texte(
                  ligne.emplacement
                ),

              code:
                texte(
                  ligne.code
                ),

              dateSortie:
                dateSeulement(
                  ligne.date_sortie
                ),

              dateRetourPrevue:
                dateSeulement(
                  ligne.date_retour_prevue
                ),

              notes:
                texte(
                  ligne.observations
                ),

              actif:
                Boolean(
                  ligne.actif
                ),

              createdAt:
                texte(
                  ligne.created_at
                ),

              updatedAt:
                texte(
                  ligne.updated_at
                ),
            })
          )
        );

        setMouvements(
          (
            resultatMouvements.data ||
            []
          ).map(
            (
              ligne
            ): MouvementCle => ({
              id:
                String(
                  ligne.id
                ),

              cleId:
                texte(
                  ligne.cle_id
                ),

              missionId:
                texte(
                  ligne.mission_id
                ),

              voyageurId:
                texte(
                  ligne.voyageur_id
                ),

              typeMouvement:
                texte(
                  ligne.type_mouvement
                ),

              quantite:
                Math.max(
                  1,
                  nombre(
                    ligne.quantite
                  )
                ),

              dateMouvement:
                texte(
                  ligne.date_mouvement
                ),

              observations:
                texte(
                  ligne.observations
                ),

              createdAt:
                texte(
                  ligne.created_at
                ),
            })
          )
        );

        setLogements(
          (
            resultatLogements.data ||
            []
          ).map(
            (
              ligne
            ): Logement => ({
              id:
                String(
                  ligne.id
                ),

              nom:
                texte(
                  ligne.nom
                ),

              ville:
                texte(
                  ligne.ville
                ),
            })
          )
        );

        setVoyageurs(
          (
            resultatVoyageurs.data ||
            []
          ).map(
            (
              ligne
            ): Voyageur => ({
              id:
                String(
                  ligne.id
                ),

              prenom:
                texte(
                  ligne.prenom
                ),

              nom:
                texte(
                  ligne.nom
                ),
            })
          )
        );

        setMissions(
          (
            resultatMissions.data ||
            []
          ).map(
            (
              ligne
            ): Mission => ({
              id:
                String(
                  ligne.id
                ),

              titre:
                texte(
                  ligne.titre
                ),

              date:
                dateSeulement(
                  ligne.date_mission
                ),

              logementId:
                texte(
                  ligne.logement_id
                ),

              voyageurId:
                texte(
                  ligne.voyageur_id
                ),
            })
          )
        );
      } catch (
        erreurInconnue
      ) {
        if (actif) {
          setErreur(
            `Impossible de charger la gestion des clés : ${messageErreur(
              erreurInconnue
            )}`
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

    void charger();

    return () => {
      actif =
        false;
    };
  }, []);

  const statistiques =
    useMemo(() => {
      const actives =
        cles.filter(
          (cle) =>
            cle.actif
        );

      const total =
        actives.reduce(
          (
            somme,
            cle
          ) =>
            somme +
            cle.quantite,
          0
        );

      const disponibles =
        actives
          .filter(
            (cle) =>
              cle.statut ===
              "Disponible"
          )
          .reduce(
            (
              somme,
              cle
            ) =>
              somme +
              cle.quantite,
            0
          );

      const enCirculation =
        actives
          .filter(
            (cle) =>
              estEnCirculation(
                cle.statut
              )
          )
          .reduce(
            (
              somme,
              cle
            ) =>
              somme +
              cle.quantite,
            0
          );

      const alertes =
        actives
          .filter(
            (cle) =>
              cle.statut ===
                "Perdue" ||
              cle.statut ===
                "À remplacer" ||
              estRetourEnRetard(
                cle
              )
          )
          .reduce(
            (
              somme,
              cle
            ) =>
              somme +
              cle.quantite,
            0
          );

      return {
        total,
        disponibles,
        enCirculation,
        alertes,
      };
    }, [
      cles,
    ]);

  const resultats =
    useMemo(() => {
      const rechercheNormalisee =
        normaliserTexte(
          recherche
        );

      return cles
        .filter(
          (cle) => {
            if (
              filtreActif ===
                "Actives" &&
              !cle.actif
            ) {
              return false;
            }

            if (
              filtreActif ===
                "Archivées" &&
              cle.actif
            ) {
              return false;
            }

            if (
              filtreStatut !==
                "Tous" &&
              cle.statut !==
                filtreStatut
            ) {
              return false;
            }

            if (
              filtreType !==
                "Tous" &&
              cle.type !==
                filtreType
            ) {
              return false;
            }

            if (
              filtreLogement !==
                "Tous" &&
              cle.logementId !==
                filtreLogement
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
                  cle.logementId
              );

            const contenu =
              [
                cle.nom,
                cle.type,
                cle.statut,
                cle.detenteur,
                cle.emplacement,
                cle.code,
                cle.numero,
                cle.notes,
                logement?.nom ||
                  "",
                logement?.ville ||
                  "",
              ]
                .map(
                  (
                    valeur
                  ) =>
                    normaliserTexte(
                      String(
                        valeur ||
                          ""
                      )
                    )
                )
                .join(
                  " "
                );

            return contenu.includes(
              rechercheNormalisee
            );
          }
        )
        .sort(
          (
            a,
            b
          ) => {
            const priorites:
              Record<
                StatutCle,
                number
              > = {
                Perdue: 0,
                "À remplacer": 1,
                "Remise au voyageur": 2,
                "Confiée à un prestataire": 3,
                Disponible: 4,
              };

            const retardA =
              estRetourEnRetard(
                a
              )
                ? -1
                : 0;

            const retardB =
              estRetourEnRetard(
                b
              )
                ? -1
                : 0;

            if (
              retardA !==
              retardB
            ) {
              return (
                retardA -
                retardB
              );
            }

            const comparaison =
              priorites[
                a.statut
              ] -
              priorites[
                b.statut
              ];

            if (
              comparaison !==
              0
            ) {
              return comparaison;
            }

            return nomLogementParListe(
              a.logementId,
              logements
            ).localeCompare(
              nomLogementParListe(
                b.logementId,
                logements
              )
            );
          }
        );
    }, [
      cles,
      logements,
      recherche,
      filtreStatut,
      filtreType,
      filtreLogement,
      filtreActif,
    ]);

  const missionsMouvement =
    useMemo(() => {
      if (
        !mouvementCleId
      ) {
        return missions;
      }

      const cle =
        cles.find(
          (item) =>
            item.id ===
            mouvementCleId
        );

      if (!cle) {
        return missions;
      }

      return missions.filter(
        (mission) =>
          !mission.logementId ||
          mission.logementId ===
            cle.logementId
      );
    }, [
      missions,
      cles,
      mouvementCleId,
    ]);

  function nomLogement(
    id: string
  ): string {
    return nomLogementParListe(
      id,
      logements
    );
  }

  function nomVoyageurParId(
    id: string
  ): string {
    return nomVoyageur(
      voyageurs.find(
        (item) =>
          item.id === id
      )
    );
  }

  function nomMission(
    id: string
  ): string {
    const mission =
      missions.find(
        (item) =>
          item.id === id
      );

    if (!mission) {
      return "";
    }

    return [
      mission.date,
      mission.titre,
    ]
      .filter(
        Boolean
      )
      .join(
        " — "
      );
  }

  function ouvrirNouvelleCle() {
    setCleEnCours(
      creerCleVide()
    );

    setErreur(
      ""
    );

    setMessage(
      ""
    );

    setFormulaireOuvert(
      true
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function ouvrirModification(
    cle: Cle
  ) {
    setCleEnCours({
      ...cle,
    });

    setErreur(
      ""
    );

    setMessage(
      ""
    );

    setFormulaireOuvert(
      true
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function fermerFormulaire() {
    setCleEnCours(
      creerCleVide()
    );

    setErreur(
      ""
    );

    setFormulaireOuvert(
      false
    );
  }

  async function sauvegarderCle() {
    if (
      !organizationId ||
      traitement
    ) {
      return;
    }

    if (
      !cleEnCours.logementId
    ) {
      setErreur(
        "Le logement est obligatoire."
      );
      return;
    }

    if (
      !cleEnCours.nom.trim()
    ) {
      setErreur(
        "Le nom du jeu de clés est obligatoire."
      );
      return;
    }

    if (
      cleEnCours.quantite <
      1
    ) {
      setErreur(
        "La quantité doit être supérieure à zéro."
      );
      return;
    }

    if (
      estEnCirculation(
        cleEnCours.statut
      ) &&
      !cleEnCours.detenteur.trim()
    ) {
      setErreur(
        "Indiquez le détenteur des clés."
      );
      return;
    }

    setTraitement(
      true
    );

    setErreur(
      ""
    );

    setMessage(
      ""
    );

    try {
      const maintenant =
        new Date()
          .toISOString();

      const payload = {
        organization_id:
          organizationId,

        logement_id:
          cleEnCours.logementId,

        libelle:
          cleEnCours.nom.trim(),

        quantite:
          Math.max(
            1,
            Math.round(
              cleEnCours.quantite
            )
          ),

        numero:
          cleEnCours.numero.trim() ||
          null,

        type_cle:
          cleEnCours.type,

        statut:
          cleEnCours.statut,

        detenteur:
          cleEnCours.detenteur.trim() ||
          null,

        emplacement:
          cleEnCours.emplacement.trim() ||
          null,

        code:
          cleEnCours.code.trim() ||
          null,

        date_sortie:
          cleEnCours.dateSortie ||
          null,

        date_retour_prevue:
          cleEnCours.dateRetourPrevue ||
          null,

        observations:
          cleEnCours.notes.trim() ||
          null,

        actif:
          cleEnCours.actif,

        updated_at:
          maintenant,
      };

      if (
        cleEnCours.id
      ) {
        const {
          data,
          error:
            erreurMiseAJour,
        } =
          await supabase
            .from(
              "cles"
            )
            .update(
              payload
            )
            .eq(
              "organization_id",
              organizationId
            )
            .eq(
              "id",
              cleEnCours.id
            )
            .select(
              "id"
            )
            .single();

        if (
          erreurMiseAJour
        ) {
          throw erreurMiseAJour;
        }

        if (!data) {
          throw new Error(
            "La clé n'a pas été modifiée."
          );
        }

        setCles(
          (liste) =>
            liste.map(
              (cle) =>
                cle.id ===
                cleEnCours.id
                  ? {
                      ...cleEnCours,
                      nom:
                        cleEnCours.nom.trim(),
                      numero:
                        cleEnCours.numero.trim(),
                      detenteur:
                        cleEnCours.detenteur.trim(),
                      emplacement:
                        cleEnCours.emplacement.trim(),
                      code:
                        cleEnCours.code.trim(),
                      notes:
                        cleEnCours.notes.trim(),
                      updatedAt:
                        maintenant,
                    }
                  : cle
            )
        );

        setMessage(
          "✓ Clé modifiée dans Supabase"
        );
      } else {
        const {
          data,
          error:
            erreurInsertion,
        } =
          await supabase
            .from(
              "cles"
            )
            .insert({
              ...payload,
              created_at:
                maintenant,
            })
            .select(
              `
                id,
                created_at,
                updated_at
              `
            )
            .single();

        if (
          erreurInsertion
        ) {
          throw erreurInsertion;
        }

        const nouvelleCle:
          Cle = {
            ...cleEnCours,
            id:
              String(
                data.id
              ),
            nom:
              cleEnCours.nom.trim(),
            numero:
              cleEnCours.numero.trim(),
            detenteur:
              cleEnCours.detenteur.trim(),
            emplacement:
              cleEnCours.emplacement.trim(),
            code:
              cleEnCours.code.trim(),
            notes:
              cleEnCours.notes.trim(),
            createdAt:
              texte(
                data.created_at
              ) ||
              maintenant,
            updatedAt:
              texte(
                data.updated_at
              ) ||
              maintenant,
          };

        setCles(
          (liste) => [
            nouvelleCle,
            ...liste,
          ]
        );

        setMessage(
          "✓ Clé créée dans Supabase"
        );
      }

      fermerFormulaire();
    } catch (
      erreurInconnue
    ) {
      setErreur(
        `Enregistrement impossible : ${messageErreur(
          erreurInconnue
        )}`
      );
    } finally {
      setTraitement(
        false
      );
    }
  }

  async function basculerArchive(
    cle: Cle
  ) {
    if (
      !organizationId ||
      traitement
    ) {
      return;
    }

    const nouvelEtat =
      !cle.actif;

    const confirmation =
      window.confirm(
        nouvelEtat
          ? `Réactiver « ${cle.nom} » ?`
          : `Archiver « ${cle.nom} » ? L'historique sera conservé.`
      );

    if (!confirmation) {
      return;
    }

    setTraitement(
      true
    );

    setErreur(
      ""
    );

    setMessage(
      ""
    );

    try {
      const maintenant =
        new Date()
          .toISOString();

      const {
        data,
        error:
          erreurMiseAJour,
      } =
        await supabase
          .from(
            "cles"
          )
          .update({
            actif:
              nouvelEtat,
            updated_at:
              maintenant,
          })
          .eq(
            "organization_id",
            organizationId
          )
          .eq(
            "id",
            cle.id
          )
          .select(
            "id"
          )
          .single();

      if (
        erreurMiseAJour
      ) {
        throw erreurMiseAJour;
      }

      if (!data) {
        throw new Error(
          "Aucune clé modifiée."
        );
      }

      setCles(
        (liste) =>
          liste.map(
            (item) =>
              item.id ===
                cle.id
                ? {
                    ...item,
                    actif:
                      nouvelEtat,
                    updatedAt:
                      maintenant,
                  }
                : item
          )
      );

      setMessage(
        nouvelEtat
          ? "✓ Clé réactivée"
          : "✓ Clé archivée"
      );
    } catch (
      erreurInconnue
    ) {
      setErreur(
        `Modification impossible : ${messageErreur(
          erreurInconnue
        )}`
      );
    } finally {
      setTraitement(
        false
      );
    }
  }

  function ouvrirMouvement(
    cle: Cle,
    type?: TypeMouvementForm
  ) {
    const mouvement =
      creerMouvementVide();

    mouvement.quantite =
      Math.min(
        Math.max(
          1,
          cle.quantite
        ),
        cle.quantite
      );

    if (type) {
      mouvement.typeMouvement =
        type;
    }

    if (
      type === "Retour"
    ) {
      mouvement.detenteur =
        cle.detenteur;
    }

    setMouvementEnCours(
      mouvement
    );

    setMouvementCleId(
      cle.id
    );

    setErreur(
      ""
    );

    setMessage(
      ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function fermerMouvement() {
    setMouvementCleId(
      ""
    );

    setMouvementEnCours(
      creerMouvementVide()
    );

    setErreur(
      ""
    );
  }

  async function enregistrerMouvement() {
    if (
      !organizationId ||
      !mouvementCleId ||
      traitement
    ) {
      return;
    }

    const cle =
      cles.find(
        (item) =>
          item.id ===
          mouvementCleId
      );

    if (!cle) {
      setErreur(
        "Clé introuvable."
      );
      return;
    }

    if (
      mouvementEnCours.quantite <
        1 ||
      mouvementEnCours.quantite >
        cle.quantite
    ) {
      setErreur(
        `La quantité doit être comprise entre 1 et ${cle.quantite}.`
      );
      return;
    }

    const estRemiseVoyageur =
      mouvementEnCours.typeMouvement ===
      "Remise au voyageur";

    const estPrestataire =
      mouvementEnCours.typeMouvement ===
      "Confiée à un prestataire";

    if (
      estRemiseVoyageur &&
      !mouvementEnCours.voyageurId &&
      !mouvementEnCours.detenteur.trim()
    ) {
      setErreur(
        "Sélectionnez un voyageur ou indiquez un détenteur."
      );
      return;
    }

    if (
      estPrestataire &&
      !mouvementEnCours.detenteur.trim()
    ) {
      setErreur(
        "Indiquez le nom du prestataire."
      );
      return;
    }

    setTraitement(
      true
    );

    setErreur(
      ""
    );

    setMessage(
      ""
    );

    try {
      const maintenant =
        new Date()
          .toISOString();

      const voyageurSelectionne =
        voyageurs.find(
          (item) =>
            item.id ===
            mouvementEnCours.voyageurId
        );

      const detenteurFinal =
        mouvementEnCours.detenteur.trim() ||
        nomVoyageur(
          voyageurSelectionne
        );

      let nouveauStatut:
        StatutCle =
        cle.statut;

      let nouveauDetenteur =
        cle.detenteur;

      let nouvelleDateSortie =
        cle.dateSortie;

      let nouvelleDateRetour =
        cle.dateRetourPrevue;

      if (
        mouvementEnCours.typeMouvement ===
        "Remise au voyageur"
      ) {
        nouveauStatut =
          "Remise au voyageur";
        nouveauDetenteur =
          detenteurFinal;
        nouvelleDateSortie =
          maintenant.slice(
            0,
            10
          );
        nouvelleDateRetour =
          mouvementEnCours.dateRetourPrevue;
      } else if (
        mouvementEnCours.typeMouvement ===
        "Confiée à un prestataire"
      ) {
        nouveauStatut =
          "Confiée à un prestataire";
        nouveauDetenteur =
          detenteurFinal;
        nouvelleDateSortie =
          maintenant.slice(
            0,
            10
          );
        nouvelleDateRetour =
          mouvementEnCours.dateRetourPrevue;
      } else if (
        mouvementEnCours.typeMouvement ===
        "Retour"
      ) {
        nouveauStatut =
          "Disponible";
        nouveauDetenteur =
          "";
        nouvelleDateSortie =
          "";
        nouvelleDateRetour =
          "";
      } else if (
        mouvementEnCours.typeMouvement ===
        "Perdue"
      ) {
        nouveauStatut =
          "Perdue";
      } else if (
        mouvementEnCours.typeMouvement ===
        "À remplacer"
      ) {
        nouveauStatut =
          "À remplacer";
      }

      const {
        data:
          mouvementInsere,
        error:
          erreurMouvement,
      } =
        await supabase
          .from(
            "mouvements_cles"
          )
          .insert({
            organization_id:
              organizationId,

            cle_id:
              cle.id,

            mission_id:
              mouvementEnCours.missionId ||
              null,

            voyageur_id:
              mouvementEnCours.voyageurId ||
              null,

            type_mouvement:
              codeMouvementSupabase(
                mouvementEnCours.typeMouvement
              ),

            quantite:
              mouvementEnCours.quantite,

            date_mouvement:
              maintenant,

            observations:
              [
                mouvementEnCours.typeMouvement ===
                    "Confiée à un prestataire" &&
                  detenteurFinal
                  ? `Prestataire : ${detenteurFinal}`
                  : "",

                mouvementEnCours.typeMouvement ===
                    "Remise au voyageur" &&
                  !mouvementEnCours.voyageurId &&
                  detenteurFinal
                  ? `Détenteur : ${detenteurFinal}`
                  : "",

                mouvementEnCours.typeMouvement ===
                    "Retour" &&
                  cle.detenteur
                  ? `Retour de : ${cle.detenteur}`
                  : "",

                mouvementEnCours.typeMouvement ===
                    "Perdue"
                  ? "Clé déclarée perdue"
                  : "",

                mouvementEnCours.typeMouvement ===
                    "À remplacer"
                  ? "Clé à remplacer"
                  : "",

                mouvementEnCours.observations.trim(),
              ]
                .filter(Boolean)
                .join("\n") ||
              null,

            created_at:
              maintenant,
          })
          .select(
            `
              id,
              cle_id,
              mission_id,
              voyageur_id,
              type_mouvement,
              quantite,
              date_mouvement,
              observations,
              created_at
            `
          )
          .single();

      if (
        erreurMouvement
      ) {
        throw erreurMouvement;
      }

      const {
        data:
          cleMiseAJour,
        error:
          erreurCle,
      } =
        await supabase
          .from(
            "cles"
          )
          .update({
            statut:
              nouveauStatut,

            detenteur:
              nouveauDetenteur ||
              null,

            date_sortie:
              nouvelleDateSortie ||
              null,

            date_retour_prevue:
              nouvelleDateRetour ||
              null,

            updated_at:
              maintenant,
          })
          .eq(
            "organization_id",
            organizationId
          )
          .eq(
            "id",
            cle.id
          )
          .select(
            "id"
          )
          .single();

      if (
        erreurCle
      ) {
        /*
         * Le mouvement a été créé mais la clé n'a pas
         * été mise à jour. On le signale explicitement
         * pour ne jamais donner un faux message de succès.
         */
        throw erreurCle;
      }

      if (!cleMiseAJour) {
        throw new Error(
          "La clé n'a pas été mise à jour."
        );
      }

      const nouveauMouvement:
        MouvementCle = {
          id:
            String(
              mouvementInsere.id
            ),

          cleId:
            texte(
              mouvementInsere.cle_id
            ),

          missionId:
            texte(
              mouvementInsere.mission_id
            ),

          voyageurId:
            texte(
              mouvementInsere.voyageur_id
            ),

          typeMouvement:
            texte(
              mouvementInsere.type_mouvement
            ),

          quantite:
            Math.max(
              1,
              nombre(
                mouvementInsere.quantite
              )
            ),

          dateMouvement:
            texte(
              mouvementInsere.date_mouvement
            ),

          observations:
            texte(
              mouvementInsere.observations
            ),

          createdAt:
            texte(
              mouvementInsere.created_at
            ),
        };

      setMouvements(
        (liste) => [
          nouveauMouvement,
          ...liste,
        ]
      );

      setCles(
        (liste) =>
          liste.map(
            (item) =>
              item.id ===
                cle.id
                ? {
                    ...item,
                    statut:
                      nouveauStatut,
                    detenteur:
                      nouveauDetenteur,
                    dateSortie:
                      nouvelleDateSortie,
                    dateRetourPrevue:
                      nouvelleDateRetour,
                    updatedAt:
                      maintenant,
                  }
                : item
          )
      );

      setHistoriqueOuvert(
        cle.id
      );

      setMessage(
        "✓ Mouvement enregistré dans Supabase"
      );

      fermerMouvement();
    } catch (
      erreurInconnue
    ) {
      setErreur(
        `Mouvement impossible : ${messageErreur(
          erreurInconnue
        )}`
      );
    } finally {
      setTraitement(
        false
      );
    }
  }

  function reinitialiserFiltres() {
    setRecherche(
      ""
    );

    setFiltreStatut(
      "Tous"
    );

    setFiltreType(
      "Tous"
    );

    setFiltreLogement(
      "Tous"
    );

    setFiltreActif(
      "Actives"
    );
  }

  const filtresActifs =
    recherche.trim() !==
      "" ||
    filtreStatut !==
      "Tous" ||
    filtreType !==
      "Tous" ||
    filtreLogement !==
      "Tous" ||
    filtreActif !==
      "Actives";

  const cleMouvement =
    cles.find(
      (item) =>
        item.id ===
        mouvementCleId
    );

  return (
    <div className="space-y-8">
      <PageHeader
        titre="Gestion des clés"
        description="Inventaire, détenteurs, remises, retours et historique des mouvements."
        action={
          <button
            type="button"
            onClick={
              ouvrirNouvelleCle
            }
            disabled={
              logements.length ===
                0 ||
              traitement
            }
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            + Nouveau jeu de clés
          </button>
        }
      />

      {erreur && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold leading-6 text-red-700">
          {erreur}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold leading-6 text-emerald-800">
          {message}
        </div>
      )}

      {logements.length ===
        0 &&
        donneesChargees && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-black text-amber-950">
              Aucun logement enregistré
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              Ajoutez un logement avant d’enregistrer ses clés, badges ou télécommandes.
            </p>
          </div>
        )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <CarteStatistique
          titre="Total"
          valeur={
            statistiques.total
          }
          couleur="blue"
        />

        <CarteStatistique
          titre="Disponibles"
          valeur={
            statistiques.disponibles
          }
          couleur="green"
        />

        <CarteStatistique
          titre="En circulation"
          valeur={
            statistiques.enCirculation
          }
          couleur="orange"
        />

        <CarteStatistique
          titre="Alertes"
          valeur={
            statistiques.alertes
          }
          couleur="red"
        />
      </div>

      {formulaireOuvert && (
        <Section
          titre={
            cleEnCours.id
              ? "Modifier le jeu de clés"
              : "Nouveau jeu de clés"
          }
          description="L’inventaire est enregistré directement dans Supabase."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Logement
              </span>

              <select
                value={
                  cleEnCours.logementId
                }
                onChange={(
                  event
                ) =>
                  setCleEnCours({
                    ...cleEnCours,
                    logementId:
                      event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">
                  Sélectionner un logement
                </option>

                {logements.map(
                  (
                    logement
                  ) => (
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

            <Champ
              label="Nom du jeu"
              value={
                cleEnCours.nom
              }
              placeholder="Exemple : jeu principal"
              onChange={(
                valeur
              ) =>
                setCleEnCours({
                  ...cleEnCours,
                  nom: valeur,
                })
              }
            />

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Type
              </span>

              <select
                value={
                  cleEnCours.type
                }
                onChange={(
                  event
                ) =>
                  setCleEnCours({
                    ...cleEnCours,
                    type:
                      event.target
                        .value as TypeCle,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {typesCle.map(
                  (
                    type
                  ) => (
                    <option
                      key={
                        type
                      }
                      value={
                        type
                      }
                    >
                      {type}
                    </option>
                  )
                )}
              </select>
            </label>

            <ChampNombre
              label="Quantité"
              value={
                cleEnCours.quantite
              }
              min={
                1
              }
              max={
                999
              }
              onChange={(
                valeur
              ) =>
                setCleEnCours({
                  ...cleEnCours,
                  quantite:
                    valeur,
                })
              }
            />

            <Champ
              label="Numéro / repère"
              value={
                cleEnCours.numero
              }
              placeholder="Exemple : JEU-01"
              onChange={(
                valeur
              ) =>
                setCleEnCours({
                  ...cleEnCours,
                  numero:
                    valeur,
                })
              }
            />

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Statut actuel
              </span>

              <select
                value={
                  cleEnCours.statut
                }
                onChange={(
                  event
                ) =>
                  setCleEnCours({
                    ...cleEnCours,
                    statut:
                      event.target
                        .value as StatutCle,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {statutsCle.map(
                  (
                    statut
                  ) => (
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
              label="Détenteur actuel"
              value={
                cleEnCours.detenteur
              }
              placeholder="Voyageur, prestataire..."
              onChange={(
                valeur
              ) =>
                setCleEnCours({
                  ...cleEnCours,
                  detenteur:
                    valeur,
                })
              }
            />

            <Champ
              label="Emplacement habituel"
              value={
                cleEnCours.emplacement
              }
              placeholder="Bureau, coffre, boîte à clés..."
              onChange={(
                valeur
              ) =>
                setCleEnCours({
                  ...cleEnCours,
                  emplacement:
                    valeur,
                })
              }
            />

            <Champ
              label="Code de la boîte"
              value={
                cleEnCours.code
              }
              placeholder="Code éventuel"
              onChange={(
                valeur
              ) =>
                setCleEnCours({
                  ...cleEnCours,
                  code:
                    valeur,
                })
              }
            />

            <Champ
              label="Date de sortie"
              type="date"
              value={
                cleEnCours.dateSortie
              }
              onChange={(
                valeur
              ) =>
                setCleEnCours({
                  ...cleEnCours,
                  dateSortie:
                    valeur,
                })
              }
            />

            <Champ
              label="Retour prévu"
              type="date"
              value={
                cleEnCours.dateRetourPrevue
              }
              onChange={(
                valeur
              ) =>
                setCleEnCours({
                  ...cleEnCours,
                  dateRetourPrevue:
                    valeur,
                })
              }
            />
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Notes
            </span>

            <textarea
              value={
                cleEnCours.notes
              }
              onChange={(
                event
              ) =>
                setCleEnCours({
                  ...cleEnCours,
                  notes:
                    event.target.value,
                })
              }
              rows={
                4
              }
              placeholder="Consignes, particularités, état du badge ou de la télécommande..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                void sauvegarderCle();
              }}
              disabled={
                traitement
              }
              className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {traitement
                ? "Enregistrement..."
                : "Enregistrer"}
            </button>

            <button
              type="button"
              onClick={
                fermerFormulaire
              }
              disabled={
                traitement
              }
              className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </Section>
      )}

      {cleMouvement && (
        <Section
          titre={`Mouvement — ${cleMouvement.nom}`}
          description={`${nomLogement(
            cleMouvement.logementId
          )} · ${cleMouvement.quantite} élément(s) en inventaire`}
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Type de mouvement
              </span>

              <select
                value={
                  mouvementEnCours.typeMouvement
                }
                onChange={(
                  event
                ) =>
                  setMouvementEnCours({
                    ...mouvementEnCours,
                    typeMouvement:
                      event.target
                        .value as TypeMouvementForm,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {typesMouvement.map(
                  (
                    type
                  ) => (
                    <option
                      key={
                        type
                      }
                      value={
                        type
                      }
                    >
                      {type}
                    </option>
                  )
                )}
              </select>
            </label>

            <ChampNombre
              label="Quantité"
              value={
                mouvementEnCours.quantite
              }
              min={
                1
              }
              max={
                cleMouvement.quantite
              }
              onChange={(
                valeur
              ) =>
                setMouvementEnCours({
                  ...mouvementEnCours,
                  quantite:
                    valeur,
                })
              }
            />

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Voyageur
              </span>

              <select
                value={
                  mouvementEnCours.voyageurId
                }
                onChange={(
                  event
                ) => {
                  const voyageurId =
                    event.target.value;

                  const voyageur =
                    voyageurs.find(
                      (item) =>
                        item.id ===
                        voyageurId
                    );

                  setMouvementEnCours({
                    ...mouvementEnCours,
                    voyageurId,
                    detenteur:
                      nomVoyageur(
                        voyageur
                      ) ||
                      mouvementEnCours.detenteur,
                  });
                }}
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">
                  Aucun voyageur
                </option>

                {voyageurs.map(
                  (
                    voyageur
                  ) => (
                    <option
                      key={
                        voyageur.id
                      }
                      value={
                        voyageur.id
                      }
                    >
                      {nomVoyageur(
                        voyageur
                      )}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Mission liée
              </span>

              <select
                value={
                  mouvementEnCours.missionId
                }
                onChange={(
                  event
                ) =>
                  setMouvementEnCours({
                    ...mouvementEnCours,
                    missionId:
                      event.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">
                  Aucune mission
                </option>

                {missionsMouvement.map(
                  (
                    mission
                  ) => (
                    <option
                      key={
                        mission.id
                      }
                      value={
                        mission.id
                      }
                    >
                      {mission.date
                        ? `${mission.date} — `
                        : ""}
                      {mission.titre}
                    </option>
                  )
                )}
              </select>
            </label>

            <Champ
              label="Détenteur"
              value={
                mouvementEnCours.detenteur
              }
              placeholder="Nom du voyageur ou du prestataire"
              onChange={(
                valeur
              ) =>
                setMouvementEnCours({
                  ...mouvementEnCours,
                  detenteur:
                    valeur,
                })
              }
            />

            <Champ
              label="Retour prévu"
              type="date"
              value={
                mouvementEnCours.dateRetourPrevue
              }
              onChange={(
                valeur
              ) =>
                setMouvementEnCours({
                  ...mouvementEnCours,
                  dateRetourPrevue:
                    valeur,
                })
              }
            />
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Observations
            </span>

            <textarea
              rows={
                4
              }
              value={
                mouvementEnCours.observations
              }
              onChange={(
                event
              ) =>
                setMouvementEnCours({
                  ...mouvementEnCours,
                  observations:
                    event.target.value,
                })
              }
              placeholder="État lors de la remise, consignes, circonstances..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                void enregistrerMouvement();
              }}
              disabled={
                traitement
              }
              className="rounded-2xl bg-violet-600 px-6 py-3 font-bold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {traitement
                ? "Enregistrement..."
                : "Enregistrer le mouvement"}
            </button>

            <button
              type="button"
              onClick={
                fermerMouvement
              }
              disabled={
                traitement
              }
              className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </Section>
      )}

      <Section
        titre="Rechercher et filtrer"
        description={`${resultats.length} élément(s) affiché(s)`}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_190px_190px_210px_170px_auto]">
          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Rechercher
            </span>

            <input
              type="search"
              value={
                recherche
              }
              onChange={(
                event
              ) =>
                setRecherche(
                  event.target.value
                )
              }
              placeholder="Logement, détenteur, emplacement, code, numéro..."
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <SelectFiltre
            label="Statut"
            value={
              filtreStatut
            }
            options={[
              "Tous",
              ...statutsCle,
            ]}
            onChange={(
              valeur
            ) =>
              setFiltreStatut(
                valeur as FiltreStatut
              )
            }
          />

          <SelectFiltre
            label="Type"
            value={
              filtreType
            }
            options={[
              "Tous",
              ...typesCle,
            ]}
            onChange={(
              valeur
            ) =>
              setFiltreType(
                valeur as FiltreType
              )
            }
          />

          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Logement
            </span>

            <select
              value={
                filtreLogement
              }
              onChange={(
                event
              ) =>
                setFiltreLogement(
                  event.target.value
                )
              }
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            >
              <option value="Tous">
                Tous les logements
              </option>

              {logements.map(
                (
                  logement
                ) => (
                  <option
                    key={
                      logement.id
                    }
                    value={
                      logement.id
                    }
                  >
                    {logement.nom}
                  </option>
                )
              )}
            </select>
          </label>

          <SelectFiltre
            label="État"
            value={
              filtreActif
            }
            options={[
              "Actives",
              "Archivées",
              "Toutes",
            ]}
            onChange={(
              valeur
            ) =>
              setFiltreActif(
                valeur as FiltreActif
              )
            }
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
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </Section>

      <Section
        titre="Inventaire des clés"
        description="Disponibilités, détenteurs, retours prévus et historique."
      >
        {!donneesChargees ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 font-bold text-slate-500">
              Chargement depuis Supabase...
            </p>
          </div>
        ) : resultats.length >
          0 ? (
          <div className="grid gap-6 xl:grid-cols-2">
            {resultats.map(
              (
                cle
              ) => {
                const historique =
                  mouvements.filter(
                    (
                      mouvement
                    ) =>
                      mouvement.cleId ===
                      cle.id
                  );

                return (
                  <CarteCle
                    key={
                      cle.id
                    }
                    cle={
                      cle
                    }
                    logement={nomLogement(
                      cle.logementId
                    )}
                    historique={
                      historique
                    }
                    historiqueOuvert={
                      historiqueOuvert ===
                      cle.id
                    }
                    voyageurNom={
                      nomVoyageurParId
                    }
                    missionNom={
                      nomMission
                    }
                    onModifier={() =>
                      ouvrirModification(
                        cle
                      )
                    }
                    onArchiver={() => {
                      void basculerArchive(
                        cle
                      );
                    }}
                    onMouvement={(
                      type
                    ) =>
                      ouvrirMouvement(
                        cle,
                        type
                      )
                    }
                    onHistorique={() =>
                      setHistoriqueOuvert(
                        historiqueOuvert ===
                          cle.id
                          ? ""
                          : cle.id
                      )
                    }
                  />
                );
              }
            )}
          </div>
        ) : cles.length ===
          0 ? (
          <EtatVide
            icone="🔑"
            titre="Aucune clé enregistrée"
            texte="Ajoutez les clés, badges et télécommandes associés à vos logements."
            action={
              logements.length >
              0 ? (
                <button
                  type="button"
                  onClick={
                    ouvrirNouvelleCle
                  }
                  className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                >
                  + Ajouter un jeu de clés
                </button>
              ) : null
            }
          />
        ) : (
          <EtatVide
            icone="🔎"
            titre="Aucun résultat"
            texte="Aucun élément ne correspond aux filtres sélectionnés."
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

function nomLogementParListe(
  id: string,
  logements: Logement[]
): string {
  const logement =
    logements.find(
      (item) =>
        item.id === id
    );

  if (!logement) {
    return "Logement non renseigné";
  }

  return logement.ville
    ? `${logement.nom} — ${logement.ville}`
    : logement.nom;
}

function CarteCle({
  cle,
  logement,
  historique,
  historiqueOuvert,
  voyageurNom,
  missionNom,
  onModifier,
  onArchiver,
  onMouvement,
  onHistorique,
}: {
  cle: Cle;
  logement: string;
  historique: MouvementCle[];
  historiqueOuvert: boolean;
  voyageurNom: (
    id: string
  ) => string;
  missionNom: (
    id: string
  ) => string;
  onModifier: () => void;
  onArchiver: () => void;
  onMouvement: (
    type:
      TypeMouvementForm
  ) => void;
  onHistorique: () => void;
}) {
  const statutClasses:
    Record<
      StatutCle,
      string
    > = {
      Disponible:
        "bg-emerald-100 text-emerald-700",

      "Remise au voyageur":
        "bg-blue-100 text-blue-700",

      "Confiée à un prestataire":
        "bg-violet-100 text-violet-700",

      Perdue:
        "bg-red-100 text-red-700",

      "À remplacer":
        "bg-orange-100 text-orange-700",
    };

  const retard =
    estRetourEnRetard(
      cle
    );

  return (
    <article
      className={`rounded-3xl border bg-white p-6 shadow-sm transition hover:shadow-md ${
        retard
          ? "border-red-300"
          : "border-slate-200"
      } ${
        !cle.actif
          ? "opacity-70"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              {cle.type}
            </span>

            {!cle.actif && (
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                Archivée
              </span>
            )}

            {retard && (
              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                ⚠ Retour en retard
              </span>
            )}
          </div>

          <h3 className="mt-4 text-xl font-black text-slate-950">
            {cle.nom}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {logement}
          </p>

          {cle.numero && (
            <p className="mt-1 text-xs font-bold text-slate-400">
              Repère : {cle.numero}
            </p>
          )}
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            statutClasses[
              cle.statut
            ]
          }`}
        >
          {cle.statut}
        </span>
      </div>

      <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <Info
          label="Quantité"
          value={String(
            cle.quantite
          )}
        />

        <Info
          label="Détenteur"
          value={
            cle.detenteur ||
            "Aucun"
          }
        />

        <Info
          label="Emplacement"
          value={
            cle.emplacement ||
            "Non renseigné"
          }
        />

        <Info
          label="Code"
          value={
            cle.code ||
            "Aucun"
          }
        />

        <Info
          label="Date de sortie"
          value={
            cle.dateSortie ||
            "—"
          }
        />

        <Info
          label="Retour prévu"
          value={
            cle.dateRetourPrevue ||
            "—"
          }
        />
      </div>

      {cle.notes && (
        <p className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          {cle.notes}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {cle.actif && (
          <>
            <button
              type="button"
              onClick={() =>
                onMouvement(
                  "Remise au voyageur"
                )
              }
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              Remettre
            </button>

            <button
              type="button"
              onClick={() =>
                onMouvement(
                  "Confiée à un prestataire"
                )
              }
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700"
            >
              Confier
            </button>

            {estEnCirculation(
              cle.statut
            ) && (
              <button
                type="button"
                onClick={() =>
                  onMouvement(
                    "Retour"
                  )
                }
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
              >
                Retour
              </button>
            )}

            <button
              type="button"
              onClick={
                onModifier
              }
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
            >
              Modifier
            </button>
          </>
        )}

        <button
          type="button"
          onClick={
            onHistorique
          }
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Historique ({historique.length})
        </button>

        <button
          type="button"
          onClick={
            onArchiver
          }
          className={`rounded-xl border px-4 py-2 text-sm font-bold ${
            cle.actif
              ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          {cle.actif
            ? "Archiver"
            : "Réactiver"}
        </button>
      </div>

      {historiqueOuvert && (
        <div className="mt-6 border-t border-slate-200 pt-5">
          <h4 className="text-sm font-black uppercase tracking-wider text-slate-500">
            Historique des mouvements
          </h4>

          {historique.length >
          0 ? (
            <div className="mt-4 space-y-3">
              {historique.map(
                (
                  mouvement
                ) => {
                  const voyageur =
                    voyageurNom(
                      mouvement.voyageurId
                    );

                  const mission =
                    missionNom(
                      mouvement.missionId
                    );

                  return (
                    <div
                      key={
                        mouvement.id
                      }
                      className="rounded-2xl bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-black text-slate-900">
                          {libelleMouvementSupabase(
                            mouvement.typeMouvement
                          )}
                        </p>

                        <p className="text-xs font-bold text-slate-500">
                          {formaterDateHeure(
                            mouvement.dateMouvement
                          )}
                        </p>
                      </div>

                      <p className="mt-2 text-sm text-slate-600">
                        Quantité :{" "}
                        <strong>
                          {mouvement.quantite}
                        </strong>
                      </p>

                      {voyageur && (
                        <p className="mt-1 text-sm text-slate-600">
                          Voyageur :{" "}
                          <strong>
                            {voyageur}
                          </strong>
                        </p>
                      )}

                      {mission && (
                        <p className="mt-1 text-sm text-slate-600">
                          Mission :{" "}
                          <strong>
                            {mission}
                          </strong>
                        </p>
                      )}

                      {mouvement.observations && (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {mouvement.observations}
                        </p>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Aucun mouvement enregistré.
            </p>
          )}
        </div>
      )}
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
        className={`inline-flex rounded-2xl border px-3 py-1 text-xs font-bold ${
          couleurs[
            couleur
          ]
        }`}
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
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <input
        type={
          type
        }
        value={
          value
        }
        placeholder={
          placeholder
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function ChampNombre({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (
    value: number
  ) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <input
        type="number"
        min={
          min
        }
        max={
          max
        }
        step={
          1
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            Math.min(
              max,
              Math.max(
                min,
                Math.round(
                  Number(
                    event.target.value ||
                      min
                  )
                )
              )
            )
          )
        }
        className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
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
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      >
        {options.map(
          (
            option
          ) => (
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
      <span className="text-slate-600">
        {value}
      </span>
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
