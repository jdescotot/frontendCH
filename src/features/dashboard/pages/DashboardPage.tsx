import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ApiError } from "../../../shared/api/apiError";
import { MyClockCard } from "../../workspace/components/MyClockCard";
import {
  workspaceApi,
  type WorkspaceEmployee,
  type WorkspaceOverview,
} from "../../workspace/api/workspaceApi";

function formatDuration(seconds: number) {
  if (seconds <= 0) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function employeeStatus(status: WorkspaceEmployee["status"]) {
  switch (status) {
    case "WORKING":
      return { label: "En jornada", className: "is-working" };
    case "BREAK":
      return { label: "En descanso", className: "is-break" };
    case "FINISHED":
      return { label: "Jornada finalizada", className: "is-finished" };
    default:
      return { label: "Sin fichar", className: "is-pending" };
  }
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function DashboardPage() {
  const { session, selectedMembership } = useAuth();
  const [overview, setOverview] = useState<WorkspaceOverview | null>(null);
  const [employees, setEmployees] = useState<WorkspaceEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clockRevision, setClockRevision] = useState(0);

  const currentMembership = selectedMembership;
  const canManage = useMemo(
    () => currentMembership?.roles.some((role) => role === "OWNER" || role === "MANAGER") ?? false,
    [currentMembership],
  );
  useEffect(() => {
    const companyId = selectedMembership?.companyId;

    if (!companyId || !canManage) {
      setLoading(false);
      return;
    }

    const activeCompanyId: string = companyId;
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [overviewResponse, employeesResponse] = await Promise.all([
          workspaceApi.getOverview(activeCompanyId),
          workspaceApi.getEmployees(activeCompanyId),
        ]);

        if (!active) return;

        setOverview(overviewResponse.data);
        setEmployees(employeesResponse.data.items);
      } catch (requestError) {
        if (!active) return;
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "No se pudo cargar la actividad de la empresa.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboard();
    return () => { active = false; };
  }, [selectedMembership?.companyId, canManage, clockRevision]);

  if (!session || !currentMembership) return null;

  const displayName = session.person?.firstName || session.user.email;
  const today = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  if (!canManage) {
    return (
      <section className="workspace-page container-xxl">
        <div className="workspace-page-heading">
          <div>
            <span className="workspace-eyebrow">MI JORNADA</span>
            <h1>Hola, {displayName}</h1>
            <p>Registra tu entrada, descansos y salida, y consulta el tiempo trabajado de hoy.</p>
          </div>
        </div>
        <MyClockCard />
      </section>
    );
  }

  return (
    <section className="workspace-page workspace-page--dashboard container-xxl">
      <div className="owner-dashboard-grid">
        <article className="owner-hero-card">
          <div className="owner-hero-card__topline">
            <span className="owner-live-pill"><i /> SUPERVISIÓN EN TIEMPO REAL</span>
            <span className="owner-date-pill">{today.toUpperCase()}</span>
          </div>

          <div className="owner-hero-card__copy">
            <h1>Tu equipo,<br />todo bajo control.</h1>
            <p>
              Consulta quién ha fichado, quién está trabajando y qué tareas requieren atención
              desde un único panel operativo.
            </p>
          </div>

          <div className="owner-hero-card__metrics">
            <span><i className="bi bi-people" /> {overview?.totalEmployees ?? 0} empleados activos</span>
            <span><i className="bi bi-clock" /> {overview?.workingNow ?? 0} en jornada ahora</span>
            <span><i className="bi bi-check2-square" /> {overview?.pendingTasks ?? 0} tareas pendientes</span>
          </div>

          <div className="owner-hero-card__actions">
            <Link to="/app/fichajes" className="owner-action-button owner-action-button--primary">
              <i className="bi bi-clock-history" /> Ver fichajes
            </Link>
            <Link to="/app/tareas" className="owner-action-button">
              <i className="bi bi-check2-square" /> Tareas
            </Link>
            <Link to="/app/empleados" className="owner-action-button">
              <i className="bi bi-people" /> Equipo
            </Link>
          </div>
        </article>

        <div className="owner-kpi-grid">
          <article className="owner-kpi-card">
            <span>TOTAL EMPLEADOS</span>
            <strong>{overview?.totalEmployees ?? 0}</strong>
            <p>Relaciones laborales activas en la empresa.</p>
          </article>
          <article className="owner-kpi-card">
            <span>YA FICHARON HOY</span>
            <strong>{overview?.clockedInToday ?? 0}</strong>
            <p>Personas con al menos una entrada registrada.</p>
          </article>
          <article className="owner-kpi-card owner-kpi-card--success">
            <span>EN JORNADA</span>
            <strong>{overview?.workingNow ?? 0}</strong>
            <p>{overview?.onBreakNow ?? 0} en descanso en este momento.</p>
          </article>
          <article className="owner-kpi-card owner-kpi-card--warning">
            <span>PENDIENTES</span>
            <strong>{overview?.pendingClockIn ?? 0}</strong>
            <p>Sin entrada registrada durante el día de hoy.</p>
          </article>
        </div>
      </div>

      <MyClockCard onChanged={() => setClockRevision((value) => value + 1)} />

      {error && (
        <div className="workspace-alert" role="alert">
          <i className="bi bi-exclamation-circle" /> {error}
        </div>
      )}

      <article className="owner-team-card">
        <div className="owner-section-heading">
          <div>
            <span className="workspace-eyebrow">ACTIVIDAD DE HOY</span>
            <h2>Empleados</h2>
            <p>Estado actual, tiempo trabajado y roles dentro de la empresa.</p>
          </div>
          <div className="owner-section-heading__actions">
            <Link className="owner-action-button" to="/app/fichajes">
              <i className="bi bi-file-earmark-bar-graph" /> Reporte horario
            </Link>
            <Link className="owner-action-button owner-action-button--primary" to="/app/empleados">
              <i className="bi bi-person-plus" /> Gestionar empleados
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="owner-loading-state">
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            Cargando actividad…
          </div>
        ) : employees.length === 0 ? (
          <div className="workspace-empty-inline">
            <i className="bi bi-people" />
            <div><strong>No hay empleados activos todavía.</strong><span>Cuando añadas empleados aparecerán aquí.</span></div>
          </div>
        ) : (
          <div className="owner-employee-list">
            <div className="owner-employee-list__header d-none d-lg-grid">
              <span>Empleado</span><span>Estado hoy</span><span>Horas</span><span>Roles</span><span />
            </div>
            {employees.slice(0, 8).map((employee) => {
              const status = employeeStatus(employee.status);
              return (
                <div className="owner-employee-row" key={employee.membershipId}>
                  <div className="owner-employee-person">
                    <span className="owner-employee-avatar">{initials(employee.firstName, employee.lastName)}</span>
                    <div>
                      <strong>{employee.firstName} {employee.lastName}</strong>
                      <small>{employee.jobTitle || "Empleado"}</small>
                    </div>
                  </div>
                  <div><span className={`owner-status-pill ${status.className}`}>{status.label}</span></div>
                  <div className="owner-hours"><small className="d-lg-none">Hoy</small>{formatDuration(employee.workedSeconds)}</div>
                  <div className="owner-role-list">
                    {employee.roles.map((role) => <span key={role}>{role}</span>)}
                  </div>
                  <Link to="/app/empleados" className="owner-row-action" aria-label="Abrir empleado">
                    <i className="bi bi-chevron-right" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
}
