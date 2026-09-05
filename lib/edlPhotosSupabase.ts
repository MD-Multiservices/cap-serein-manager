import { supabase } from "@/lib/supabase";

const BUCKET_EDL = "edl-media";

export type PhotoEdlSupabase = {
  id: string;
  zoneId: string;
  storagePath: string;
  nomFichier: string;
  mimeType: string;
  tailleOctets: number;
  commentaire: string;
  datePriseVue: string;
  ordre: number;
  url: string;
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

  return Number.isFinite(resultat)
    ? Math.max(
        0,
        resultat
      )
    : 0;
}

function extensionDepuisMime(
  mimeType: string
): string {
  if (
    mimeType === "image/png"
  ) {
    return "png";
  }

  if (
    mimeType === "image/webp"
  ) {
    return "webp";
  }

  return "jpg";
}

function blobDepuisDataUrl(
  dataUrl: string
): Blob {
  const morceaux =
    dataUrl.split(",");

  if (
    morceaux.length !== 2
  ) {
    throw new Error(
      "Photo compressée invalide."
    );
  }

  const entete =
    morceaux[0];

  const contenu =
    morceaux[1];

  const correspondance =
    entete.match(
      /data:(.*?);base64/
    );

  const mimeType =
    correspondance?.[1] ||
    "image/jpeg";

  const chaine =
    window.atob(
      contenu
    );

  const octets =
    new Uint8Array(
      chaine.length
    );

  for (
    let index = 0;
    index < chaine.length;
    index += 1
  ) {
    octets[index] =
      chaine.charCodeAt(
        index
      );
  }

  return new Blob(
    [octets],
    {
      type: mimeType,
    }
  );
}

export async function chargerPhotosEdl(
  organizationId: string,
  etatDesLieuxId: string
): Promise<
  PhotoEdlSupabase[]
> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "edl_photos"
      )
      .select(
        `
          id,
          zone_id,
          storage_path,
          nom_fichier,
          mime_type,
          taille_octets,
          commentaire,
          date_prise_vue,
          ordre
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
      )
      .order(
        "date_prise_vue",
        {
          ascending:
            true,
        }
      );

  if (error) {
    throw error;
  }

  const lignes =
    data || [];

  if (
    lignes.length === 0
  ) {
    return [];
  }

  const chemins =
    lignes.map(
      (ligne) =>
        String(
          ligne.storage_path
        )
    );

  const {
    data:
      urlsSignees,
    error:
      erreurUrls,
  } =
    await supabase.storage
      .from(
        BUCKET_EDL
      )
      .createSignedUrls(
        chemins,
        60 * 60
      );

  if (
    erreurUrls
  ) {
    throw erreurUrls;
  }

  return lignes.map(
    (
      ligne,
      index
    ): PhotoEdlSupabase => ({
      id:
        String(
          ligne.id
        ),

      zoneId:
        texte(
          ligne.zone_id
        ),

      storagePath:
        texte(
          ligne.storage_path
        ),

      nomFichier:
        texte(
          ligne.nom_fichier
        ) ||
        "Photo",

      mimeType:
        texte(
          ligne.mime_type
        ) ||
        "image/jpeg",

      tailleOctets:
        nombre(
          ligne.taille_octets
        ),

      commentaire:
        texte(
          ligne.commentaire
        ),

      datePriseVue:
        texte(
          ligne.date_prise_vue
        ),

      ordre:
        nombre(
          ligne.ordre
        ),

      url:
        urlsSignees?.[
          index
        ]?.signedUrl ||
        "",
    })
  );
}

export async function televerserPhotoEdl(
  organizationId: string,
  etatDesLieuxId: string,
  zoneId: string,
  donnees: {
    dataUrl: string;
    nomFichier: string;
    commentaire?: string;
    ordre?: number;
    datePriseVue?: string;
  }
): Promise<
  PhotoEdlSupabase
> {
  const blob =
    blobDepuisDataUrl(
      donnees.dataUrl
    );

  const mimeType =
    blob.type ||
    "image/jpeg";

  const extension =
    extensionDepuisMime(
      mimeType
    );

  const identifiant =
    crypto.randomUUID();

  const nomStockage =
    `${identifiant}.${extension}`;

  const storagePath =
    [
      organizationId,
      etatDesLieuxId,
      zoneId,
      nomStockage,
    ].join("/");

  const {
    error:
      erreurUpload,
  } =
    await supabase.storage
      .from(
        BUCKET_EDL
      )
      .upload(
        storagePath,
        blob,
        {
          contentType:
            mimeType,

          upsert:
            false,
        }
      );

  if (
    erreurUpload
  ) {
    throw erreurUpload;
  }

  const {
    data:
      lignePhoto,
    error:
      erreurInsertion,
  } =
    await supabase
      .from(
        "edl_photos"
      )
      .insert({
        organization_id:
          organizationId,

        etat_des_lieux_id:
          etatDesLieuxId,

        zone_id:
          zoneId,

        storage_path:
          storagePath,

        nom_fichier:
          donnees.nomFichier ||
          `photo.${extension}`,

        mime_type:
          mimeType,

        taille_octets:
          blob.size,

        commentaire:
          donnees.commentaire ||
          null,

        date_prise_vue:
          donnees.datePriseVue ||
          new Date()
            .toISOString(),

        ordre:
          donnees.ordre ??
          0,
      })
      .select(
        `
          id,
          zone_id,
          storage_path,
          nom_fichier,
          mime_type,
          taille_octets,
          commentaire,
          date_prise_vue,
          ordre
        `
      )
      .single();

  if (
    erreurInsertion
  ) {
    await supabase.storage
      .from(
        BUCKET_EDL
      )
      .remove([
        storagePath,
      ]);

    throw erreurInsertion;
  }

  const {
    data:
      urlSignee,
    error:
      erreurUrl,
  } =
    await supabase.storage
      .from(
        BUCKET_EDL
      )
      .createSignedUrl(
        storagePath,
        60 * 60
      );

  if (
    erreurUrl
  ) {
    throw erreurUrl;
  }

  return {
    id:
      String(
        lignePhoto.id
      ),

    zoneId:
      texte(
        lignePhoto.zone_id
      ),

    storagePath:
      texte(
        lignePhoto.storage_path
      ),

    nomFichier:
      texte(
        lignePhoto.nom_fichier
      ),

    mimeType:
      texte(
        lignePhoto.mime_type
      ),

    tailleOctets:
      nombre(
        lignePhoto.taille_octets
      ),

    commentaire:
      texte(
        lignePhoto.commentaire
      ),

    datePriseVue:
      texte(
        lignePhoto.date_prise_vue
      ),

    ordre:
      nombre(
        lignePhoto.ordre
      ),

    url:
      urlSignee.signedUrl,
  };
}

export async function modifierCommentairePhotoEdl(
  organizationId: string,
  photoId: string,
  commentaire: string
): Promise<void> {
  const commentaireFinal =
    commentaire.trim();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "edl_photos"
      )
      .update({
        commentaire:
          commentaireFinal ||
          null,
      })
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "id",
        photoId
      )
      .select(
        "id, commentaire"
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      `Aucune photo Supabase trouvée pour l'identifiant ${photoId}.`
    );
  }

  const commentaireEnregistre =
    texte(
      data.commentaire
    );

  if (
    commentaireEnregistre !==
    commentaireFinal
  ) {
    throw new Error(
      "Le commentaire de la photo n'a pas été enregistré correctement."
    );
  }
}

export async function supprimerPhotoEdl(
  organizationId: string,
  photoId: string,
  storagePath: string
): Promise<void> {
  const {
    error:
      erreurStorage,
  } =
    await supabase.storage
      .from(
        BUCKET_EDL
      )
      .remove([
        storagePath,
      ]);

  if (
    erreurStorage
  ) {
    throw erreurStorage;
  }

  const {
    data,
    error:
      erreurBase,
  } =
    await supabase
      .from(
        "edl_photos"
      )
      .delete()
      .eq(
        "organization_id",
        organizationId
      )
      .eq(
        "id",
        photoId
      )
      .select(
        "id"
      )
      .maybeSingle();

  if (
    erreurBase
  ) {
    throw erreurBase;
  }

  if (!data) {
    throw new Error(
      `La photo ${photoId} n'a pas été supprimée de la base de données.`
    );
  }
}