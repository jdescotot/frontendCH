import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { AppLogo } from "../../../shared/components/AppLogo";

export function CompanySelectionPage() {
  const navigate = useNavigate();
  const { session, selectMembership, logout } = useAuth();

  if (!session) return null;

  function choose(membershipId: string) {
    selectMembership(membershipId);
    navigate("/app/inicio", { replace: true });
  }

  return (
    <main className="app-page app-page--centered">
      <section className="company-selector-card">
        <div className="d-flex align-items-center justify-content-between gap-3 mb-5">
          <AppLogo />
          <button className="btn btn-link app-link" onClick={() => void logout()}>
            Cerrar sesión
          </button>
        </div>

        <span className="app-eyebrow">ESPACIO DE TRABAJO</span>
        <h1>Selecciona una empresa</h1>
        <p className="app-muted mb-4">
          Tu cuenta está relacionada con varias empresas. Elige con cuál quieres
          trabajar ahora.
        </p>

        <div className="company-list">
          {session.memberships.map((membership) => (
            <button
              key={membership.id}
              type="button"
              className="company-option"
              onClick={() => choose(membership.id)}
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
