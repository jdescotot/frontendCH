import { apiRequest } from "../../../shared/api/httpClient";

export interface PlatformSummary {
  companies: {
    total: number;
    active: number;
    suspended: number;
  };
  users: {
    total: number;
    active: number;
  };
  platformAdmins: {
    total: number;
    active: number;
  };
  memberships: {
    active: number;
  };
}

export interface PlatformCompany {
  id: string;
  legalName: string;
  tradeName: string | null;
  taxId: string | null;
  timeZone: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "CLOSED" | string;
  membersCount: number;
  ownersCount: number;
  createdAt: string;
}

interface SummaryResponse {
  data: PlatformSummary;
}

interface CompaniesResponse {
  data: {
    items: PlatformCompany[];
    total: number;
    limit: number;
    offset: number;
  };
}

export const platformApi = {
  getSummary() {
    return apiRequest<SummaryResponse>("/api/v1/platform/summary", {
      method: "GET",
    });
  },

  getCompanies(search = "") {
    const params = new URLSearchParams({ limit: "100", offset: "0" });
    if (search.trim()) {
      params.set("search", search.trim());
    }
    return apiRequest<CompaniesResponse>(
      `/api/v1/platform/companies?${params.toString()}`,
      { method: "GET" },
    );
  },
};
