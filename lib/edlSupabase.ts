import { supabase } from "@/lib/supabase";

export type EtatZoneEdl =
  | "non_verifie"
  | "bon"
  | "usage"
  | "degrade";

export type StatutEdl =
  | "a_preparer"
  | "en_cours"
  | "termine"
  | "signe";

export type TypeEdl =
  | "entree"
  | "sortie";

export type ValidationEdlSupabase = {
  nomSignataireVoyageur: string;
  accordVoyageur: boolean;
  observationsVoyageur: string;
  signatureVoyageurPath: string;
  dateSignatureVoyageur: string;

  operateurUserId: string;
  nomSignataireOperateur: string;
  signatureOperateurPath: string;
  dateSignatureOperateur: string;
};

export type ZoneEdlSupabase = {
  id: string;
  nom: string;
  ordre: number;
  etat: EtatZoneEdl;
  observations: string;
};

export type ReleveEdlSupabase = {
  id: string;
  typeCompteur: string;
  numero: string;
  valeur: string;
  unite: string;
  observations: string;
};

export type CleEdlSupabase = {
  id: string;
  libelle: string;
  quantiteAttendue: number;
  quantiteConstatee: number;
  etat: string;
  observations: string;
};

export type EtatDesLieuxSupabase = {
  id: string;
  organizationId: string;

  missionId: string;
  logementId: string;
  voyageurId: string;

  type: TypeEdl;
  statut: StatutEdl;

  datePrevue: string;
  dateDebut: string;
  dateFin: string;

  notesPreparation: string;

  etatGeneral: EtatZoneEdl;
  proprete: EtatZoneEdl;
  observationsGenerales: string;

  logementSnapshot:
    Record<string, unknown>;

  voyageurSnapshot:
    Record<string, unknown>;

  proprietaireSnapshot:
    Record<string, unknown>;

  validation:
    ValidationEdlSupabase;

  createdAt: string;
  updatedAt: string;
};

function texte(
  valeur: unknown
): string {
  if (
    valeur === null ||
    valeur === undefined
  ) {
    return "";
  }

  return String(valeur);
}

function nombre(
  valeur: unknown
): number {
  const resultat =
    Number(valeur || 0);

  return Number.isFinite(
    resultat
  )
    ? Math.max(
        0,
        resultat
      )
    : 0;
}

function objet(
  valeur: unknown
): Record<string, unknown> {
  if (
    valeur &&
    typeof valeur === "object" &&
    !Array.isArray(valeur)
  ) {
    return valeur as Record<
      string,
      unknown
    >;
  }

  return {};
}

export function estUuidEdl(
  valeur: string
): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    valeur
  );
}

export function nouvelUuidEdl():
  string {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  throw new Error(
    "Impossible de générer un identifiant UUID."
  );
}

function normaliserEtatZone(
  valeur: unknown
): EtatZoneEdl {
  if (
    valeur === "bon" ||
    valeur === "usage" ||
    valeur === "degrade"
  ) {
    return valeur;
  }

  return "non_verifie";
}

function normaliserStatut(
  valeur: unknown
): StatutEdl {
  if (
    valeur === "en_cours" ||
    valeur === "termine" ||
    valeur === "signe"
  ) {
    return valeur;
  }

  return "a_preparer";
}

function normaliserType(
  valeur: unknown
): TypeEdl {
  return valeur === "sortie"
    ? "sortie"
    : "entree";
}

export async function obtenirOrganisationEdl():
  Promise<string> {
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
    data,
    error,
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
      .limit(1)
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (
    !data?.organization_id
  ) {
    throw new Error(
      "Aucune organisation associée à ce compte."
    );
  }

  return String(
    data.organization_id
  );
}

export async function chargerEnteteEdl(
  organizationId: string,
  etatDesLieuxId: string
): Promise<EtatDesLieuxSupabase> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "etats_des_lieux"
      )
      .select(
        `
          id,
          organization_id,
          mission_id,
          logement_id,
          voyageur_id,
          type_edl,
          statut,
          date_prevue,
          date_debut,
          date_fin,
          notes_preparation,
          etat_general,
          proprete,
          observations_generales,
          logement_snapshot,
          voyageur_snapshot,
          proprietaire_snapshot,
          nom_signataire_voyageur,
          accord_voyageur,
          observations_voyageur,
          signature_voyageur_path,
          date_signature_voyageur,
          operateur_user_id,
          nom_signataire_operateur,
          signature_operateur_path,
          date_signature_operateur,
          created_at,
          updated_at
        `
      )
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "id",
        etatDesLieuxId
      )
      .single();

  if (error) {
    throw error;
  }

  return {
    id:
      String(data.id),

    organizationId:
      String(
        data.organization_id
      ),

    missionId:
      texte(
        data.mission_id
      ),

    logementId:
      texte(
        data.logement_id
      ),

    voyageurId:
      texte(
        data.voyageur_id
      ),

    type:
      normaliserType(
        data.type_edl
      ),

    statut:
      normaliserStatut(
        data.statut
      ),

    datePrevue:
      texte(
        data.date_prevue
      ),

    dateDebut:
      texte(
        data.date_debut
      ),

    dateFin:
      texte(
        data.date_fin
      ),

    notesPreparation:
      texte(
        data.notes_preparation
      ),

    etatGeneral:
      normaliserEtatZone(
        data.etat_general
      ),

    proprete:
      normaliserEtatZone(
        data.proprete
      ),

    observationsGenerales:
      texte(
        data.observations_generales
      ),

    logementSnapshot:
      objet(
        data.logement_snapshot
      ),

    voyageurSnapshot:
      objet(
        data.voyageur_snapshot
      ),

    proprietaireSnapshot:
      objet(
        data.proprietaire_snapshot
      ),

    validation: {
      nomSignataireVoyageur:
        texte(
          data.nom_signataire_voyageur
        ),

      accordVoyageur:
        Boolean(
          data.accord_voyageur
        ),

      observationsVoyageur:
        texte(
          data.observations_voyageur
        ),

      signatureVoyageurPath:
        texte(
          data.signature_voyageur_path
        ),

      dateSignatureVoyageur:
        texte(
          data.date_signature_voyageur
        ),

      operateurUserId:
        texte(
          data.operateur_user_id
        ),

      nomSignataireOperateur:
        texte(
          data.nom_signataire_operateur
        ),

      signatureOperateurPath:
        texte(
          data.signature_operateur_path
        ),

      dateSignatureOperateur:
        texte(
          data.date_signature_operateur
        ),
    },

    createdAt:
      texte(
        data.created_at
      ),

    updatedAt:
      texte(
        data.updated_at
      ),
  };
}

export async function chargerZonesEdl(
  organizationId: string,
  etatDesLieuxId: string
): Promise<ZoneEdlSupabase[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "edl_zones"
      )
      .select(
        `
          id,
          nom,
          ordre,
          etat,
          observations
        `
      )
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "etat_des_lieux_id",
        etatDesLieuxId
      )
      .order(
        "ordre",
        {
          ascending:
            true,
        }
      );

  if (error) {
    throw error;
  }

  return (
    data || []
  ).map(
    (
      ligne
    ): ZoneEdlSupabase => ({
      id:
        String(
          ligne.id
        ),

      nom:
        texte(
          ligne.nom
        ),

      ordre:
        nombre(
          ligne.ordre
        ),

      etat:
        normaliserEtatZone(
          ligne.etat
        ),

      observations:
        texte(
          ligne.observations
        ),
    })
  );
}

export async function chargerRelevesEdl(
  organizationId: string,
  etatDesLieuxId: string
): Promise<
  ReleveEdlSupabase[]
> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "edl_releves"
      )
      .select(
        `
          id,
          type_compteur,
          numero_compteur,
          valeur,
          unite,
          observations
        `
      )
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "etat_des_lieux_id",
        etatDesLieuxId
      );

  if (error) {
    throw error;
  }

  return (
    data || []
  ).map(
    (
      ligne
    ): ReleveEdlSupabase => ({
      id:
        String(
          ligne.id
        ),

      typeCompteur:
        texte(
          ligne.type_compteur
        ),

      numero:
        texte(
          ligne.numero_compteur
        ),

      valeur:
        texte(
          ligne.valeur
        ),

      unite:
        texte(
          ligne.unite
        ),

      observations:
        texte(
          ligne.observations
        ),
    })
  );
}

export async function chargerClesEdl(
  organizationId: string,
  etatDesLieuxId: string
): Promise<CleEdlSupabase[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "edl_cles"
      )
      .select(
        `
          id,
          libelle,
          quantite_attendue,
          quantite_constatee,
          etat,
          observations
        `
      )
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "etat_des_lieux_id",
        etatDesLieuxId
      );

  if (error) {
    throw error;
  }

  return (
    data || []
  ).map(
    (
      ligne
    ): CleEdlSupabase => ({
      id:
        String(
          ligne.id
        ),

      libelle:
        texte(
          ligne.libelle
        ),

      quantiteAttendue:
        nombre(
          ligne.quantite_attendue
        ),

      quantiteConstatee:
        nombre(
          ligne.quantite_constatee
        ),

      etat:
        texte(
          ligne.etat
        ),

      observations:
        texte(
          ligne.observations
        ),
    })
  );
}

export async function sauvegarderEnteteEdl(
  organizationId: string,
  etatDesLieuxId: string,
  donnees: {
    statut: StatutEdl;
    notesPreparation: string;
    etatGeneral: EtatZoneEdl;
    proprete: EtatZoneEdl;
    observationsGenerales: string;
    dateDebut: string;
    dateFin: string;
  }
): Promise<void> {
  const {
    error,
  } =
    await supabase
      .from(
        "etats_des_lieux"
      )
      .update({
        statut:
          donnees.statut,

        notes_preparation:
          donnees.notesPreparation ||
          null,

        etat_general:
          donnees.etatGeneral,

        proprete:
          donnees.proprete,

        observations_generales:
          donnees.observationsGenerales ||
          null,

        date_debut:
          donnees.dateDebut ||
          null,

        date_fin:
          donnees.dateFin ||
          null,
      })
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "id",
        etatDesLieuxId
      );

  if (error) {
    throw error;
  }
}

export async function sauvegarderValidationEdl(
  organizationId: string,
  etatDesLieuxId: string,
  donnees: ValidationEdlSupabase
): Promise<void> {
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
      "Session Supabase indisponible pour enregistrer les signatures."
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "etats_des_lieux"
      )
      .update({
        nom_signataire_voyageur:
          donnees.nomSignataireVoyageur.trim() ||
          null,

        accord_voyageur:
          donnees.accordVoyageur,

        observations_voyageur:
          donnees.observationsVoyageur.trim() ||
          null,

        signature_voyageur_path:
          donnees.signatureVoyageurPath.trim() ||
          null,

        date_signature_voyageur:
          donnees.dateSignatureVoyageur ||
          null,

        operateur_user_id:
          user.id,

        nom_signataire_operateur:
          donnees.nomSignataireOperateur.trim() ||
          null,

        signature_operateur_path:
          donnees.signatureOperateurPath.trim() ||
          null,

        date_signature_operateur:
          donnees.dateSignatureOperateur ||
          null,
      })
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "id",
        etatDesLieuxId
      )
      .select(
        "id"
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "L'état des lieux n'a pas été trouvé lors de l'enregistrement des signatures."
    );
  }
}

export async function sauvegarderRelevesEdl(
  organizationId: string,
  etatDesLieuxId: string,
  releves: {
    typeCompteur: string;
    numero: string;
    valeur: string;
    unite?: string;
    observations?: string;
  }[]
): Promise<void> {
  const {
    error:
      erreurSuppression,
  } =
    await supabase
      .from(
        "edl_releves"
      )
      .delete()
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "etat_des_lieux_id",
        etatDesLieuxId
      );

  if (
    erreurSuppression
  ) {
    throw erreurSuppression;
  }

  if (
    releves.length === 0
  ) {
    return;
  }

  const {
    error,
  } =
    await supabase
      .from(
        "edl_releves"
      )
      .insert(
        releves.map(
          (releve) => ({
            organization_id:
              organizationId,

            etat_des_lieux_id:
              etatDesLieuxId,

            type_compteur:
              releve.typeCompteur,

            numero_compteur:
              releve.numero ||
              null,

            valeur:
              releve.valeur ||
              null,

            unite:
              releve.unite ||
              null,

            observations:
              releve.observations ||
              null,
          })
        )
      );

  if (error) {
    throw error;
  }
}

export async function sauvegarderClesEdl(
  organizationId: string,
  etatDesLieuxId: string,
  cles: {
    libelle: string;
    quantite: number;
    observations?: string;
  }[]
): Promise<void> {
  const {
    error:
      erreurSuppression,
  } =
    await supabase
      .from(
        "edl_cles"
      )
      .delete()
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "etat_des_lieux_id",
        etatDesLieuxId
      );

  if (
    erreurSuppression
  ) {
    throw erreurSuppression;
  }

  if (
    cles.length === 0
  ) {
    return;
  }

  const {
    error,
  } =
    await supabase
      .from(
        "edl_cles"
      )
      .insert(
        cles.map(
          (cle) => ({
            organization_id:
              organizationId,

            etat_des_lieux_id:
              etatDesLieuxId,

            cle_id:
              null,

            libelle:
              cle.libelle,

            quantite_attendue:
              cle.quantite,

            quantite_constatee:
              cle.quantite,

            etat:
              null,

            observations:
              cle.observations ||
              null,
          })
        )
      );

  if (error) {
    throw error;
  }
}

export async function sauvegarderZonesEdl(
  organizationId: string,
  etatDesLieuxId: string,
  zones: ZoneEdlSupabase[]
): Promise<void> {
  const {
    data:
      zonesExistantes,
    error:
      erreurLecture,
  } =
    await supabase
      .from(
        "edl_zones"
      )
      .select(
        "id"
      )
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "etat_des_lieux_id",
        etatDesLieuxId
      );

  if (
    erreurLecture
  ) {
    throw erreurLecture;
  }

  const idsConserves =
    new Set(
      zones.map(
        (zone) =>
          zone.id
      )
    );

  const idsASupprimer =
    (
      zonesExistantes ||
      []
    )
      .map(
        (zone) =>
          String(
            zone.id
          )
      )
      .filter(
        (id) =>
          !idsConserves.has(
            id
          )
      );

  if (
    idsASupprimer.length >
    0
  ) {
    const {
      error,
    } =
      await supabase
        .from(
          "edl_zones"
        )
        .delete()
        .eq(
          "organization_id",
          organizationId
        )
        .eq(
          "etat_des_lieux_id",
          etatDesLieuxId
        )
        .in(
          "id",
          idsASupprimer
        );

    if (error) {
      throw error;
    }
  }

  if (
    zones.length === 0
  ) {
    return;
  }

  const {
    error,
  } =
    await supabase
      .from(
        "edl_zones"
      )
      .upsert(
        zones.map(
          (
            zone,
            index
          ) => ({
            id:
              zone.id,

            organization_id:
              organizationId,

            etat_des_lieux_id:
              etatDesLieuxId,

            nom:
              zone.nom,

            ordre:
              index,

            etat:
              zone.etat,

            observations:
              zone.observations ||
              null,
          })
        ),
        {
          onConflict:
            "id",
        }
      );

  if (error) {
    throw error;
  }
}