import { BaseRepository } from "./baseRepository";
import type { Voyageur } from "@/types/voyageur";

export const voyageurRepository =
  new BaseRepository<Voyageur>("voyageurs");