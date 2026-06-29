import { BaseRepository } from "./baseRepository";
import type { Mission } from "@/types/mission";

export const missionRepository =
  new BaseRepository<Mission>("missions");