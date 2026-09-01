import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { AppLogo } from "../../../shared/components/AppLogo";

const employeeNavItems = [
  { to: "/app/inicio", label: "Inicio", icon: "bi-grid-1x2" },
  { to: "/app/fichajes", label: "Fichajes", icon: "bi-clock-history" },
  { to: "/app/turnos", label: "Turnos", icon: "bi-calendar-week" },
  { to: "/app/tareas", label: "Tareas", icon: "bi-check2-square" },
  { to: "/app/vacaciones", label: "Vacaciones", icon: "bi-sun" },
];

const managerNavItems = [
  { to: "/app/inicio", label: "Inicio", icon: "bi-grid-1x2" },
  { to: "/app/empleados", label: "Empleados", icon: "bi-people" },
  { to: "/app/fichajes", label: "Fichajes", icon: "bi-clock-history" },
  { to: "/app/turnos", label: "Turnos", icon: "bi-calendar-week" },
  { to: "/app/tareas", label: "Tareas", icon: "bi-check2-square" },
  { to: "/app/vacaciones", label: "Vacaciones", icon: "bi-sun" },
  { to: "/app/reportes", label: "Reportes", icon: "bi-bar-chart" },
  { to: "/app/empleos", label: "Empleos", icon: "bi-briefcase" },
];

const managerMobileNavItems = [
  { to: "/app/inicio", label: "Inicio", icon: "bi-grid-1x2" },
  { to: "/app/empleados", label: "Empleados", icon: "bi-people" },
  { to: "/app/turnos", label: "Turnos", icon: "bi-calendar-week" },
  { to: "/app/tareas", label: "Tareas", icon: "bi-check2-square" },
  { to: "/app/mas", label: "Más", icon: "bi-three-dots" },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function WorkspaceShell() {
  const navigate = useNavigate();
  const { session, selectedMembership, clearSelectedMembership, logout } = useAuth();

  if (!session) return null;
  if (!selectedMembership) {
    return <Navigate to={session.platformAccess ? "/app/espacios" : "/app/empresas"} replace />;
  }

  const currentSession = session;
  const currentMembership = selectedMembership;
  const canManage = currentMembership.roles.some((role) => role === "OWNER" || role === "MANAGER");
  const desktopNavItems = canManage ? managerNavItems : employeeNavItems;
  const mobileNavItems = canManage ? managerMobileNavItems : employeeNavItems;
  const displayName = currentSession.person
    ? `${currentSession.person.firstName} ${currentSession.person.lastName}`.trim()
    : currentSession.user.email;

  function changeWorkspace() {
    clearSelectedMembership();
    navigate(currentSession.platformAccess ? "/app/espacios" : "/app/empresas");
  }

  return (
    <div className="workspace-shell">
      <header className="workspace-topbar">
        <div className="workspace-topbar__brand">
          <AppLogo light />
          <div className="workspace-topbar__context d-none d-lg-block">
            <span>ESPACIO DE TRABAJO</span>
            <strong>{currentMembership.companyName}</strong>
          </div>
        </div>

        <nav className="workspace-desktop-nav d-none d-xxl-flex" aria-label="Navegación principal">
          {desktopNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `workspace-nav-link${isActive ? " workspace-nav-link--active" : ""}`
              }
            >
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="workspace-user">
          <button
            type="button"
            className="workspace-company-switch d-none d-md-flex"
            onClick={changeWorkspace}
            title="Cambiar de espacio"
          >
            <span>
              <small>Empresa activa</small>
              <strong>{currentMembership.companyName}</strong>
            </span>
            <i className="bi bi-chevron-expand" aria-hidden="true" />
          </button>

          <div className="workspace-user__avatar" title={displayName}>
            {initials(displayName) || "U"}
          </div>

          <button
            type="button"
            className="workspace-icon-button"
            onClick={() => void logout()}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <i className="bi bi-box-arrow-right" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="workspace-mobile-company d-md-none">
        <button type="button" onClick={changeWorkspace}>
          <span>
            <small>Empresa</small>
            <strong>{currentMembership.companyName}</strong>
          </span>
          <i className="bi bi-chevron-down" aria-hidden="true" />
        </button>
      </div>

      <main className="workspace-main">
        <Outlet />
      </main>

      <nav className="workspace-mobile-nav d-xxl-none" aria-label="Navegación móvil">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `workspace-mobile-nav__link${isActive ? " workspace-mobile-nav__link--active" : ""}`
            }
          >
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
