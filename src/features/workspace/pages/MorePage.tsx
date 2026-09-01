import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";

const destinations = [
  { to: "/app/fichajes", icon: "bi-clock-history", title: "Fichajes", description: "Consulta jornadas, marcas originales y correcciones." },
  { to: "/app/vacaciones", icon: "bi-sun", title: "Vacaciones", description: "Solicita ausencias y revisa las peticiones del equipo." },
  { to: "/app/reportes", icon: "bi-bar-chart", title: "Reportes", description: "Analiza horas por fecha, empleado y centro de trabajo." },
  { to: "/app/empleos", icon: "bi-briefcase", title: "Portal de empleo", description: "Publica ofertas, revisa candidaturas y conversa con candidatos." },
];

export function MorePage() {
  const { selectedMembership } = useAuth();
  const canManage = selectedMembership?.roles.some((role) => role === "OWNER" || role === "MANAGER") ?? false;

  if (!canManage) return <Navigate to="/app/inicio" replace />;

  return (
    <section className="workspace-page container-xxl more-page">
      <div className="workspace-page-heading">
        <span className="workspace-eyebrow">HERRAMIENTAS</span>
        <h1>Más opciones</h1>
        <p>Accede a la actividad diaria, las ausencias y los reportes de tu empresa.</p>
      </div>
      <div className="more-grid">
        {destinations.map((item) => (
          <Link className="more-card" to={item.to} key={item.to}>
            <span className="more-card__icon"><i className={`bi ${item.icon}`} /></span>
            <span className="more-card__copy"><strong>{item.title}</strong><small>{item.description}</small></span>
            <i className="bi bi-chevron-right more-card__arrow" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
