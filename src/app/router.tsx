import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { CompanySelectionPage } from "../features/company/pages/CompanySelectionPage";
import { NoCompanyPage } from "../features/company/pages/NoCompanyPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { AdminDashboardPage } from "../features/platform/pages/AdminDashboardPage";
import { AdminCompaniesPage } from "../features/platform/pages/AdminCompaniesPage";
import { WorkspaceShell } from "../features/workspace/components/WorkspaceShell";
import { EmployeesPage } from "../features/workspace/pages/EmployeesPage";
import { EmployeeDetailPage } from "../features/workspace/pages/EmployeeDetailPage";
import { LeavePage } from "../features/workspace/pages/LeavePage";
import { MorePage } from "../features/workspace/pages/MorePage";
import { ReportsPage } from "../features/workspace/pages/ReportsPage";
import { ShiftsPage } from "../features/workspace/pages/ShiftsPage";
import { TasksPage } from "../features/workspace/pages/TasksPage";
import { TimeTrackingPage } from "../features/workspace/pages/TimeTrackingPage";
import { WorkspaceSelectionPage } from "../features/workspace/pages/WorkspaceSelectionPage";
import { InvitationActivationPage } from "../features/workspace/pages/InvitationActivationPage";
import { AppEntry } from "./routes/AppEntry";
import { PlatformAdminRoute } from "./routes/PlatformAdminRoute";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicOnlyRoute } from "./routes/PublicOnlyRoute";

export const router = createBrowserRouter([
  { path: "/activar-invitacion", element: <InvitationActivationPage /> },
  {
    element: <PublicOnlyRoute />,
    children: [{ path: "/login", element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/app", element: <AppEntry /> },
      { path: "/app/espacios", element: <WorkspaceSelectionPage /> },
      { path: "/app/empresas", element: <CompanySelectionPage /> },
      { path: "/app/sin-empresa", element: <NoCompanyPage /> },
      {
        element: <WorkspaceShell />,
        children: [
          { path: "/app/inicio", element: <DashboardPage /> },
          { path: "/app/fichajes", element: <TimeTrackingPage /> },
          { path: "/app/empleados", element: <EmployeesPage /> },
          { path: "/app/empleados/:membershipId", element: <EmployeeDetailPage /> },
          { path: "/app/turnos", element: <ShiftsPage /> },
          { path: "/app/tareas", element: <TasksPage /> },
          { path: "/app/vacaciones", element: <LeavePage /> },
          { path: "/app/reportes", element: <ReportsPage /> },
          { path: "/app/mas", element: <MorePage /> },
        ],
      },
      {
        element: <PlatformAdminRoute />,
        children: [
          { path: "/admin", element: <AdminDashboardPage /> },
          { path: "/admin/empresas", element: <AdminCompaniesPage /> },
        ],
      },
    ],
  },
  { path: "/", element: <Navigate to="/app" replace /> },
  { path: "*", element: <Navigate to="/app" replace /> },
]);
