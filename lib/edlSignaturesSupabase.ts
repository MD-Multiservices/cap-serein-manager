import { supabase } from "@/lib/supabase";

const BUCKET_EDL = "edl-media";

export type TypeSignatureEdl =
  | "voyageur"
  | "operateur";

export type SignatureEdlSupabase = {
  storagePath: string;
  url: string;
};

function extensionDepuisMime(
  mimeType: string
): string {
  if (
    mimeType === "image/jpeg"
  ) {
    return "jpg";
  }

  if (
    mimeType === "image/webp"
  ) {
    return "webp";
  }

  return "png";
}

function blobDepuisDataUrl(
  dataUrl: string
): Blob {
  const correspondance =
    dataUrl.match(
      /^data:(.*?);base64,(.*)$/
    );

  if (!correspondance) {
    throw new Error(
      "Signature numérique invalide."
    );
  }

  const mimeType =
    correspondance[1] ||
    "image/png";

  const contenu =
    correspondance[2];

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

export async function chargerUrlSignatureEdl(
  storagePath: string
): Promise<string> {
  if (!storagePath) {
    return "";
  }

  const {
    data,
    error,
  } =
    await supabase.storage
      .from(
        BUCKET_EDL
      )
      .createSignedUrl(
        storagePath,
        60 * 60
      );

  if (error) {
    throw error;
  }

  return (
    data?.signedUrl ||
    ""
  );
}

export async function televerserSignatureEdl(
  organizationId: string,
  etatDesLieuxId: string,
  typeSignature: TypeSignatureEdl,
  dataUrl: string
): Promise<SignatureEdlSupabase> {
  if (
    !organizationId ||
    !etatDesLieuxId
  ) {
    throw new Error(
      "Organisation ou état des lieux manquant."
    );
  }

  if (
    !dataUrl.startsWith(
      "data:image/"
    )
  ) {
    throw new Error(
      "La signature à enregistrer n'est pas une image locale valide."
    );
  }

  const blob =
    blobDepuisDataUrl(
      dataUrl
    );

  const extension =
    extensionDepuisMime(
      blob.type ||
        "image/png"
    );

  const storagePath =
    [
      organizationId,
      etatDesLieuxId,
      "signatures",
      `${typeSignature}.${extension}`,
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
            blob.type ||
            "image/png",

          upsert:
            true,
        }
      );

  if (
    erreurUpload
  ) {
    throw erreurUpload;
  }

  const url =
    await chargerUrlSignatureEdl(
      storagePath
    );

  return {
    storagePath,
    url,
  };
}

export async function supprimerSignatureEdl(
  storagePath: string
): Promise<void> {
  if (!storagePath) {
    return;
  }

  const {
    error,
  } =
    await supabase.storage
      .from(
        BUCKET_EDL
      )
      .remove([
        storagePath,
      ]);

  if (error) {
    throw error;
  }
}
