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
  source: string;
  note: string | null;
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

  getTasks(companyId: string) {
    return apiRequest<TasksResponse>(
      `/api/v1/workspace/tasks?${companyQuery(companyId)}`,
    );
  },
};
