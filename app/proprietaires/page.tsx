"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import { supabase } from "@/lib/supabase";

type StatutProprietaire =
  | "Actif"
  | "Prospect"
  | "Inactif";

type Proprietaire = {
  id: string;
  nom: string;
  telephone: string;
  email: string;
  ville: string;
  statut: StatutProprietaire;
  notes: string;
};

type ProprietaireSupabase = {
  id: string;
  nom: string | null;
  telephone: string | null;
  email: string | null;
  ville: string | null;
  statut: string | null;
  observations: string | null;
  actif: boolean | null;
};

function creerProprietaireVide(): Proprietaire {
  return {
    id: "",
    nom: "",
    telephone: "",
    email: "",
    ville: "",
    statut: "Actif",
    notes: "",
  };
}

function normaliserStatut(
  valeur: unknown
): StatutProprietaire {
  if (
    valeur === "Actif" ||
    valeur === "Prospect" ||
    valeur === "Inactif"
  ) {
    return valeur;
  }

  return "Actif";
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

export default function ProprietairesPage() {
  const [
    organizationId,
    setOrganizationId,
  ] = useState("");

  const [
    proprietaires,
    setProprietaires,
  ] = useState<Proprietaire[]>([]);

  const [
    recherche,
    setRecherche,
  ] = useState("");

  const [
    formulaireOuvert,
    setFormulaireOuvert,
  ] = useState(false);

  const [
    proprietaire,
    setProprietaire,
  ] = useState<Proprietaire>(
    creerProprietaireVide()
  );

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

  useEffect(() => {
    let actif = true;

    async function initialiser() {
      try {
        setDonneesChargees(false);
        setErreurPage("");

        const {
          data: { user },
          error: erreurUtilisateur,
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
          error: erreurAdhesion,
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

        const migrationEffectuee =
          await chargerProprietaires(
            orgId,
            true
          );

        if (
          actif &&
          migrationEffectuee
        ) {
          setMessage(
            "Vos anciens propriétaires enregistrés sur cet ordinateur ont été importés dans Supabase."
          );
        }
      } catch (error) {
        console.error(error);

        if (actif) {
          setErreurPage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les propriétaires."
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

  async function chargerProprietaires(
    orgId: string,
    autoriserMigration: boolean
  ): Promise<boolean> {
    const {
      data,
      error,
    } = await supabase
      .from("proprietaires")
      .select(
        `
          id,
          nom,
          telephone,
          email,
          ville,
          statut,
          observations,
          actif
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
      (data ||
        []) as ProprietaireSupabase[];

    const proprietairesConvertis =
      lignes.map(
        (
          ligne
        ): Proprietaire => ({
          id: ligne.id,

          nom: String(
            ligne.nom || ""
          ),

          telephone: String(
            ligne.telephone || ""
          ),

          email: String(
            ligne.email || ""
          ),

          ville: String(
            ligne.ville || ""
          ),

          statut:
            normaliserStatut(
              ligne.statut
            ),

          notes: String(
            ligne.observations ||
              ""
          ),
        })
      );

    setProprietaires(
      proprietairesConvertis
    );

    return false;
  }

  const resultats =
    useMemo(() => {
      const terme =
        normaliserTexte(
          recherche
        );

      return proprietaires
        .filter((item) => {
          if (!terme) {
            return true;
          }

          const contenu =
            normaliserTexte(
              [
                item.nom,
                item.telephone,
                item.email,
                item.ville,
                item.statut,
              ].join(" ")
            );

          return contenu.includes(
            terme
          );
        })
        .sort((a, b) =>
          a.nom.localeCompare(
            b.nom,
            "fr"
          )
        );
    }, [
      proprietaires,
      recherche,
    ]);

  function ouvrirNouveau() {
    setProprietaire(
      creerProprietaireVide()
    );

    setErreur("");
    setMessage("");

    setFormulaireOuvert(
      true
    );
  }

  function ouvrirModification(
    item: Proprietaire
  ) {
    setProprietaire({
      ...item,
    });

    setErreur("");
    setMessage("");

    setFormulaireOuvert(
      true
    );
  }

  function fermerFormulaire() {
    setProprietaire(
      creerProprietaireVide()
    );

    setErreur("");

    setFormulaireOuvert(
      false
    );
  }

  async function sauvegarder() {
    if (
      sauvegardeEnCours
    ) {
      return;
    }

    setErreur("");
    setErreurPage("");
    setMessage("");

    if (
      !proprietaire.nom.trim()
    ) {
      setErreur(
        "Le nom du propriétaire est obligatoire."
      );

      return;
    }

    if (
      proprietaire.email &&
      !proprietaire.email.includes(
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
      const payload = {
        organization_id:
          organizationId,

        nom:
          proprietaire.nom.trim(),

        telephone:
          proprietaire.telephone.trim() ||
          null,

        email:
          proprietaire.email.trim() ||
          null,

        ville:
          proprietaire.ville.trim() ||
          null,

        statut:
          proprietaire.statut,

        /*
         * Le booléen historique reste cohérent
         * avec le statut métier.
         */
        actif:
          proprietaire.statut !==
          "Inactif",

        observations:
          proprietaire.notes.trim() ||
          null,
      };

      if (
        proprietaire.id
      ) {
        const {
          error,
        } = await supabase
          .from(
            "proprietaires"
          )
          .update(payload)
          .eq(
            "id",
            proprietaire.id
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
          .from(
            "proprietaires"
          )
          .insert(payload);

        if (error) {
          throw error;
        }
      }

      const etaitModification =
        Boolean(
          proprietaire.id
        );

      await chargerProprietaires(
        organizationId,
        false
      );

      fermerFormulaire();

      setMessage(
        etaitModification
          ? "Le propriétaire a été modifié et synchronisé."
          : "Le propriétaire a été créé et synchronisé."
      );
    } catch (error) {
      console.error(error);

      setErreur(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer le propriétaire."
      );
    } finally {
      setSauvegardeEnCours(
        false
      );
    }
  }

  async function supprimer(
    item: Proprietaire
  ) {
    if (
      suppressionEnCours
    ) {
      return;
    }

    const confirmation =
      window.confirm(
        `Supprimer définitivement le propriétaire « ${item.nom} » ? Les logements liés resteront enregistrés mais ne seront plus rattachés à ce propriétaire.`
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
      item.id
    );

    try {
      const {
        error,
      } = await supabase
        .from("proprietaires")
        .delete()
        .eq(
          "id",
          item.id
        )
        .eq(
          "organization_id",
          organizationId
        );

      if (error) {
        throw error;
      }

      setProprietaires(
        (liste) =>
          liste.filter(
            (element) =>
              element.id !==
              item.id
          )
      );

      if (
        proprietaire.id ===
        item.id
      ) {
        fermerFormulaire();
      }

      setMessage(
        "Le propriétaire a été supprimé de Supabase."
      );
    } catch (error) {
      console.error(error);

      setErreurPage(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer le propriétaire."
      );
    } finally {
      setSuppressionEnCours(
        ""
      );
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        titre="Propriétaires"
        description="Centralisez les contacts, statuts et notes de vos propriétaires."
        action={
          <button
            type="button"
            onClick={
              ouvrirNouveau
            }
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Nouveau propriétaire
          </button>
        }
      />

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
        ☁️ Les propriétaires de cette page sont maintenant synchronisés avec Supabase.
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

      <div className="grid gap-6 md:grid-cols-4">
        <Carte
          titre="Total"
          valeur={
            proprietaires.length
          }
        />

        <Carte
          titre="Actifs"
          valeur={
            proprietaires.filter(
              (p) =>
                p.statut ===
                "Actif"
            ).length
          }
        />

        <Carte
          titre="Prospects"
          valeur={
            proprietaires.filter(
              (p) =>
                p.statut ===
                "Prospect"
            ).length
          }
        />

        <Carte
          titre="Inactifs"
          valeur={
            proprietaires.filter(
              (p) =>
                p.statut ===
                "Inactif"
            ).length
          }
        />
      </div>

      {formulaireOuvert && (
        <Section
          titre={
            proprietaire.id
              ? "Modifier le propriétaire"
              : "Nouveau propriétaire"
          }
        >
          {erreur && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              {erreur}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Champ
              label="Nom / Société"
              value={
                proprietaire.nom
              }
              onChange={(v) =>
                setProprietaire({
                  ...proprietaire,
                  nom: v,
                })
              }
            />

            <Champ
              label="Téléphone"
              value={
                proprietaire.telephone
              }
              type="tel"
              onChange={(v) =>
                setProprietaire({
                  ...proprietaire,
                  telephone: v,
                })
              }
            />

            <Champ
              label="Email"
              value={
                proprietaire.email
              }
              type="email"
              onChange={(v) =>
                setProprietaire({
                  ...proprietaire,
                  email: v,
                })
              }
            />

            <Champ
              label="Ville"
              value={
                proprietaire.ville
              }
              onChange={(v) =>
                setProprietaire({
                  ...proprietaire,
                  ville: v,
                })
              }
            />

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Statut
              </span>

              <select
                value={
                  proprietaire.statut
                }
                onChange={(e) =>
                  setProprietaire({
                    ...proprietaire,

                    statut:
                      e.target
                        .value as StatutProprietaire,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="Actif">
                  Actif
                </option>

                <option value="Prospect">
                  Prospect
                </option>

                <option value="Inactif">
                  Inactif
                </option>
              </select>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Notes
            </span>

            <textarea
              value={
                proprietaire.notes
              }
              onChange={(e) =>
                setProprietaire({
                  ...proprietaire,

                  notes:
                    e.target.value,
                })
              }
              rows={4}
              className="w-full rounded-2xl border border-slate-300 px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={
                sauvegarder
              }
              disabled={
                sauvegardeEnCours
              }
              className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sauvegardeEnCours
                ? "Enregistrement..."
                : proprietaire.id
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
              className="rounded-2xl border px-5 py-3 font-bold hover:bg-slate-50 disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </Section>
      )}

      <Section
        titre="Liste des propriétaires"
        description={`${resultats.length} propriétaire(s) affiché(s)`}
      >
        <input
          type="search"
          value={recherche}
          onChange={(e) =>
            setRecherche(
              e.target.value
            )
          }
          placeholder="Rechercher un propriétaire..."
          className="mb-6 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        />

        {!donneesChargees ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-12 text-center sm:p-16">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 font-bold text-slate-500">
              Chargement des propriétaires depuis Supabase...
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="hidden grid-cols-5 border-b bg-slate-50 px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 md:grid">
              <div>Nom</div>
              <div>Téléphone</div>
              <div>Email</div>
              <div>Statut</div>
              <div>Actions</div>
            </div>

            {resultats.length >
            0 ? (
              resultats.map(
                (item) => (
                  <div
                    key={
                      item.id
                    }
                    className="grid gap-4 border-b border-slate-100 px-5 py-5 hover:bg-slate-50 md:grid-cols-5 md:items-center md:px-6"
                  >
                    <div>
                      <div className="text-xs font-bold uppercase text-slate-400 md:hidden">
                        Nom
                      </div>

                      <div className="font-bold text-slate-900">
                        {
                          item.nom
                        }
                      </div>

                      {item.ville && (
                        <div className="mt-1 text-sm text-slate-500">
                          {
                            item.ville
                          }
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase text-slate-400 md:hidden">
                        Téléphone
                      </div>

                      <div className="text-slate-600">
                        {item.telephone ||
                          "—"}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase text-slate-400 md:hidden">
                        Email
                      </div>

                      <div className="break-all text-slate-600">
                        {item.email ||
                          "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase text-slate-400 md:hidden">
                        Statut
                      </div>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          item.statut ===
                          "Actif"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.statut ===
                                "Prospect"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {
                          item.statut
                        }
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row md:flex-col xl:flex-row">
                      <button
                        type="button"
                        onClick={() =>
                          ouvrirModification(
                            item
                          )
                        }
                        disabled={
                          suppressionEnCours ===
                          item.id
                        }
                        className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold hover:bg-slate-200 disabled:opacity-50"
                      >
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          supprimer(
                            item
                          )
                        }
                        disabled={
                          suppressionEnCours ===
                          item.id
                        }
                        className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {suppressionEnCours ===
                        item.id
                          ? "Suppression..."
                          : "Supprimer"}
                      </button>
                    </div>

                    {item.notes && (
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 md:col-span-5">
                        {
                          item.notes
                        }
                      </div>
                    )}
                  </div>
                )
              )
            ) : (
              <div className="px-8 py-16 text-center">
                <div className="text-5xl">
                  👥
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  Aucun propriétaire enregistré
                </h3>

                <p className="mt-2 text-slate-500">
                  Ajoutez votre premier propriétaire. Il sera enregistré dans Supabase et accessible depuis votre téléphone et votre ordinateur.
                </p>
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}

function Carte({
  titre,
  valeur,
}: {
  titre: string;
  valeur: number;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold uppercase text-slate-500">
        {titre}
      </p>

      <p className="mt-3 text-4xl font-black text-slate-900">
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
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full rounded-2xl border border-slate-300 px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}