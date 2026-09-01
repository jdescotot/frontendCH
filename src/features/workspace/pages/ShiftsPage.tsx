import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ApiError } from "../../../shared/api/apiError";
import { workspaceApi, type WorkCenter, type WorkspaceEmployee, type WorkspaceShift } from "../api/workspaceApi";

function inputDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function weekRange(anchor: Date) {
  const day = (anchor.getDay() + 6) % 7;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - day);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: inputDate(monday), to: inputDate(sunday) };
}

function zoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second));
}

function zonedLocalToISO(value: string, timeZone: string) {
  const assumedUTC = new Date(`${value}:00Z`);
  let instant = assumedUTC.getTime() - (zoneParts(assumedUTC, timeZone) - assumedUTC.getTime());
  const check = new Date(instant);
  instant -= zoneParts(check, timeZone) - assumedUTC.getTime();
  return new Date(instant).toISOString();
}

function toLocalDateTime(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function formatShift(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("es-ES", { timeZone, weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function ShiftsPage() {
  const { session, selectedMembership } = useAuth();
  const canManage = selectedMembership?.roles.some((role) => role === "OWNER" || role === "MANAGER") ?? false;
  const initialRange = useMemo(() => weekRange(new Date()), []);
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [items, setItems] = useState<WorkspaceShift[]>([]);
  const [employees, setEmployees] = useState<WorkspaceEmployee[]>([]);
  const [centers, setCenters] = useState<WorkCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WorkspaceShift | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ membershipId: "", workCenterId: "", start: `${initialRange.from}T09:00`, end: `${initialRange.from}T17:00`, breakMinutes: "0", notes: "" });

  const companyId = selectedMembership?.companyId;
  const timeZone = selectedMembership?.timeZone || "UTC";

  async function load() {
    if (!companyId) return;
    setLoading(true);
    setError("");
    try {
      const requests = [workspaceApi.getShifts(companyId, from, to), workspaceApi.getWorkCenters(companyId)] as const;
      const [shiftResponse, centerResponse] = await Promise.all(requests);
      setItems(shiftResponse.data.items);
      setCenters(centerResponse.data.items);
      if (canManage) {
        const employeeResponse = await workspaceApi.getEmployees(companyId);
        setEmployees(employeeResponse.data.items);
      }
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "No se pudieron cargar los turnos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [companyId, from, to, canManage]);

  function openCreate() {
    const start = `${from}T09:00`;
    setEditing(null);
    setForm({ membershipId: employees[0]?.membershipId || "", workCenterId: centers[0]?.id || "", start, end: `${from}T17:00`, breakMinutes: "0", notes: "" });
    setShowForm(true);
  }

  function openEdit(shift: WorkspaceShift) {
    setEditing(shift);
    setForm({ membershipId: shift.membershipId, workCenterId: shift.workCenterId, start: toLocalDateTime(shift.scheduledStartAt, timeZone), end: toLocalDateTime(shift.scheduledEndAt, timeZone), breakMinutes: String(shift.plannedBreakMinutes), notes: shift.notes || "" });
    setShowForm(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!companyId || !session || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const input = {
        membershipId: form.membershipId,
        workCenterId: form.workCenterId,
        scheduledStartAt: zonedLocalToISO(form.start, timeZone),
        scheduledEndAt: zonedLocalToISO(form.end, timeZone),
        plannedBreakMinutes: Number(form.breakMinutes || 0),
        notes: form.notes || null,
      };
      if (editing) await workspaceApi.updateShift(companyId, session.csrfToken, editing.id, input);
      else await workspaceApi.createShift(companyId, session.csrfToken, input);
      setShowForm(false);
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "No se pudo guardar el turno.");
    } finally { setSubmitting(false); }
  }

  async function cancel(shift: WorkspaceShift) {
    if (!companyId || !session || !window.confirm(`¿Cancelar el turno de ${shift.employeeName}?`)) return;
    try {
      await workspaceApi.cancelShift(companyId, session.csrfToken, shift.id);
      await load();
    } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "No se pudo cancelar el turno."); }
  }

  return (
    <section className="workspace-page container-xxl">
      <div className="workspace-page-heading workspace-page-heading--actions">
        <div><span className="workspace-eyebrow">PLANIFICACIÓN</span><h1>{canManage ? "Turnos del equipo" : "Mis turnos"}</h1><p>Consulta horarios reales, centros y turnos nocturnos con su fecha completa.</p></div>
        {canManage && <button type="button" className="owner-action-button owner-action-button--primary" onClick={openCreate}><i className="bi bi-plus-lg" /> Crear turno</button>}
      </div>
      <div className="workspace-toolbar shift-range-toolbar">
        <label className="workspace-date-control"><span>Desde</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
        <label className="workspace-date-control"><span>Hasta</span><input type="date" min={from} value={to} onChange={(event) => setTo(event.target.value)} /></label>
        <small><i className="bi bi-globe2" /> {timeZone}</small>
      </div>
      {error && <div className="workspace-alert" role="alert"><i className="bi bi-exclamation-circle" /> {error}</div>}
      <article className="workspace-list-card">
        {loading ? <div className="owner-loading-state"><span className="spinner-border spinner-border-sm" /> Cargando turnos…</div> : items.length === 0 ? <div className="workspace-empty-inline"><i className="bi bi-calendar-week" /><div><strong>No hay turnos en este rango.</strong><span>{canManage ? "Crea el primer turno para empezar la planificación." : "Cuando te asignen un turno aparecerá aquí."}</span></div></div> : <div className="shift-list">{items.map((shift) => (
          <article className={`shift-card ${shift.status === "CANCELLED" ? "is-cancelled" : ""}`} key={shift.id}>
            <div className="shift-card__date"><i className="bi bi-calendar3" /><span>{formatShift(shift.scheduledStartAt, timeZone)}</span></div>
            <div className="shift-card__main"><strong>{shift.employeeName}</strong><span>{shift.jobTitle || "Empleado"} · {shift.workCenterName}</span><small>{formatShift(shift.scheduledStartAt, timeZone)} — {formatShift(shift.scheduledEndAt, timeZone)} · {shift.plannedBreakMinutes} min descanso</small></div>
            <span className={`owner-status-pill ${shift.status === "CANCELLED" ? "is-pending" : "is-working"}`}>{shift.status}</span>
            {canManage && shift.status === "SCHEDULED" && <div className="shift-card__actions"><button type="button" onClick={() => openEdit(shift)} aria-label="Editar turno"><i className="bi bi-pencil" /></button><button type="button" onClick={() => void cancel(shift)} aria-label="Cancelar turno"><i className="bi bi-x-lg" /></button></div>}
          </article>
        ))}</div>}
      </article>

      {showForm && <div className="employee-modal-layer" role="dialog" aria-modal="true"><button className="employee-modal-backdrop" type="button" aria-label="Cerrar" onClick={() => setShowForm(false)} /><form className="employee-modal-card shift-form" onSubmit={submit}>
        <div className="employee-modal-card__header"><div><span className="workspace-eyebrow">{editing ? "MODIFICAR" : "NUEVO"} TURNO</span><h2>{editing ? "Editar turno" : "Planificar turno"}</h2></div><button className="btn-close" type="button" aria-label="Cerrar" onClick={() => setShowForm(false)} /></div>
        <div className="row g-3">
          <div className="col-md-6"><label className="form-label">Empleado</label><select className="form-select" required value={form.membershipId} onChange={(e) => setForm({ ...form, membershipId: e.target.value })}><option value="">Seleccionar…</option>{employees.map((employee) => <option key={employee.membershipId} value={employee.membershipId}>{employee.firstName} {employee.lastName}</option>)}</select></div>
          <div className="col-md-6"><label className="form-label">Centro</label><select className="form-select" required value={form.workCenterId} onChange={(e) => setForm({ ...form, workCenterId: e.target.value })}><option value="">Seleccionar…</option>{centers.map((center) => <option key={center.id} value={center.id}>{center.name}</option>)}</select></div>
          <div className="col-md-6"><label className="form-label">Inicio</label><input className="form-control" type="datetime-local" required value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></div>
          <div className="col-md-6"><label className="form-label">Fin</label><input className="form-control" type="datetime-local" required value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></div>
          <div className="col-md-4"><label className="form-label">Descanso (min)</label><input className="form-control" type="number" min="0" max="1439" value={form.breakMinutes} onChange={(e) => setForm({ ...form, breakMinutes: e.target.value })} /></div>
          <div className="col-md-8"><label className="form-label">Notas</label><input className="form-control" maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="employee-modal-card__footer"><button type="button" className="owner-action-button" onClick={() => setShowForm(false)}>Cancelar</button><button type="submit" className="owner-action-button owner-action-button--primary" disabled={submitting}>{submitting ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-check-lg" />} Guardar turno</button></div>
      </form></div>}
    </section>
  );
}

