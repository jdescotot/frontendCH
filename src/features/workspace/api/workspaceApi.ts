import { apiRequest } from "../../../shared/api/httpClient";

export type EmployeePresenceStatus =
  | "WORKING"
  | "BREAK"
  | "FINISHED"
  | "NOT_CLOCKED";

export interface WorkspaceOverview {
  companyName: string;
  date: string;
  roles: string[];
  totalEmployees: number;
  clockedInToday: number;
  workingNow: number;
  onBreakNow: number;
  pendingClockIn: number;
  pendingTasks: number;
  completedTasksToday: number;
}

export interface WorkspaceEmployee {
  membershipId: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  roles: string[];
  status: EmployeePresenceStatus;
  lastEvent: string | null;
  lastEventAt: string | null;
  workedSeconds: number;
}

export interface WorkspaceTimeEvent {
  id: string;
  membershipId: string;
  employeeName: string;
  eventType: "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END";
  occurredAt: string;
  originalOccurredAt: string;
  effectiveOccurredAt: string;
  correctionCount: number;
  latestCorrectionReason: string | null;
  source: string;
  note: string | null;
}

export interface TimeEventCorrection {
  sequenceNo: number;
  previousEffectiveOccurredAt: string;
  correctedOccurredAt: string;
  reason: string;
  appliedBy: string;
  appliedAt: string;
}

export interface CorrectTimeEventInput {
  correctedLocalDateTime: string;
  reason: string;
}


export type MyClockState = "IDLE" | "WORKING" | "BREAK" | "INELIGIBLE";
export type ClockEventType = "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END";

export interface MyClockStatus {
  eligible: boolean;
  reason: string | null;
  state: MyClockState;
  companyName: string;
  timeZone: string;
  serverTime: string;
  allowedEvents: ClockEventType[];
  todayWorkedSeconds: number;
  currentSession: {
    id: string;
    startedAt: string;
    breakStartedAt: string | null;
    workedSeconds: number;
    breakSeconds: number;
  } | null;
  lastEvent: {
    eventType: ClockEventType;
    occurredAt: string;
  } | null;
  duplicate?: boolean;
}

interface MyClockResponse {
  data: MyClockStatus;
}


export interface EmployeeInvitationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  taxId?: string | null;
  employeeNumber?: string | null;
  jobTitle?: string | null;
  professionalCategory?: string | null;
  contractType?: string | null;
  weeklyMinutes?: number | null;
  startedOn: string;
}

export interface EmployeeInvitation {
  invitationId: string;
  invitedEmail: string;
  employeeName: string;
  companyName: string;
  expiresAt: string;
  activationUrl: string;
  existingAccount: boolean;
}

export interface PendingEmployeeInvitation {
  invitationId: string;
  invitedEmail: string;
  employeeName: string;
  status: "PENDING" | "EXPIRED";
  expiresAt: string;
  createdAt: string;
  existingAccount: boolean;
}

export interface InvitationDetails {
  invitedEmail: string;
  employeeName: string;
  companyName: string;
  status: "PENDING" | "EXPIRED" | "ACCEPTED" | "REVOKED";
  expiresAt: string;
  existingAccount: boolean;
}

export interface WorkspaceTask {
  assignmentId: string;
  title: string;
  description: string | null;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
  occurrenceStatus: string;
  assigneeName: string;
  dueAt: string | null;
  requiresPhoto: boolean;
}


interface EmployeeInvitationResponse {
  data: EmployeeInvitation;
}

interface EmployeeInvitationsResponse {
  data: { items: PendingEmployeeInvitation[] };
}

interface InvitationDetailsResponse {
  data: InvitationDetails;
}

interface AcceptInvitationResponse {
  data: {
    invitedEmail: string;
    companyName: string;
    membershipId: string;
    employmentStatus: "PLANNED" | "ACTIVE";
    status: "ACCEPTED";
  };
}

interface OverviewResponse {
  data: WorkspaceOverview;
}

interface EmployeesResponse {
  data: {
    items: WorkspaceEmployee[];
    total: number;
    date: string;
  };
}

interface TimeEventsResponse {
  data: {
    items: WorkspaceTimeEvent[];
    date: string;
  };
}


interface TimeEventCorrectionsResponse {
  data: { items: TimeEventCorrection[] };
}

interface CorrectTimeEventResponse {
  data: {
    eventId: string;
    originalOccurredAt: string;
    previousEffectiveOccurredAt: string;
    effectiveOccurredAt: string;
    correctionCount: number;
    reason: string;
  };
}

interface TasksResponse {
  data: {
    items: WorkspaceTask[];
    pending: number;
    inProgress: number;
    completed: number;
  };
}

function companyQuery(companyId: string, date?: string): string {
  const params = new URLSearchParams({ companyId });
  if (date) params.set("date", date);
  return params.toString();
}

export const workspaceApi = {
  getOverview(companyId: string, date?: string) {
    return apiRequest<OverviewResponse>(
      `/api/v1/workspace/overview?${companyQuery(companyId, date)}`,
    );
  },

  getEmployees(companyId: string, date?: string) {
    return apiRequest<EmployeesResponse>(
      `/api/v1/workspace/employees?${companyQuery(companyId, date)}`,
    );
  },

  getTimeEvents(companyId: string, date?: string) {
    return apiRequest<TimeEventsResponse>(
      `/api/v1/workspace/time-events?${companyQuery(companyId, date)}`,
    );
  },


  getTimeEventCorrections(companyId: string, eventId: string) {
    return apiRequest<TimeEventCorrectionsResponse>(
      `/api/v1/workspace/time-events/${encodeURIComponent(eventId)}/corrections?${companyQuery(companyId)}`,
    );
  },

  correctTimeEvent(
    companyId: string,
    csrfToken: string,
    eventId: string,
    input: CorrectTimeEventInput,
  ) {
    return apiRequest<CorrectTimeEventResponse>(
      `/api/v1/workspace/time-events/${encodeURIComponent(eventId)}/corrections?${companyQuery(companyId)}`,
      { method: "POST", csrfToken, body: input },
    );
  },

  getTasks(companyId: string) {
    return apiRequest<TasksResponse>(
      `/api/v1/workspace/tasks?${companyQuery(companyId)}`,
    );
  },

  getMyClockStatus(companyId: string) {
    return apiRequest<MyClockResponse>(
      `/api/v1/workspace/my-clock?${companyQuery(companyId)}`,
    );
  },

  getMyTimeEvents(companyId: string, date?: string) {
    return apiRequest<TimeEventsResponse>(
      `/api/v1/workspace/my-clock/events?${companyQuery(companyId, date)}`,
    );
  },

  recordMyClockEvent(
    companyId: string,
    csrfToken: string,
    eventType: ClockEventType,
    idempotencyKey: string,
  ) {
    return apiRequest<MyClockResponse>(
      `/api/v1/workspace/my-clock/events?${companyQuery(companyId)}`,
      {
        method: "POST",
        csrfToken,
        body: { eventType, idempotencyKey },
      },
    );
  },

  getEmployeeInvitations(companyId: string) {
    return apiRequest<EmployeeInvitationsResponse>(
      `/api/v1/workspace/employee-invitations?${companyQuery(companyId)}`,
    );
  },

  createEmployeeInvitation(
    companyId: string,
    csrfToken: string,
    input: EmployeeInvitationInput,
  ) {
    return apiRequest<EmployeeInvitationResponse>(
      `/api/v1/workspace/employee-invitations?${companyQuery(companyId)}`,
      { method: "POST", csrfToken, body: input },
    );
  },

  renewEmployeeInvitation(
    companyId: string,
    csrfToken: string,
    invitationId: string,
  ) {
    return apiRequest<EmployeeInvitationResponse>(
      `/api/v1/workspace/employee-invitations/${encodeURIComponent(invitationId)}/renew?${companyQuery(companyId)}`,
      { method: "POST", csrfToken },
    );
  },

  getInvitation(token: string) {
    return apiRequest<InvitationDetailsResponse>(
      `/api/v1/invitations/${encodeURIComponent(token)}`,
    );
  },

  acceptInvitation(token: string, password: string) {
    return apiRequest<AcceptInvitationResponse>(
      `/api/v1/invitations/${encodeURIComponent(token)}/accept`,
      { method: "POST", body: { password } },
    );
  },

  acceptExistingInvitation(token: string, csrfToken: string) {
    return apiRequest<AcceptInvitationResponse>(
      `/api/v1/invitations/${encodeURIComponent(token)}/accept-existing`,
      { method: "POST", csrfToken },
    );
  },
};
