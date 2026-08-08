import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export function PlatformAdminRoute() {
  const { session } = useAuth();

  if (!session?.platformAccess) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
