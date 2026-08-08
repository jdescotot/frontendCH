import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { FullPageLoader } from "../../shared/components/FullPageLoader";

export function PublicOnlyRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return <FullPageLoader />;
  }

  if (status === "authenticated") {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
