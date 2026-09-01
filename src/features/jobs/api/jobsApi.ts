import { apiRequest } from "../../../shared/api/httpClient";

export type WorkplaceMode = "ONSITE" | "HYBRID" | "REMOTE";
export type JobStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "FILLED" | "CLOSED";
export type ApplicationStatus = "SUBMITTED" | "REVIEWING" | "SHORTLISTED" | "REJECTED" | "HIRED" | "WITHDRAWN";

export interface PublicJob {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  summary: string;
  description?: string;
  employmentType: string | null;
  location: string;
  workplaceMode: WorkplaceMode;
  availablePositions: number;
  publishedAt: string;
  closesAt: string | null;
}

export interface JobMessage {
  id: string;
  sender: "APPLICANT" | "COMPANY";
  body: string;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  status: ApplicationStatus;
  jobStatus: JobStatus;
  jobTitle: string;
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  coverMessage: string | null;
  appliedAt: string;
  messages: JobMessage[];
}

export interface WorkspaceJob {
  id: string;
  title: string;
  summary: string;
  employmentType: string | null;
  location: string;
  workplaceMode: WorkplaceMode;
  availablePositions: number;
  filledPositions: number;
  status: JobStatus;
  publishedAt: string | null;
  closesAt: string | null;
  createdAt: string;
  applicationCount: number;
  activeApplicationCount: number;
}

export interface WorkspaceApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  coverMessage: string | null;
  status: ApplicationStatus;
  appliedAt: string;
  lastActivityAt: string;
  messageCount: number;
}

export interface JobPostingInput {
  title: string;
  summary: string;
  description: string;
  employmentType?: string | null;
  location: string;
  workplaceMode: WorkplaceMode;
  availablePositions: number;
  closesAt?: string | null;
  status: "DRAFT" | "PUBLISHED";
}

export interface PublicApplicationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  coverMessage?: string | null;
  privacyAccepted: boolean;
  website: string;
}

const applicationHeaders = (token: string) => ({ "X-Application-Token": token });

export const jobsApi = {
  listPublic() {
    return apiRequest<{ data: { items: PublicJob[] } }>("/api/v1/public/jobs");
  },
  getPublic(jobId: string) {
    return apiRequest<{ data: PublicJob }>(`/api/v1/public/jobs/${jobId}`);
  },
  apply(jobId: string, input: PublicApplicationInput) {
    return apiRequest<{ data: { applicationId: string; accessToken: string; status: ApplicationStatus } }>(
      `/api/v1/public/jobs/${jobId}/applications`, { method: "POST", body: input },
    );
  },
  getApplication(applicationId: string, token: string) {
    return apiRequest<{ data: JobApplication }>(`/api/v1/public/job-applications/${applicationId}`, {
      headers: applicationHeaders(token),
    });
  },
  sendApplicantMessage(applicationId: string, token: string, body: string) {
    return apiRequest(`/api/v1/public/job-applications/${applicationId}/messages`, {
      method: "POST", headers: applicationHeaders(token), body: { body },
    });
  },
  withdraw(applicationId: string, token: string) {
    return apiRequest(`/api/v1/public/job-applications/${applicationId}/withdraw`, {
      method: "POST", headers: applicationHeaders(token),
    });
  },
  listWorkspace(companyId: string) {
    return apiRequest<{ data: { items: WorkspaceJob[] } }>(`/api/v1/workspace/job-postings?companyId=${encodeURIComponent(companyId)}`);
  },
  createWorkspace(companyId: string, csrfToken: string, input: JobPostingInput) {
    return apiRequest<{ data: { id: string } }>(`/api/v1/workspace/job-postings?companyId=${encodeURIComponent(companyId)}`, {
      method: "POST", csrfToken, body: input,
    });
  },
  updateWorkspaceStatus(companyId: string, csrfToken: string, jobId: string, status: "PUBLISHED" | "PAUSED" | "CLOSED") {
    return apiRequest(`/api/v1/workspace/job-postings/${jobId}/status?companyId=${encodeURIComponent(companyId)}`, {
      method: "PATCH", csrfToken, body: { status },
    });
  },
  listApplications(companyId: string, jobId: string) {
    return apiRequest<{ data: { items: WorkspaceApplication[] } }>(
      `/api/v1/workspace/job-postings/${jobId}/applications?companyId=${encodeURIComponent(companyId)}`,
    );
  },
  getWorkspaceApplication(companyId: string, applicationId: string) {
    return apiRequest<{ data: JobApplication }>(
      `/api/v1/workspace/job-applications/${applicationId}?companyId=${encodeURIComponent(companyId)}`,
    );
  },
  sendWorkspaceMessage(companyId: string, csrfToken: string, applicationId: string, body: string) {
    return apiRequest(`/api/v1/workspace/job-applications/${applicationId}/messages?companyId=${encodeURIComponent(companyId)}`, {
      method: "POST", csrfToken, body: { body },
    });
  },
  updateApplicationStatus(companyId: string, csrfToken: string, applicationId: string, status: "REVIEWING" | "SHORTLISTED" | "REJECTED") {
    return apiRequest(`/api/v1/workspace/job-applications/${applicationId}/status?companyId=${encodeURIComponent(companyId)}`, {
      method: "PATCH", csrfToken, body: { status },
    });
  },
};
