import { Navigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export function AppEntry() {
  const { session, selectedMembership } = useAuth();

  if (!session) {
    return null;
  }

  if (session.platformAccess && session.memberships.length > 0) {
    return <Navigate to="/app/espacios" replace />;
  }

  if (session.platformAccess && session.memberships.length === 0) {
    return <Navigate to="/admin" replace />;
  }

  if (session.memberships.length === 0) {
    return <Navigate to="/app/sin-empresa" replace />;
  }

  if (!selectedMembership) {
    return <Navigate to="/app/empresas" replace />;
  }

  return <Navigate to="/app/inicio" replace />;
}
