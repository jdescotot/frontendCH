import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ApiError } from "../../../shared/api/apiError";
import { workspaceApi, type WorkCenter, type WorkspaceEmployee, type WorkspaceTask } from "../api/workspaceApi";
import { TaskCameraModal } from "../components/TaskCameraModal";
import { TaskEvidenceModal } from "../components/TaskEvidenceModal";

const statusLabels: Record<WorkspaceTask["status"], string> = { PENDING: "Pendiente", IN_PROGRESS: "En curso", COMPLETED: "Completada", REJECTED: "Rechazada" };
const emptyForm = { title: "", description: "", priority: "NORMAL" as WorkspaceTask["priority"], dueAt: "", workCenterId: "", membershipIds: [] as string[], requiresPhoto: false };

function priorityLabel(priority: WorkspaceTask["priority"]) { return { LOW: "Baja", NORMAL: "Normal", HIGH: "Alta", URGENT: "Urgente" }[priority]; }
function zoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second));
}
function zonedLocalToISO(value: string, timeZone: string) {
  const assumedUTC = new Date(`${value}:00Z`);
  let instant = assumedUTC.getTime() - (zoneParts(assumedUTC, timeZone) - assumedUTC.getTime());
  instant -= zoneParts(new Date(instant), timeZone) - assumedUTC.getTime();
  return new Date(instant).toISOString();
}
function dateTime(value: string | null, timeZone: string) { return value ? new Intl.DateTimeFormat("es-ES", { timeZone, dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Sin fecha límite"; }

export function TasksPage() {
  const { session, selectedMembership } = useAuth();
  const canManage = selectedMembership?.roles.some((role) => role === "OWNER" || role === "MANAGER") ?? false;
  const [items, setItems] = useState<WorkspaceTask[]>([]);
  const [employees, setEmployees] = useState<WorkspaceEmployee[]>([]);
  const [centers, setCenters] = useState<WorkCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"ALL" | WorkspaceTask["status"]>("ALL");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [photoEvidenceAvailable, setPhotoEvidenceAvailable] = useState(false);
  const [cameraTask, setCameraTask] = useState<WorkspaceTask | null>(null);
  const [evidenceTask, setEvidenceTask] = useState<WorkspaceTask | null>(null);
  const [form, setForm] = useState(emptyForm);
  const companyId = selectedMembership?.companyId;
  const timeZone = selectedMembership?.timeZone || "UTC";

  async function load() {
    if (!companyId) return;
    setLoading(true); setError("");
    try {
      const taskResponse = await workspaceApi.getTasks(companyId);
      setItems(taskResponse.data.items);
      setPhotoEvidenceAvailable(taskResponse.data.photoEvidenceAvailable);
      if (canManage) {
        const [employeeResponse, centerResponse] = await Promise.all([workspaceApi.getEmployees(companyId), workspaceApi.getWorkCenters(companyId)]);
        setEmployees(employeeResponse.data.items); setCenters(centerResponse.data.items);
      }
    } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "No se pudieron cargar las tareas."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [companyId, canManage]);
  const counts = useMemo(() => items.reduce((acc, item) => ({ ...acc, [item.status]: acc[item.status] + 1 }), { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, REJECTED: 0 }), [items]);
  const visibleItems = filter === "ALL" ? items : items.filter((item) => item.status === filter);

  function toggleEmployee(id: string) { setForm((current) => ({ ...current, membershipIds: current.membershipIds.includes(id) ? current.membershipIds.filter((item) => item !== id) : [...current.membershipIds, id] })); }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!companyId || !session || submitting) return;
    setSubmitting(true); setError("");
    try {
      await workspaceApi.createTask(companyId, session.csrfToken, { title: form.title, description: form.description || null, priority: form.priority, dueAt: form.dueAt ? zonedLocalToISO(form.dueAt, timeZone) : null, workCenterId: form.workCenterId || null, membershipIds: form.membershipIds, requiresPhoto: form.requiresPhoto });
      setShowForm(false); setForm(emptyForm); await load();
    } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "No se pudo crear la tarea."); }
    finally { setSubmitting(false); }
  }

  async function transition(item: WorkspaceTask, status: WorkspaceTask["status"], note?: string) {
    if (!companyId || !session || updatingId) return;
    setUpdatingId(item.assignmentId); setError("");
    try { await workspaceApi.updateTaskAssignment(companyId, session.csrfToken, item.assignmentId, status, note); await load(); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "No se pudo actualizar la tarea."); }
    finally { setUpdatingId(null); }
  }

  async function cancel(item: WorkspaceTask) {
    if (!companyId || !session || !window.confirm(`¿Cancelar la tarea “${item.title}” para todas sus asignaciones?`)) return;
    try { await workspaceApi.cancelTask(companyId, session.csrfToken, item.taskId); await load(); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "No se pudo cancelar la tarea."); }
  }

  return <section className="workspace-page container-xxl">
    <div className="workspace-page-heading workspace-page-heading--actions">
      <div><span className="workspace-eyebrow">ORGANIZACIÓN DIARIA</span><h1>{canManage ? "Tareas del equipo" : "Mis tareas"}</h1><p>{canManage ? "Asigna trabajo, controla vencimientos y revisa el avance real." : "Consulta, inicia y completa únicamente las tareas que tienes asignadas."}</p></div>
      {canManage && <button className="owner-action-button owner-action-button--primary" type="button" onClick={() => setShowForm(true)}><i className="bi bi-plus-lg" /> Nueva tarea</button>}
    </div>
    <div className="task-summary-grid"><article><span>Pendientes</span><strong>{counts.PENDING}</strong><small>por iniciar</small></article><article><span>En curso</span><strong>{counts.IN_PROGRESS}</strong><small>con actividad</small></article><article><span>Completadas</span><strong>{counts.COMPLETED}</strong><small>finalizadas</small></article><article><span>Rechazadas</span><strong>{counts.REJECTED}</strong><small>requieren revisión</small></article></div>
    <div className="task-filter-row" role="group" aria-label="Filtrar por estado">{(["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED"] as const).map((status) => <button type="button" key={status} className={filter === status ? "is-active" : ""} onClick={() => setFilter(status)}>{status === "ALL" ? "Todas" : statusLabels[status]}</button>)}</div>
    {error && <div className="workspace-alert" role="alert"><i className="bi bi-exclamation-circle" /> {error}</div>}
    <article className="workspace-list-card">{loading ? <div className="owner-loading-state"><span className="spinner-border spinner-border-sm" /> Cargando tareas…</div> : visibleItems.length === 0 ? <div className="workspace-empty-inline"><i className="bi bi-check2-square" /><div><strong>No hay tareas en esta vista.</strong><span>{canManage ? "Crea una tarea y asígnala a uno o varios empleados." : "Cuando te asignen trabajo aparecerá aquí."}</span></div></div> : <div className="task-board-list">{visibleItems.map((item) => <article className={`task-board-item task-priority-${item.priority.toLowerCase()}`} key={item.assignmentId}>
      <span className="task-board-item__marker" /><div className="task-board-item__content"><div className="task-board-item__title"><strong>{item.title}</strong><span className={`task-status task-status-${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span></div><p>{item.description || "Sin descripción"}</p><div className="task-board-item__details"><span><i className="bi bi-person" /> {item.assigneeName}</span><span><i className="bi bi-flag" /> {priorityLabel(item.priority)}</span>{item.workCenter && <span><i className="bi bi-geo-alt" /> {item.workCenter}</span>}<span><i className="bi bi-calendar" /> {dateTime(item.dueAt, timeZone)}</span></div></div>
      <div className="task-board-item__actions">{item.status === "PENDING" && <button type="button" onClick={() => void transition(item, "IN_PROGRESS")} disabled={updatingId === item.assignmentId}>Comenzar</button>}{!item.requiresPhoto && (item.status === "IN_PROGRESS" || item.status === "REJECTED" || item.status === "PENDING") && <button type="button" className="is-primary" onClick={() => void transition(item, "COMPLETED")} disabled={updatingId === item.assignmentId}>Completar</button>}{item.requiresPhoto && (!item.hasEvidence || item.status === "REJECTED") && item.membershipId === selectedMembership?.id && (item.status === "IN_PROGRESS" || item.status === "REJECTED" || item.status === "PENDING") && <button type="button" className="is-primary" onClick={() => setCameraTask(item)}><i className="bi bi-camera" /> {item.status === "REJECTED" ? "Repetir foto" : "Abrir cámara"}</button>}{item.hasEvidence && <button type="button" onClick={() => setEvidenceTask(item)}><i className="bi bi-image" /> Ver evidencia</button>}{canManage && item.status === "COMPLETED" && <button type="button" onClick={() => void transition(item, "REJECTED", "Requiere revisión")}>Rechazar</button>}{canManage && <button type="button" className="is-danger" onClick={() => void cancel(item)} aria-label="Cancelar tarea"><i className="bi bi-trash" /></button>}</div>
      {item.requiresPhoto && <small className="task-photo-warning"><i className="bi bi-camera" /> {item.status === "REJECTED" ? "La evidencia fue rechazada; debe tomarse una nueva fotografía" : item.hasEvidence ? "Evidencia tomada desde la cámara" : item.membershipId === selectedMembership?.id ? "Requiere una fotografía tomada en tiempo real" : "Pendiente de evidencia del empleado asignado"}</small>}
    </article>)}</div>}</article>

    {showForm && <div className="employee-modal-layer" role="dialog" aria-modal="true"><button className="employee-modal-backdrop" type="button" aria-label="Cerrar" onClick={() => setShowForm(false)} /><form className="employee-modal-card" onSubmit={submit}>
      <div className="employee-modal-card__header"><div><span className="workspace-eyebrow">NUEVA ASIGNACIÓN</span><h2>Crear tarea</h2></div><button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setShowForm(false)} /></div>
      <div className="row g-3"><div className="col-md-8"><label className="form-label">Título *</label><input className="form-control" required maxLength={180} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div><div className="col-md-4"><label className="form-label">Prioridad</label><select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as WorkspaceTask["priority"] })}><option value="LOW">Baja</option><option value="NORMAL">Normal</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option></select></div>
        <div className="col-12"><label className="form-label">Descripción</label><textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div><div className="col-md-6"><label className="form-label">Fecha límite</label><input className="form-control" type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></div><div className="col-md-6"><label className="form-label">Centro</label><select className="form-select" value={form.workCenterId} onChange={(e) => setForm({ ...form, workCenterId: e.target.value })}><option value="">Sin centro específico</option>{centers.map((center) => <option key={center.id} value={center.id}>{center.name}</option>)}</select></div>
        <div className="col-12"><label className="form-label">Responsables *</label><div className="task-assignee-picker">{employees.map((employee) => <label key={employee.membershipId}><input type="checkbox" checked={form.membershipIds.includes(employee.membershipId)} onChange={() => toggleEmployee(employee.membershipId)} /><span>{employee.firstName} {employee.lastName}<small>{employee.jobTitle || "Empleado"}</small></span></label>)}</div></div><div className="col-12"><label className={`task-photo-option${photoEvidenceAvailable ? "" : " is-disabled"}`}><input type="checkbox" checked={form.requiresPhoto} disabled={!photoEvidenceAvailable} onChange={(event) => setForm({ ...form, requiresPhoto: event.target.checked })} /><span><strong>Exigir fotografía en tiempo real</strong><small>{photoEvidenceAvailable ? "El empleado deberá abrir la cámara; no podrá elegir una imagen de la galería." : "Configura Cloudflare R2, S3 o MinIO en el backend para activar esta opción."}</small></span><i className="bi bi-camera" /></label></div>
      </div><div className="employee-modal-card__footer"><button type="button" className="owner-action-button" onClick={() => setShowForm(false)}>Cancelar</button><button type="submit" className="owner-action-button owner-action-button--primary" disabled={submitting || form.membershipIds.length === 0}>{submitting ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-check-lg" />} Crear tarea</button></div>
    </form></div>}
    {cameraTask && companyId && session && <TaskCameraModal task={cameraTask} companyId={companyId} csrfToken={session.csrfToken} onClose={() => setCameraTask(null)} onCompleted={load} />}
    {evidenceTask && companyId && <TaskEvidenceModal task={evidenceTask} companyId={companyId} onClose={() => setEvidenceTask(null)} />}
  </section>;
}
