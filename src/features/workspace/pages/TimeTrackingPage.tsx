import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ApiError } from "../../../shared/api/apiError";
import { workspaceApi, type WorkspaceTimeEvent } from "../api/workspaceApi";
import { MyClockCard } from "../components/MyClockCard";

const eventCopy: Record<WorkspaceTimeEvent["eventType"], { label: string; icon: string; className: string }> = {
  CLOCK_IN: { label: "Entrada", icon: "bi-box-arrow-in-right", className: "is-in" },
  CLOCK_OUT: { label: "Salida", icon: "bi-box-arrow-right", className: "is-out" },
  BREAK_START: { label: "Inicio descanso", icon: "bi-cup-hot", className: "is-break" },
  BREAK_END: { label: "Fin descanso", icon: "bi-play-circle", className: "is-return" },
};

function todayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function TimeTrackingPage() {
  const { selectedMembership } = useAuth();
  const [date, setDate] = useState(todayInputValue);
  const [items, setItems] = useState<WorkspaceTimeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clockRevision, setClockRevision] = useState(0);

  const canManage = useMemo(
    () => selectedMembership?.roles.some((role) => role === "OWNER" || role === "MANAGER") ?? false,
    [selectedMembership],
  );

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
        const response = canManage
          ? await workspaceApi.getTimeEvents(activeCompanyId, date)
          : await workspaceApi.getMyTimeEvents(activeCompanyId, date);
        if (active) setItems(response.data.items);
      } catch (requestError) {
        if (!active) return;
        setError(requestError instanceof ApiError ? requestError.message : "No se pudieron cargar los fichajes.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [selectedMembership?.companyId, canManage, date, clockRevision]);

  const employeeCount = useMemo(() => new Set(items.map((item) => item.membershipId)).size, [items]);

  if (!selectedMembership) return null;

  return (
    <section className="workspace-page container-xxl">
      <div className="workspace-page-heading workspace-page-heading--actions">
        <div>
          <span className="workspace-eyebrow">CONTROL HORARIO</span>
          <h1>Fichajes</h1>
          <p>
            {canManage
              ? "Registra tu propia jornada y supervisa las entradas, salidas y descansos del equipo."
              : "Registra tu jornada y consulta tus entradas, salidas y descansos sin alterar los originales."}
          </p>
        </div>
        <label className="workspace-date-control">
          <span>Fecha</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
      </div>

      <MyClockCard onChanged={() => setClockRevision((value) => value + 1)} />

      <div className="time-summary-grid">
        <article><span>Eventos</span><strong>{items.length}</strong><small>registrados en la fecha</small></article>
        <article>
          <span>{canManage ? "Personas" : "Actividad"}</span>
          <strong>{canManage ? employeeCount : items.length > 0 ? 1 : 0}</strong>
          <small>{canManage ? "con actividad registrada" : "jornada con registros"}</small>
        </article>
        <article className="time-summary-grid__accent"><span>Auditoría</span><strong><i className="bi bi-shield-check" /></strong><small>eventos originales preservados</small></article>
      </div>

      {error && <div className="workspace-alert"><i className="bi bi-exclamation-circle" /> {error}</div>}

      <article className="workspace-list-card">
        <div className="owner-section-heading owner-section-heading--compact">
          <div><span className="workspace-eyebrow">ACTIVIDAD</span><h2>{canManage ? "Línea temporal del equipo" : "Mi línea temporal"}</h2></div>
        </div>
        {loading ? (
          <div className="owner-loading-state"><span className="spinner-border spinner-border-sm" /> Cargando fichajes…</div>
        ) : items.length === 0 ? (
          <div className="workspace-empty-inline">
            <i className="bi bi-clock-history" />
            <div><strong>No hay fichajes en esta fecha.</strong><span>Cuando se registre actividad aparecerá aquí en orden cronológico.</span></div>
          </div>
        ) : (
          <div className="time-event-list">
            {items.map((item) => {
              const copy = eventCopy[item.eventType];
              const occurredAt = new Date(item.occurredAt);
              return (
                <div className="time-event-row" key={item.id}>
                  <span className={`time-event-icon ${copy.className}`}><i className={`bi ${copy.icon}`} /></span>
                  <div className="time-event-row__person"><strong>{item.employeeName}</strong><small>{item.source}</small></div>
                  <div className="time-event-row__type"><strong>{copy.label}</strong>{item.note && <small>{item.note}</small>}</div>
                  <time dateTime={item.occurredAt}>{occurredAt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</time>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
}
