import { enregistrer as ecrireCompat, lire as lireCompat } from "@/lib/database";

/** @deprecated Conservé uniquement pour les anciens services non branchés à l'interface. */
export class BaseRepository<T extends { id: string }> {
  constructor(private table: Parameters<typeof lireCompat>[0]) {}
  getAll(): T[] { return lireCompat<T>(this.table); }
  getById(id: string): T | undefined { return this.getAll().find((item) => item.id === id); }
  saveAll(items: T[]): void { ecrireCompat(this.table, items); }
  add(item: T): void { this.saveAll([...this.getAll(), item]); }
  update(item: T): void { this.saveAll(this.getAll().map((i) => i.id === item.id ? item : i)); }
  delete(id: string): void { this.saveAll(this.getAll().filter((i) => i.id !== id)); }
}
