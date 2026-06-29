import { lire } from "./database";

export interface DashboardStats {
  logements: number;
  voyageurs: number;
  proprietaires: number;
  missions: number;
  factures: number;
}

export function recupererDashboard(): DashboardStats {
  return {
    logements: lire<any>("logements").length,

    voyageurs: lire<any>("voyageurs").length,

    proprietaires: lire<any>("proprietaires").length,

    missions: lire<any>("missions").length,

    factures: lire<any>("factures").length,
  };
}