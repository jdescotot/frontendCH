import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ApiError } from "../../../shared/api/apiError";
import { workspaceApi, type WorkspaceTask } from "../api/workspaceApi";

function priorityLabel(priority: WorkspaceTask["priority"]) {
  switch (priority) {
    case "URGENT": return "Urgente";
    case "HIGH": return "Alta";
    case "LOW": return "Baja";
    default: return "Normal";
  }
}

function statusLabel(status: WorkspaceTask["status"]) {
  switch (status) {
    case "IN_PROGRESS": return "En curso";
    case "COMPLETED": return "Completada";
    case "REJECTED": return "Rechazada";
    default: return "Pendiente";
  }
}

export function TasksPage() {
  const { selectedMembership } = useAuth();
  const [items, setItems] = useState<WorkspaceTask[]>([]);
  const [pending, setPending] = useState(0);
  const [inProgress, setInProgress] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [filter, setFilter] = useState<"ALL" | WorkspaceTask["status"]>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const companyId = selectedMembership?.companyId;

    if (!companyId) {
      setLoading(false);
      return;
    }

    const activeCompanyId: string = companyId;
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await workspaceApi.getTasks(activeCompanyId);
        if (!active) return;
        setItems(response.data.items);
        setPending(response.data.pending);
        setInProgress(response.data.inProgress);
        setCompleted(response.data.completed);
      } catch (requestError) {
        if (!active) return;
        setError(requestError instanceof ApiError ? requestError.message : "No se pudieron cargar las tareas.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [selectedMembership?.companyId]);

  const filteredItems = useMemo(
    () => filter === "ALL" ? items : items.filter((item) => item.status === filter),
    [filter, items],
  );

  if (!selectedMembership) return null;

  return (
    <section className="workspace-page container-xxl">
      <div className="workspace-page-heading workspace-page-heading--actions">
        <div>
          <span className="workspace-eyebrow">ORGANIZACIÓN</span>
          <h1>Tareas</h1>
          <p>Control de pendientes, recurrencias y evidencias sin mezclar la operación con el fichaje.</p>
        </div>
        <button className="owner-action-button owner-action-button--primary" type="button" disabled>
          <i className="bi bi-plus-lg" /> Nueva tarea <small>Próxima fase</small>
        </button>
      </div>

      <div className="task-summary-grid">
        <article><span>Pendientes</span><strong>{pending}</strong><small>por iniciar</small></article>
        <article><span>En curso</span><strong>{inProgress}</strong><small>en ejecución</small></article>
        <article><span>Completadas</span><strong>{completed}</strong><small>histórico disponible</small></article>
      </div>

      <div className="task-filter-bar" role="group" aria-label="Filtrar tareas">
        {([
          ["ALL", "Todas"],
          ["PENDING", "Pendientes"],
          ["IN_PROGRESS", "En curso"],
          ["COMPLETED", "Completadas"],
          ["REJECTED", "Rechazadas"],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setFilter(value)} className={filter === value ? "is-active" : ""}>
            {label}
          </button>
        ))}
      </div>

      {error && <div className="workspace-alert"><i className="bi bi-exclamation-circle" /> {error}</div>}

      <article className="workspace-list-card">
        {loading ? (
          <div className="owner-loading-state"><span className="spinner-border spinner-border-sm" /> Cargando tareas…</div>
        ) : filteredItems.length === 0 ? (
          <div className="workspace-empty-inline">
            <i className="bi bi-check2-square" />
            <div><strong>No hay tareas en este estado.</strong><span>Las tareas asignadas aparecerán aquí con prioridad, responsable y evidencia requerida.</span></div>
          </div>
        ) : (
          <div className="task-board-list">
            {filteredItems.map((task) => (
              <article className="task-board-item" key={task.assignmentId}>
                <div className="task-board-item__main">
                  <div className="task-board-item__badges">
                    <span className={`task-priority task-priority--${task.priority.toLowerCase()}`}>{priorityLabel(task.priority)}</span>
                    <span className={`task-status task-status--${task.status.toLowerCase()}`}>{statusLabel(task.status)}</span>
                    {task.requiresPhoto && <span className="task-photo"><i className="bi bi-camera" /> Foto requerida</span>}
                  </div>
                  <h2>{task.title}</h2>
                  {task.description && <p>{task.description}</p>}
                </div>
                <div className="task-board-item__meta">
                  <span><i className="bi bi-person" /> {task.assigneeName}</span>
                  <span><i className="bi bi-calendar-event" /> {task.dueAt ? new Date(task.dueAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) : "Sin vencimiento"}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
