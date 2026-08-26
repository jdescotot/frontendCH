import { useState, type PropsWithChildren, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { AppLogo } from "../../../shared/components/AppLogo";

interface PlatformShellProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

const navigation = [
  { to: "/admin", icon: "bi-grid-1x2", label: "Resumen", end: true },
  { to: "/admin/empresas", icon: "bi-buildings", label: "Empresas" },
];

export function PlatformShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: PlatformShellProps) {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const platformAccess = session?.platformAccess;

  if (!session || !platformAccess) return null;

  const currentSession = session;

  const displayName = currentSession.person
    ? `${currentSession.person.firstName} ${currentSession.person.lastName}`.trim()
    : currentSession.user.email;

  const roleName = platformAccess.roleName;

  function changeWorkspace() {
    setMobileOpen(false);
    navigate(currentSession.memberships.length > 0 ? "/app/espacios" : "/app");
  }

  return (
    <div className="platform-shell">
      <aside className={`platform-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="platform-sidebar__brand">
          <AppLogo light />
          <button
            type="button"
            className="platform-icon-button d-lg-none"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        <div className="platform-sidebar__context">
          <span>Plataforma</span>
          <strong>{roleName}</strong>
        </div>

        <nav className="platform-nav" aria-label="Administración de plataforma">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `platform-nav__link ${isActive ? "is-active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="platform-nav__separator" />

          <button type="button" className="platform-nav__link is-disabled" disabled>
            <i className="bi bi-person-plus" aria-hidden="true" />
            <span>Nuevo cliente</span>
            <small>MFA</small>
          </button>
          <button type="button" className="platform-nav__link is-disabled" disabled>
            <i className="bi bi-shield-check" aria-hidden="true" />
            <span>Administradores</span>
            <small>MFA</small>
          </button>
          <button type="button" className="platform-nav__link is-disabled" disabled>
            <i className="bi bi-journal-text" aria-hidden="true" />
            <span>Auditoría</span>
            <small>MFA</small>
          </button>
        </nav>

        <div className="platform-sidebar__footer">
          <button type="button" className="platform-workspace-button" onClick={changeWorkspace}>
            <i className="bi bi-arrow-left-right" aria-hidden="true" />
            <span>Cambiar espacio</span>
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="platform-sidebar-backdrop d-lg-none"
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="platform-main">
        <header className="platform-topbar">
          <button
            type="button"
            className="platform-icon-button d-lg-none"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
          >
            <i className="bi bi-list" aria-hidden="true" />
          </button>

          <div className="platform-topbar__user">
            <span className="platform-avatar" aria-hidden="true">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <div>
              <strong>{displayName}</strong>
              <small>{currentSession.user.email}</small>
            </div>
          </div>

          <button type="button" className="platform-topbar__logout" onClick={() => void logout()}>
            <i className="bi bi-box-arrow-right" aria-hidden="true" />
            <span className="d-none d-sm-inline">Cerrar sesión</span>
          </button>
        </header>

        <main className="platform-content">
          <div className="platform-page-heading">
            <div>
              <span className="app-eyebrow">{eyebrow}</span>
              <h1>{title}</h1>
              {description && <p>{description}</p>}
            </div>
            {actions && <div className="platform-page-heading__actions">{actions}</div>}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
