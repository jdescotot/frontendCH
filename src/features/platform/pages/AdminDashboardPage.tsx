import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { AppLogo } from "../../../shared/components/AppLogo";

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  if (!session?.platformAccess) return null;

  const displayName = session.person
    ? `${session.person.firstName} ${session.person.lastName}`.trim()
    : session.user.email;

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <AppLogo light />
        <div className="dashboard-header__actions">
          {session.memberships.length > 0 && (
            <button
              className="btn dashboard-ghost-button"
              onClick={() => navigate("/app/espacios")}
            >
              <i className="bi bi-grid" aria-hidden="true" />
              Cambiar espacio
            </button>
          )}
          <button className="btn dashboard-ghost-button" onClick={() => void logout()}>
            <i className="bi bi-box-arrow-right" aria-hidden="true" />
            Salir
          </button>
        </div>
      </header>

      <section className="dashboard-content container-xl">
        <div className="dashboard-hero">
          <div>
            <span className="app-eyebrow">ADMINISTRACIÓN DE PLATAFORMA</span>
            <h1>Hola, {displayName}</h1>
            <p>
              Este espacio administra clientes y configuración global sin mezclar
              esos privilegios con los roles de cada empresa.
            </p>
          </div>
          <span className="dashboard-status">
            <span /> {session.platformAccess.roleName}
          </span>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <article className="dashboard-card dashboard-card--company">
              <span className="dashboard-card__icon">
                <i className="bi bi-shield-check" aria-hidden="true" />
              </span>
              <div>
                <small>Rol de plataforma</small>
                <h2>{session.platformAccess.roleName}</h2>
                <p className="mb-0">
                  {session.platformAccess.permissions.length} permisos efectivos asignados.
                </p>
              </div>
            </article>
          </div>

          <div className="col-12 col-lg-5">
            <article className="dashboard-card">
              <small>Seguridad administrativa</small>
              <h2>{session.platformAccess.mfaRequired ? "MFA requerido" : "MFA opcional"}</h2>
              <p>
                La exigencia está registrada en el backend. Activaremos el flujo MFA
                antes de habilitar operaciones administrativas críticas.
              </p>
            </article>
          </div>

          <div className="col-12">
            <article className="dashboard-card">
              <small>Siguiente módulo</small>
              <h2>Clientes y propietarios</h2>
              <p className="mb-0">
                Aquí incorporaremos la creación de empresas, invitación del primer
                propietario y administración de cuentas de plataforma.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
