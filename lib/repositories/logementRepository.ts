import { BaseRepository } from "./baseRepository";
import type { Logement } from "@/types/logement";

export const logementRepository =
  new BaseRepository<Logement>("logements");