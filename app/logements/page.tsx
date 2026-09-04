"use client";

import { useEffect, useMemo, useState } from "react";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import { enregistrer, lire } from "@/lib/database";
import { supabase } from "@/lib/supabase";

type TypeLogement =
  | ""
  | "Studio"
  | "T1"
  | "T2"
  | "T3"
  | "T4"
  | "T5"
  | "T6 et plus"
  | "Maison"
  | "Villa"
  | "Autre";

type Logement = {
  id: string;

  proprietaireId: string | null;

  nom: string;
  typeLogement: TypeLogement;

  superficie: number;
  nombreChambres: number;

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

type LogementSupabase = {
  id: string;

  proprietaire_id: string | null;

  nom: string | null;
  type_logement: string | null;

  superficie_m2: number | string | null;
  nombre_chambres: number | null;

  adresse: string | null;
  ville: string | null;
  code_postal: string | null;

  wifi_ssid: string | null;
  wifi_mot_de_passe: string | null;

  boite_cles: string | null;
  code_boite_cles: string | null;

  observations: string | null;
};

type ProprietaireSupabase = {
  id: string;
  prenom: string | null;
  nom: string | null;
  email: string | null;
  telephone: string | null;
};

const typesLogement: Exclude<
  TypeLogement,
  ""
>[] = [
  "Studio",
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6 et plus",
  "Maison",
  "Villa",
  "Autre",
];

function creerLogementVide(): Logement {
  return {
    id: "",

    proprietaireId: null,

    nom: "",
    typeLogement: "",

    superficie: 0,
    nombreChambres: 0,

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
}

function normaliserTexte(
  texte: string
): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normaliserTypeLogement(
  valeur: unknown
): TypeLogement {
  const type = String(valeur || "");

  if (
    type === "Studio" ||
    type === "T1" ||
    type === "T2" ||
    type === "T3" ||
    type === "T4" ||
    type === "T5" ||
    type === "T6 et plus" ||
    type === "Maison" ||
    type === "Villa" ||
    type === "Autre"
  ) {
    return type;
  }

  return "";
}

function estUuid(
  valeur: string
): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    valeur
  );
}

function normaliserLogementLocal(
  logement: Partial<Logement>
): Logement {
  return {
    ...creerLogementVide(),
    ...logement,

    id: String(logement.id || ""),

    proprietaireId:
      logement.proprietaireId || null,

    nom: String(logement.nom || ""),

    typeLogement: normaliserTypeLogement(
      logement.typeLogement
    ),

    superficie: Math.max(
      0,
      Number(logement.superficie || 0)
    ),

    nombreChambres: Math.max(
      0,
      Math.round(
        Number(
          logement.nombreChambres || 0
        )
      )
    ),

    adresse: String(
      logement.adresse || ""
    ),

    ville: String(
      logement.ville || ""
    ),

    codePostal: String(
      logement.codePostal || ""
    ),

    proprietaire: String(
      logement.proprietaire || ""
    ),

    telephone: String(
      logement.telephone || ""
    ),

    email: String(
      logement.email || ""
    ),

    wifi: String(
      logement.wifi || ""
    ),

    motDePasseWifi: String(
      logement.motDePasseWifi || ""
    ),

    boiteCles: String(
      logement.boiteCles || ""
    ),

    codeBoiteCles: String(
      logement.codeBoiteCles || ""
    ),

    observations: String(
      logement.observations || ""
    ),
  };
}

export default function LogementsPage() {
  const [organizationId, setOrganizationId] =
    useState("");

  const [logements, setLogements] =
    useState<Logement[]>([]);

  const [
    logementEnCours,
    setLogementEnCours,
  ] = useState<Logement>(
    creerLogementVide()
  );

  const [recherche, setRecherche] =
    useState("");

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

  const [erreur, setErreur] =
    useState("");

  const [erreurPage, setErreurPage] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    let actif = true;

    async function initialiser() {
      try {
        setDonneesChargees(false);
        setErreurPage("");

        const {
          data: { user },
          error: erreurUtilisateur,
        } = await supabase.auth.getUser();

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
          error: erreurAdhesion,
        } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (erreurAdhesion) {
          throw erreurAdhesion;
        }

        if (!adhesion?.organization_id) {
          throw new Error(
            "Aucune organisation Cap Serein n’est associée à votre compte."
          );
        }

        if (!actif) {
          return;
        }

        const orgId =
          adhesion.organization_id;

        setOrganizationId(orgId);

        const migrationEffectuee =
          await chargerLogements(
            orgId,
            true
          );

        if (
          actif &&
          migrationEffectuee
        ) {
          setMessage(
            "Vos anciens logements enregistrés sur cet ordinateur ont été importés dans Supabase."
          );
        }
      } catch (error) {
        console.error(error);

        if (actif) {
          setErreurPage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les logements."
          );
        }
      } finally {
        if (actif) {
          setDonneesChargees(true);
        }
      }
    }

    initialiser();

    return () => {
      actif = false;
    };
  }, []);

  /*
   * Transition :
   * Supabase est désormais la source principale.
   *
   * On garde seulement une copie locale des logements
   * pour les anciens modules qui utilisent encore
   * localStorage.
   *
   * Cette copie disparaîtra lorsque tous les modules
   * auront été migrés.
   */
  useEffect(() => {
    if (!donneesChargees) {
      return;
    }

    enregistrer(
      "logements",
      logements
    );
  }, [
    logements,
    donneesChargees,
  ]);

  useEffect(() => {
    function verifierOuvertureDepuisAdresse() {
      if (
        window.location.hash ===
        "#nouveau-logement"
      ) {
        ouvrirNouveauLogement(false);
      }
    }

    verifierOuvertureDepuisAdresse();

    window.addEventListener(
      "hashchange",
      verifierOuvertureDepuisAdresse
    );

    return () => {
      window.removeEventListener(
        "hashchange",
        verifierOuvertureDepuisAdresse
      );
    };
  }, []);

  async function chargerLogements(
    orgId: string,
    autoriserMigration: boolean
  ): Promise<boolean> {
    const {
      data,
      error,
    } = await supabase
      .from("logements")
      .select(
        `
          id,
          proprietaire_id,
          nom,
          type_logement,
          superficie_m2,
          nombre_chambres,
          adresse,
          ville,
          code_postal,
          wifi_ssid,
          wifi_mot_de_passe,
          boite_cles,
          code_boite_cles,
          observations
        `
      )
      .eq(
        "organization_id",
        orgId
      )
      .order("nom", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    const lignes =
      (data || []) as LogementSupabase[];

    /*
     * Première ouverture après migration :
     * si Supabase est vide, on récupère les anciens
     * logements présents dans le navigateur.
     */
    if (
      autoriserMigration &&
      lignes.length === 0
    ) {
      const logementsLocaux =
        lire<Partial<Logement>>(
          "logements"
        )
          .map(
            normaliserLogementLocal
          )
          .filter(
            (logement) =>
              logement.nom.trim() !== ""
          );

      if (
        logementsLocaux.length > 0
      ) {
        await importerLogementsLocaux(
          orgId,
          logementsLocaux
        );

        await chargerLogements(
          orgId,
          false
        );

        return true;
      }
    }

    const idsProprietaires = [
      ...new Set(
        lignes
          .map(
            (ligne) =>
              ligne.proprietaire_id
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      ),
    ];

    const proprietairesParId =
      new Map<
        string,
        ProprietaireSupabase
      >();

    if (
      idsProprietaires.length > 0
    ) {
      const {
        data: donneesProprietaires,
        error: erreurProprietaires,
      } = await supabase
        .from("proprietaires")
        .select(
          `
            id,
            prenom,
            nom,
            email,
            telephone
          `
        )
        .eq(
          "organization_id",
          orgId
        )
        .in(
          "id",
          idsProprietaires
        );

      if (
        erreurProprietaires
      ) {
        throw erreurProprietaires;
      }

      (
        (donneesProprietaires ||
          []) as ProprietaireSupabase[]
      ).forEach(
        (proprietaire) => {
          proprietairesParId.set(
            proprietaire.id,
            proprietaire
          );
        }
      );
    }

    const logementsConvertis =
      lignes.map(
        (ligne): Logement => {
          const proprietaire =
            ligne.proprietaire_id
              ? proprietairesParId.get(
                  ligne.proprietaire_id
                )
              : undefined;

          const nomProprietaire =
            proprietaire
              ? [
                  proprietaire.prenom,
                  proprietaire.nom,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .trim()
              : "";

          return {
            id: ligne.id,

            proprietaireId:
              ligne.proprietaire_id,

            nom: String(
              ligne.nom || ""
            ),

            typeLogement:
              normaliserTypeLogement(
                ligne.type_logement
              ),

            superficie: Math.max(
              0,
              Number(
                ligne.superficie_m2 ||
                  0
              )
            ),

            nombreChambres:
              Math.max(
                0,
                Number(
                  ligne.nombre_chambres ||
                    0
                )
              ),

            adresse: String(
              ligne.adresse || ""
            ),

            ville: String(
              ligne.ville || ""
            ),

            codePostal: String(
              ligne.code_postal || ""
            ),

            proprietaire:
              nomProprietaire,

            telephone: String(
              proprietaire?.telephone ||
                ""
            ),

            email: String(
              proprietaire?.email ||
                ""
            ),

            wifi: String(
              ligne.wifi_ssid || ""
            ),

            motDePasseWifi: String(
              ligne.wifi_mot_de_passe ||
                ""
            ),

            boiteCles: String(
              ligne.boite_cles || ""
            ),

            codeBoiteCles: String(
              ligne.code_boite_cles ||
                ""
            ),

            observations: String(
              ligne.observations || ""
            ),
          };
        }
      );

    setLogements(
      logementsConvertis
    );

    return false;
  }

  async function importerLogementsLocaux(
    orgId: string,
    logementsLocaux: Logement[]
  ) {
    for (
      const logement of logementsLocaux
    ) {
      const proprietaireId =
        await obtenirOuCreerProprietaire(
          orgId,
          logement,
          null
        );

      const payload: Record<
        string,
        unknown
      > = {
        organization_id: orgId,

        proprietaire_id:
          proprietaireId,

        nom:
          logement.nom.trim() ||
          "Logement",

        type_logement:
          logement.typeLogement ||
          null,

        superficie_m2:
          logement.superficie > 0
            ? logement.superficie
            : null,

        nombre_chambres:
          logement.nombreChambres,

        adresse:
          logement.adresse.trim() ||
          "Adresse à compléter",

        ville:
          logement.ville.trim() ||
          null,

        code_postal:
          logement.codePostal.trim() ||
          null,

        wifi_ssid:
          logement.wifi.trim() ||
          null,

        wifi_mot_de_passe:
          logement.motDePasseWifi.trim() ||
          null,

        boite_cles:
          logement.boiteCles.trim() ||
          null,

        code_boite_cles:
          logement.codeBoiteCles.trim() ||
          null,

        observations:
          logement.observations.trim() ||
          null,
      };

      /*
       * On conserve l'ancien UUID lorsque c'est
       * possible pour limiter les problèmes avec
       * les autres modules encore locaux.
       */
      if (
        logement.id &&
        estUuid(logement.id)
      ) {
        payload.id =
          logement.id;
      }

      const {
        error,
      } = await supabase
        .from("logements")
        .insert(payload);

      if (error) {
        throw error;
      }
    }
  }

  async function obtenirOuCreerProprietaire(
    orgId: string,
    logement: Logement,
    proprietaireIdActuel:
      | string
      | null
  ): Promise<string | null> {
    const nom =
      logement.proprietaire.trim();

    const email =
      logement.email.trim();

    const telephone =
      logement.telephone.trim();

    /*
     * Aucun propriétaire renseigné :
     * le logement peut rester sans propriétaire.
     */
    if (
      !nom &&
      !email &&
      !telephone
    ) {
      return null;
    }

    const nomStocke =
      nom ||
      email ||
      telephone ||
      "Propriétaire";

    /*
     * Modification d'un logement déjà lié
     * à un propriétaire.
     */
    if (
      proprietaireIdActuel
    ) {
      const {
        error,
      } = await supabase
        .from("proprietaires")
        .update({
          nom: nomStocke,
          email:
            email || null,
          telephone:
            telephone || null,
        })
        .eq(
          "id",
          proprietaireIdActuel
        )
        .eq(
          "organization_id",
          orgId
        );

      if (error) {
        throw error;
      }

      return proprietaireIdActuel;
    }

    let proprietaireTrouve:
      | { id: string }
      | null = null;

    if (email) {
      const {
        data,
        error,
      } = await supabase
        .from("proprietaires")
        .select("id")
        .eq(
          "organization_id",
          orgId
        )
        .ilike(
          "email",
          email
        )
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      proprietaireTrouve =
        data;
    }

    if (
      !proprietaireTrouve &&
      telephone
    ) {
      const {
        data,
        error,
      } = await supabase
        .from("proprietaires")
        .select("id")
        .eq(
          "organization_id",
          orgId
        )
        .eq(
          "telephone",
          telephone
        )
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      proprietaireTrouve =
        data;
    }

    if (
      !proprietaireTrouve &&
      nom
    ) {
      const {
        data,
        error,
      } = await supabase
        .from("proprietaires")
        .select("id")
        .eq(
          "organization_id",
          orgId
        )
        .ilike(
          "nom",
          nom
        )
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      proprietaireTrouve =
        data;
    }

    if (
      proprietaireTrouve
    ) {
      const {
        error,
      } = await supabase
        .from("proprietaires")
        .update({
          nom: nomStocke,
          email:
            email || null,
          telephone:
            telephone || null,
        })
        .eq(
          "id",
          proprietaireTrouve.id
        )
        .eq(
          "organization_id",
          orgId
        );

      if (error) {
        throw error;
      }

      return proprietaireTrouve.id;
    }

    const {
      data: nouveauProprietaire,
      error,
    } = await supabase
      .from("proprietaires")
      .insert({
        organization_id:
          orgId,

        nom: nomStocke,

        email:
          email || null,

        telephone:
          telephone || null,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return nouveauProprietaire.id;
  }

  const resultats = useMemo(() => {
    const rechercheNormalisee =
      normaliserTexte(
        recherche
      );

    return logements
      .filter(
        (logement) => {
          if (
            !rechercheNormalisee
          ) {
            return true;
          }

          const contenu = [
            logement.nom,
            logement.typeLogement,
            String(
              logement.superficie
            ),
            String(
              logement.nombreChambres
            ),
            logement.adresse,
            logement.ville,
            logement.codePostal,
            logement.proprietaire,
            logement.telephone,
            logement.email,
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
      .sort((a, b) =>
        a.nom.localeCompare(
          b.nom,
          "fr"
        )
      );
  }, [
    logements,
    recherche,
  ]);

  const statistiques =
    useMemo(() => {
      const superficieTotale =
        logements.reduce(
          (
            total,
            logement
          ) =>
            total +
            logement.superficie,
          0
        );

      const logementsRenseignes =
        logements.filter(
          (logement) =>
            logement.typeLogement &&
            logement.superficie >
              0
        ).length;

      return {
        total:
          logements.length,

        superficieTotale,

        logementsRenseignes,

        villes: new Set(
          logements
            .map((logement) =>
              logement.ville.trim()
            )
            .filter(Boolean)
        ).size,
      };
    }, [logements]);

  function ouvrirNouveauLogement(
    modifierAdresse = true
  ) {
    setLogementEnCours(
      creerLogementVide()
    );

    setErreur("");
    setMessage("");

    setFormulaireOuvert(
      true
    );

    if (
      modifierAdresse &&
      window.location.hash !==
        "#nouveau-logement"
    ) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}#nouveau-logement`
      );
    }

    window.setTimeout(() => {
      document
        .getElementById(
          "formulaire-logement"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  function ouvrirModification(
    logement: Logement
  ) {
    setLogementEnCours({
      ...logement,
    });

    setErreur("");
    setMessage("");

    setFormulaireOuvert(
      true
    );

    window.setTimeout(() => {
      document
        .getElementById(
          "formulaire-logement"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  function fermerFormulaire() {
    setLogementEnCours(
      creerLogementVide()
    );

    setErreur("");

    setFormulaireOuvert(
      false
    );

    if (
      window.location.hash
    ) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname
      );
    }
  }

  async function sauvegarderLogement() {
    if (
      sauvegardeEnCours
    ) {
      return;
    }

    setErreur("");
    setErreurPage("");
    setMessage("");

    if (
      !logementEnCours.nom.trim()
    ) {
      setErreur(
        "Le nom du logement est obligatoire."
      );

      return;
    }

    if (
      !logementEnCours.typeLogement
    ) {
      setErreur(
        "Le type de logement est obligatoire."
      );

      return;
    }

    if (
      logementEnCours.superficie <=
      0
    ) {
      setErreur(
        "La superficie doit être supérieure à zéro."
      );

      return;
    }

    if (
      !logementEnCours.adresse.trim()
    ) {
      setErreur(
        "L’adresse du logement est obligatoire."
      );

      return;
    }

    if (
      !logementEnCours.ville.trim()
    ) {
      setErreur(
        "La ville est obligatoire."
      );

      return;
    }

    if (
      logementEnCours.email &&
      !logementEnCours.email.includes(
        "@"
      )
    ) {
      setErreur(
        "L’adresse e-mail semble incorrecte."
      );

      return;
    }

    if (!organizationId) {
      setErreur(
        "L’organisation Cap Serein n’est pas encore chargée."
      );

      return;
    }

    setSauvegardeEnCours(
      true
    );

    try {
      const proprietaireId =
        await obtenirOuCreerProprietaire(
          organizationId,
          logementEnCours,
          logementEnCours.proprietaireId
        );

      const payload = {
        organization_id:
          organizationId,

        proprietaire_id:
          proprietaireId,

        nom:
          logementEnCours.nom.trim(),

        type_logement:
          logementEnCours.typeLogement,

        superficie_m2:
          Math.max(
            0,
            Number(
              logementEnCours.superficie ||
                0
            )
          ),

        nombre_chambres:
          Math.max(
            0,
            Math.round(
              Number(
                logementEnCours.nombreChambres ||
                  0
              )
            )
          ),

        adresse:
          logementEnCours.adresse.trim(),

        ville:
          logementEnCours.ville.trim(),

        code_postal:
          logementEnCours.codePostal.trim() ||
          null,

        wifi_ssid:
          logementEnCours.wifi.trim() ||
          null,

        wifi_mot_de_passe:
          logementEnCours.motDePasseWifi.trim() ||
          null,

        boite_cles:
          logementEnCours.boiteCles.trim() ||
          null,

        code_boite_cles:
          logementEnCours.codeBoiteCles.trim() ||
          null,

        observations:
          logementEnCours.observations.trim() ||
          null,
      };

      if (
        logementEnCours.id
      ) {
        const {
          error,
        } = await supabase
          .from("logements")
          .update(payload)
          .eq(
            "id",
            logementEnCours.id
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
          .from("logements")
          .insert(payload);

        if (error) {
          throw error;
        }
      }

      await chargerLogements(
        organizationId,
        false
      );

      fermerFormulaire();

      setMessage(
        logementEnCours.id
          ? "Le logement a été modifié et synchronisé."
          : "Le logement a été créé et synchronisé."
      );
    } catch (error) {
      console.error(error);

      setErreur(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer le logement."
      );
    } finally {
      setSauvegardeEnCours(
        false
      );
    }
  }

  async function supprimerLogement(
    logement: Logement
  ) {
    if (
      suppressionEnCours
    ) {
      return;
    }

    const confirmation =
      window.confirm(
        `Supprimer définitivement le logement « ${logement.nom} » ?`
      );

    if (!confirmation) {
      return;
    }

    if (!organizationId) {
      setErreurPage(
        "L’organisation Cap Serein n’est pas chargée."
      );

      return;
    }

    setErreurPage("");
    setMessage("");

    setSuppressionEnCours(
      logement.id
    );

    try {
      const {
        error,
      } = await supabase
        .from("logements")
        .delete()
        .eq(
          "id",
          logement.id
        )
        .eq(
          "organization_id",
          organizationId
        );

      if (error) {
        throw error;
      }

      setLogements(
        (liste) =>
          liste.filter(
            (item) =>
              item.id !==
              logement.id
          )
      );

      if (
        logementEnCours.id ===
        logement.id
      ) {
        fermerFormulaire();
      }

      setMessage(
        "Le logement a été supprimé de Supabase."
      );
    } catch (error) {
      console.error(error);

      const messageErreur =
        error instanceof Error
          ? error.message
          : "";

      if (
        messageErreur.includes(
          "foreign key"
        ) ||
        messageErreur.includes(
          "violates"
        )
      ) {
        setErreurPage(
          "Ce logement est déjà utilisé par une mission ou un état des lieux et ne peut pas être supprimé directement."
        );
      } else {
        setErreurPage(
          messageErreur ||
            "Impossible de supprimer le logement."
        );
      }
    } finally {
      setSuppressionEnCours(
        ""
      );
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        titre="Logements"
        description="Gérez les logements et les informations qui seront reprises dans les états des lieux."
        action={
          <button
            type="button"
            onClick={() =>
              ouvrirNouveauLogement()
            }
            className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            + Nouveau logement
          </button>
        }
      />

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
        ☁️ Les logements de cette page sont maintenant
        synchronisés avec Supabase.
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CarteStatistique
          titre="Logements"
          valeur={String(
            statistiques.total
          )}
        />

        <CarteStatistique
          titre="Fiches complètes"
          valeur={String(
            statistiques.logementsRenseignes
          )}
        />

        <CarteStatistique
          titre="Superficie totale"
          valeur={`${statistiques.superficieTotale} m²`}
        />

        <CarteStatistique
          titre="Villes"
          valeur={String(
            statistiques.villes
          )}
        />
      </div>

      {formulaireOuvert && (
        <div id="formulaire-logement">
          <Section
            titre={
              logementEnCours.id
                ? "Modifier le logement"
                : "Nouveau logement"
            }
            description="Les caractéristiques du logement seront automatiquement reprises dans ses états des lieux."
          >
            {erreur && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {erreur}
              </div>
            )}

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4 sm:p-6">
              <h3 className="text-lg font-black text-blue-950">
                Caractéristiques du logement
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-800">
                Ces informations apparaîtront dans
                chaque état des lieux lié à ce
                logement.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Champ
                  label="Nom du logement"
                  value={
                    logementEnCours.nom
                  }
                  placeholder="Appartement Tamaris"
                  onChange={(valeur) =>
                    setLogementEnCours({
                      ...logementEnCours,
                      nom: valeur,
                    })
                  }
                />

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Type de logement
                  </span>

                  <select
                    value={
                      logementEnCours.typeLogement
                    }
                    onChange={(event) =>
                      setLogementEnCours({
                        ...logementEnCours,

                        typeLogement:
                          event.target
                            .value as TypeLogement,
                      })
                    }
                    className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">
                      Sélectionner
                    </option>

                    {typesLogement.map(
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

                <ChampNombre
                  label="Superficie"
                  value={
                    logementEnCours.superficie
                  }
                  min={0}
                  step={0.5}
                  suffixe="m²"
                  onChange={(valeur) =>
                    setLogementEnCours({
                      ...logementEnCours,
                      superficie:
                        valeur,
                    })
                  }
                />

                <ChampNombre
                  label="Nombre de chambres"
                  value={
                    logementEnCours.nombreChambres
                  }
                  min={0}
                  step={1}
                  suffixe="chambre(s)"
                  onChange={(valeur) =>
                    setLogementEnCours({
                      ...logementEnCours,

                      nombreChambres:
                        Math.round(
                          valeur
                        ),
                    })
                  }
                />
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <Champ
                label="Propriétaire"
                value={
                  logementEnCours.proprietaire
                }
                placeholder="Nom du propriétaire"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    proprietaire:
                      valeur,
                  })
                }
              />

              <Champ
                label="Téléphone"
                type="tel"
                value={
                  logementEnCours.telephone
                }
                placeholder="Téléphone du propriétaire"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    telephone:
                      valeur,
                  })
                }
              />

              <Champ
                label="Adresse e-mail"
                type="email"
                value={
                  logementEnCours.email
                }
                placeholder="proprietaire@email.fr"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    email: valeur,
                  })
                }
              />

              <Champ
                label="Adresse"
                value={
                  logementEnCours.adresse
                }
                placeholder="Numéro et nom de rue"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    adresse: valeur,
                  })
                }
              />

              <Champ
                label="Code postal"
                value={
                  logementEnCours.codePostal
                }
                placeholder="83500"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    codePostal:
                      valeur,
                  })
                }
              />

              <Champ
                label="Ville"
                value={
                  logementEnCours.ville
                }
                placeholder="La Seyne-sur-Mer"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    ville: valeur,
                  })
                }
              />

              <Champ
                label="Nom du réseau Wi-Fi"
                value={
                  logementEnCours.wifi
                }
                placeholder="Nom du réseau"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    wifi: valeur,
                  })
                }
              />

              <Champ
                label="Mot de passe Wi-Fi"
                value={
                  logementEnCours.motDePasseWifi
                }
                placeholder="Mot de passe"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,

                    motDePasseWifi:
                      valeur,
                  })
                }
              />

              <Champ
                label="Emplacement de la boîte à clés"
                value={
                  logementEnCours.boiteCles
                }
                placeholder="Portail, mur de gauche..."
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,
                    boiteCles:
                      valeur,
                  })
                }
              />

              <Champ
                label="Code de la boîte à clés"
                value={
                  logementEnCours.codeBoiteCles
                }
                placeholder="Code d’accès"
                onChange={(valeur) =>
                  setLogementEnCours({
                    ...logementEnCours,

                    codeBoiteCles:
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
                value={
                  logementEnCours.observations
                }
                onChange={(event) =>
                  setLogementEnCours({
                    ...logementEnCours,

                    observations:
                      event.target
                        .value,
                  })
                }
                rows={5}
                placeholder="Accès, stationnement, consignes particulières, équipements..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={
                  sauvegarderLogement
                }
                disabled={
                  sauvegardeEnCours
                }
                className="min-h-12 w-full rounded-2xl bg-blue-600 px-6 py-3 font-black text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {sauvegardeEnCours
                  ? "Enregistrement..."
                  : logementEnCours.id
                    ? "Enregistrer les modifications"
                    : "Enregistrer le logement"}
              </button>

              <button
                type="button"
                onClick={
                  fermerFormulaire
                }
                disabled={
                  sauvegardeEnCours
                }
                className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
              >
                Annuler
              </button>
            </div>
          </Section>
        </div>
      )}

      <Section
        titre="Liste des logements"
        description={`${resultats.length} logement(s) affiché(s)`}
      >
        <input
          type="search"
          value={recherche}
          onChange={(event) =>
            setRecherche(
              event.target.value
            )
          }
          placeholder="Rechercher un logement, un type, une ville ou un propriétaire..."
          className="mb-6 min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        />

        {!donneesChargees ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-12 text-center sm:p-16">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 font-bold text-slate-500">
              Chargement des logements
              depuis Supabase...
            </p>
          </div>
        ) : resultats.length >
          0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {resultats.map(
              (logement) => (
                <article
                  key={
                    logement.id
                  }
                  className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                          {logement.typeLogement ||
                            "Type non renseigné"}
                        </span>

                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                          {logement.superficie >
                          0
                            ? `${logement.superficie} m²`
                            : "Superficie non renseignée"}
                        </span>

                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                          {logement.nombreChambres ===
                          0
                            ? "Aucune chambre séparée"
                            : `${logement.nombreChambres} chambre(s)`}
                        </span>
                      </div>

                      <h3 className="mt-4 break-words text-xl font-black text-slate-950">
                        {
                          logement.nom
                        }
                      </h3>

                      <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                        {logement.adresse ||
                          "Adresse non renseignée"}

                        {(logement.codePostal ||
                          logement.ville) &&
                          `, ${logement.codePostal} ${logement.ville}`}
                      </p>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <button
                        type="button"
                        onClick={() =>
                          ouvrirModification(
                            logement
                          )
                        }
                        disabled={
                          suppressionEnCours ===
                          logement.id
                        }
                        className="min-h-11 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 sm:w-auto"
                      >
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          supprimerLogement(
                            logement
                          )
                        }
                        disabled={
                          suppressionEnCours ===
                          logement.id
                        }
                        className="min-h-11 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        {suppressionEnCours ===
                        logement.id
                          ? "Suppression..."
                          : "Supprimer"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                    <Info
                      label="Propriétaire"
                      valeur={
                        logement.proprietaire ||
                        "Non renseigné"
                      }
                    />

                    <Info
                      label="Téléphone"
                      valeur={
                        logement.telephone ||
                        "Non renseigné"
                      }
                    />

                    <Info
                      label="Wi-Fi"
                      valeur={
                        logement.wifi ||
                        "Non renseigné"
                      }
                    />

                    <Info
                      label="Boîte à clés"
                      valeur={
                        logement.boiteCles ||
                        "Non renseignée"
                      }
                    />
                  </div>

                  {logement.observations && (
                    <p className="mt-5 whitespace-pre-wrap break-words rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      {
                        logement.observations
                      }
                    </p>
                  )}
                </article>
              )
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center sm:px-6 sm:py-16">
            <div className="text-5xl">
              🏡
            </div>

            <h3 className="mt-5 text-xl font-black text-slate-900">
              Aucun logement
              enregistré
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-slate-500">
              Ajoutez votre premier
              logement. Il sera
              automatiquement enregistré
              dans votre espace Supabase.
            </p>

            <button
              type="button"
              onClick={() =>
                ouvrirNouveauLogement()
              }
              className="mt-6 min-h-12 w-full rounded-2xl bg-blue-600 px-6 py-3 font-black text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 sm:w-auto"
            >
              + Ajouter le premier
              logement
            </button>
          </div>
        )}
      </Section>
    </div>
  );
}

function CarteStatistique({
  titre,
  valeur,
}: {
  titre: string;
  valeur: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {titre}
      </p>

      <p className="mt-3 break-words text-3xl font-black text-slate-950">
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
    <label className="min-w-0">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="min-h-12 w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function ChampNombre({
  label,
  value,
  onChange,
  min,
  step,
  suffixe,
}: {
  label: string;
  value: number;
  onChange: (
    value: number
  ) => void;
  min: number;
  step: number;
  suffixe: string;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <div className="flex min-h-12 overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) =>
            onChange(
              Math.max(
                min,
                Number(
                  event.target
                    .value || 0
                )
              )
            )
          }
          className="min-w-0 flex-1 bg-transparent px-5 py-3 text-slate-900 outline-none"
        />

        <span className="flex shrink-0 items-center border-l border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-500 sm:px-4 sm:text-sm">
          {suffixe}
        </span>
      </div>
    </label>
  );
}

function Info({
  label,
  valeur,
}: {
  label: string;
  valeur: string;
}) {
  return (
    <p className="min-w-0 break-words">
      <span className="font-bold text-slate-700">
        {label} :
      </span>{" "}
      <span className="text-slate-600">
        {valeur}
      </span>
    </p>
  );
}