import { api } from "@/lib/api";
import { HomeData } from "@/types";

export const dashboardService = {
  home: () => api.get<HomeData>("/dashboard/home"),
};
