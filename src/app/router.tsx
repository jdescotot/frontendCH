import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { CompanySelectionPage } from "../features/company/pages/CompanySelectionPage";
import { NoCompanyPage } from "../features/company/pages/NoCompanyPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { AdminDashboardPage } from "../features/platform/pages/AdminDashboardPage";
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
      { path: "/app/inicio", element: <DashboardPage /> },
      { path: "/app/sin-empresa", element: <NoCompanyPage /> },
      {
        element: <PlatformAdminRoute />,
        children: [{ path: "/admin", element: <AdminDashboardPage /> }],
      },
    ],
  },
  { path: "/", element: <Navigate to="/app" replace /> },
  { path: "*", element: <Navigate to="/app" replace /> },
]);
