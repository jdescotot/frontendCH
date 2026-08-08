import { useAuth } from "../../../app/providers/AuthProvider";
import { AppLogo } from "../../../shared/components/AppLogo";

export function NoCompanyPage() {
  const { logout } = useAuth();

  return (
    <main className="app-page app-page--centered">
      <section className="empty-state-card text-center">
        <div className="d-flex justify-content-center mb-4">
          <AppLogo />
        </div>
        <span className="empty-state-card__icon">
          <i className="bi bi-buildings" aria-hidden="true" />
        </span>
        <h1>Tu cuenta todavía no tiene empresa</h1>
        <p>
          Un propietario o gerente debe invitarte o relacionar tu cuenta con una
          empresa antes de poder continuar.
        </p>
        <button className="btn login-submit" onClick={() => void logout()}>
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}
