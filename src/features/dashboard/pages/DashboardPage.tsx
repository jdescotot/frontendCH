import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { AppLogo } from "../../../shared/components/AppLogo";

export function DashboardPage() {
  const navigate = useNavigate();

  const {
    session,
    selectedMembership,
    clearSelectedMembership,
    logout,
    logoutAll,
  } = useAuth();

  if (!session || !selectedMembership) {
    return null;
  }


  const currentSession = session;
  const currentMembership = selectedMembership;

  const displayName = currentSession.person
    ? `${currentSession.person.firstName} ${currentSession.person.lastName}`.trim()
    : currentSession.user.email;

  function changeCompany() {
    clearSelectedMembership();

    navigate(
      currentSession.platformAccess
        ? "/app/espacios"
        : "/app/empresas",
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <AppLogo light />

        <div className="dashboard-header__actions">
          {(currentSession.memberships.length > 1 ||
            currentSession.platformAccess) && (
            <button
              type="button"
              className="btn dashboard-ghost-button"
              onClick={changeCompany}
            >
              <i
                className="bi bi-arrow-left-right"
                aria-hidden="true"
              />
              Cambiar espacio
            </button>
          )}

          <button
            type="button"
            className="btn dashboard-ghost-button"
            onClick={() => void logout()}
          >
            <i
              className="bi bi-box-arrow-right"
              aria-hidden="true"
            />
            Salir
          </button>
        </div>
      </header>

      <section className="dashboard-content container-xl">
        <div className="dashboard-hero">
          <div>
            <span className="app-eyebrow">
              TU ESPACIO DE TRABAJO
            </span>

            <h1>Hola, {displayName}</h1>

            <p>
              Estás trabajando en {currentMembership.companyName}. Los módulos
              que aparezcan aquí respetarán tus roles y permisos dentro de esta
              empresa.
            </p>
          </div>

          <span className="dashboard-status">
            <span />
            Sesión activa
          </span>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <article className="dashboard-card dashboard-card--company">
              <span className="dashboard-card__icon">
                <i
                  className="bi bi-building"
                  aria-hidden="true"
                />
              </span>

              <div>
                <small>Empresa seleccionada</small>

                <h2>{currentMembership.companyName}</h2>

                <div className="role-pills">
                  {currentMembership.roles.map((role) => (
                    <span key={role}>{role}</span>
                  ))}
                </div>
              </div>
            </article>
          </div>

          <div className="col-12 col-lg-5">
            <article className="dashboard-card">
              <small>Sesión</small>

              <h2>
                {new Date(
                  currentSession.sessionExpiresAt,
                ).toLocaleString("es-ES")}
              </h2>

              <p>
                La sesión se mantiene mediante una cookie HttpOnly gestionada
                por Go.
              </p>
            </article>
          </div>

          <div className="col-12 col-md-4">
            <article className="dashboard-card module-card">
              <span className="module-card__icon">
                <i
                  className="bi bi-clock-history"
                  aria-hidden="true"
                />
              </span>

              <small>Control horario</small>

              <h2>Fichajes</h2>

              <p>
                Entradas, salidas y correcciones auditadas.
              </p>

              <span className="module-card__status">
                Preparado para integrar
              </span>
            </article>
          </div>

          <div className="col-12 col-md-4">
            <article className="dashboard-card module-card">
              <span className="module-card__icon">
                <i
                  className="bi bi-check2-square"
                  aria-hidden="true"
                />
              </span>

              <small>Organización</small>

              <h2>Tareas</h2>

              <p>
                Asignaciones, recurrencias y evidencias fotográficas.
              </p>

              <span className="module-card__status">
                Preparado para integrar
              </span>
            </article>
          </div>

          <div className="col-12 col-md-4">
            <article className="dashboard-card module-card">
              <span className="module-card__icon">
                <i
                  className="bi bi-people"
                  aria-hidden="true"
                />
              </span>

              <small>Equipo</small>

              <h2>Empleados</h2>

              <p>
                Personas, invitaciones, roles y relaciones laborales.
              </p>

              <span className="module-card__status">
                Preparado para integrar
              </span>
            </article>
          </div>

          <div className="col-12">
            <article className="dashboard-card">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div>
                  <small>Seguridad</small>

                  <h2>Cerrar todas las sesiones</h2>

                  <p className="mb-0">
                    Revoca también las sesiones abiertas en otros dispositivos.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-danger rounded-3 px-4"
                  onClick={() => void logoutAll()}
                >
                  Cerrar en todos los dispositivos
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}