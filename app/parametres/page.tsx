"use client";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Section from "@/components/ui/Section";
import { supabase } from "@/lib/supabase";
import { obtenirOrganisationCourante, messageErreurSupabase } from "@/lib/organization";
import { lireParametres, ecrireParametres, parametresParDefaut, type Parametres } from "@/lib/settingsSupabase";

export default function ParametresPage() {
  const [parametres, setParametres] = useState<Parametres>(parametresParDefaut);
  const [donneesChargees, setDonneesChargees] = useState(false);
  const [chargementReussi, setChargementReussi] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    lireParametres().then(p => { if (active) { setParametres(p); setChargementReussi(true); } })
      .catch(e => { if (active) setErreur(messageErreurSupabase(e)); })
      .finally(() => { if (active) setDonneesChargees(true); });
    return () => { active = false; };
  }, []);
  async function executer(action: () => Promise<void>) {
    if (lock.current || !chargementReussi) return;
    lock.current = true; setBusy(true); setErreur(""); setMessage("");
    try { await action(); } catch (cause) { setErreur(messageErreurSupabase(cause)); }
    finally { lock.current = false; setBusy(false); }
  }
  async function enregistrerParametres() {
    await executer(async () => {
      if (!parametres.nomEntreprise.trim()) throw new Error("Le nom de l’entreprise est obligatoire.");
      if (parametres.email && !parametres.email.includes("@")) throw new Error("Adresse e-mail incorrecte.");
      if (!Number.isFinite(parametres.tauxTVA) || parametres.tauxTVA < 0 || !Number.isInteger(parametres.delaiPaiement) || parametres.delaiPaiement < 0)
        throw new Error("TVA ou délai de paiement invalide.");
      await ecrireParametres(parametres);
      setMessage("Les paramètres ont été enregistrés.");
    });
  }
  async function exporterDonnees() {
    await executer(async () => {
      const org = await obtenirOrganisationCourante();
      const { data, error } = await supabase.rpc("exporter_organisation", { p_organization_id: org });
      if (error) throw error;
      const backup = { application: "Cap Serein Manager", version: 2, organizationId: org, dateExport: new Date().toISOString(), donnees: data };
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url;
      link.download = "cap-serein-sauvegarde-" + new Date().toISOString().replaceAll(":", "-") + ".json";
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Les données Supabase ont été exportées. Les fichiers médias restent dans leur stockage d’origine.");
    });
  }
  async function importerDonnees(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    if (!window.confirm("Remplacer les données de votre organisation par cette sauvegarde Supabase ?")) return;
    await executer(async () => {
      const backup = JSON.parse(await file.text());
      const org = await obtenirOrganisationCourante();
      if (backup.application !== "Cap Serein Manager" || backup.version !== 2 || backup.organizationId !== org || !backup.donnees)
        throw new Error("Utilisez une sauvegarde Supabase version 2 de cette organisation. Les anciennes sauvegardes navigateur nécessitent une conversion préalable.");
      const { error } = await supabase.rpc("restaurer_organisation", { p_organization_id: org, p_donnees: backup.donnees });
      if (error) throw error;
      setParametres(await lireParametres()); setMessage("La sauvegarde a été restaurée.");
    });
  }
  async function reinitialiserParametres() {
    if (!window.confirm("Réinitialiser les paramètres de l’entreprise ?")) return;
    await executer(async () => { await ecrireParametres(parametresParDefaut); setParametres(parametresParDefaut); setMessage("Paramètres réinitialisés."); });
  }
  async function supprimerToutesLesDonnees() {
    if (!window.confirm("Supprimer les données métier de toute votre organisation ? Les comptes, paramètres et fichiers médias seront conservés.")) return;
    if (window.prompt("Écrivez SUPPRIMER pour confirmer") !== "SUPPRIMER") return;
    await executer(async () => {
      const org = await obtenirOrganisationCourante();
      const { error } = await supabase.rpc("effacer_donnees_organisation", { p_organization_id: org });
      if (error) throw error;
      setMessage("Les données métier ont été supprimées. Les comptes, paramètres et fichiers médias sont conservés.");
    });
  }
  if (!donneesChargees) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

        <p className="mt-4 font-bold text-slate-500">
          Chargement des paramètres...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {busy && <p role="status">Opération en cours…</p>}
      <fieldset disabled={busy || !chargementReussi} className="min-w-0 space-y-8">
      <PageHeader
        titre="Paramètres"
        description="Configurez les informations de votre entreprise et gérez la sauvegarde de vos données."
        action={
          <button
            type="button"
            onClick={enregistrerParametres}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            Enregistrer
          </button>
        }
      />

      {message && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-700">
          {message}
        </div>
      )}

      {erreur && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700">
          {erreur}
        </div>
      )}

      <Section
        titre="Informations de l’entreprise"
        description="Ces informations pourront être utilisées dans vos documents et factures."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Champ
            label="Nom de l’entreprise"
            value={parametres.nomEntreprise}
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                nomEntreprise: valeur,
              })
            }
          />

          <Champ
            label="Responsable"
            value={parametres.responsable}
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                responsable: valeur,
              })
            }
          />

          <Champ
            label="SIRET"
            value={parametres.siret}
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                siret: valeur,
              })
            }
          />

          <Champ
            label="Adresse e-mail"
            type="email"
            value={parametres.email}
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                email: valeur,
              })
            }
          />

          <Champ
            label="Téléphone"
            type="tel"
            value={parametres.telephone}
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                telephone: valeur,
              })
            }
          />

          <Champ
            label="Adresse"
            value={parametres.adresse}
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                adresse: valeur,
              })
            }
          />

          <Champ
            label="Code postal"
            value={parametres.codePostal}
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                codePostal: valeur,
              })
            }
          />

          <Champ
            label="Ville"
            value={parametres.ville}
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                ville: valeur,
              })
            }
          />
        </div>
      </Section>

      <Section
        titre="Facturation"
        description="Définissez les valeurs utilisées par défaut lors de la création de vos documents."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Devise
            </span>

            <select
              value={parametres.devise}
              onChange={(event) =>
                setParametres({
                  ...parametres,
                  devise:
                    event.target.value,
                })
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            >
              <option value="EUR">
                Euro — EUR
              </option>

              <option value="CHF">
                Franc suisse — CHF
              </option>

              <option value="USD">
                Dollar américain — USD
              </option>

              <option value="GBP">
                Livre sterling — GBP
              </option>
            </select>
          </label>

          <ChampNombre
            label="TVA par défaut"
            value={parametres.tauxTVA}
            min={0}
            step={0.1}
            suffixe="%"
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                tauxTVA: valeur,
              })
            }
          />

          <ChampNombre
            label="Délai de paiement"
            value={
              parametres.delaiPaiement
            }
            min={0}
            step={1}
            suffixe="jours"
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                delaiPaiement: valeur,
              })
            }
          />

          <Champ
            label="Préfixe des factures"
            value={
              parametres.prefixeFacture
            }
            onChange={(valeur) =>
              setParametres({
                ...parametres,
                prefixeFacture: valeur,
              })
            }
          />
        </div>

        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Notes affichées sur les factures
          </span>

          <textarea
            value={
              parametres.notesFacture
            }
            onChange={(event) =>
              setParametres({
                ...parametres,
                notesFacture:
                  event.target.value,
              })
            }
            rows={5}
            className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={enregistrerParametres}
            className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
          >
            Enregistrer les paramètres
          </button>

          <button
            type="button"
            onClick={
              reinitialiserParametres
            }
            className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 hover:bg-slate-50"
          >
            Réinitialiser les paramètres
          </button>
        </div>
      </Section>

      <Section
        titre="Sauvegarde des données"
        description="Conservez régulièrement une copie de vos informations sur votre ordinateur."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
            <div className="text-4xl">
              💾
            </div>

            <h3 className="mt-4 text-xl font-black text-blue-950">
              Exporter une sauvegarde
            </h3>

            <p className="mt-2 text-sm leading-6 text-blue-800">
              Téléchargez un fichier contenant vos logements,
              voyageurs, missions, factures, photos et autres
              données.
            </p>

            <button
              type="button"
              onClick={exporterDonnees}
              className="mt-6 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
            >
              Télécharger la sauvegarde
            </button>
          </div>

          <div className="rounded-3xl border border-violet-200 bg-violet-50 p-6">
            <div className="text-4xl">
              📥
            </div>

            <h3 className="mt-4 text-xl font-black text-violet-950">
              Restaurer une sauvegarde
            </h3>

            <p className="mt-2 text-sm leading-6 text-violet-800">
              Administrateur : importez une sauvegarde Supabase de cette organisation. Les
              données actuelles seront remplacées.
            </p>

            <label className="mt-6 inline-flex cursor-pointer rounded-2xl bg-violet-600 px-5 py-3 font-bold text-white hover:bg-violet-700">
              Choisir un fichier

              <input
                type="file"
                accept=".json,application/json"
                onChange={importerDonnees}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </Section>

      <Section
        titre="Zone dangereuse"
        description="Ces actions sont irréversibles."
      >
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-xl font-black text-red-950">
            Supprimer les données métier
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-red-800">
            Cette action supprimera les logements, propriétaires,
            voyageurs, missions, états des lieux, clés, ménages,
            prestations de pressing, factures et références des photos. Les fichiers médias, comptes et paramètres sont conservés.
          </p>

          <button
            type="button"
            onClick={
              supprimerToutesLesDonnees
            }
            className="mt-6 rounded-2xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700"
          >
            Supprimer les données métier
          </button>
        </div>
      </Section>
      </fieldset>
      {!chargementReussi && <p role="alert">{erreur}</p>}
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
  onChange: (value: string) => void;
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
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
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
  onChange: (value: number) => void;
  min: number;
  step: number;
  suffixe: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <div className="flex overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">
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
                  event.target.value || min
                )
              )
            )
          }
          className="min-w-0 flex-1 bg-transparent px-5 py-3 outline-none"
        />

        <span className="flex items-center border-l border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-500">
          {suffixe}
        </span>
      </div>
    </label>
  );
}