import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { CompanySelectionPage } from "../features/company/pages/CompanySelectionPage";
import { NoCompanyPage } from "../features/company/pages/NoCompanyPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { AdminDashboardPage } from "../features/platform/pages/AdminDashboardPage";
import { AdminCompaniesPage } from "../features/platform/pages/AdminCompaniesPage";
import { WorkspaceShell } from "../features/workspace/components/WorkspaceShell";
import { EmployeesPage } from "../features/workspace/pages/EmployeesPage";
import { TasksPage } from "../features/workspace/pages/TasksPage";
import { TimeTrackingPage } from "../features/workspace/pages/TimeTrackingPage";
import { WorkspaceSelectionPage } from "../features/workspace/pages/WorkspaceSelectionPage";
import { AppEntry } from "./routes/AppEntry";
import { PlatformAdminRoute } from "./routes/PlatformAdminRoute";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicOnlyRoute } from "./routes/PublicOnlyRoute";

export const router = createBrowserRouter([
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
          { path: "/app/tareas", element: <TasksPage /> },
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
