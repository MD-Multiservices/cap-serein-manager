"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import VoyageurCard from "@/components/voyageurs/VoyageurCard";
import VoyageurForm from "@/components/voyageurs/VoyageurForm";

import {
  enregistrer,
  lire,
} from "@/lib/database";

import { supabase } from "@/lib/supabase";

import {
  type StatutVoyageur,
  type Voyageur,
  voyageurVide,
} from "@/types/voyageur";

type Logement = {
  id: string;
  nom: string;
  ville: string;
};

type LogementLocal = {
  id?: string;
  nom?: string;
  ville?: string;
};

type VoyageurSupabase = {
  id: string;

  logement_id: string | null;

  nom: string | null;
  prenom: string | null;

  telephone: string | null;
  email: string | null;

  adultes: number | null;
  enfants: number | null;
  animaux: number | null;

  arrivee: string | null;
  depart: string | null;

  heure_arrivee: string | null;
  heure_depart: string | null;

  langue: string | null;

  plateforme: string | null;
  numero_reservation: string | null;

  caution: boolean | null;

  statut: string | null;

  observations: string | null;

  created_at: string | null;
  updated_at: string | null;
};

type FiltreStatut =
  | "Tous"
  | StatutVoyageur;

const statuts: FiltreStatut[] = [
  "Tous",
  "Réservation",
  "Arrivé",
  "Parti",
  "Annulé",
];

function creerIdentifiant() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `voyageur-${Date.now()}-${Math.random()
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
) {
  return texte
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}

function normaliserStatut(
  valeur: unknown
): StatutVoyageur {
  if (
    valeur === "Réservation" ||
    valeur === "Arrivé" ||
    valeur === "Parti" ||
    valeur === "Annulé"
  ) {
    return valeur;
  }

  return "Réservation";
}

function normaliserHeure(
  valeur: unknown,
  valeurParDefaut: string
): string {
  const texte = String(
    valeur || ""
  );

  if (
    /^\d{2}:\d{2}/.test(texte)
  ) {
    return texte.slice(0, 5);
  }

  return valeurParDefaut;
}

function dateIsoValide(
  valeur: string
): boolean {
  if (!valeur) {
    return false;
  }

  return !Number.isNaN(
    Date.parse(valeur)
  );
}

function creerNouveauVoyageur(): Voyageur {
  const maintenant =
    new Date().toISOString();

  return {
    ...voyageurVide,

    id: creerIdentifiant(),

    createdAt: maintenant,
    updatedAt: maintenant,
  };
}

function normaliserVoyageurLocal(
  valeur: Partial<Voyageur>
): Voyageur {
  const maintenant =
    new Date().toISOString();

  return {
    ...voyageurVide,
    ...valeur,

    id: String(
      valeur.id ||
        creerIdentifiant()
    ),

    logementId: String(
      valeur.logementId || ""
    ),

    nom: String(
      valeur.nom || ""
    ),

    prenom: String(
      valeur.prenom || ""
    ),

    telephone: String(
      valeur.telephone || ""
    ),

    email: String(
      valeur.email || ""
    ),

    adultes: Math.max(
      0,
      Number(
        valeur.adultes ?? 1
      )
    ),

    enfants: Math.max(
      0,
      Number(
        valeur.enfants ?? 0
      )
    ),

    animaux: Math.max(
      0,
      Number(
        valeur.animaux ?? 0
      )
    ),

    arrivee: String(
      valeur.arrivee || ""
    ),

    depart: String(
      valeur.depart || ""
    ),

    heureArrivee:
      normaliserHeure(
        valeur.heureArrivee,
        "16:00"
      ),

    heureDepart:
      normaliserHeure(
        valeur.heureDepart,
        "10:00"
      ),

    langue: String(
      valeur.langue ||
        "Français"
    ),

    plateforme: String(
      valeur.plateforme ||
        "Direct"
    ),

    numeroReservation:
      String(
        valeur.numeroReservation ||
          ""
      ),

    caution: Boolean(
      valeur.caution
    ),

    statut:
      normaliserStatut(
        valeur.statut
      ),

    observations: String(
      valeur.observations || ""
    ),

    createdAt:
      String(
        valeur.createdAt ||
          maintenant
      ),

    updatedAt:
      String(
        valeur.updatedAt ||
          maintenant
      ),
  };
}

export default function VoyageursPage() {
  const [
    organizationId,
    setOrganizationId,
  ] = useState("");

  const [
    voyageurs,
    setVoyageurs,
  ] = useState<Voyageur[]>([]);

  const [
    logements,
    setLogements,
  ] = useState<Logement[]>([]);

  const [
    voyageurEnCours,
    setVoyageurEnCours,
  ] =
    useState<Voyageur | null>(
      null
    );

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
    filtreLogement,
    setFiltreLogement,
  ] = useState("Tous");

  const [
    formulaireOuvert,
    setFormulaireOuvert,
  ] = useState(false);

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

        const logementsDistants =
          await chargerLogements(
            orgId
          );

        if (!actif) {
          return;
        }

        setLogements(
          logementsDistants
        );

        const migrationEffectuee =
          await chargerVoyageurs(
            orgId,
            logementsDistants,
            true
          );

        if (
          actif &&
          migrationEffectuee
        ) {
          setMessage(
            "Vos anciens voyageurs enregistrés sur cet ordinateur ont été importés dans Supabase."
          );
        }
      } catch (error) {
        console.error(error);

        if (actif) {
          setErreurPage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les voyageurs."
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

  /*
   * Supabase est maintenant la source principale.
   *
   * On conserve temporairement cette copie
   * locale pour les modules Missions / EDL /
   * Planning qui n'ont pas encore été migrés.
   */
  useEffect(() => {
    if (
      !donneesChargees
    ) {
      return;
    }

    enregistrer(
      "voyageurs",
      voyageurs
    );
  }, [
    voyageurs,
    donneesChargees,
  ]);

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
          ville
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
      .order("nom", {
        ascending: true,
      });

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
      })
    );
  }

  async function chargerVoyageurs(
    orgId: string,
    logementsDistants: Logement[],
    autoriserMigration: boolean
  ): Promise<boolean> {
    const {
      data,
      error,
    } = await supabase
      .from("voyageurs")
      .select(
        `
          id,
          logement_id,
          nom,
          prenom,
          telephone,
          email,
          adultes,
          enfants,
          animaux,
          arrivee,
          depart,
          heure_arrivee,
          heure_depart,
          langue,
          plateforme,
          numero_reservation,
          caution,
          statut,
          observations,
          created_at,
          updated_at
        `
      )
      .eq(
        "organization_id",
        orgId
      )
      .order(
        "arrivee",
        {
          ascending: false,
          nullsFirst: false,
        }
      );

    if (error) {
      throw error;
    }

    const lignes =
      (data ||
        []) as VoyageurSupabase[];

    /*
     * Première migration :
     * si Supabase ne contient encore aucun voyageur,
     * on récupère les anciennes fiches du navigateur.
     */
    if (
      autoriserMigration &&
      lignes.length === 0
    ) {
      const voyageursLocaux =
        lire<
          Partial<Voyageur>
        >("voyageurs")
          .map(
            normaliserVoyageurLocal
          )
          .filter(
            (voyageur) =>
              voyageur.nom.trim() !==
                "" ||
              voyageur.prenom.trim() !==
                ""
          );

      if (
        voyageursLocaux.length >
        0
      ) {
        const logementsLocaux =
          lire<LogementLocal>(
            "logements"
          );

        await importerVoyageursLocaux(
          orgId,
          voyageursLocaux,
          logementsLocaux,
          logementsDistants
        );

        await chargerVoyageurs(
          orgId,
          logementsDistants,
          false
        );

        return true;
      }
    }

    const voyageursConvertis =
      lignes.map(
        (
          ligne
        ): Voyageur => ({
          id: ligne.id,

          logementId: String(
            ligne.logement_id ||
              ""
          ),

          nom: String(
            ligne.nom || ""
          ),

          prenom: String(
            ligne.prenom || ""
          ),

          telephone: String(
            ligne.telephone ||
              ""
          ),

          email: String(
            ligne.email || ""
          ),

          adultes: Math.max(
            0,
            Number(
              ligne.adultes ?? 1
            )
          ),

          enfants: Math.max(
            0,
            Number(
              ligne.enfants ?? 0
            )
          ),

          animaux: Math.max(
            0,
            Number(
              ligne.animaux ?? 0
            )
          ),

          arrivee: String(
            ligne.arrivee || ""
          ),

          depart: String(
            ligne.depart || ""
          ),

          heureArrivee:
            normaliserHeure(
              ligne.heure_arrivee,
              "16:00"
            ),

          heureDepart:
            normaliserHeure(
              ligne.heure_depart,
              "10:00"
            ),

          langue: String(
            ligne.langue ||
              "Français"
          ),

          plateforme: String(
            ligne.plateforme ||
              "Direct"
          ),

          numeroReservation:
            String(
              ligne.numero_reservation ||
                ""
            ),

          caution: Boolean(
            ligne.caution
          ),

          statut:
            normaliserStatut(
              ligne.statut
            ),

          observations: String(
            ligne.observations ||
              ""
          ),

          createdAt: String(
            ligne.created_at ||
              ""
          ),

          updatedAt: String(
            ligne.updated_at ||
              ""
          ),
        })
      );

    setVoyageurs(
      voyageursConvertis
    );

    return false;
  }

  function trouverLogementDistant(
    logementIdLocal: string,
    logementsLocaux: LogementLocal[],
    logementsDistants: Logement[]
  ): string | null {
    if (
      !logementIdLocal
    ) {
      return null;
    }

    const correspondanceId =
      logementsDistants.find(
        (logement) =>
          logement.id ===
          logementIdLocal
      );

    if (correspondanceId) {
      return correspondanceId.id;
    }

    const logementLocal =
      logementsLocaux.find(
        (logement) =>
          logement.id ===
          logementIdLocal
      );

    if (!logementLocal) {
      return null;
    }

    const nomLocal =
      normaliserTexte(
        String(
          logementLocal.nom || ""
        )
      );

    const villeLocale =
      normaliserTexte(
        String(
          logementLocal.ville || ""
        )
      );

    const correspondanceExacte =
      logementsDistants.find(
        (logement) =>
          normaliserTexte(
            logement.nom
          ) === nomLocal &&
          normaliserTexte(
            logement.ville
          ) === villeLocale
      );

    if (
      correspondanceExacte
    ) {
      return correspondanceExacte.id;
    }

    const correspondanceNom =
      logementsDistants.filter(
        (logement) =>
          normaliserTexte(
            logement.nom
          ) === nomLocal
      );

    if (
      correspondanceNom.length ===
      1
    ) {
      return correspondanceNom[0].id;
    }

    return null;
  }

  async function importerVoyageursLocaux(
    orgId: string,
    voyageursLocaux: Voyageur[],
    logementsLocaux: LogementLocal[],
    logementsDistants: Logement[]
  ) {
    for (
      const voyageur of voyageursLocaux
    ) {
      const logementId =
        trouverLogementDistant(
          voyageur.logementId,
          logementsLocaux,
          logementsDistants
        );

      const payload: Record<
        string,
        unknown
      > = {
        organization_id:
          orgId,

        logement_id:
          logementId,

        nom:
          voyageur.nom.trim() ||
          "Nom à compléter",

        prenom:
          voyageur.prenom.trim() ||
          null,

        telephone:
          voyageur.telephone.trim() ||
          null,

        email:
          voyageur.email.trim() ||
          null,

        adultes:
          Math.max(
            0,
            Math.round(
              Number(
                voyageur.adultes || 0
              )
            )
          ),

        enfants:
          Math.max(
            0,
            Math.round(
              Number(
                voyageur.enfants || 0
              )
            )
          ),

        animaux:
          Math.max(
            0,
            Math.round(
              Number(
                voyageur.animaux || 0
              )
            )
          ),

        arrivee:
          voyageur.arrivee ||
          null,

        depart:
          voyageur.depart ||
          null,

        heure_arrivee:
          voyageur.heureArrivee ||
          "16:00",

        heure_depart:
          voyageur.heureDepart ||
          "10:00",

        langue:
          voyageur.langue.trim() ||
          "Français",

        plateforme:
          voyageur.plateforme.trim() ||
          "Direct",

        numero_reservation:
          voyageur.numeroReservation.trim() ||
          null,

        caution:
          voyageur.caution,

        statut:
          voyageur.statut,

        observations:
          voyageur.observations.trim() ||
          null,
      };

      if (
        voyageur.id &&
        estUuid(voyageur.id)
      ) {
        payload.id =
          voyageur.id;
      }

      if (
        dateIsoValide(
          voyageur.createdAt
        )
      ) {
        payload.created_at =
          voyageur.createdAt;
      }

      if (
        dateIsoValide(
          voyageur.updatedAt
        )
      ) {
        payload.updated_at =
          voyageur.updatedAt;
      }

      const {
        error,
      } = await supabase
        .from("voyageurs")
        .insert(payload);

      if (error) {
        throw error;
      }
    }
  }

  const statistiques =
    useMemo(() => {
      return {
        total:
          voyageurs.length,

        reservations:
          voyageurs.filter(
            (voyageur) =>
              voyageur.statut ===
              "Réservation"
          ).length,

        arrives:
          voyageurs.filter(
            (voyageur) =>
              voyageur.statut ===
              "Arrivé"
          ).length,

        partis:
          voyageurs.filter(
            (voyageur) =>
              voyageur.statut ===
              "Parti"
          ).length,
      };
    }, [voyageurs]);

  const voyageursFiltres =
    useMemo(() => {
      const rechercheNormalisee =
        normaliserTexte(
          recherche
        );

      return voyageurs
        .filter(
          (voyageur) => {
            if (
              filtreStatut !==
                "Tous" &&
              voyageur.statut !==
                filtreStatut
            ) {
              return false;
            }

            if (
              filtreLogement !==
                "Tous" &&
              voyageur.logementId !==
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
                  voyageur.logementId
              );

            const contenu = [
              voyageur.nom,
              voyageur.prenom,
              voyageur.telephone,
              voyageur.email,
              voyageur.numeroReservation,
              voyageur.plateforme,
              logement?.nom || "",
              logement?.ville || "",
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
            Date.parse(
              a.arrivee || ""
            );

          const dateB =
            Date.parse(
              b.arrivee || ""
            );

          const timestampA =
            Number.isNaN(
              dateA
            )
              ? 0
              : dateA;

          const timestampB =
            Number.isNaN(
              dateB
            )
              ? 0
              : dateB;

          return (
            timestampB -
            timestampA
          );
        });
    }, [
      voyageurs,
      logements,
      recherche,
      filtreStatut,
      filtreLogement,
    ]);

  function ouvrirNouveauVoyageur() {
    setVoyageurEnCours(
      creerNouveauVoyageur()
    );

    setErreur("");
    setMessage("");

    setFormulaireOuvert(
      true
    );
  }

  function ouvrirModification(
    voyageur: Voyageur
  ) {
    setVoyageurEnCours({
      ...voyageur,
    });

    setErreur("");
    setMessage("");

    setFormulaireOuvert(
      true
    );
  }

  function fermerFormulaire() {
    setVoyageurEnCours(
      null
    );

    setErreur("");

    setFormulaireOuvert(
      false
    );
  }

  function modifierVoyageur(
    voyageur: Voyageur
  ) {
    setVoyageurEnCours(
      voyageur
    );

    if (erreur) {
      setErreur("");
    }
  }

  async function enregistrerVoyageur() {
    if (
      !voyageurEnCours ||
      sauvegardeEnCours
    ) {
      return;
    }

    setErreur("");
    setErreurPage("");
    setMessage("");

    if (
      !voyageurEnCours.prenom.trim()
    ) {
      setErreur(
        "Le prénom du voyageur est obligatoire."
      );

      return;
    }

    if (
      !voyageurEnCours.nom.trim()
    ) {
      setErreur(
        "Le nom du voyageur est obligatoire."
      );

      return;
    }

    if (
      !voyageurEnCours.logementId
    ) {
      setErreur(
        "Le logement est obligatoire."
      );

      return;
    }

    if (
      !voyageurEnCours.arrivee
    ) {
      setErreur(
        "La date d’arrivée est obligatoire."
      );

      return;
    }

    if (
      !voyageurEnCours.depart
    ) {
      setErreur(
        "La date de départ est obligatoire."
      );

      return;
    }

    const dateArrivee =
      Date.parse(
        voyageurEnCours.arrivee
      );

    const dateDepart =
      Date.parse(
        voyageurEnCours.depart
      );

    if (
      !Number.isNaN(
        dateArrivee
      ) &&
      !Number.isNaN(
        dateDepart
      ) &&
      dateDepart <
        dateArrivee
    ) {
      setErreur(
        "La date de départ ne peut pas être antérieure à la date d’arrivée."
      );

      return;
    }

    if (
      voyageurEnCours.email &&
      !voyageurEnCours.email.includes(
        "@"
      )
    ) {
      setErreur(
        "L’adresse e-mail semble incorrecte."
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

    const existe =
      voyageurs.some(
        (voyageur) =>
          voyageur.id ===
          voyageurEnCours.id
      );

    setSauvegardeEnCours(
      true
    );

    try {
      const payload = {
        organization_id:
          organizationId,

        logement_id:
          voyageurEnCours.logementId,

        nom:
          voyageurEnCours.nom.trim(),

        prenom:
          voyageurEnCours.prenom.trim(),

        telephone:
          voyageurEnCours.telephone.trim() ||
          null,

        email:
          voyageurEnCours.email.trim() ||
          null,

        adultes:
          Math.max(
            0,
            Math.round(
              Number(
                voyageurEnCours.adultes ||
                  0
              )
            )
          ),

        enfants:
          Math.max(
            0,
            Math.round(
              Number(
                voyageurEnCours.enfants ||
                  0
              )
            )
          ),

        animaux:
          Math.max(
            0,
            Math.round(
              Number(
                voyageurEnCours.animaux ||
                  0
              )
            )
          ),

        arrivee:
          voyageurEnCours.arrivee,

        depart:
          voyageurEnCours.depart,

        heure_arrivee:
          voyageurEnCours.heureArrivee ||
          "16:00",

        heure_depart:
          voyageurEnCours.heureDepart ||
          "10:00",

        langue:
          voyageurEnCours.langue.trim() ||
          "Français",

        plateforme:
          voyageurEnCours.plateforme.trim() ||
          "Direct",

        numero_reservation:
          voyageurEnCours.numeroReservation.trim() ||
          null,

        caution:
          voyageurEnCours.caution,

        statut:
          voyageurEnCours.statut,

        observations:
          voyageurEnCours.observations.trim() ||
          null,
      };

      if (existe) {
        const {
          error,
        } = await supabase
          .from("voyageurs")
          .update(payload)
          .eq(
            "id",
            voyageurEnCours.id
          )
          .eq(
            "organization_id",
            organizationId
          );

        if (error) {
          throw error;
        }
      } else {
        const payloadCreation: Record<
          string,
          unknown
        > = {
          ...payload,
        };

        if (
          estUuid(
            voyageurEnCours.id
          )
        ) {
          payloadCreation.id =
            voyageurEnCours.id;
        }

        const {
          error,
        } = await supabase
          .from("voyageurs")
          .insert(
            payloadCreation
          );

        if (error) {
          throw error;
        }
      }

      await chargerVoyageurs(
        organizationId,
        logements,
        false
      );

      fermerFormulaire();

      setMessage(
        existe
          ? "Le voyageur a été modifié et synchronisé."
          : "Le voyageur a été créé et synchronisé."
      );
    } catch (error) {
      console.error(error);

      setErreur(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer le voyageur."
      );
    } finally {
      setSauvegardeEnCours(
        false
      );
    }
  }

  async function supprimerVoyageur(
    id: string
  ) {
    if (
      suppressionEnCours
    ) {
      return;
    }

    const voyageur =
      voyageurs.find(
        (item) =>
          item.id === id
      );

    if (!voyageur) {
      return;
    }

    const confirmation =
      window.confirm(
        `Supprimer définitivement la fiche de ${voyageur.prenom} ${voyageur.nom} ?`
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

    setErreurPage("");
    setMessage("");

    setSuppressionEnCours(
      id
    );

    try {
      const {
        error,
      } = await supabase
        .from("voyageurs")
        .delete()
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

      setVoyageurs(
        (liste) =>
          liste.filter(
            (item) =>
              item.id !== id
          )
      );

      if (
        voyageurEnCours?.id ===
        id
      ) {
        fermerFormulaire();
      }

      setMessage(
        "Le voyageur a été supprimé de Supabase."
      );
    } catch (error) {
      console.error(error);

      setErreurPage(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer le voyageur."
      );
    } finally {
      setSuppressionEnCours(
        ""
      );
    }
  }

  function reinitialiserFiltres() {
    setRecherche("");
    setFiltreStatut("Tous");
    setFiltreLogement(
      "Tous"
    );
  }

  const filtresActifs =
    recherche.trim() !== "" ||
    filtreStatut !== "Tous" ||
    filtreLogement !== "Tous";

  return (
    <div className="space-y-8">
      <PageHeader
        titre="Voyageurs"
        description="Centralisez les réservations, les coordonnées et le suivi des arrivées et départs."
        action={
          <button
            type="button"
            onClick={
              ouvrirNouveauVoyageur
            }
            disabled={
              logements.length ===
              0
            }
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            + Nouveau voyageur
          </button>
        }
      />

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
        ☁️ Les voyageurs et réservations de cette page sont maintenant synchronisés avec Supabase.
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

      {logements.length ===
        0 &&
        donneesChargees && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl">
                ⚠️
              </div>

              <div>
                <h2 className="font-bold text-amber-950">
                  Aucun logement disponible
                </h2>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Ajoutez d’abord un logement avant de créer une fiche voyageur.
                </p>
              </div>
            </div>
          </div>
        )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <CarteStatistique
          titre="Total voyageurs"
          valeur={
            statistiques.total
          }
          couleur="blue"
        />

        <CarteStatistique
          titre="Réservations"
          valeur={
            statistiques.reservations
          }
          couleur="orange"
        />

        <CarteStatistique
          titre="Sur place"
          valeur={
            statistiques.arrives
          }
          couleur="green"
        />

        <CarteStatistique
          titre="Départs terminés"
          valeur={
            statistiques.partis
          }
          couleur="slate"
        />
      </div>

      <Section
        titre="Rechercher et filtrer"
        description={`${voyageursFiltres.length} voyageur(s) affiché(s)`}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Rechercher
            </span>

            <input
              type="search"
              value={recherche}
              onChange={(
                event
              ) =>
                setRecherche(
                  event.target
                    .value
                )
              }
              placeholder="Nom, téléphone, réservation, logement..."
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Statut
            </span>

            <select
              value={
                filtreStatut
              }
              onChange={(
                event
              ) =>
                setFiltreStatut(
                  event.target
                    .value as FiltreStatut
                )
              }
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            >
              {statuts.map(
                (statut) => (
                  <option
                    key={
                      statut
                    }
                    value={
                      statut
                    }
                  >
                    {statut ===
                    "Tous"
                      ? "Tous les statuts"
                      : statut}
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
                filtreLogement
              }
              onChange={(
                event
              ) =>
                setFiltreLogement(
                  event.target
                    .value
                )
              }
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            >
              <option value="Tous">
                Tous les logements
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
        titre="Liste des voyageurs"
        description="Réservations et séjours enregistrés."
      >
        {!donneesChargees ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-semibold text-slate-500">
              Chargement des voyageurs depuis Supabase...
            </p>
          </div>
        ) : voyageursFiltres.length >
          0 ? (
          <div className="grid gap-6 xl:grid-cols-2">
            {voyageursFiltres.map(
              (voyageur) => (
                <VoyageurCard
                  key={
                    voyageur.id
                  }
                  voyageur={
                    voyageur
                  }
                  logements={
                    logements
                  }
                  onModifier={
                    ouvrirModification
                  }
                  onSupprimer={
                    supprimerVoyageur
                  }
                />
              )
            )}
          </div>
        ) : voyageurs.length ===
          0 ? (
          <EtatVide
            icone="🧳"
            titre="Aucun voyageur enregistré"
            texte="Ajoutez votre première réservation pour préparer l’accueil et le suivi du séjour."
            action={
              logements.length >
              0 ? (
                <button
                  type="button"
                  onClick={
                    ouvrirNouveauVoyageur
                  }
                  className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                >
                  + Ajouter un voyageur
                </button>
              ) : null
            }
          />
        ) : (
          <EtatVide
            icone="🔎"
            titre="Aucun résultat"
            texte="Aucun voyageur ne correspond aux critères sélectionnés."
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

      {formulaireOuvert &&
        voyageurEnCours && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                fermerFormulaire();
              }
            }}
          >
            <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-slate-100 shadow-2xl sm:max-w-5xl sm:rounded-3xl">
              {erreur && (
                <div className="mx-4 mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 sm:mx-6 sm:mt-6">
                  {erreur}
                </div>
              )}

              {sauvegardeEnCours && (
                <div className="mx-4 mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-800 sm:mx-6 sm:mt-6">
                  Enregistrement dans Supabase...
                </div>
              )}

              <VoyageurForm
                voyageur={
                  voyageurEnCours
                }
                logements={
                  logements
                }
                onChange={
                  modifierVoyageur
                }
                onEnregistrer={
                  enregistrerVoyageur
                }
                onAnnuler={
                  fermerFormulaire
                }
              />
            </div>
          </div>
        )}
    </div>
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
    | "slate";
}) {
  const couleurs = {
    blue:
      "border-blue-200 bg-blue-50 text-blue-700",

    green:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    orange:
      "border-orange-200 bg-orange-50 text-orange-700",

    slate:
      "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div
        className={`inline-flex rounded-2xl border px-3 py-1 text-xs font-bold ${couleurs[couleur]}`}
      >
        {titre}
      </div>

      <p className="mt-5 text-4xl font-black text-slate-950">
        {valeur}
      </p>
    </div>
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