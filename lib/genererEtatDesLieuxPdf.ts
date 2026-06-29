import { jsPDF } from "jspdf";

export type PhotoPdf = {
  id?: string;
  dataUrl: string;
  nom?: string;
  annotation?: string;
  dateAjout?: string;
};

export type ZonePdf = {
  id?: string;
  nom: string;
  etat: string;
  observations?: string;
  photos: PhotoPdf[];
};

export type RelevePdf = {
  numero: string;
  index: string;
};

export type ValidationPdf = {
  nomOperateur: string;
  nomVoyageur: string;
  accordVoyageur: boolean;
  observationsFinales: string;

  signatureVoyageur: string;
  signatureOperateur: string;

  dateSignatureVoyageur: string;
  dateSignatureOperateur: string;
};

export type EtatDesLieuxPdf = {
  id: string;
  missionId?: string;

  logementNom: string;
  typeLogement: string;
  superficie: number;
  nombreChambres: number;
  adresseLogement: string;

  voyageurNom: string;
  voyageurTelephone: string;
  voyageurEmail: string;

  type: "entree" | "sortie";
  statut: string;

  date: string;
  heure: string;

  notesPreparation: string;
  etatGeneral: string;
  proprete: string;
  observationsGenerales: string;

  compteurs: {
    electricite: RelevePdf;
    eauFroide: RelevePdf;
    eauChaude: RelevePdf;
    gaz: RelevePdf;
  };

  cles: {
    nombreJeux: number;
    nombreBadges: number;
    nombreTelecommandes: number;
    observations: string;
  };

  zones: ZonePdf[];
  validation: ValidationPdf;

  dateDebut?: string;
  dateFin?: string;
  dateSignature?: string;
};

export type InformationsEntreprisePdf = {
  nom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  logoUrl?: string;
};

export type ResultatGenerationPdf = {
  blob: Blob;
  nomFichier: string;
};

const COULEUR_PRINCIPALE = {
  rouge: 37,
  vert: 99,
  bleu: 235,
};

const COULEUR_SOMBRE = {
  rouge: 15,
  vert: 23,
  bleu: 42,
};

const COULEUR_GRISE = {
  rouge: 100,
  vert: 116,
  bleu: 139,
};

const COULEUR_FOND = {
  rouge: 241,
  vert: 245,
  bleu: 249,
};

function texte(valeur: unknown): string {
  if (
    valeur === undefined ||
    valeur === null ||
    valeur === ""
  ) {
    return "Non renseigné";
  }

  return String(valeur);
}

function valeurOuTiret(
  valeur: unknown
): string {
  if (
    valeur === undefined ||
    valeur === null ||
    valeur === ""
  ) {
    return "—";
  }

  return String(valeur);
}

function formaterType(
  type: "entree" | "sortie"
): string {
  return type === "sortie"
    ? "ÉTAT DES LIEUX DE SORTIE"
    : "ÉTAT DES LIEUX D’ENTRÉE";
}

function formaterEtatZone(
  etat: string
): string {
  if (etat === "bon") {
    return "Bon état";
  }

  if (etat === "usage") {
    return "État d’usage";
  }

  if (etat === "degrade") {
    return "Dégradation constatée";
  }

  return "Non vérifié";
}

function formaterDate(
  valeur: string
): string {
  if (!valeur) {
    return "Non renseignée";
  }

  const date = new Date(
    valeur.includes("T")
      ? valeur
      : `${valeur}T12:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return valeur;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formaterDateHeure(
  valeur: string
): string {
  if (!valeur) {
    return "Non renseignée";
  }

  const date = new Date(valeur);

  if (Number.isNaN(date.getTime())) {
    return valeur;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function nettoyerNomFichier(
  valeur: string
): string {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function detecterFormatImage(
  dataUrl: string
): "PNG" | "JPEG" | "WEBP" {
  if (
    dataUrl.startsWith(
      "data:image/png"
    )
  ) {
    return "PNG";
  }

  if (
    dataUrl.startsWith(
      "data:image/webp"
    )
  ) {
    return "WEBP";
  }

  return "JPEG";
}

function convertirBlobEnDataUrl(
  blob: Blob
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const lecteur = new FileReader();

      lecteur.onload = () => {
        if (
          typeof lecteur.result === "string"
        ) {
          resolve(lecteur.result);
          return;
        }

        reject(
          new Error(
            "Impossible de lire le fichier."
          )
        );
      };

      lecteur.onerror = () => {
        reject(
          new Error(
            "Impossible de lire le fichier."
          )
        );
      };

      lecteur.readAsDataURL(blob);
    }
  );
}

async function chargerImageDepuisUrl(
  url: string
): Promise<string> {
  try {
    const reponse = await fetch(url, {
      cache: "no-store",
    });

    if (!reponse.ok) {
      return "";
    }

    const blob = await reponse.blob();

    return await convertirBlobEnDataUrl(
      blob
    );
  } catch {
    return "";
  }
}

function ajouterImageAjustee(
  document: jsPDF,
  dataUrl: string,
  x: number,
  y: number,
  largeurMaximale: number,
  hauteurMaximale: number
): boolean {
  if (!dataUrl) {
    return false;
  }

  try {
    const proprietes =
      document.getImageProperties(dataUrl);

    const largeurImage = Number(
      proprietes.width || 1
    );

    const hauteurImage = Number(
      proprietes.height || 1
    );

    const ratio = Math.min(
      largeurMaximale / largeurImage,
      hauteurMaximale / hauteurImage
    );

    const largeur =
      largeurImage * ratio;

    const hauteur =
      hauteurImage * ratio;

    const positionX =
      x +
      (largeurMaximale - largeur) / 2;

    const positionY =
      y +
      (hauteurMaximale - hauteur) / 2;

    document.addImage(
      dataUrl,
      detecterFormatImage(dataUrl),
      positionX,
      positionY,
      largeur,
      hauteur,
      undefined,
      "FAST"
    );

    return true;
  } catch {
    return false;
  }
}

export async function genererEtatDesLieuxPdf(
  etat: EtatDesLieuxPdf,
  entreprise: InformationsEntreprisePdf
): Promise<ResultatGenerationPdf> {
  const document = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const largeurPage =
    document.internal.pageSize.getWidth();

  const hauteurPage =
    document.internal.pageSize.getHeight();

  const marge = 15;
  const largeurContenu =
    largeurPage - marge * 2;

  let positionY = 35;

  const logoUrl =
    entreprise.logoUrl ||
    "/logo-cap-serein.jpg";

  const logoDataUrl =
    await chargerImageDepuisUrl(logoUrl);

  function ajouterEntete() {
    document.setFillColor(
      COULEUR_SOMBRE.rouge,
      COULEUR_SOMBRE.vert,
      COULEUR_SOMBRE.bleu
    );

    document.rect(
      0,
      0,
      largeurPage,
      26,
      "F"
    );

    if (logoDataUrl) {
      document.setFillColor(
        255,
        255,
        255
      );

      document.roundedRect(
        marge,
        4,
        30,
        18,
        2,
        2,
        "F"
      );

      ajouterImageAjustee(
        document,
        logoDataUrl,
        marge + 2,
        5,
        26,
        16
      );
    } else {
      document.setFillColor(
        COULEUR_PRINCIPALE.rouge,
        COULEUR_PRINCIPALE.vert,
        COULEUR_PRINCIPALE.bleu
      );

      document.roundedRect(
        marge,
        4,
        18,
        18,
        3,
        3,
        "F"
      );

      document.setTextColor(
        255,
        255,
        255
      );

      document.setFont(
        "helvetica",
        "bold"
      );

      document.setFontSize(13);

      document.text(
        "CS",
        marge + 9,
        15.5,
        {
          align: "center",
        }
      );
    }

    const texteX = logoDataUrl
      ? marge + 35
      : marge + 23;

    document.setTextColor(
      255,
      255,
      255
    );

    document.setFont(
      "helvetica",
      "bold"
    );

    document.setFontSize(13);

    document.text(
      entreprise.nom ||
        "Cap Serein",
      texteX,
      11
    );

    document.setFont(
      "helvetica",
      "normal"
    );

    document.setFontSize(8.5);

    document.text(
      entreprise.email ||
        "Adresse e-mail non renseignée",
      texteX,
      17
    );

    const reference =
      etat.missionId ||
      etat.id;

    document.setFontSize(8);

    document.text(
      `Référence : ${reference}`,
      largeurPage - marge,
      11,
      {
        align: "right",
      }
    );

    document.text(
      formaterDate(etat.date),
      largeurPage - marge,
      17,
      {
        align: "right",
      }
    );
  }

  function nouvellePage() {
    document.addPage();
    ajouterEntete();
    positionY = 35;
  }

  function assurerEspace(
    hauteurNecessaire: number
  ) {
    if (
      positionY +
        hauteurNecessaire >
      hauteurPage - 18
    ) {
      nouvellePage();
    }
  }

  function ajouterTitreSection(
    titre: string
  ) {
    assurerEspace(14);

    document.setFillColor(
      COULEUR_PRINCIPALE.rouge,
      COULEUR_PRINCIPALE.vert,
      COULEUR_PRINCIPALE.bleu
    );

    document.roundedRect(
      marge,
      positionY,
      largeurContenu,
      9,
      2,
      2,
      "F"
    );

    document.setTextColor(
      255,
      255,
      255
    );

    document.setFont(
      "helvetica",
      "bold"
    );

    document.setFontSize(10);

    document.text(
      titre.toUpperCase(),
      marge + 4,
      positionY + 6
    );

    positionY += 14;
  }

  function ajouterTexte(
    contenu: string,
    options?: {
      gras?: boolean;
      taille?: number;
      couleur?: {
        rouge: number;
        vert: number;
        bleu: number;
      };
      retrait?: number;
      espaceApres?: number;
    }
  ) {
    const retrait =
      options?.retrait || 0;

    const largeur =
      largeurContenu - retrait;

    const lignes =
      document.splitTextToSize(
        contenu || "—",
        largeur
      ) as string[];

    const taille =
      options?.taille || 9;

    const hauteurLigne =
      taille * 0.42 + 1.2;

    const hauteur =
      lignes.length * hauteurLigne;

    assurerEspace(hauteur + 3);

    const couleur =
      options?.couleur ||
      COULEUR_SOMBRE;

    document.setTextColor(
      couleur.rouge,
      couleur.vert,
      couleur.bleu
    );

    document.setFont(
      "helvetica",
      options?.gras
        ? "bold"
        : "normal"
    );

    document.setFontSize(taille);

    document.text(
      lignes,
      marge + retrait,
      positionY
    );

    positionY +=
      hauteur +
      (options?.espaceApres ?? 3);
  }

  function ajouterLigneInformation(
    label: string,
    valeur: string
  ) {
    assurerEspace(9);

    document.setFillColor(
      COULEUR_FOND.rouge,
      COULEUR_FOND.vert,
      COULEUR_FOND.bleu
    );

    document.roundedRect(
      marge,
      positionY - 4.5,
      largeurContenu,
      8,
      1.5,
      1.5,
      "F"
    );

    document.setTextColor(
      COULEUR_GRISE.rouge,
      COULEUR_GRISE.vert,
      COULEUR_GRISE.bleu
    );

    document.setFont(
      "helvetica",
      "bold"
    );

    document.setFontSize(8.5);

    document.text(
      `${label} :`,
      marge + 3,
      positionY
    );

    document.setTextColor(
      COULEUR_SOMBRE.rouge,
      COULEUR_SOMBRE.vert,
      COULEUR_SOMBRE.bleu
    );

    document.setFont(
      "helvetica",
      "normal"
    );

    document.text(
      valeurOuTiret(valeur),
      marge + 48,
      positionY
    );

    positionY += 10;
  }

  function ajouterCompteur(
    titre: string,
    releve: RelevePdf
  ) {
    assurerEspace(18);

    document.setDrawColor(
      203,
      213,
      225
    );

    document.setFillColor(
      248,
      250,
      252
    );

    document.roundedRect(
      marge,
      positionY,
      largeurContenu,
      14,
      2,
      2,
      "FD"
    );

    document.setTextColor(
      COULEUR_SOMBRE.rouge,
      COULEUR_SOMBRE.vert,
      COULEUR_SOMBRE.bleu
    );

    document.setFont(
      "helvetica",
      "bold"
    );

    document.setFontSize(9);

    document.text(
      titre,
      marge + 4,
      positionY + 5
    );

    document.setFont(
      "helvetica",
      "normal"
    );

    document.setFontSize(8.5);

    document.text(
      `N° : ${valeurOuTiret(
        releve.numero
      )}`,
      marge + 45,
      positionY + 5
    );

    document.text(
      `Index : ${valeurOuTiret(
        releve.index
      )}`,
      marge + 110,
      positionY + 5
    );

    positionY += 18;
  }

  function ajouterPhoto(
    photo: PhotoPdf,
    numero: number,
    total: number
  ) {
    const hauteurImage = 65;
    const hauteurLegende = 18;
    const hauteurTotale =
      hauteurImage +
      hauteurLegende +
      8;

    assurerEspace(hauteurTotale);

    document.setDrawColor(
      203,
      213,
      225
    );

    document.setFillColor(
      248,
      250,
      252
    );

    document.roundedRect(
      marge,
      positionY,
      largeurContenu,
      hauteurTotale - 4,
      2,
      2,
      "FD"
    );

    ajouterImageAjustee(
      document,
      photo.dataUrl,
      marge + 3,
      positionY + 3,
      largeurContenu - 6,
      hauteurImage - 6
    );

    document.setTextColor(
      COULEUR_GRISE.rouge,
      COULEUR_GRISE.vert,
      COULEUR_GRISE.bleu
    );

    document.setFont(
      "helvetica",
      "bold"
    );

    document.setFontSize(8);

    document.text(
      `Photo ${numero}/${total}`,
      marge + 4,
      positionY + hauteurImage + 2
    );

    document.setFont(
      "helvetica",
      "normal"
    );

    const annotation =
      photo.annotation?.trim() ||
      "Aucune annotation";

    const lignes =
      document.splitTextToSize(
        annotation,
        largeurContenu - 8
      ) as string[];

    document.setTextColor(
      COULEUR_SOMBRE.rouge,
      COULEUR_SOMBRE.vert,
      COULEUR_SOMBRE.bleu
    );

    document.text(
      lignes.slice(0, 3),
      marge + 4,
      positionY + hauteurImage + 8
    );

    positionY += hauteurTotale;
  }

  ajouterEntete();

  document.setTextColor(
    COULEUR_SOMBRE.rouge,
    COULEUR_SOMBRE.vert,
    COULEUR_SOMBRE.bleu
  );

  document.setFont(
    "helvetica",
    "bold"
  );

  document.setFontSize(20);

  document.text(
    formaterType(etat.type),
    marge,
    positionY
  );

  positionY += 9;

  document.setFontSize(15);

  document.text(
    etat.logementNom ||
      "Logement non renseigné",
    marge,
    positionY
  );

  positionY += 7;

  document.setFont(
    "helvetica",
    "normal"
  );

  document.setFontSize(9.5);

  document.setTextColor(
    COULEUR_GRISE.rouge,
    COULEUR_GRISE.vert,
    COULEUR_GRISE.bleu
  );

  const adresse =
    document.splitTextToSize(
      etat.adresseLogement ||
        "Adresse non renseignée",
      largeurContenu
    ) as string[];

  document.text(
    adresse,
    marge,
    positionY
  );

  positionY +=
    adresse.length * 4.5 + 7;

  ajouterTitreSection(
    "Informations générales"
  );

  ajouterLigneInformation(
    "Type de logement",
    etat.typeLogement
  );

  ajouterLigneInformation(
    "Superficie",
    etat.superficie
      ? `${etat.superficie} m²`
      : ""
  );

  ajouterLigneInformation(
    "Nombre de chambres",
    String(etat.nombreChambres ?? 0)
  );

  ajouterLigneInformation(
    "Date prévue",
    formaterDate(etat.date)
  );

  ajouterLigneInformation(
    "Heure prévue",
    etat.heure
  );

  ajouterLigneInformation(
    "Voyageur",
    etat.voyageurNom
  );

  ajouterLigneInformation(
    "Téléphone",
    etat.voyageurTelephone
  );

  ajouterLigneInformation(
    "Adresse e-mail",
    etat.voyageurEmail
  );

  ajouterTitreSection(
    "Évaluation générale"
  );

  ajouterLigneInformation(
    "État général",
    formaterEtatZone(
      etat.etatGeneral
    )
  );

  ajouterLigneInformation(
    "Propreté générale",
    formaterEtatZone(
      etat.proprete
    )
  );

  ajouterTexte(
    `Observations générales : ${
      etat.observationsGenerales ||
      "Aucune observation"
    }`
  );

  ajouterTitreSection(
    "Relevés des compteurs"
  );

  ajouterCompteur(
    "Électricité",
    etat.compteurs.electricite
  );

  ajouterCompteur(
    "Eau froide",
    etat.compteurs.eauFroide
  );

  ajouterCompteur(
    "Eau chaude",
    etat.compteurs.eauChaude
  );

  ajouterCompteur(
    "Gaz",
    etat.compteurs.gaz
  );

  ajouterTitreSection(
    "Clés et moyens d’accès"
  );

  ajouterLigneInformation(
    "Jeux de clés",
    String(
      etat.cles.nombreJeux ?? 0
    )
  );

  ajouterLigneInformation(
    "Badges",
    String(
      etat.cles.nombreBadges ?? 0
    )
  );

  ajouterLigneInformation(
    "Télécommandes",
    String(
      etat.cles
        .nombreTelecommandes ?? 0
    )
  );

  ajouterTexte(
    `Observations sur les clés : ${
      etat.cles.observations ||
      "Aucune observation"
    }`
  );

  ajouterTitreSection(
    "Détail des pièces et équipements"
  );

  for (const zone of etat.zones) {
    assurerEspace(22);

    document.setTextColor(
      COULEUR_SOMBRE.rouge,
      COULEUR_SOMBRE.vert,
      COULEUR_SOMBRE.bleu
    );

    document.setFont(
      "helvetica",
      "bold"
    );

    document.setFontSize(11);

    document.text(
      zone.nom,
      marge,
      positionY
    );

    positionY += 5;

    document.setFontSize(8.5);

    document.setTextColor(
      COULEUR_PRINCIPALE.rouge,
      COULEUR_PRINCIPALE.vert,
      COULEUR_PRINCIPALE.bleu
    );

    document.text(
      formaterEtatZone(zone.etat),
      marge,
      positionY
    );

    positionY += 5;

    ajouterTexte(
      zone.observations ||
        "Aucune observation",
      {
        taille: 8.5,
        espaceApres: 4,
      }
    );

    if (zone.photos.length > 0) {
      zone.photos.forEach(
        (photo, index) => {
          ajouterPhoto(
            photo,
            index + 1,
            zone.photos.length
          );
        }
      );
    }

    positionY += 3;
  }

  ajouterTitreSection(
    "Validation et signatures"
  );

  ajouterLigneInformation(
    "Voyageur signataire",
    etat.validation.nomVoyageur
  );

  ajouterLigneInformation(
    "Opérateur signataire",
    etat.validation.nomOperateur
  );

  ajouterLigneInformation(
    "Accord du voyageur",
    etat.validation.accordVoyageur
      ? "Confirmé"
      : "Non confirmé"
  );

  ajouterTexte(
    `Observations finales : ${
      etat.validation
        .observationsFinales ||
      "Aucune observation"
    }`
  );

  assurerEspace(65);

  const largeurSignature =
    (largeurContenu - 8) / 2;

  document.setDrawColor(
    203,
    213,
    225
  );

  document.setFillColor(
    248,
    250,
    252
  );

  document.roundedRect(
    marge,
    positionY,
    largeurSignature,
    50,
    2,
    2,
    "FD"
  );

  document.roundedRect(
    marge + largeurSignature + 8,
    positionY,
    largeurSignature,
    50,
    2,
    2,
    "FD"
  );

  document.setTextColor(
    COULEUR_SOMBRE.rouge,
    COULEUR_SOMBRE.vert,
    COULEUR_SOMBRE.bleu
  );

  document.setFont(
    "helvetica",
    "bold"
  );

  document.setFontSize(9);

  document.text(
    "Signature du voyageur",
    marge + 4,
    positionY + 6
  );

  document.text(
    "Signature de l’opérateur",
    marge +
      largeurSignature +
      12,
    positionY + 6
  );

  ajouterImageAjustee(
    document,
    etat.validation
      .signatureVoyageur,
    marge + 4,
    positionY + 9,
    largeurSignature - 8,
    28
  );

  ajouterImageAjustee(
    document,
    etat.validation
      .signatureOperateur,
    marge +
      largeurSignature +
      12,
    positionY + 9,
    largeurSignature - 8,
    28
  );

  document.setFont(
    "helvetica",
    "normal"
  );

  document.setFontSize(7);

  document.setTextColor(
    COULEUR_GRISE.rouge,
    COULEUR_GRISE.vert,
    COULEUR_GRISE.bleu
  );

  document.text(
    formaterDateHeure(
      etat.validation
        .dateSignatureVoyageur
    ),
    marge + 4,
    positionY + 45
  );

  document.text(
    formaterDateHeure(
      etat.validation
        .dateSignatureOperateur
    ),
    marge +
      largeurSignature +
      12,
    positionY + 45
  );

  positionY += 58;

  ajouterTexte(
    "Le voyageur reconnaît avoir pris connaissance de l’état des lieux, des photographies et des observations figurant dans ce document.",
    {
      taille: 8,
      couleur: COULEUR_GRISE,
    }
  );

  const nombrePages =
    document.getNumberOfPages();

  for (
    let numeroPage = 1;
    numeroPage <= nombrePages;
    numeroPage += 1
  ) {
    document.setPage(numeroPage);

    document.setDrawColor(
      226,
      232,
      240
    );

    document.line(
      marge,
      hauteurPage - 13,
      largeurPage - marge,
      hauteurPage - 13
    );

    document.setTextColor(
      COULEUR_GRISE.rouge,
      COULEUR_GRISE.vert,
      COULEUR_GRISE.bleu
    );

    document.setFont(
      "helvetica",
      "normal"
    );

    document.setFontSize(7.5);

    document.text(
      `${entreprise.nom} — État des lieux ${
        etat.type === "sortie"
          ? "de sortie"
          : "d’entrée"
      }`,
      marge,
      hauteurPage - 8
    );

    document.text(
      `Page ${numeroPage} / ${nombrePages}`,
      largeurPage - marge,
      hauteurPage - 8,
      {
        align: "right",
      }
    );
  }

  const typeFichier =
    etat.type === "sortie"
      ? "sortie"
      : "entree";

  const logement =
    nettoyerNomFichier(
      etat.logementNom ||
        "logement"
    );

  const date =
    etat.date ||
    new Date()
      .toISOString()
      .slice(0, 10);

  const nomFichier =
    `etat-des-lieux-${typeFichier}-${logement}-${date}.pdf`;

  const blob =
    document.output("blob");

  return {
    blob,
    nomFichier,
  };
}

export function telechargerPdf(
  blob: Blob,
  nomFichier: string
) {
  const url =
    URL.createObjectURL(blob);

  const lien =
    document.createElement("a");

  lien.href = url;
  lien.download = nomFichier;

  document.body.appendChild(lien);
  lien.click();
  lien.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}