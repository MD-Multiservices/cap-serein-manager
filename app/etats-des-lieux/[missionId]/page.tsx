"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChangeEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import { lire } from "@/lib/database";

type StatutEtatDesLieux =
  | "a_preparer"
  | "en_cours"
  | "termine"
  | "signe";

type EtatZone =
  | "non_verifie"
  | "bon"
  | "usage"
  | "degrade";

type Etape =
  | "resume"
  | "compteurs"
  | "photos"
  | "validation";

type PhotoEtatDesLieux = {
  id: string;
  dataUrl: string;
  nom: string;
  annotation: string;
  dateAjout: string;
  source: "camera" | "galerie";
  tailleOriginale: number;
};

type ZoneEtatDesLieux = {
  id: string;
  nom: string;
  etat: EtatZone;
  observations: string;
  photos: PhotoEtatDesLieux[];
};

type ReleveCompteur = {
  numero: string;
  index: string;
};

type EtatDesLieux = {
  id: string;
  missionId: string;

  logementId: string;
  logementNom: string;
  typeLogement: string;
  superficie: number;
  nombreChambres: number;
  adresseLogement: string;

  voyageurId: string;
  voyageurNom: string;
  voyageurTelephone: string;
  voyageurEmail: string;

  type: "entree" | "sortie";
  statut: StatutEtatDesLieux;

  date: string;
  heure: string;
  notesPreparation: string;

  etatGeneral: EtatZone;
  proprete: EtatZone;
  observationsGenerales: string;

  compteurs: {
    electricite: ReleveCompteur;
    eauFroide: ReleveCompteur;
    eauChaude: ReleveCompteur;
    gaz: ReleveCompteur;
  };

  cles: {
    nombreJeux: number;
    nombreBadges: number;
    nombreTelecommandes: number;
    observations: string;
  };

  zones: ZoneEtatDesLieux[];

  validation: {
    nomOperateur: string;
    nomVoyageur: string;
    accordVoyageur: boolean;
    observationsFinales: string;
  };

  dateDebut: string;
  dateFin: string;
  dateSignature: string;
  dateCreation: string;
  dateModification: string;

  [cle: string]: unknown;
};

type Logement = {
  id: string;
  nom: string;
  typeLogement: string;
  superficie: number;
  nombreChambres: number;
  adresse: string;
  codePostal: string;
  ville: string;
};

type Voyageur = {
  id: string;
  nom: string;
  prenom: string;
  nomComplet: string;
  telephone: string;
  email: string;
};

const etapes: {
  id: Etape;
  label: string;
  icone: string;
}[] = [
  {
    id: "resume",
    label: "Résumé",
    icone: "📋",
  },
  {
    id: "compteurs",
    label: "Compteurs",
    icone: "⚡",
  },
  {
    id: "photos",
    label: "Pièces & photos",
    icone: "📷",
  },
  {
    id: "validation",
    label: "Validation",
    icone: "✅",
  },
];

const etatsDisponibles: {
  valeur: EtatZone;
  label: string;
}[] = [
  {
    valeur: "non_verifie",
    label: "Non vérifié",
  },
  {
    valeur: "bon",
    label: "Bon état",
  },
  {
    valeur: "usage",
    label: "État d’usage",
  },
  {
    valeur: "degrade",
    label: "Dégradation constatée",
  },
];

function creerIdentifiant(prefixe: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefixe}-${crypto.randomUUID()}`;
  }

  return `${prefixe}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function texte(valeur: unknown): string {
  if (
    valeur === null ||
    valeur === undefined
  ) {
    return "";
  }

  return String(valeur);
}

function nombre(valeur: unknown): number {
  const resultat = Number(valeur || 0);

  if (!Number.isFinite(resultat)) {
    return 0;
  }

  return Math.max(0, resultat);
}

function objet(
  valeur: unknown
): Record<string, unknown> {
  if (
    valeur &&
    typeof valeur === "object" &&
    !Array.isArray(valeur)
  ) {
    return valeur as Record<string, unknown>;
  }

  return {};
}

function normaliserEtatZone(
  valeur: unknown
): EtatZone {
  const etat = texte(valeur);

  if (
    etat === "bon" ||
    etat === "usage" ||
    etat === "degrade"
  ) {
    return etat;
  }

  return "non_verifie";
}

function normaliserStatut(
  valeur: unknown
): StatutEtatDesLieux {
  const statut = texte(valeur)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");

  if (statut === "en_cours") {
    return "en_cours";
  }

  if (
    statut === "termine" ||
    statut === "terminee"
  ) {
    return "termine";
  }

  if (
    statut === "signe" ||
    statut === "signee"
  ) {
    return "signe";
  }

  return "a_preparer";
}

function adresseComplete(
  logement: Partial<Logement>
): string {
  const ligneVille = [
    texte(logement.codePostal).trim(),
    texte(logement.ville).trim(),
  ]
    .filter(Boolean)
    .join(" ");

  return [
    texte(logement.adresse).trim(),
    ligneVille,
  ]
    .filter(Boolean)
    .join(", ");
}

function nomCompletVoyageur(
  voyageur: Partial<Voyageur>
): string {
  const resultat = [
    texte(voyageur.prenom).trim(),
    texte(voyageur.nom).trim(),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    resultat ||
    texte(voyageur.nomComplet).trim()
  );
}

function creerReleve(
  valeur: unknown
): ReleveCompteur {
  const releve = objet(valeur);

  return {
    numero: texte(releve.numero),
    index: texte(releve.index),
  };
}

function creerZonesParDefaut(
  nombreChambres: number
): ZoneEtatDesLieux[] {
  const noms = [
    "Entrée",
    "Séjour",
    "Cuisine",
  ];

  for (
    let numero = 1;
    numero <= nombreChambres;
    numero += 1
  ) {
    noms.push(`Chambre ${numero}`);
  }

  noms.push(
    "Salle de bain",
    "Toilettes",
    "Extérieur",
    "Compteurs",
    "Clés"
  );

  return noms.map((nom) => ({
    id: creerIdentifiant("zone"),
    nom,
    etat: "non_verifie",
    observations: "",
    photos: [],
  }));
}

function normaliserPhoto(
  valeur: unknown
): PhotoEtatDesLieux | null {
  const photo = objet(valeur);

  const dataUrl =
    texte(photo.dataUrl) ||
    texte(photo.url) ||
    texte(photo.src);

  if (!dataUrl) {
    return null;
  }

  const source =
    photo.source === "camera"
      ? "camera"
      : "galerie";

  return {
    id:
      texte(photo.id) ||
      creerIdentifiant("photo"),
    dataUrl,
    nom:
      texte(photo.nom) ||
      texte(photo.name) ||
      "Photo",
    annotation:
      texte(photo.annotation) ||
      texte(photo.commentaire),
    dateAjout:
      texte(photo.dateAjout) ||
      texte(photo.date) ||
      new Date().toISOString(),
    source,
    tailleOriginale: nombre(
      photo.tailleOriginale
    ),
  };
}

function normaliserZones(
  valeur: unknown,
  nombreChambres: number
): ZoneEtatDesLieux[] {
  if (!Array.isArray(valeur)) {
    return creerZonesParDefaut(
      nombreChambres
    );
  }

  const zones = valeur
    .map((element): ZoneEtatDesLieux | null => {
      const zone = objet(element);

      const nom = texte(zone.nom).trim();

      if (!nom) {
        return null;
      }

      const photos = Array.isArray(zone.photos)
        ? zone.photos
            .map(normaliserPhoto)
            .filter(
              (
                photo
              ): photo is PhotoEtatDesLieux =>
                photo !== null
            )
        : [];

      return {
        id:
          texte(zone.id) ||
          creerIdentifiant("zone"),
        nom,
        etat: normaliserEtatZone(
          zone.etat
        ),
        observations: texte(
          zone.observations
        ),
        photos,
      };
    })
    .filter(
      (
        zone
      ): zone is ZoneEtatDesLieux =>
        zone !== null
    );

  if (zones.length === 0) {
    return creerZonesParDefaut(
      nombreChambres
    );
  }

  return zones;
}

function normaliserEtatDesLieux(
  brut: Record<string, unknown>,
  logement?: Logement,
  voyageur?: Voyageur
): EtatDesLieux {
  const compteurs = objet(brut.compteurs);
  const cles = objet(brut.cles);
  const validation = objet(brut.validation);

  const nombreChambres =
    nombre(brut.nombreChambres) ||
    nombre(logement?.nombreChambres);

  return {
    ...brut,

    id:
      texte(brut.id) ||
      texte(brut.missionId),

    missionId:
      texte(brut.missionId) ||
      texte(brut.id),

    logementId: texte(brut.logementId),

    logementNom:
      texte(brut.logementNom) ||
      logement?.nom ||
      "Logement non renseigné",

    typeLogement:
      texte(brut.typeLogement) ||
      logement?.typeLogement ||
      "",

    superficie:
      nombre(brut.superficie) ||
      nombre(logement?.superficie),

    nombreChambres,

    adresseLogement:
      texte(brut.adresseLogement) ||
      (logement
        ? adresseComplete(logement)
        : ""),

    voyageurId: texte(brut.voyageurId),

    voyageurNom:
      texte(brut.voyageurNom) ||
      (voyageur
        ? nomCompletVoyageur(voyageur)
        : "Voyageur non renseigné"),

    voyageurTelephone:
      texte(brut.voyageurTelephone) ||
      voyageur?.telephone ||
      "",

    voyageurEmail:
      texte(brut.voyageurEmail) ||
      voyageur?.email ||
      "",

    type:
      texte(brut.type) === "sortie"
        ? "sortie"
        : "entree",

    statut: normaliserStatut(
      brut.statut
    ),

    date: texte(brut.date),
    heure: texte(brut.heure),

    notesPreparation: texte(
      brut.notesPreparation
    ),

    etatGeneral: normaliserEtatZone(
      brut.etatGeneral
    ),

    proprete: normaliserEtatZone(
      brut.proprete
    ),

    observationsGenerales: texte(
      brut.observationsGenerales
    ),

    compteurs: {
      electricite: creerReleve(
        compteurs.electricite
      ),
      eauFroide: creerReleve(
        compteurs.eauFroide
      ),
      eauChaude: creerReleve(
        compteurs.eauChaude
      ),
      gaz: creerReleve(compteurs.gaz),
    },

    cles: {
      nombreJeux: nombre(
        cles.nombreJeux
      ),
      nombreBadges: nombre(
        cles.nombreBadges
      ),
      nombreTelecommandes: nombre(
        cles.nombreTelecommandes
      ),
      observations: texte(
        cles.observations
      ),
    },

    zones: normaliserZones(
      brut.zones,
      nombreChambres
    ),

    validation: {
      nomOperateur: texte(
        validation.nomOperateur
      ),
      nomVoyageur:
        texte(validation.nomVoyageur) ||
        texte(brut.voyageurNom) ||
        voyageur?.nomComplet ||
        "",
      accordVoyageur: Boolean(
        validation.accordVoyageur
      ),
      observationsFinales: texte(
        validation.observationsFinales
      ),
    },

    dateDebut: texte(brut.dateDebut),
    dateFin: texte(brut.dateFin),
    dateSignature: texte(
      brut.dateSignature
    ),

    dateCreation:
      texte(brut.dateCreation) ||
      new Date().toISOString(),

    dateModification:
      texte(brut.dateModification) ||
      new Date().toISOString(),
  };
}

function libelleStatut(
  statut: StatutEtatDesLieux
): string {
  if (statut === "en_cours") {
    return "En cours";
  }

  if (statut === "termine") {
    return "Terminé";
  }

  if (statut === "signe") {
    return "Signé";
  }

  return "À préparer";
}

function classeStatut(
  statut: StatutEtatDesLieux
): string {
  if (statut === "en_cours") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (statut === "termine") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (statut === "signe") {
    return "border-violet-200 bg-violet-50 text-violet-800";
  }

  return "border-blue-200 bg-blue-50 text-blue-800";
}

function formaterDate(
  valeur: string
): string {
  if (!valeur) {
    return "Non renseignée";
  }

  const date = new Date(
    `${valeur}T12:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return valeur;
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

function lireFichier(
  fichier: File
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
            "Impossible de lire la photo."
          )
        );
      };

      lecteur.onerror = () => {
        reject(
          new Error(
            "Impossible de lire la photo."
          )
        );
      };

      lecteur.readAsDataURL(fichier);
    }
  );
}

function chargerImage(
  source: string
): Promise<HTMLImageElement> {
  return new Promise(
    (resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);

      image.onerror = () =>
        reject(
          new Error(
            "Format de photo non compatible."
          )
        );

      image.src = source;
    }
  );
}

async function compresserPhoto(
  fichier: File
): Promise<string> {
  const source = await lireFichier(fichier);
  const image = await chargerImage(source);

  const dimensionMaximale = 1280;

  const ratio = Math.min(
    1,
    dimensionMaximale /
      Math.max(
        image.naturalWidth,
        image.naturalHeight
      )
  );

  const largeur = Math.max(
    1,
    Math.round(
      image.naturalWidth * ratio
    )
  );

  const hauteur = Math.max(
    1,
    Math.round(
      image.naturalHeight * ratio
    )
  );

  const canvas =
    document.createElement("canvas");

  canvas.width = largeur;
  canvas.height = hauteur;

  const contexte =
    canvas.getContext("2d");

  if (!contexte) {
    throw new Error(
      "Impossible de préparer la photo."
    );
  }

  contexte.drawImage(
    image,
    0,
    0,
    largeur,
    hauteur
  );

  return canvas.toDataURL(
    "image/jpeg",
    0.68
  );
}

export default function FicheEtatDesLieuxPage() {
  const params =
    useParams<{
      missionId: string;
    }>();

  const missionId = Array.isArray(
    params.missionId
  )
    ? params.missionId[0]
    : params.missionId;

  const [etat, setEtat] =
    useState<EtatDesLieux | null>(null);

  const [etapeActive, setEtapeActive] =
    useState<Etape>("resume");

  const [chargement, setChargement] =
    useState(true);

  const [introuvable, setIntrouvable] =
    useState(false);

  const [
    traitementPhoto,
    setTraitementPhoto,
  ] = useState(false);

  const [
    erreurPhoto,
    setErreurPhoto,
  ] = useState("");

  const [
    erreurSauvegarde,
    setErreurSauvegarde,
  ] = useState("");

  const [
    nouveauNomZone,
    setNouveauNomZone,
  ] = useState("");

  useEffect(() => {
    const logements =
      lire<Partial<Logement>>(
        "logements"
      ).map(
        (logement): Logement => ({
          id: texte(logement.id),
          nom: texte(logement.nom),
          typeLogement: texte(
            logement.typeLogement
          ),
          superficie: nombre(
            logement.superficie
          ),
          nombreChambres: nombre(
            logement.nombreChambres
          ),
          adresse: texte(
            logement.adresse
          ),
          codePostal: texte(
            logement.codePostal
          ),
          ville: texte(logement.ville),
        })
      );

    const voyageurs =
      lire<Partial<Voyageur>>(
        "voyageurs"
      ).map(
        (voyageur): Voyageur => ({
          id: texte(voyageur.id),
          nom: texte(voyageur.nom),
          prenom: texte(
            voyageur.prenom
          ),
          nomComplet:
            nomCompletVoyageur(
              voyageur
            ),
          telephone: texte(
            voyageur.telephone
          ),
          email: texte(
            voyageur.email
          ),
        })
      );

    const liste =
      lire<Record<string, unknown>>(
        "etatsDesLieux"
      );

    const element = liste.find(
      (item) =>
        texte(item.id) === missionId ||
        texte(item.missionId) ===
          missionId
    );

    if (!element) {
      setIntrouvable(true);
      setChargement(false);
      return;
    }

    const logement = logements.find(
      (item) =>
        item.id ===
        texte(element.logementId)
    );

    const voyageur = voyageurs.find(
      (item) =>
        item.id ===
        texte(element.voyageurId)
    );

    setEtat(
      normaliserEtatDesLieux(
        element,
        logement,
        voyageur
      )
    );

    setChargement(false);
  }, [missionId]);

  useEffect(() => {
    if (!etat || chargement) {
      return;
    }

    const minuterie = window.setTimeout(
      () => {
        try {
          const liste =
            lire<
              Record<string, unknown>
            >("etatsDesLieux");

          const versionSauvegardee = {
            ...etat,
            dateModification:
              new Date().toISOString(),
          };

          const existe = liste.some(
            (element) =>
              texte(element.id) ===
                etat.id ||
              texte(
                element.missionId
              ) === etat.missionId
          );

          const nouvelleListe = existe
            ? liste.map((element) => {
                const correspond =
                  texte(element.id) ===
                    etat.id ||
                  texte(
                    element.missionId
                  ) ===
                    etat.missionId;

                return correspond
                  ? versionSauvegardee
                  : element;
              })
            : [
                versionSauvegardee,
                ...liste,
              ];

          window.localStorage.setItem(
            "cap-serein-etats-des-lieux",
            JSON.stringify(nouvelleListe)
          );

          setErreurSauvegarde("");
        } catch {
          setErreurSauvegarde(
            "La sauvegarde locale est pleine. Supprimez quelques photos ou poursuivez après la connexion au stockage en ligne."
          );
        }
      },
      350
    );

    return () =>
      window.clearTimeout(minuterie);
  }, [etat, chargement]);

  const nombrePhotos = useMemo(() => {
    if (!etat) {
      return 0;
    }

    return etat.zones.reduce(
      (total, zone) =>
        total + zone.photos.length,
      0
    );
  }, [etat]);

  const taillePhotos = useMemo(() => {
    if (!etat) {
      return "0 Mo";
    }

    const caracteres =
      etat.zones.reduce(
        (total, zone) =>
          total +
          zone.photos.reduce(
            (sousTotal, photo) =>
              sousTotal +
              photo.dataUrl.length,
            0
          ),
        0
      );

    const octetsEstimes =
      caracteres * 0.75;

    return `${(
      octetsEstimes /
      1024 /
      1024
    ).toFixed(1)} Mo`;
  }, [etat]);

  function modifierEtat(
    modification: Partial<EtatDesLieux>
  ) {
    setEtat((valeur) =>
      valeur
        ? {
            ...valeur,
            ...modification,
          }
        : valeur
    );
  }

  function changerStatut(
    statut: StatutEtatDesLieux
  ) {
    if (!etat) return;

    const maintenant =
      new Date().toISOString();

    const modification:
      Partial<EtatDesLieux> = {
      statut,
    };

    if (
      statut === "en_cours" &&
      !etat.dateDebut
    ) {
      modification.dateDebut =
        maintenant;
    }

    if (
      statut === "termine" &&
      !etat.dateFin
    ) {
      modification.dateFin =
        maintenant;
    }

    if (
      statut === "signe" &&
      !etat.dateSignature
    ) {
      modification.dateSignature =
        maintenant;
    }

    modifierEtat(modification);
  }

  function actionPrincipale() {
    if (!etat) return;

    if (etat.statut === "a_preparer") {
      changerStatut("en_cours");
      setEtapeActive("compteurs");
      return;
    }

    if (etat.statut === "en_cours") {
      changerStatut("termine");
      setEtapeActive("validation");
      return;
    }

    if (etat.statut === "termine") {
      changerStatut("signe");
    }
  }

  function mettreAJourCompteur(
    cle:
      | "electricite"
      | "eauFroide"
      | "eauChaude"
      | "gaz",
    champ: keyof ReleveCompteur,
    valeur: string
  ) {
    if (!etat) return;

    modifierEtat({
      compteurs: {
        ...etat.compteurs,
        [cle]: {
          ...etat.compteurs[cle],
          [champ]: valeur,
        },
      },
    });
  }

  function mettreAJourZone(
    zoneId: string,
    modification: Partial<ZoneEtatDesLieux>
  ) {
    if (!etat) return;

    modifierEtat({
      zones: etat.zones.map((zone) =>
        zone.id === zoneId
          ? {
              ...zone,
              ...modification,
            }
          : zone
      ),
    });
  }

  async function ajouterPhotos(
    zoneId: string,
    fichiers: File[],
    source: "camera" | "galerie"
  ) {
    if (
      !etat ||
      fichiers.length === 0
    ) {
      return;
    }

    setTraitementPhoto(true);
    setErreurPhoto("");

    try {
      const nouvellesPhotos:
        PhotoEtatDesLieux[] = [];

      for (const fichier of fichiers) {
        if (
          !fichier.type.startsWith(
            "image/"
          )
        ) {
          continue;
        }

        const dataUrl =
          await compresserPhoto(
            fichier
          );

        nouvellesPhotos.push({
          id: creerIdentifiant("photo"),
          dataUrl,
          nom:
            fichier.name ||
            "Photo état des lieux",
          annotation: "",
          dateAjout:
            new Date().toISOString(),
          source,
          tailleOriginale:
            fichier.size,
        });
      }

      modifierEtat({
        zones: etat.zones.map((zone) =>
          zone.id === zoneId
            ? {
                ...zone,
                photos: [
                  ...zone.photos,
                  ...nouvellesPhotos,
                ],
              }
            : zone
        ),
      });
    } catch (erreur) {
      setErreurPhoto(
        erreur instanceof Error
          ? erreur.message
          : "Impossible d’ajouter la photo."
      );
    } finally {
      setTraitementPhoto(false);
    }
  }

  function modifierPhoto(
    zoneId: string,
    photoId: string,
    annotation: string
  ) {
    if (!etat) return;

    modifierEtat({
      zones: etat.zones.map((zone) =>
        zone.id === zoneId
          ? {
              ...zone,
              photos: zone.photos.map(
                (photo) =>
                  photo.id === photoId
                    ? {
                        ...photo,
                        annotation,
                      }
                    : photo
              ),
            }
          : zone
      ),
    });
  }

  function supprimerPhoto(
    zoneId: string,
    photoId: string
  ) {
    if (!etat) return;

    const confirmation =
      window.confirm(
        "Supprimer définitivement cette photo ?"
      );

    if (!confirmation) return;

    modifierEtat({
      zones: etat.zones.map((zone) =>
        zone.id === zoneId
          ? {
              ...zone,
              photos: zone.photos.filter(
                (photo) =>
                  photo.id !== photoId
              ),
            }
          : zone
      ),
    });
  }

  function ajouterZone() {
    if (!etat) return;

    const nom =
      nouveauNomZone.trim();

    if (!nom) return;

    modifierEtat({
      zones: [
        ...etat.zones,
        {
          id: creerIdentifiant("zone"),
          nom,
          etat: "non_verifie",
          observations: "",
          photos: [],
        },
      ],
    });

    setNouveauNomZone("");
  }

  function supprimerZone(
    zone: ZoneEtatDesLieux
  ) {
    if (!etat) return;

    const confirmation =
      window.confirm(
        `Supprimer la zone « ${zone.nom} » et ses ${zone.photos.length} photo(s) ?`
      );

    if (!confirmation) return;

    modifierEtat({
      zones: etat.zones.filter(
        (element) =>
          element.id !== zone.id
      ),
    });
  }

  function allerEtapeSuivante() {
    const index = etapes.findIndex(
      (etape) =>
        etape.id === etapeActive
    );

    const suivante =
      etapes[index + 1];

    if (suivante) {
      setEtapeActive(suivante.id);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  function allerEtapePrecedente() {
    const index = etapes.findIndex(
      (etape) =>
        etape.id === etapeActive
    );

    const precedente =
      etapes[index - 1];

    if (precedente) {
      setEtapeActive(precedente.id);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  if (chargement) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 font-bold text-slate-500">
            Chargement de l’état des
            lieux...
          </p>
        </div>
      </div>
    );
  }

  if (introuvable || !etat) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
        <div className="text-5xl">
          ⚠️
        </div>

        <h1 className="mt-5 text-2xl font-black text-red-950">
          État des lieux introuvable
        </h1>

        <p className="mt-3 text-red-800">
          Cette intervention n’existe plus
          ou son identifiant est incorrect.
        </p>

        <Link
          href="/etats-des-lieux"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 font-black text-white"
        >
          Retour aux états des lieux
        </Link>
      </div>
    );
  }

  const texteAction =
    etat.statut === "a_preparer"
      ? "▶ Démarrer l’état des lieux"
      : etat.statut === "en_cours"
        ? "✓ Terminer l’état des lieux"
        : etat.statut === "termine"
          ? "✍ Marquer comme signé"
          : "État des lieux signé";

  return (
    <div className="space-y-5 sm:space-y-7">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <Link
            href="/etats-des-lieux"
            className="inline-flex min-h-10 items-center text-sm font-black text-blue-700"
          >
            ← Retour aux états des lieux
          </Link>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${classeStatut(
                etat.statut
              )}`}
            >
              {libelleStatut(
                etat.statut
              )}
            </span>

            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
              {etat.type === "entree"
                ? "Entrée"
                : "Sortie"}
            </span>

            {etat.typeLogement && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {etat.typeLogement}
              </span>
            )}

            {etat.superficie > 0 && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                {etat.superficie} m²
              </span>
            )}
          </div>

          <h1 className="mt-4 break-words text-2xl font-black text-slate-950 sm:text-3xl">
            {etat.logementNom}
          </h1>

          <p className="mt-2 break-words text-sm leading-6 text-slate-500">
            {etat.adresseLogement ||
              "Adresse non renseignée"}
          </p>
        </div>

        <button
          type="button"
          onClick={actionPrincipale}
          disabled={
            etat.statut === "signe"
          }
          className="min-h-14 w-full rounded-2xl bg-blue-600 px-6 py-3 font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-violet-600 xl:w-auto"
        >
          {texteAction}
        </button>
      </div>

      {erreurSauvegarde && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold leading-6 text-red-700">
          {erreurSauvegarde}
        </div>
      )}

      <div className="sticky top-16 z-20 -mx-3 overflow-x-auto border-y border-slate-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur sm:mx-0 sm:rounded-3xl sm:border">
        <div className="flex min-w-max gap-2">
          {etapes.map((etape) => {
            const active =
              etape.id === etapeActive;

            return (
              <button
                key={etape.id}
                type="button"
                onClick={() =>
                  setEtapeActive(etape.id)
                }
                className={`flex min-h-12 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                  active
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{etape.icone}</span>
                <span>{etape.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {etapeActive === "resume" && (
        <div className="space-y-5">
          <Bloc
            titre="Informations de l’intervention"
            description="Le logement et le voyageur sont liés à cet état des lieux."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Information
                label="Voyageur"
                valeur={etat.voyageurNom}
              />

              <Information
                label="Téléphone"
                valeur={
                  etat.voyageurTelephone ||
                  "Non renseigné"
                }
              />

              <Information
                label="E-mail"
                valeur={
                  etat.voyageurEmail ||
                  "Non renseigné"
                }
              />

              <Information
                label="Date prévue"
                valeur={formaterDate(
                  etat.date
                )}
              />

              <Information
                label="Heure prévue"
                valeur={
                  etat.heure ||
                  "Non renseignée"
                }
              />

              <Information
                label="Chambres"
                valeur={`${etat.nombreChambres} chambre(s)`}
              />
            </div>
          </Bloc>

          <Bloc
            titre="Préparation"
            description="Ajoutez les informations importantes avant l’intervention."
          >
            <label>
              <span className="mb-2 block text-sm font-black text-slate-700">
                Notes de préparation
              </span>

              <textarea
                rows={5}
                value={
                  etat.notesPreparation
                }
                onChange={(event) =>
                  modifierEtat({
                    notesPreparation:
                      event.target.value,
                  })
                }
                placeholder="Consignes du propriétaire, éléments à contrôler, accès au logement..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </Bloc>

          <Bloc
            titre="Évaluation générale"
            description="Ces informations figureront dans le compte rendu."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <SelectionEtat
                label="État général"
                value={etat.etatGeneral}
                onChange={(valeur) =>
                  modifierEtat({
                    etatGeneral: valeur,
                  })
                }
              />

              <SelectionEtat
                label="Propreté générale"
                value={etat.proprete}
                onChange={(valeur) =>
                  modifierEtat({
                    proprete: valeur,
                  })
                }
              />
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-black text-slate-700">
                Observations générales
              </span>

              <textarea
                rows={5}
                value={
                  etat.observationsGenerales
                }
                onChange={(event) =>
                  modifierEtat({
                    observationsGenerales:
                      event.target.value,
                  })
                }
                placeholder="État global du logement, propreté, odeurs, dommages généraux..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </Bloc>
        </div>
      )}

      {etapeActive === "compteurs" && (
        <div className="space-y-5">
          <Bloc
            titre="Relevés des compteurs"
            description="Photographiez ensuite les compteurs depuis l’onglet Pièces & photos."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Compteur
                titre="Électricité"
                icone="⚡"
                releve={
                  etat.compteurs
                    .electricite
                }
                onChange={(champ, valeur) =>
                  mettreAJourCompteur(
                    "electricite",
                    champ,
                    valeur
                  )
                }
              />

              <Compteur
                titre="Eau froide"
                icone="💧"
                releve={
                  etat.compteurs
                    .eauFroide
                }
                onChange={(champ, valeur) =>
                  mettreAJourCompteur(
                    "eauFroide",
                    champ,
                    valeur
                  )
                }
              />

              <Compteur
                titre="Eau chaude"
                icone="♨️"
                releve={
                  etat.compteurs
                    .eauChaude
                }
                onChange={(champ, valeur) =>
                  mettreAJourCompteur(
                    "eauChaude",
                    champ,
                    valeur
                  )
                }
              />

              <Compteur
                titre="Gaz"
                icone="🔥"
                releve={
                  etat.compteurs.gaz
                }
                onChange={(champ, valeur) =>
                  mettreAJourCompteur(
                    "gaz",
                    champ,
                    valeur
                  )
                }
              />
            </div>
          </Bloc>

          <Bloc
            titre="Clés et accès"
            description="Indiquez ce qui est remis ou récupéré."
          >
            <div className="grid gap-5 sm:grid-cols-3">
              <ChampNombre
                label="Jeux de clés"
                value={
                  etat.cles.nombreJeux
                }
                onChange={(valeur) =>
                  modifierEtat({
                    cles: {
                      ...etat.cles,
                      nombreJeux: valeur,
                    },
                  })
                }
              />

              <ChampNombre
                label="Badges"
                value={
                  etat.cles.nombreBadges
                }
                onChange={(valeur) =>
                  modifierEtat({
                    cles: {
                      ...etat.cles,
                      nombreBadges:
                        valeur,
                    },
                  })
                }
              />

              <ChampNombre
                label="Télécommandes"
                value={
                  etat.cles
                    .nombreTelecommandes
                }
                onChange={(valeur) =>
                  modifierEtat({
                    cles: {
                      ...etat.cles,
                      nombreTelecommandes:
                        valeur,
                    },
                  })
                }
              />
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-black text-slate-700">
                Observations sur les clés
              </span>

              <textarea
                rows={4}
                value={
                  etat.cles.observations
                }
                onChange={(event) =>
                  modifierEtat({
                    cles: {
                      ...etat.cles,
                      observations:
                        event.target.value,
                    },
                  })
                }
                placeholder="Clé de portail, badge de parking, télécommande de garage..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </Bloc>
        </div>
      )}

      {etapeActive === "photos" && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-blue-950">
                  Photos de l’état des
                  lieux
                </h2>

                <p className="mt-2 text-sm leading-6 text-blue-800">
                  {nombrePhotos} photo(s)
                  enregistrée(s) · environ{" "}
                  {taillePhotos}
                </p>
              </div>

              {traitementPhoto && (
                <div className="flex items-center gap-3 font-bold text-blue-800">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
                  Préparation...
                </div>
              )}
            </div>

            <p className="mt-4 text-xs leading-5 text-blue-700">
              Les photos sont compressées
              automatiquement. Pour le moment,
              elles restent enregistrées dans
              ce navigateur. Le stockage en
              ligne sera ajouté à l’étape
              suivante.
            </p>
          </div>

          {erreurPhoto && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              {erreurPhoto}
            </div>
          )}

          {etat.zones.map((zone) => (
            <Bloc
              key={zone.id}
              titre={zone.nom}
              description={`${zone.photos.length} photo(s)`}
              action={
                <button
                  type="button"
                  onClick={() =>
                    supprimerZone(zone)
                  }
                  className="min-h-10 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700"
                >
                  Supprimer
                </button>
              }
            >
              <div className="grid gap-5 md:grid-cols-2">
                <SelectionEtat
                  label={`État de la zone`}
                  value={zone.etat}
                  onChange={(valeur) =>
                    mettreAJourZone(
                      zone.id,
                      {
                        etat: valeur,
                      }
                    )
                  }
                />

                <label>
                  <span className="mb-2 block text-sm font-black text-slate-700">
                    Observations
                  </span>

                  <input
                    type="text"
                    value={
                      zone.observations
                    }
                    onChange={(event) =>
                      mettreAJourZone(
                        zone.id,
                        {
                          observations:
                            event.target
                              .value,
                        }
                      )
                    }
                    placeholder="État, défauts, propreté..."
                    className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>

              <CapturePhotos
                zoneId={zone.id}
                disabled={traitementPhoto}
                onCamera={(fichiers) =>
                  ajouterPhotos(
                    zone.id,
                    fichiers,
                    "camera"
                  )
                }
                onGalerie={(fichiers) =>
                  ajouterPhotos(
                    zone.id,
                    fichiers,
                    "galerie"
                  )
                }
              />

              {zone.photos.length > 0 && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {zone.photos.map(
                    (photo) => (
                      <article
                        key={photo.id}
                        className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"
                      >
                        <div className="aspect-[4/3] bg-slate-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              photo.dataUrl
                            }
                            alt={
                              photo.annotation ||
                              photo.nom
                            }
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                              {photo.source ===
                              "camera"
                                ? "📷 Caméra"
                                : "🖼️ Galerie"}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                supprimerPhoto(
                                  zone.id,
                                  photo.id
                                )
                              }
                              className="min-h-10 rounded-xl bg-red-50 px-3 text-xs font-black text-red-700"
                            >
                              Supprimer
                            </button>
                          </div>

                          <label>
                            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                              Annotation
                            </span>

                            <textarea
                              rows={3}
                              value={
                                photo.annotation
                              }
                              onChange={(
                                event
                              ) =>
                                modifierPhoto(
                                  zone.id,
                                  photo.id,
                                  event.target
                                    .value
                                )
                              }
                              placeholder="Exemple : impact sur le mur à gauche de la fenêtre..."
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                            />
                          </label>
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
            </Bloc>
          ))}

          <Bloc
            titre="Ajouter une zone"
            description="Ajoutez une pièce ou un équipement qui n’apparaît pas dans la liste."
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={nouveauNomZone}
                onChange={(event) =>
                  setNouveauNomZone(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter"
                  ) {
                    event.preventDefault();
                    ajouterZone();
                  }
                }}
                placeholder="Exemple : Balcon, Garage, Buanderie..."
                className="min-h-12 min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={ajouterZone}
                className="min-h-12 rounded-2xl bg-slate-900 px-6 py-3 font-black text-white"
              >
                + Ajouter la zone
              </button>
            </div>
          </Bloc>
        </div>
      )}

      {etapeActive === "validation" && (
        <div className="space-y-5">
          <Bloc
            titre="Récapitulatif"
            description="Vérifiez les informations avant de terminer ou signer."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <CarteRecap
                label="Statut"
                valeur={libelleStatut(
                  etat.statut
                )}
              />

              <CarteRecap
                label="Photos"
                valeur={`${nombrePhotos}`}
              />

              <CarteRecap
                label="Zones"
                valeur={`${etat.zones.length}`}
              />

              <CarteRecap
                label="Voyageur"
                valeur={
                  etat.voyageurNom
                }
              />
            </div>
          </Bloc>

          <Bloc
            titre="Validation de l’intervention"
            description="Les signatures manuscrites et l’export PDF seront ajoutés après le stockage en ligne."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <ChampTexte
                label="Nom de l’opérateur"
                value={
                  etat.validation
                    .nomOperateur
                }
                placeholder="Nom de la personne réalisant l’état des lieux"
                onChange={(valeur) =>
                  modifierEtat({
                    validation: {
                      ...etat.validation,
                      nomOperateur:
                        valeur,
                    },
                  })
                }
              />

              <ChampTexte
                label="Nom du voyageur"
                value={
                  etat.validation
                    .nomVoyageur
                }
                placeholder="Nom du voyageur"
                onChange={(valeur) =>
                  modifierEtat({
                    validation: {
                      ...etat.validation,
                      nomVoyageur:
                        valeur,
                    },
                  })
                }
              />
            </div>

            <label className="mt-5 flex min-h-14 cursor-pointer items-start gap-4 rounded-2xl border border-slate-300 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={
                  etat.validation
                    .accordVoyageur
                }
                onChange={(event) =>
                  modifierEtat({
                    validation: {
                      ...etat.validation,
                      accordVoyageur:
                        event.target
                          .checked,
                    },
                  })
                }
                className="mt-1 h-5 w-5 shrink-0 accent-blue-600"
              />

              <span className="text-sm font-bold leading-6 text-slate-700">
                Le voyageur confirme avoir
                pris connaissance des
                informations et observations
                saisies.
              </span>
            </label>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-black text-slate-700">
                Observations finales
              </span>

              <textarea
                rows={5}
                value={
                  etat.validation
                    .observationsFinales
                }
                onChange={(event) =>
                  modifierEtat({
                    validation: {
                      ...etat.validation,
                      observationsFinales:
                        event.target.value,
                    },
                  })
                }
                placeholder="Réserves, désaccords, éléments à transmettre au propriétaire..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {etat.statut ===
                "a_preparer" && (
                <button
                  type="button"
                  onClick={() =>
                    changerStatut(
                      "en_cours"
                    )
                  }
                  className="min-h-14 rounded-2xl bg-amber-500 px-6 py-3 font-black text-white shadow-lg"
                >
                  ▶ Démarrer
                </button>
              )}

              {etat.statut ===
                "en_cours" && (
                <button
                  type="button"
                  onClick={() =>
                    changerStatut(
                      "termine"
                    )
                  }
                  className="min-h-14 rounded-2xl bg-emerald-600 px-6 py-3 font-black text-white shadow-lg"
                >
                  ✓ Terminer
                </button>
              )}

              {etat.statut ===
                "termine" && (
                <button
                  type="button"
                  onClick={() =>
                    changerStatut(
                      "signe"
                    )
                  }
                  disabled={
                    !etat.validation
                      .accordVoyageur
                  }
                  className="min-h-14 rounded-2xl bg-violet-600 px-6 py-3 font-black text-white shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  ✍ Marquer comme signé
                </button>
              )}

              {etat.statut === "signe" && (
                <div className="flex min-h-14 items-center justify-center rounded-2xl bg-violet-50 px-6 py-3 text-center font-black text-violet-800">
                  ✓ État des lieux signé
                </div>
              )}

              <Link
                href="/etats-des-lieux"
                className="flex min-h-14 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-center font-black text-slate-700"
              >
                Retour à la liste
              </Link>
            </div>
          </Bloc>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={allerEtapePrecedente}
          disabled={
            etapeActive ===
            etapes[0].id
          }
          className="min-h-12 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Étape précédente
        </button>

        <p className="text-center text-xs font-bold text-slate-500">
          Sauvegarde automatique
        </p>

        <button
          type="button"
          onClick={allerEtapeSuivante}
          disabled={
            etapeActive ===
            etapes[
              etapes.length - 1
            ].id
          }
          className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Étape suivante →
        </button>
      </div>
    </div>
  );
}

function Bloc({
  titre,
  description,
  children,
  action,
}: {
  titre: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-950">
            {titre}
          </h2>

          {description && (
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

function Information({
  label,
  valeur,
}: {
  label: string;
  valeur: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words font-bold text-slate-900">
        {valeur}
      </p>
    </div>
  );
}

function SelectionEtat({
  label,
  value,
  onChange,
}: {
  label: string;
  value: EtatZone;
  onChange: (valeur: EtatZone) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target
              .value as EtatZone
          )
        }
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      >
        {etatsDisponibles.map(
          (etat) => (
            <option
              key={etat.valeur}
              value={etat.valeur}
            >
              {etat.label}
            </option>
          )
        )}
      </select>
    </label>
  );
}

function Compteur({
  titre,
  icone,
  releve,
  onChange,
}: {
  titre: string;
  icone: string;
  releve: ReleveCompteur;
  onChange: (
    champ: keyof ReleveCompteur,
    valeur: string
  ) => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="flex items-center gap-3 text-lg font-black text-slate-950">
        <span>{icone}</span>
        <span>{titre}</span>
      </h3>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ChampTexte
          label="Numéro du compteur"
          value={releve.numero}
          placeholder="Numéro ou référence"
          onChange={(valeur) =>
            onChange(
              "numero",
              valeur
            )
          }
        />

        <ChampTexte
          label="Index relevé"
          value={releve.index}
          placeholder="Valeur affichée"
          onChange={(valeur) =>
            onChange("index", valeur)
          }
        />
      </div>
    </div>
  );
}

function ChampTexte({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (valeur: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </span>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function ChampNombre({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (valeur: number) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </span>

      <input
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        value={value}
        onChange={(event) =>
          onChange(
            Math.max(
              0,
              Math.round(
                Number(
                  event.target.value ||
                    0
                )
              )
            )
          )
        }
        className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function CapturePhotos({
  zoneId,
  disabled,
  onCamera,
  onGalerie,
}: {
  zoneId: string;
  disabled: boolean;
  onCamera: (
    fichiers: File[]
  ) => Promise<void>;
  onGalerie: (
    fichiers: File[]
  ) => Promise<void>;
}) {
  const cameraId = `camera-${zoneId}`;
  const galerieId = `galerie-${zoneId}`;

  async function traiterFichiers(
    event: ChangeEvent<HTMLInputElement>,
    origine: "camera" | "galerie"
  ) {
    const fichiers = Array.from(
      event.target.files || []
    );

    event.target.value = "";

    if (origine === "camera") {
      await onCamera(fichiers);
      return;
    }

    await onGalerie(fichiers);
  }

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <input
        id={cameraId}
        type="file"
        accept="image/*"
        capture="environment"
        disabled={disabled}
        onChange={(event) =>
          traiterFichiers(
            event,
            "camera"
          )
        }
        className="sr-only"
      />

      <label
        htmlFor={cameraId}
        className={`flex min-h-14 cursor-pointer items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-center font-black text-white shadow-md ${
          disabled
            ? "pointer-events-none opacity-50"
            : ""
        }`}
      >
        📷 Prendre une photo
      </label>

      <input
        id={galerieId}
        type="file"
        accept="image/*"
        multiple
        disabled={disabled}
        onChange={(event) =>
          traiterFichiers(
            event,
            "galerie"
          )
        }
        className="sr-only"
      />

      <label
        htmlFor={galerieId}
        className={`flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-center font-black text-slate-700 ${
          disabled
            ? "pointer-events-none opacity-50"
            : ""
        }`}
      >
        🖼️ Choisir dans la galerie
      </label>
    </div>
  );
}

function CarteRecap({
  label,
  valeur,
}: {
  label: string;
  valeur: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-lg font-black text-slate-950">
        {valeur}
      </p>
    </div>
  );
}