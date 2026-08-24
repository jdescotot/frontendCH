import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ApiError } from "../../../shared/api/apiError";
import { PlatformShell } from "../components/PlatformShell";
import { platformApi, type PlatformSummary } from "../api/platformApi";

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      try {
        setLoading(true);
        const response = await platformApi.getSummary();
        if (!active) return;
        setSummary(response.data);
        setError("");
      } catch (requestError) {
        if (!active) return;
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "No se pudo cargar el resumen de plataforma.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSummary();
    return () => {
      active = false;
    };
  }, []);

  if (!session?.platformAccess) return null;

  const cards = [
    {
      label: "Empresas",
      value: summary?.companies.total,
      detail: summary ? `${summary.companies.active} activas` : "",
      icon: "bi-buildings",
    },
    {
      label: "Usuarios",
      value: summary?.users.total,
      detail: summary ? `${summary.users.active} activos` : "",
      icon: "bi-people",
    },
    {
      label: "Membresías",
      value: summary?.memberships.active,
      detail: "activas",
      icon: "bi-person-vcard",
    },
    {
      label: "Administradores",
      value: summary?.platformAdmins.total,
      detail: summary ? `${summary.platformAdmins.active} activos` : "",
      icon: "bi-shield-check",
    },
  ];

  return (
    <PlatformShell
      eyebrow="ADMINISTRACIÓN DE PLATAFORMA"
      title="Resumen"
      description="Visión global de clientes, usuarios y acceso administrativo sin mezclar permisos de empresa."
      actions={
        <button
          type="button"
          className="btn platform-primary-button"
          onClick={() => navigate("/admin/empresas")}
        >
          <i className="bi bi-buildings" aria-hidden="true" />
          Ver empresas
        </button>
      }
    >
      {error && (
        <div className="platform-alert" role="alert">
          <i className="bi bi-exclamation-triangle" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <section className="platform-stat-grid" aria-label="Indicadores de plataforma">
        {cards.map((card) => (
          <article className="platform-stat-card" key={card.label}>
            <span className="platform-stat-card__icon">
              <i className={`bi ${card.icon}`} aria-hidden="true" />
            </span>
            <div>
              <small>{card.label}</small>
              <strong>{loading ? "—" : card.value ?? 0}</strong>
              <span>{loading ? "Cargando…" : card.detail}</span>
            </div>
          </article>
        ))}
      </section>

      <div className="row g-4 mt-1">
        <div className="col-12 col-xl-7">
          <article className="platform-panel platform-panel--accent">
            <div className="platform-panel__heading">
              <div>
                <span className="app-eyebrow">SIGUIENTE PASO</span>
                <h2>Gestionar clientes</h2>
              </div>
              <span className="platform-panel__icon">
                <i className="bi bi-building-add" aria-hidden="true" />
              </span>
            </div>
            <p>
              Ya podemos consultar empresas reales desde MySQL. La creación de nuevos
              clientes quedará habilitada cuando implementemos MFA para las acciones
              sensibles del SUPER_ADMIN.
            </p>
            <button
              type="button"
              className="platform-link-button"
              onClick={() => navigate("/admin/empresas")}
            >
              Abrir directorio de empresas
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </button>
          </article>
        </div>

        <div className="col-12 col-xl-5">
          <article className="platform-panel">
            <div className="platform-security-heading">
              <span className="platform-security-icon">
                <i className="bi bi-shield-lock" aria-hidden="true" />
              </span>
              <div>
                <small>Seguridad administrativa</small>
                <h2>{session.platformAccess.mfaRequired ? "MFA requerido" : "MFA opcional"}</h2>
              </div>
            </div>
            <p>
              El backend ya marca este acceso como administrativo. Las operaciones
              críticas seguirán deshabilitadas hasta completar el segundo factor.
            </p>
            <div className="role-pills">
              <span>{session.platformAccess.roleCode}</span>
              <span>{session.platformAccess.permissions.length} permisos</span>
            </div>
          </article>
        </div>
      </div>
    </PlatformShell>
  );
}
