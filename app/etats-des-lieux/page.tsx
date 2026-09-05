"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import { enregistrer, lire } from "@/lib/database";
import { supabase } from "@/lib/supabase";

type TypeEtatDesLieux = "entree" | "sortie";

type StatutEtatDesLieux =
  | "a_preparer"
  | "en_cours"
  | "termine"
  | "signe";

type Logement = {
  id: string;
  nom: string;
  typeLogement: string;
  superficie: number;
  nombreChambres: number;
  adresse: string;
  codePostal: string;
  ville: string;
  proprietaireId: string;
};

type Voyageur = {
  id: string;
  nom: string;
  prenom: string;
  nomComplet: string;
  telephone: string;
  email: string;
};

type EtatDesLieux = {
  id: string;
  missionId?: string;

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

  type: TypeEtatDesLieux;
  statut: StatutEtatDesLieux;

  date: string;
  heure: string;

  notesPreparation: string;

  dateCreation: string;
  dateModification: string;

  [cle: string]: unknown;
};

type FormulaireEtatDesLieux = {
  logementId: string;
  voyageurId: string;
  type: TypeEtatDesLieux;
  statut: StatutEtatDesLieux;
  date: string;
  heure: string;
  notesPreparation: string;
};

type LigneEtatDesLieux = {
  id: string;
  mission_id: string | null;
  logement_id: string;
  voyageur_id: string | null;
  type_edl: string;
  statut: string;
  date_prevue: string | null;
  notes_preparation: string | null;
  logement_snapshot: unknown;
  voyageur_snapshot: unknown;
  created_at: string;
  updated_at: string;
};

const statuts: { valeur: StatutEtatDesLieux; label: string }[] = [
  { valeur: "a_preparer", label: "À préparer" },
  { valeur: "en_cours", label: "En cours" },
  { valeur: "termine", label: "Terminé" },
  { valeur: "signe", label: "Signé" },
];

function creerIdentifiant(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `edl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function estUuid(valeur: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    valeur
  );
}

function dateAujourdhui(): string {
  const maintenant = new Date();
  const annee = maintenant.getFullYear();
  const mois = String(maintenant.getMonth() + 1).padStart(2, "0");
  const jour = String(maintenant.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}

function creerFormulaireVide(): FormulaireEtatDesLieux {
  return {
    logementId: "",
    voyageurId: "",
    type: "entree",
    statut: "a_preparer",
    date: dateAujourdhui(),
    heure: "10:00",
    notesPreparation: "",
  };
}

function texte(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return "";
  return String(valeur);
}

function nombre(valeur: unknown): number {
  const resultat = Number(valeur || 0);
  return Number.isFinite(resultat) ? Math.max(0, resultat) : 0;
}

function objet(valeur: unknown): Record<string, unknown> {
  if (valeur && typeof valeur === "object" && !Array.isArray(valeur)) {
    return valeur as Record<string, unknown>;
  }
  return {};
}

function normaliserTexte(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normaliserStatut(valeur: unknown): StatutEtatDesLieux {
  const statut = texte(valeur)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");

  if (statut === "en_cours") return "en_cours";
  if (statut === "termine" || statut === "terminee") return "termine";
  if (statut === "signe" || statut === "signee") return "signe";
  return "a_preparer";
}

function normaliserType(valeur: unknown): TypeEtatDesLieux {
  const type = texte(valeur).toLowerCase();
  if (type.includes("sortie") || type === "out") return "sortie";
  return "entree";
}

function nomCompletVoyageur(voyageur: Partial<Voyageur>): string {
  const prenom = texte(voyageur.prenom).trim();
  const nom = texte(voyageur.nom).trim();
  const resultat = [prenom, nom].filter(Boolean).join(" ");
  return resultat || texte(voyageur.nomComplet).trim() || "Voyageur sans nom";
}

function adresseComplete(logement: Partial<Logement>): string {
  const adresse = texte(logement.adresse).trim();
  const ville = [texte(logement.codePostal).trim(), texte(logement.ville).trim()]
    .filter(Boolean)
    .join(" ");
  return [adresse, ville].filter(Boolean).join(", ");
}

function libelleStatut(statut: StatutEtatDesLieux): string {
  return statuts.find((element) => element.valeur === statut)?.label || "À préparer";
}

function classeStatut(statut: StatutEtatDesLieux): string {
  if (statut === "en_cours") return "border-amber-200 bg-amber-50 text-amber-800";
  if (statut === "termine") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (statut === "signe") return "border-violet-200 bg-violet-50 text-violet-800";
  return "border-blue-200 bg-blue-50 text-blue-800";
}

function formaterDate(date: string): string {
  if (!date) return "Date non définie";
  const valeur = new Date(`${date}T12:00:00`);
  if (Number.isNaN(valeur.getTime())) return date;

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(valeur);
}

function dateEtHeureDepuisIso(valeur: string | null): { date: string; heure: string } {
  if (!valeur) return { date: "", heure: "" };

  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) {
    return { date: valeur.slice(0, 10), heure: "" };
  }

  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  const heures = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return {
    date: `${annee}-${mois}-${jour}`,
    heure: `${heures}:${minutes}`,
  };
}

function convertirEtatSupabase(
  ligne: LigneEtatDesLieux,
  logements: Logement[],
  voyageurs: Voyageur[]
): EtatDesLieux {
  const logement = logements.find((element) => element.id === ligne.logement_id);
  const voyageur = voyageurs.find((element) => element.id === ligne.voyageur_id);
  const logementSnapshot = objet(ligne.logement_snapshot);
  const voyageurSnapshot = objet(ligne.voyageur_snapshot);
  const datePrevue = dateEtHeureDepuisIso(ligne.date_prevue);

  const logementNom =
    texte(logementSnapshot.nom) || logement?.nom || "Logement non renseigné";

  const typeLogement =
    texte(logementSnapshot.typeLogement) ||
    texte(logementSnapshot.type_logement) ||
    logement?.typeLogement ||
    "";

  const superficie =
    nombre(logementSnapshot.superficie) || logement?.superficie || 0;

  const nombreChambres =
    nombre(logementSnapshot.nombreChambres) ||
    nombre(logementSnapshot.nombre_chambres) ||
    logement?.nombreChambres ||
    0;

  const adresseLogement =
    texte(logementSnapshot.adresseComplete) ||
    texte(logementSnapshot.adresse_complete) ||
    (logement ? adresseComplete(logement) : "");

  const voyageurNom =
    texte(voyageurSnapshot.nomComplet) ||
    texte(voyageurSnapshot.nom_complet) ||
    (voyageur ? nomCompletVoyageur(voyageur) : "Voyageur non renseigné");

  const voyageurTelephone =
    texte(voyageurSnapshot.telephone) || voyageur?.telephone || "";

  const voyageurEmail = texte(voyageurSnapshot.email) || voyageur?.email || "";

  return {
    id: ligne.id,
    missionId: ligne.mission_id || ligne.id,
    logementId: ligne.logement_id,
    logementNom,
    typeLogement,
    superficie,
    nombreChambres,
    adresseLogement,
    voyageurId: ligne.voyageur_id || "",
    voyageurNom,
    voyageurTelephone,
    voyageurEmail,
    type: normaliserType(ligne.type_edl),
    statut: normaliserStatut(ligne.statut),
    date: datePrevue.date,
    heure: datePrevue.heure,
    notesPreparation: ligne.notes_preparation || "",
    dateCreation: ligne.created_at,
    dateModification: ligne.updated_at,
  };
}

export default function EtatsDesLieuxPage() {
  const [organizationId, setOrganizationId] = useState("");
  const [logements, setLogements] = useState<Logement[]>([]);
  const [voyageurs, setVoyageurs] = useState<Voyageur[]>([]);
  const [etatsDesLieux, setEtatsDesLieux] = useState<EtatDesLieux[]>([]);
  const [formulaire, setFormulaire] = useState<FormulaireEtatDesLieux>(
    creerFormulaireVide()
  );
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [donneesChargees, setDonneesChargees] = useState(false);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState("");
  const [statutEnCours, setStatutEnCours] = useState("");
  const [erreur, setErreur] = useState("");
  const [erreurPage, setErreurPage] = useState("");
  const [message, setMessage] = useState("");
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<"tous" | StatutEtatDesLieux>(
    "tous"
  );

  useEffect(() => {
    let actif = true;

    async function initialiser() {
      setDonneesChargees(false);
      setErreurPage("");

      try {
        const {
          data: { user },
          error: erreurUtilisateur,
        } = await supabase.auth.getUser();

        if (erreurUtilisateur || !user) {
          throw new Error("Votre session Supabase n’est pas disponible.");
        }

        const { data: adhesion, error: erreurAdhesion } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (erreurAdhesion) throw erreurAdhesion;

        if (!adhesion?.organization_id) {
          throw new Error("Aucune organisation Cap Serein n’est associée à votre compte.");
        }

        if (!actif) return;

        const orgId = String(adhesion.organization_id);
        setOrganizationId(orgId);

        const [logementsDistants, voyageursDistants] = await Promise.all([
          chargerLogements(orgId),
          chargerVoyageurs(orgId),
        ]);

        if (!actif) return;

        setLogements(logementsDistants);
        setVoyageurs(voyageursDistants);

        const migration = await chargerEtatsDesLieux(
          orgId,
          logementsDistants,
          voyageursDistants,
          true
        );

        if (actif && migration) {
          setMessage(
            "Vos anciens états des lieux présents sur cet ordinateur ont été importés dans Supabase."
          );
        }
      } catch (error) {
        console.error(error);
        if (actif) {
          setErreurPage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les états des lieux."
          );
        }
      } finally {
        if (actif) setDonneesChargees(true);
      }
    }

    void initialiser();

    return () => {
      actif = false;
    };
  }, []);

  useEffect(() => {
    if (!donneesChargees) return;

    const anciens = lire<Record<string, unknown>>("etatsDesLieux");

    const fusion = etatsDesLieux.map((etat) => {
      const ancien = anciens.find(
        (element) =>
          texte(element.id) === etat.id ||
          texte(element.missionId) === etat.id ||
          texte(element.id) === etat.missionId ||
          texte(element.missionId) === etat.missionId
      );

      if (!ancien) return etat;

      return {
        ...ancien,
        ...etat,
        missionId: texte(ancien.missionId) || etat.missionId || etat.id,
      };
    });

    enregistrer("etatsDesLieux", fusion);
  }, [etatsDesLieux, donneesChargees]);

  async function chargerLogements(orgId: string): Promise<Logement[]> {
    const { data, error } = await supabase
      .from("logements")
      .select(
        `
          id,
          nom,
          type_logement,
          superficie_m2,
          nombre_chambres,
          adresse,
          code_postal,
          ville,
          proprietaire_id
        `
      )
      .eq("organization_id", orgId)
      .eq("actif", true)
      .order("nom", { ascending: true });

    if (error) throw error;

    return (data || []).map(
      (ligne): Logement => ({
        id: String(ligne.id),
        nom: String(ligne.nom || ""),
        typeLogement: String(ligne.type_logement || ""),
        superficie: nombre(ligne.superficie_m2),
        nombreChambres: nombre(ligne.nombre_chambres),
        adresse: String(ligne.adresse || ""),
        codePostal: String(ligne.code_postal || ""),
        ville: String(ligne.ville || ""),
        proprietaireId: String(ligne.proprietaire_id || ""),
      })
    );
  }

  async function chargerVoyageurs(orgId: string): Promise<Voyageur[]> {
    const { data, error } = await supabase
      .from("voyageurs")
      .select("id, nom, prenom, telephone, email")
      .eq("organization_id", orgId)
      .order("nom", { ascending: true });

    if (error) throw error;

    return (data || []).map((ligne): Voyageur => {
      const voyageur = {
        id: String(ligne.id),
        nom: String(ligne.nom || ""),
        prenom: String(ligne.prenom || ""),
        nomComplet: "",
        telephone: String(ligne.telephone || ""),
        email: String(ligne.email || ""),
      };

      return { ...voyageur, nomComplet: nomCompletVoyageur(voyageur) };
    });
  }

  async function chargerEtatsDesLieux(
    orgId: string,
    logementsDistants: Logement[],
    voyageursDistants: Voyageur[],
    autoriserMigration: boolean
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from("etats_des_lieux")
      .select(
        `
          id,
          mission_id,
          logement_id,
          voyageur_id,
          type_edl,
          statut,
          date_prevue,
          notes_preparation,
          logement_snapshot,
          voyageur_snapshot,
          created_at,
          updated_at
        `
      )
      .eq("organization_id", orgId)
      .order("date_prevue", { ascending: false });

    if (error) throw error;

    const lignes = (data || []) as LigneEtatDesLieux[];

    if (autoriserMigration && lignes.length === 0) {
      const locaux = lire<Record<string, unknown>>("etatsDesLieux");

      if (locaux.length > 0) {
        await importerEtatsLocaux(
          orgId,
          locaux,
          logementsDistants,
          voyageursDistants
        );

        await chargerEtatsDesLieux(
          orgId,
          logementsDistants,
          voyageursDistants,
          false
        );

        return true;
      }
    }

    setEtatsDesLieux(
      lignes.map((ligne) =>
        convertirEtatSupabase(ligne, logementsDistants, voyageursDistants)
      )
    );

    return false;
  }

  function trouverLogement(
    brut: Record<string, unknown>,
    logementsDistants: Logement[]
  ): Logement | null {
    const id = texte(brut.logementId);
    const direct = logementsDistants.find((element) => element.id === id);
    if (direct) return direct;

    const nom = normaliserTexte(texte(brut.logementNom || brut.nomLogement));
    if (!nom) return null;

    const correspondances = logementsDistants.filter(
      (element) => normaliserTexte(element.nom) === nom
    );

    return correspondances.length === 1 ? correspondances[0] : null;
  }

  function trouverVoyageur(
    brut: Record<string, unknown>,
    voyageursDistants: Voyageur[]
  ): Voyageur | null {
    const id = texte(brut.voyageurId);
    const direct = voyageursDistants.find((element) => element.id === id);
    if (direct) return direct;

    const email = normaliserTexte(texte(brut.voyageurEmail));
    if (email) {
      const parEmail = voyageursDistants.find(
        (element) => normaliserTexte(element.email) === email
      );
      if (parEmail) return parEmail;
    }

    const nom = normaliserTexte(texte(brut.voyageurNom || brut.nomVoyageur));
    if (!nom) return null;

    const correspondances = voyageursDistants.filter(
      (element) => normaliserTexte(nomCompletVoyageur(element)) === nom
    );

    return correspondances.length === 1 ? correspondances[0] : null;
  }

  async function importerEtatsLocaux(
    orgId: string,
    locaux: Record<string, unknown>[],
    logementsDistants: Logement[],
    voyageursDistants: Voyageur[]
  ) {
    for (const brut of locaux) {
      const logement = trouverLogement(brut, logementsDistants);
      if (!logement) continue;

      const voyageur = trouverVoyageur(brut, voyageursDistants);
      const date =
        texte(brut.date || brut.datePrevue || brut.dateIntervention) ||
        dateAujourdhui();
      const heure = texte(brut.heure || brut.heurePrevue) || "10:00";

      let datePrevue: string | null = null;
      try {
        datePrevue = new Date(`${date}T${heure}:00`).toISOString();
      } catch {
        datePrevue = null;
      }

      const logementSnapshot = {
        id: logement.id,
        nom: logement.nom,
        typeLogement: logement.typeLogement,
        superficie: logement.superficie,
        nombreChambres: logement.nombreChambres,
        adresse: logement.adresse,
        codePostal: logement.codePostal,
        ville: logement.ville,
        adresseComplete: adresseComplete(logement),
      };

      const voyageurSnapshot = voyageur
        ? {
            id: voyageur.id,
            nom: voyageur.nom,
            prenom: voyageur.prenom,
            nomComplet: nomCompletVoyageur(voyageur),
            telephone: voyageur.telephone,
            email: voyageur.email,
          }
        : null;

      const payload: Record<string, unknown> = {
        organization_id: orgId,
        logement_id: logement.id,
        voyageur_id: voyageur?.id || null,
        mission_id: null,
        type_edl: normaliserType(brut.type || brut.typeEtatDesLieux),
        statut: normaliserStatut(brut.statut),
        date_prevue: datePrevue,
        notes_preparation:
          texte(brut.notesPreparation) || texte(brut.observations) || null,
        etat_general: texte(brut.etatGeneral) || null,
        proprete: texte(brut.proprete) || null,
        observations_generales: texte(brut.observationsGenerales) || null,
        logement_snapshot: logementSnapshot,
        voyageur_snapshot: voyageurSnapshot,
      };

      const ancienId = texte(brut.id);
      if (ancienId && estUuid(ancienId)) payload.id = ancienId;

      const dateCreation = texte(brut.dateCreation || brut.createdAt);
      if (dateCreation) payload.created_at = dateCreation;

      const dateModification = texte(brut.dateModification || brut.updatedAt);
      if (dateModification) payload.updated_at = dateModification;

      const { error } = await supabase.from("etats_des_lieux").insert(payload);
      if (error) throw error;
    }
  }

  const statistiques = useMemo(
    () => ({
      total: etatsDesLieux.length,
      aPreparer: etatsDesLieux.filter((etat) => etat.statut === "a_preparer").length,
      enCours: etatsDesLieux.filter((etat) => etat.statut === "en_cours").length,
      termines: etatsDesLieux.filter(
        (etat) => etat.statut === "termine" || etat.statut === "signe"
      ).length,
    }),
    [etatsDesLieux]
  );

  const resultats = useMemo(() => {
    const terme = recherche
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return etatsDesLieux
      .filter((etat) => {
        if (filtreStatut !== "tous" && etat.statut !== filtreStatut) return false;
        if (!terme) return true;

        const contenu = [
          etat.logementNom,
          etat.typeLogement,
          etat.adresseLogement,
          etat.voyageurNom,
          etat.type,
          libelleStatut(etat.statut),
          etat.date,
        ]
          .join(" ")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        return contenu.includes(terme);
      })
      .sort((a, b) => {
        const dateA = `${a.date}T${a.heure || "00:00"}`;
        const dateB = `${b.date}T${b.heure || "00:00"}`;
        return dateB.localeCompare(dateA);
      });
  }, [etatsDesLieux, recherche, filtreStatut]);

  function ouvrirFormulaire() {
    setFormulaire(creerFormulaireVide());
    setErreur("");
    setMessage("");
    setFormulaireOuvert(true);

    window.setTimeout(() => {
      document.getElementById("formulaire-etat-des-lieux")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function fermerFormulaire() {
    setFormulaire(creerFormulaireVide());
    setErreur("");
    setFormulaireOuvert(false);
  }

  async function creerEtatDesLieux() {
    if (sauvegardeEnCours) return;

    setErreur("");
    setErreurPage("");
    setMessage("");

    const logement = logements.find((element) => element.id === formulaire.logementId);
    if (!logement) {
      setErreur("Sélectionnez un logement.");
      return;
    }

    const voyageur = voyageurs.find((element) => element.id === formulaire.voyageurId);
    if (!voyageur) {
      setErreur("Sélectionnez un voyageur.");
      return;
    }

    if (!formulaire.date) {
      setErreur("Sélectionnez une date.");
      return;
    }

    if (!formulaire.heure) {
      setErreur("Sélectionnez une heure.");
      return;
    }

    if (!organizationId) {
      setErreur("L’organisation Cap Serein n’est pas encore chargée.");
      return;
    }

    setSauvegardeEnCours(true);

    try {
      const datePrevue = new Date(
        `${formulaire.date}T${formulaire.heure}:00`
      ).toISOString();

      const logementSnapshot = {
        id: logement.id,
        nom: logement.nom,
        typeLogement: logement.typeLogement,
        superficie: logement.superficie,
        nombreChambres: logement.nombreChambres,
        adresse: logement.adresse,
        codePostal: logement.codePostal,
        ville: logement.ville,
        adresseComplete: adresseComplete(logement),
      };

      const voyageurSnapshot = {
        id: voyageur.id,
        nom: voyageur.nom,
        prenom: voyageur.prenom,
        nomComplet: nomCompletVoyageur(voyageur),
        telephone: voyageur.telephone,
        email: voyageur.email,
      };

      const { data, error } = await supabase
        .from("etats_des_lieux")
        .insert({
          organization_id: organizationId,
          logement_id: logement.id,
          voyageur_id: voyageur.id,
          mission_id: null,
          type_edl: formulaire.type,
          statut: formulaire.statut,
          date_prevue: datePrevue,
          notes_preparation: formulaire.notesPreparation.trim() || null,
          logement_snapshot: logementSnapshot,
          voyageur_snapshot: voyageurSnapshot,
        })
        .select(
          `
            id,
            mission_id,
            logement_id,
            voyageur_id,
            type_edl,
            statut,
            date_prevue,
            notes_preparation,
            logement_snapshot,
            voyageur_snapshot,
            created_at,
            updated_at
          `
        )
        .single();

      if (error) throw error;

      const nouvelEtat = convertirEtatSupabase(
        data as LigneEtatDesLieux,
        logements,
        voyageurs
      );

      setEtatsDesLieux((liste) => [nouvelEtat, ...liste]);
      fermerFormulaire();
      setMessage("L’état des lieux a été créé et synchronisé avec Supabase.");
    } catch (error) {
      console.error(error);
      setErreur(
        error instanceof Error ? error.message : "Impossible de créer l’état des lieux."
      );
    } finally {
      setSauvegardeEnCours(false);
    }
  }

  async function changerStatut(
    identifiant: string,
    statut: StatutEtatDesLieux
  ) {
    if (!organizationId || statutEnCours) return;

    setStatutEnCours(identifiant);
    setErreurPage("");
    setMessage("");

    try {
      const { error } = await supabase
        .from("etats_des_lieux")
        .update({ statut })
        .eq("id", identifiant)
        .eq("organization_id", organizationId);

      if (error) throw error;

      setEtatsDesLieux((liste) =>
        liste.map((etat) =>
          etat.id === identifiant
            ? {
                ...etat,
                statut,
                dateModification: new Date().toISOString(),
              }
            : etat
        )
      );
    } catch (error) {
      console.error(error);
      setErreurPage(
        error instanceof Error ? error.message : "Impossible de modifier le statut."
      );
    } finally {
      setStatutEnCours("");
    }
  }

  async function supprimerEtatDesLieux(etat: EtatDesLieux) {
    if (suppressionEnCours) return;

    const confirmation = window.confirm(
      `Supprimer l’état des lieux ${
        etat.type === "entree" ? "d’entrée" : "de sortie"
      } de « ${etat.logementNom} » ?`
    );

    if (!confirmation) return;

    if (!organizationId) {
      setErreurPage("L’organisation Cap Serein n’est pas chargée.");
      return;
    }

    setSuppressionEnCours(etat.id);
    setErreurPage("");
    setMessage("");

    try {
      const { error } = await supabase
        .from("etats_des_lieux")
        .delete()
        .eq("id", etat.id)
        .eq("organization_id", organizationId);

      if (error) throw error;

      setEtatsDesLieux((liste) => liste.filter((element) => element.id !== etat.id));
      setMessage("L’état des lieux a été supprimé de Supabase.");
    } catch (error) {
      console.error(error);
      setErreurPage(
        error instanceof Error ? error.message : "Impossible de supprimer l’état des lieux."
      );
    } finally {
      setSuppressionEnCours("");
    }
  }

  const logementSelectionne = logements.find(
    (logement) => logement.id === formulaire.logementId
  );

  const voyageurSelectionne = voyageurs.find(
    (voyageur) => voyageur.id === formulaire.voyageurId
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        titre="États des lieux"
        description="Préparez, réalisez et suivez vos états des lieux d’entrée et de sortie."
        action={
          <button
            type="button"
            onClick={ouvrirFormulaire}
            className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            + Nouvel état des lieux
          </button>
        }
      />

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
        ☁️ La liste des états des lieux est maintenant synchronisée avec Supabase.
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
        <CarteStatistique titre="Total" valeur={statistiques.total} icone="📋" />
        <CarteStatistique titre="À préparer" valeur={statistiques.aPreparer} icone="🗓️" />
        <CarteStatistique titre="En cours" valeur={statistiques.enCours} icone="⏳" />
        <CarteStatistique titre="Terminés" valeur={statistiques.termines} icone="✅" />
      </div>

      {formulaireOuvert && (
        <div id="formulaire-etat-des-lieux">
          <Section
            titre="Nouvel état des lieux"
            description="Le logement et le voyageur resteront liés à toute l’intervention."
          >
            {erreur && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {erreur}
              </div>
            )}

            {logements.length === 0 || voyageurs.length === 0 ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
                <h3 className="font-black">Informations manquantes</h3>
                <p className="mt-2 text-sm leading-6">
                  Il faut avoir au moins un logement et un voyageur avant de créer un état des lieux.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  {logements.length === 0 && (
                    <Link
                      href="/logements#nouveau-logement"
                      className="rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-black text-white"
                    >
                      Ajouter un logement
                    </Link>
                  )}

                  {voyageurs.length === 0 && (
                    <Link
                      href="/voyageurs"
                      className="rounded-2xl bg-slate-900 px-5 py-3 text-center text-sm font-black text-white"
                    >
                      Ajouter un voyageur
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <ChampSelection
                    label="Logement"
                    value={formulaire.logementId}
                    onChange={(valeur) =>
                      setFormulaire({ ...formulaire, logementId: valeur })
                    }
                  >
                    <option value="">Sélectionner un logement</option>
                    {logements.map((logement) => (
                      <option key={logement.id} value={logement.id}>
                        {logement.nom}
                        {logement.typeLogement ? ` — ${logement.typeLogement}` : ""}
                      </option>
                    ))}
                  </ChampSelection>

                  <ChampSelection
                    label="Voyageur"
                    value={formulaire.voyageurId}
                    onChange={(valeur) =>
                      setFormulaire({ ...formulaire, voyageurId: valeur })
                    }
                  >
                    <option value="">Sélectionner un voyageur</option>
                    {voyageurs.map((voyageur) => (
                      <option key={voyageur.id} value={voyageur.id}>
                        {nomCompletVoyageur(voyageur)}
                      </option>
                    ))}
                  </ChampSelection>
                </div>

                {(logementSelectionne || voyageurSelectionne) && (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {logementSelectionne && (
                      <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                        <p className="text-xs font-black uppercase tracking-wider text-blue-700">
                          Logement sélectionné
                        </p>
                        <h3 className="mt-2 text-lg font-black text-blue-950">
                          {logementSelectionne.nom}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-blue-800">
                          {logementSelectionne.typeLogement || "Type non renseigné"}
                          {" · "}
                          {logementSelectionne.superficie || 0} m²
                          {" · "}
                          {logementSelectionne.nombreChambres || 0} chambre(s)
                        </p>
                        <p className="mt-2 text-sm text-blue-800">
                          {adresseComplete(logementSelectionne) || "Adresse non renseignée"}
                        </p>
                      </div>
                    )}

                    {voyageurSelectionne && (
                      <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5">
                        <p className="text-xs font-black uppercase tracking-wider text-violet-700">
                          Voyageur sélectionné
                        </p>
                        <h3 className="mt-2 text-lg font-black text-violet-950">
                          {nomCompletVoyageur(voyageurSelectionne)}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-violet-800">
                          {voyageurSelectionne.telephone || "Téléphone non renseigné"}
                        </p>
                        <p className="break-words text-sm text-violet-800">
                          {voyageurSelectionne.email || "E-mail non renseigné"}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  <ChampSelection
                    label="Type d’état des lieux"
                    value={formulaire.type}
                    onChange={(valeur) =>
                      setFormulaire({ ...formulaire, type: valeur as TypeEtatDesLieux })
                    }
                  >
                    <option value="entree">État des lieux d’entrée</option>
                    <option value="sortie">État des lieux de sortie</option>
                  </ChampSelection>

                  <ChampSelection
                    label="Statut initial"
                    value={formulaire.statut}
                    onChange={(valeur) =>
                      setFormulaire({
                        ...formulaire,
                        statut: valeur as StatutEtatDesLieux,
                      })
                    }
                  >
                    {statuts.map((statut) => (
                      <option key={statut.valeur} value={statut.valeur}>
                        {statut.label}
                      </option>
                    ))}
                  </ChampSelection>

                  <Champ
                    label="Date prévue"
                    type="date"
                    value={formulaire.date}
                    onChange={(valeur) => setFormulaire({ ...formulaire, date: valeur })}
                  />

                  <Champ
                    label="Heure prévue"
                    type="time"
                    value={formulaire.heure}
                    onChange={(valeur) => setFormulaire({ ...formulaire, heure: valeur })}
                  />
                </div>

                <label className="mt-5 block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Notes de préparation
                  </span>
                  <textarea
                    rows={4}
                    value={formulaire.notesPreparation}
                    onChange={(event) =>
                      setFormulaire({
                        ...formulaire,
                        notesPreparation: event.target.value,
                      })
                    }
                    placeholder="Informations à vérifier, consignes du propriétaire, éléments à préparer..."
                    className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void creerEtatDesLieux()}
                    disabled={sauvegardeEnCours}
                    className="min-h-12 rounded-2xl bg-blue-600 px-6 py-3 font-black text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sauvegardeEnCours ? "Création..." : "Créer l’état des lieux"}
                  </button>

                  <button
                    type="button"
                    onClick={fermerFormulaire}
                    disabled={sauvegardeEnCours}
                    className="min-h-12 rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                </div>
              </>
            )}
          </Section>
        </div>
      )}

      <Section
        titre="Interventions"
        description={`${resultats.length} état(s) des lieux affiché(s)`}
      >
        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            type="search"
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Rechercher un logement, un voyageur ou une adresse..."
            className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />

          <select
            value={filtreStatut}
            onChange={(event) =>
              setFiltreStatut(event.target.value as "tous" | StatutEtatDesLieux)
            }
            className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          >
            <option value="tous">Tous les statuts</option>
            {statuts.map((statut) => (
              <option key={statut.valeur} value={statut.valeur}>
                {statut.label}
              </option>
            ))}
          </select>
        </div>

        {!donneesChargees ? (
          <div className="rounded-3xl bg-slate-50 p-12 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            <p className="mt-4 font-bold text-slate-500">Chargement depuis Supabase...</p>
          </div>
        ) : resultats.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center">
            <div className="text-5xl">📋</div>
            <h3 className="mt-5 text-xl font-black text-slate-900">
              Aucun état des lieux
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-slate-500">
              Créez une première intervention en sélectionnant son logement et son voyageur.
            </p>
            <button
              type="button"
              onClick={ouvrirFormulaire}
              className="mt-6 min-h-12 w-full rounded-2xl bg-blue-600 px-6 py-3 font-black text-white sm:w-auto"
            >
              + Créer un état des lieux
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {resultats.map((etat) => (
              <article
                key={etat.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${classeStatut(
                            etat.statut
                          )}`}
                        >
                          {libelleStatut(etat.statut)}
                        </span>

                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
                          {etat.type === "entree" ? "Entrée" : "Sortie"}
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

                      <h3 className="mt-4 break-words text-xl font-black text-slate-950">
                        {etat.logementNom}
                      </h3>

                      <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                        {etat.adresseLogement || "Adresse non renseignée"}
                      </p>

                      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                        <Information label="Voyageur" valeur={etat.voyageurNom} />
                        <Information label="Date" valeur={formaterDate(etat.date)} />
                        <Information label="Heure" valeur={etat.heure || "Non définie"} />
                        <Information
                          label="Logement"
                          valeur={etat.typeLogement || "Type non renseigné"}
                        />
                        <Information
                          label="Superficie"
                          valeur={etat.superficie > 0 ? `${etat.superficie} m²` : "Non renseignée"}
                        />
                        <Information
                          label="Chambres"
                          valeur={`${etat.nombreChambres} chambre(s)`}
                        />
                      </div>

                      {etat.notesPreparation && (
                        <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                          <span className="font-black">Préparation : </span>
                          {etat.notesPreparation}
                        </div>
                      )}
                    </div>

                    <div className="w-full xl:w-64">
                      <label>
                        <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                          Changer le statut
                        </span>
                        <select
                          value={etat.statut}
                          disabled={
                            statutEnCours === etat.id || suppressionEnCours === etat.id
                          }
                          onChange={(event) =>
                            void changerStatut(
                              etat.id,
                              event.target.value as StatutEtatDesLieux
                            )
                          }
                          className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:opacity-50"
                        >
                          {statuts.map((statut) => (
                            <option key={statut.valeur} value={statut.valeur}>
                              {statut.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="mt-3 grid gap-2">
                        <Link
                          href={`/etats-des-lieux/${etat.id}`}
                          className="flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-black text-white shadow-md transition hover:bg-blue-700"
                        >
                          Ouvrir la fiche
                        </Link>

                        <button
                          type="button"
                          disabled={suppressionEnCours === etat.id}
                          onClick={() => void supprimerEtatDesLieux(etat)}
                          className="min-h-11 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {suppressionEnCours === etat.id ? "Suppression..." : "Supprimer"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function CarteStatistique({
  titre,
  valeur,
  icone,
}: {
  titre: string;
  valeur: number;
  icone: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            {titre}
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">{valeur}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
          {icone}
        </div>
      </div>
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
  onChange: (valeur: string) => void;
  type?: string;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function ChampSelection({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (valeur: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  );
}

function Information({ label, valeur }: { label: string; valeur: string }) {
  return (
    <p className="min-w-0 break-words">
      <span className="font-black text-slate-700">{label} :</span>{" "}
      <span className="text-slate-600">{valeur}</span>
    </p>
  );
}
