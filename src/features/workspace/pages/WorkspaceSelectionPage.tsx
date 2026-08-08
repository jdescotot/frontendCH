import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { AppLogo } from "../../../shared/components/AppLogo";

export function WorkspaceSelectionPage() {
  const navigate = useNavigate();
  const { session, selectMembership, logout } = useAuth();

  if (!session) return null;

  function chooseCompany(membershipId: string) {
    selectMembership(membershipId);
    navigate("/app/inicio", { replace: true });
  }

  return (
    <main className="app-page app-page--centered">
      <section className="company-selector-card workspace-selector-card">
        <div className="d-flex align-items-center justify-content-between gap-3 mb-5">
          <AppLogo />
          <button className="btn btn-link app-link" onClick={() => void logout()}>
            Cerrar sesión
          </button>
        </div>

        <span className="app-eyebrow">SELECCIONA TU ESPACIO</span>
        <h1>¿Dónde quieres entrar?</h1>
        <p className="app-muted mb-4">
          Tu cuenta tiene acceso a distintos contextos. Cada uno mantiene sus
          permisos y datos separados.
        </p>

        <div className="company-list">
          {session.platformAccess && (
            <button
              type="button"
              className="company-option company-option--platform"
              onClick={() => navigate("/admin")}
            >
              <span className="company-option__mark">
                <i className="bi bi-shield-lock" aria-hidden="true" />
              </span>
              <span className="company-option__body">
                <strong>Administración de plataforma</strong>
                <small>{session.platformAccess.roleName}</small>
              </span>
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </button>
          )}

          {session.memberships.map((membership) => (
            <button
              key={membership.id}
              type="button"
              className="company-option"
              onClick={() => chooseCompany(membership.id)}
            >
              <span className="company-option__mark">
                {membership.companyName.charAt(0).toUpperCase()}
              </span>
              <span className="company-option__body">
                <strong>{membership.companyName}</strong>
                <small>{membership.roles.join(" · ")}</small>
              </span>
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
