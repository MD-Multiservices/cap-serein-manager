"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { obtenirOrganisationCourante, messageErreurSupabase } from "./organization";
import { chargerCollection, lireTable, sauvegarderElement, supprimerElement, type Collection, type Row } from "./remoteData";

export function useRemoteCollection<T extends { id: string }>(table: Collection) {
  const [items, setItems] = useState<T[]>([]);
  const [references, setReferences] = useState<Record<string, Row[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const current = useRef<T[]>([]), organization = useRef(""), locked = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    let active = true;
    alive.current = true;
    async function load() {
      try {
        const org = await obtenirOrganisationCourante();
        const [rows, logements, voyageurs, proprietaires] = await Promise.all([
          chargerCollection(table, org), lireTable("logements", org), lireTable("voyageurs", org), lireTable("proprietaires", org),
        ]);
        if (!active) return;
        organization.current = org;
        current.current = rows as unknown as T[];
        setItems(current.current);
        setReferences({ logements, voyageurs, proprietaires });
      } catch (cause) { if (active) setError(messageErreurSupabase(cause)); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; alive.current = false; };
  }, [table]);

  const change = useCallback(async (transform: (previous: T[]) => T[]): Promise<boolean> => {
    if (locked.current || !organization.current) return false;
    locked.current = true;
    setBusy(true); setError("");
    const org = organization.current;
    try {
      const previous = current.current;
      const next = transform(previous);
      for (const row of next) {
        const old = previous.find(item => item.id === row.id);
        if (old !== row) await sauvegarderElement(table, org, { ...row,
          versionDistante: (old as unknown as Row | undefined)?.updatedAt } as Row, Boolean(old));
      }
      for (const old of previous) if (!next.some(row => row.id === old.id)) await supprimerElement(table, org, old as unknown as Row);
      const fresh = await chargerCollection(table, org);
      current.current = fresh as unknown as T[];
      if (alive.current) setItems(current.current);
      return true;
    } catch (cause) {
      // Des opérations multiples peuvent avoir partiellement abouti : relire la vérité distante.
      try {
        current.current = await chargerCollection(table, org) as unknown as T[];
        if (alive.current) setItems(current.current);
      } catch { /* Conserver les données visibles et l'erreur initiale. */ }
      if (alive.current) setError("Opération non terminée : " + messageErreurSupabase(cause));
      return false;
    } finally { locked.current = false; if (alive.current) setBusy(false); }
  }, [table]);
  return { items, references, loading, busy, error, change };
}
