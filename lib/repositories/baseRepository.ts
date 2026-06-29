import { lire, enregistrer } from "@/lib/database";

export class BaseRepository<T extends { id: string }> {
  constructor(private table: Parameters<typeof lire>[0]) {}

  getAll(): T[] {
    return lire<T>(this.table);
  }

  getById(id: string): T | undefined {
    return this.getAll().find((item) => item.id === id);
  }

  saveAll(items: T[]) {
    enregistrer(this.table, items);
  }

  add(item: T) {
    const items = this.getAll();
    items.push(item);
    this.saveAll(items);
  }

  update(item: T) {
    const items = this.getAll().map((i) =>
      i.id === item.id ? item : i
    );

    this.saveAll(items);
  }

  delete(id: string) {
    this.saveAll(
      this.getAll().filter((i) => i.id !== id)
    );
  }
}