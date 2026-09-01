import { apiBinaryRequest, apiBlobRequest, apiRequest } from "../../../shared/api/httpClient";

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
  jobApplicationId?: string | null;
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
  taskId: string;
  membershipId: string;
  title: string;
  description: string | null;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
  occurrenceStatus?: string;
  assigneeName: string;
  dueAt: string | null;
  requiresPhoto: boolean;
  hasEvidence: boolean;
  workCenter: string | null;
}

export interface TaskCaptureSession {
  captureId: string;
  captureToken: string;
  serverTime: string;
  expiresAt: string;
  maxBytes: number;
  mimeTypes: string[];
}

export interface WorkCenter {
  id: string;
  code: string;
  name: string;
  timeZone: string;
}

export interface WorkspaceShift {
  id: string;
  membershipId: string;
  employeeName: string;
  jobTitle: string | null;
  workCenterId: string;
  workCenterName: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  plannedBreakMinutes: number;
  status: "DRAFT" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  notes: string | null;
}

export interface ShiftInput {
  membershipId: string;
  workCenterId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  plannedBreakMinutes: number;
  notes?: string | null;
}

export interface EmployeeDetailEvent {
  id: string;
  eventType: ClockEventType;
  originalOccurredAt: string;
  effectiveOccurredAt: string;
  corrected: boolean;
}

export interface EmployeeDetail {
  membershipId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  taxId: string | null;
  phone: string | null;
  jobTitle: string | null;
  professionalCategory: string | null;
  contractType: string | null;
  employeeNumber: string | null;
  weeklyMinutes: number | null;
  membershipStatus: string;
  employmentStatus: string;
  startedOn: string;
  endedOn: string | null;
  roles: string[];
  companyName: string;
  workCenter: { id: string; name: string } | null;
  summary: {
    clockState: "IDLE" | "WORKING" | "BREAK";
    workedTodaySeconds: number;
    workedPeriodSeconds: number;
    lastEvent: EmployeeDetailEvent | null;
    todayShift: WorkspaceShift | null;
    pendingTasks: number;
    pendingLeaveRequests: number;
  };
  recentEvents: EmployeeDetailEvent[];
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  priority: WorkspaceTask["priority"];
  dueAt?: string | null;
  workCenterId?: string | null;
  membershipIds: string[];
  requiresPhoto: boolean;
}

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  unit: "DAYS" | "HOURS" | "MINUTES";
  requiresApproval: boolean;
  paid: boolean;
}

export interface LeaveRequest {
  id: string;
  membershipId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  requestedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
}

export interface AttendanceReport {
  from: string;
  to: string;
  timeZone: string;
  totals: {
    workedSeconds: number;
    breakSeconds: number;
    employees: number;
    sessions: number;
    correctedEvents: number;
  };
  days: Array<{ date: string; workedSeconds: number; breakSeconds: number; employees: number }>;
  items: Array<{
    membershipId: string;
    employeeName: string;
    jobTitle: string;
    workedSeconds: number;
    breakSeconds: number;
    sessions: number;
  }>;
  events: Array<{
    id: string;
    membershipId: string;
    employeeName: string;
    eventType: ClockEventType;
    originalOccurredAt: string;
    effectiveOccurredAt: string;
    correctionReason: string | null;
    corrected: boolean;
  }>;
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
    rejected: number;
    photoEvidenceAvailable: boolean;
  };
}

interface EmployeeDetailResponse { data: EmployeeDetail }
interface WorkCentersResponse { data: { items: WorkCenter[] } }
interface ShiftsResponse { data: { items: WorkspaceShift[]; from: string; to: string } }
interface LeaveTypesResponse { data: { items: LeaveType[] } }
interface LeaveRequestsResponse { data: { items: LeaveRequest[] } }
interface AttendanceReportResponse { data: AttendanceReport }

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

  getEmployee(companyId: string, membershipId: string) {
    return apiRequest<EmployeeDetailResponse>(
      `/api/v1/workspace/employees/${encodeURIComponent(membershipId)}?${companyQuery(companyId)}`,
    );
  },

  getWorkCenters(companyId: string) {
    return apiRequest<WorkCentersResponse>(
      `/api/v1/workspace/work-centers?${companyQuery(companyId)}`,
    );
  },

  getShifts(companyId: string, from: string, to: string) {
    const params = new URLSearchParams({ companyId, from, to });
    return apiRequest<ShiftsResponse>(`/api/v1/workspace/shifts?${params.toString()}`);
  },

  createShift(companyId: string, csrfToken: string, input: ShiftInput) {
    return apiRequest<{ data: { id: string } }>(
      `/api/v1/workspace/shifts?${companyQuery(companyId)}`,
      { method: "POST", csrfToken, body: input },
    );
  },

  updateShift(companyId: string, csrfToken: string, shiftId: string, input: ShiftInput) {
    return apiRequest<void>(
      `/api/v1/workspace/shifts/${encodeURIComponent(shiftId)}?${companyQuery(companyId)}`,
      { method: "PUT", csrfToken, body: input },
    );
  },

  cancelShift(companyId: string, csrfToken: string, shiftId: string) {
    return apiRequest<void>(
      `/api/v1/workspace/shifts/${encodeURIComponent(shiftId)}?${companyQuery(companyId)}`,
      { method: "DELETE", csrfToken },
    );
  },

  createTask(companyId: string, csrfToken: string, input: CreateTaskInput) {
    return apiRequest<{ data: { id: string } }>(
      `/api/v1/workspace/tasks?${companyQuery(companyId)}`,
      { method: "POST", csrfToken, body: input },
    );
  },

  updateTaskAssignment(
    companyId: string,
    csrfToken: string,
    assignmentId: string,
    status: WorkspaceTask["status"],
    note?: string,
  ) {
    return apiRequest<void>(
      `/api/v1/workspace/task-assignments/${encodeURIComponent(assignmentId)}?${companyQuery(companyId)}`,
      { method: "PATCH", csrfToken, body: { status, note: note || null } },
    );
  },

  cancelTask(companyId: string, csrfToken: string, taskId: string) {
    return apiRequest<void>(
      `/api/v1/workspace/tasks/${encodeURIComponent(taskId)}?${companyQuery(companyId)}`,
      { method: "DELETE", csrfToken },
    );
  },

  createTaskCaptureSession(companyId: string, csrfToken: string, assignmentId: string) {
    return apiRequest<{ data: TaskCaptureSession }>(
      `/api/v1/workspace/task-assignments/${encodeURIComponent(assignmentId)}/capture-sessions?${companyQuery(companyId)}`,
      { method: "POST", csrfToken, body: {} },
    );
  },

  uploadTaskEvidence(
    companyId: string,
    csrfToken: string,
    capture: TaskCaptureSession,
    photo: Blob,
    capturedAt: string,
  ) {
    return apiBinaryRequest<{ data: { id: string; status: string; reviewStatus: string } }>(
      `/api/v1/workspace/task-captures/${encodeURIComponent(capture.captureId)}/evidence?${companyQuery(companyId)}`,
      photo,
      { csrfToken, headers: { "X-Capture-Token": capture.captureToken, "X-Captured-At": capturedAt } },
    );
  },

  getTaskEvidence(companyId: string, assignmentId: string) {
    return apiBlobRequest(
      `/api/v1/workspace/task-assignments/${encodeURIComponent(assignmentId)}/evidence?${companyQuery(companyId)}`,
    );
  },

  getLeaveTypes(companyId: string) {
    return apiRequest<LeaveTypesResponse>(
      `/api/v1/workspace/leave-types?${companyQuery(companyId)}`,
    );
  },

  getLeaveRequests(companyId: string) {
    return apiRequest<LeaveRequestsResponse>(
      `/api/v1/workspace/leave-requests?${companyQuery(companyId)}`,
    );
  },

  createLeaveRequest(
    companyId: string,
    csrfToken: string,
    input: { leaveTypeId: string; startDate: string; endDate: string; reason?: string | null },
  ) {
    return apiRequest<{ data: { id: string; status: string } }>(
      `/api/v1/workspace/leave-requests?${companyQuery(companyId)}`,
      { method: "POST", csrfToken, body: input },
    );
  },

  reviewLeaveRequest(
    companyId: string,
    csrfToken: string,
    requestId: string,
    status: "APPROVED" | "REJECTED",
    note?: string,
  ) {
    return apiRequest<void>(
      `/api/v1/workspace/leave-requests/${encodeURIComponent(requestId)}?${companyQuery(companyId)}`,
      { method: "PATCH", csrfToken, body: { status, note: note || null } },
    );
  },

  getAttendanceReport(companyId: string, from: string, to: string) {
    const params = new URLSearchParams({ companyId, from, to });
    return apiRequest<AttendanceReportResponse>(
      `/api/v1/workspace/reports/attendance?${params.toString()}`,
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
