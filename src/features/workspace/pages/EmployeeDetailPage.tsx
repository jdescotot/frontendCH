import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ApiError } from "../../../shared/api/apiError";
import { workspaceApi, type EmployeeDetail } from "../api/workspaceApi";

type DetailTab = "summary" | "clock" | "shifts" | "tasks" | "leave";

function hours(seconds: number) {
  if (seconds <= 0) return "0h 00m";
  const wholeHours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${wholeHours}h ${String(minutes).padStart(2, "0")}m`;
}

function dateTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const eventLabels = {
  CLOCK_IN: "Entrada",
  CLOCK_OUT: "Salida",
  BREAK_START: "Inicio de descanso",
  BREAK_END: "Fin de descanso",
};

export function EmployeeDetailPage() {
  const { membershipId } = useParams();
  const { selectedMembership } = useAuth();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [tab, setTab] = useState<DetailTab>("summary");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const companyId = selectedMembership?.companyId;
    if (!companyId || !membershipId) {
      setLoading(false);
      return;
    }
    const activeCompanyId: string = companyId;
    const activeMembershipId: string = membershipId;
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await workspaceApi.getEmployee(activeCompanyId, activeMembershipId);
        if (active) setEmployee(response.data);
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof ApiError ? requestError.message : "No se pudo cargar la ficha.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [selectedMembership?.companyId, membershipId]);

  if (loading) {
    return <section className="workspace-page container-xxl"><div className="workspace-loading"><span className="spinner-border" /> Cargando ficha…</div></section>;
  }
  if (error || !employee) {
    return (
      <section className="workspace-page container-xxl">
        <Link className="employee-detail-back" to="/app/empleados"><i className="bi bi-arrow-left" /> Empleados</Link>
        <article className="workspace-empty-card"><span className="workspace-empty-card__icon"><i className="bi bi-person-x" /></span><h2>No se pudo abrir la ficha</h2><p>{error || "El empleado no está disponible."}</p></article>
      </section>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;
  const timeZone = selectedMembership?.timeZone || "UTC";
  const stateLabel = employee.summary.clockState === "WORKING" ? "Trabajando" : employee.summary.clockState === "BREAK" ? "En descanso" : "Fuera de jornada";

  return (
    <section className="workspace-page container-xxl employee-detail-page">
      <Link className="employee-detail-back" to="/app/empleados"><i className="bi bi-arrow-left" /> Volver a empleados</Link>
      <header className="employee-detail-hero">
        <div className="employee-detail-avatar">{employee.firstName[0]}{employee.lastName[0]}</div>
        <div className="employee-detail-identity">
          <span className="workspace-eyebrow">FICHA DEL EMPLEADO</span>
          <h1>{fullName}</h1>
          <p>{employee.jobTitle || "Empleado"} · {employee.companyName}</p>
          <div className="employee-detail-badges">
            <span className={`owner-status-pill ${employee.summary.clockState === "WORKING" ? "is-working" : employee.summary.clockState === "BREAK" ? "is-break" : "is-pending"}`}>{stateLabel}</span>
            {employee.roles.map((role) => <span className="owner-role-badge" key={role}>{role}</span>)}
          </div>
        </div>
        <div className="employee-detail-meta">
          <span>Alta</span><strong>{employee.startedOn}</strong>
          <span>Relación laboral</span><strong>{employee.employmentStatus}</strong>
        </div>
      </header>

      <nav className="employee-detail-tabs" aria-label="Secciones de la ficha">
        {([
          ["summary", "Resumen", "bi-grid"],
          ["clock", "Fichajes", "bi-clock-history"],
          ["shifts", "Turnos", "bi-calendar-week"],
          ["tasks", "Tareas", "bi-check2-square"],
          ["leave", "Vacaciones", "bi-sun"],
        ] as Array<[DetailTab, string, string]>).map(([key, label, icon]) => (
          <button key={key} type="button" className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}><i className={`bi ${icon}`} /> {label}</button>
        ))}
      </nav>

      {tab === "summary" && (
        <div className="employee-detail-grid">
          <article className="employee-detail-card employee-detail-card--wide">
            <span className="workspace-eyebrow">RESUMEN DEL PERIODO</span>
            <div className="employee-detail-kpis">
              <div><span>Hoy</span><strong>{hours(employee.summary.workedTodaySeconds)}</strong></div>
              <div><span>Este mes</span><strong>{hours(employee.summary.workedPeriodSeconds)}</strong></div>
              <div><span>Tareas pendientes</span><strong>{employee.summary.pendingTasks}</strong></div>
              <div><span>Solicitudes pendientes</span><strong>{employee.summary.pendingLeaveRequests}</strong></div>
            </div>
          </article>
          <article className="employee-detail-card">
            <span className="workspace-eyebrow">DATOS DE CONTACTO</span>
            <dl className="employee-detail-list">
              <div><dt>Correo</dt><dd>{employee.email || "No disponible"}</dd></div>
              <div><dt>Teléfono</dt><dd>{employee.phone || "No disponible"}</dd></div>
              <div><dt>Documento</dt><dd>{employee.taxId || "No disponible"}</dd></div>
              <div><dt>N.º empleado</dt><dd>{employee.employeeNumber || "No asignado"}</dd></div>
            </dl>
          </article>
          <article className="employee-detail-card">
            <span className="workspace-eyebrow">PUESTO Y CENTRO</span>
            <dl className="employee-detail-list">
              <div><dt>Puesto</dt><dd>{employee.jobTitle || "Sin definir"}</dd></div>
              <div><dt>Categoría</dt><dd>{employee.professionalCategory || "Sin definir"}</dd></div>
              <div><dt>Contrato</dt><dd>{employee.contractType || "Sin definir"}</dd></div>
              <div><dt>Centro principal</dt><dd>{employee.workCenter?.name || "Sin asignar"}</dd></div>
            </dl>
          </article>
        </div>
      )}

      {tab === "clock" && (
        <article className="employee-detail-card employee-detail-card--wide">
          <div className="owner-section-heading owner-section-heading--compact"><div><span className="workspace-eyebrow">HISTORIAL</span><h2>Últimas marcas</h2></div></div>
          {employee.recentEvents.length === 0 ? <div className="workspace-empty-inline"><i className="bi bi-clock" /><div><strong>Sin fichajes todavía.</strong><span>Las marcas aparecerán aquí cuando se registre la jornada.</span></div></div> : employee.recentEvents.map((event) => (
            <div className="employee-detail-event" key={event.id}>
              <span className="employee-detail-event__icon"><i className="bi bi-clock" /></span>
              <div><strong>{eventLabels[event.eventType]}</strong><small>{dateTime(event.effectiveOccurredAt, timeZone)}</small></div>
              {event.corrected && <span className="employee-detail-corrected" title={`Original: ${dateTime(event.originalOccurredAt, timeZone)}`}><i className="bi bi-pencil" /> Corregido</span>}
            </div>
          ))}
        </article>
      )}

      {tab === "shifts" && (
        <article className="employee-detail-card employee-detail-card--wide">
          <span className="workspace-eyebrow">TURNO DE HOY</span>
          {employee.summary.todayShift ? (
            <div className="employee-detail-today-shift"><i className="bi bi-calendar-check" /><div><strong>{dateTime(employee.summary.todayShift.scheduledStartAt, timeZone)} — {dateTime(employee.summary.todayShift.scheduledEndAt, timeZone)}</strong><span>{employee.summary.todayShift.workCenterName} · {employee.summary.todayShift.plannedBreakMinutes} min de descanso</span></div></div>
          ) : <div className="workspace-empty-inline"><i className="bi bi-calendar" /><div><strong>Sin turno programado hoy.</strong><span>Consulta el calendario para próximos turnos.</span></div></div>}
          <Link className="owner-action-button mt-3" to="/app/turnos">Abrir calendario de turnos</Link>
        </article>
      )}

      {tab === "tasks" && <article className="employee-detail-card employee-detail-card--wide"><span className="workspace-eyebrow">TAREAS</span><h2>{employee.summary.pendingTasks} pendientes</h2><p>Abre el tablero para consultar responsables, prioridad y vencimientos reales.</p><Link className="owner-action-button" to="/app/tareas">Abrir tareas</Link></article>}
      {tab === "leave" && <article className="employee-detail-card employee-detail-card--wide"><span className="workspace-eyebrow">VACACIONES Y AUSENCIAS</span><h2>{employee.summary.pendingLeaveRequests} solicitudes pendientes</h2><p>Consulta el historial o registra una nueva solicitud desde el módulo de vacaciones.</p><Link className="owner-action-button" to="/app/vacaciones">Abrir vacaciones</Link></article>}
    </section>
  );
}
