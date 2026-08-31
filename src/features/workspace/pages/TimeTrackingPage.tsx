import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ApiError } from "../../../shared/api/apiError";
import {
  workspaceApi,
  type TimeEventCorrection,
  type WorkspaceTimeEvent,
} from "../api/workspaceApi";
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

function toCompanyDateTimeLocal(iso: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function formatCompanyTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatCompanyDateTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function TimeTrackingPage() {
  const { session, selectedMembership } = useAuth();
  const [date, setDate] = useState(todayInputValue);
  const [items, setItems] = useState<WorkspaceTimeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clockRevision, setClockRevision] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<WorkspaceTimeEvent | null>(null);
  const [correctedLocalDateTime, setCorrectedLocalDateTime] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionError, setCorrectionError] = useState("");
  const [correctionSaving, setCorrectionSaving] = useState(false);
  const [history, setHistory] = useState<TimeEventCorrection[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  if (!selectedMembership || !session) return null;

  const companyId = selectedMembership.companyId;
  const timeZone = selectedMembership.timeZone || "Europe/Madrid";
  const activeCsrfToken: string = session.csrfToken;

  async function openCorrection(event: WorkspaceTimeEvent) {
    setSelectedEvent(event);
    setCorrectedLocalDateTime(toCompanyDateTimeLocal(event.effectiveOccurredAt || event.occurredAt, timeZone));
    setCorrectionReason("");
    setCorrectionError("");
    setHistory([]);

    if (event.correctionCount > 0) {
      setHistoryLoading(true);
      try {
        const response = await workspaceApi.getTimeEventCorrections(companyId, event.id);
        setHistory(response.data.items);
      } catch {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    }
  }

  function closeCorrection() {
    if (correctionSaving) return;
    setSelectedEvent(null);
    setCorrectionError("");
  }

  async function submitCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEvent) return;

    const reason = correctionReason.trim();
    if (reason.length < 5) {
      setCorrectionError("Escribe un motivo de al menos 5 caracteres.");
      return;
    }

    setCorrectionSaving(true);
    setCorrectionError("");
    try {
      await workspaceApi.correctTimeEvent(
        companyId,
        activeCsrfToken,
        selectedEvent.id,
        { correctedLocalDateTime, reason },
      );
      setSelectedEvent(null);
      setClockRevision((value) => value + 1);
    } catch (requestError) {
      setCorrectionError(
        requestError instanceof ApiError
          ? requestError.message
          : "No se pudo guardar la corrección.",
      );
    } finally {
      setCorrectionSaving(false);
    }
  }

  return (
    <section className="workspace-page container-xxl">
      <div className="workspace-page-heading workspace-page-heading--actions">
        <div>
          <span className="workspace-eyebrow">CONTROL HORARIO</span>
          <h1>Fichajes</h1>
          <p>
            {canManage
              ? "Registra tu propia jornada, supervisa al equipo y corrige incidencias sin alterar nunca el fichaje original."
              : "Registra tu jornada y consulta tus entradas, salidas y descansos. Las correcciones conservan siempre el registro original."}
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
        <article className="time-summary-grid__accent"><span>Auditoría</span><strong><i className="bi bi-shield-check" /></strong><small>originales y correcciones preservados</small></article>
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
              const effective = item.effectiveOccurredAt || item.occurredAt;
              const corrected = item.correctionCount > 0;
              return (
                <div className={`time-event-row ${corrected ? "time-event-row--corrected" : ""}`} key={item.id}>
                  <span className={`time-event-icon ${copy.className}`}><i className={`bi ${copy.icon}`} /></span>
                  <div className="time-event-row__person"><strong>{item.employeeName}</strong><small>{item.source}</small></div>
                  <div className="time-event-row__type">
                    <strong>{copy.label}</strong>
                    {corrected ? (
                      <small className="time-event-correction-note">
                        <i className="bi bi-pencil-square" /> Corregido · original {formatCompanyTime(item.originalOccurredAt, timeZone)}
                      </small>
                    ) : item.note ? <small>{item.note}</small> : null}
                  </div>
                  <div className="time-event-row__actions">
                    <time dateTime={effective}>{formatCompanyTime(effective, timeZone)}</time>
                    {canManage && (
                      <button type="button" className="time-event-correct-button" onClick={() => void openCorrection(item)}>
                        <i className="bi bi-pencil" /> <span>Corregir</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>

      {selectedEvent && canManage && (
        <>
          <button type="button" className="clock-correction-backdrop" aria-label="Cerrar corrección" onClick={closeCorrection} />
          <section className="clock-correction-dialog" role="dialog" aria-modal="true" aria-labelledby="clock-correction-title">
            <header className="clock-correction-dialog__header">
              <div>
                <span className="workspace-eyebrow">CORRECCIÓN AUDITADA</span>
                <h2 id="clock-correction-title">{selectedEvent.employeeName} · {eventCopy[selectedEvent.eventType].label}</h2>
                <p>El registro original no se modifica. La nueva hora se guarda como una corrección adicional.</p>
              </div>
              <button type="button" className="clock-correction-close" onClick={closeCorrection} aria-label="Cerrar">
                <i className="bi bi-x-lg" />
              </button>
            </header>

            <div className="clock-correction-original">
              <div><span>Hora original</span><strong>{formatCompanyDateTime(selectedEvent.originalOccurredAt, timeZone)}</strong></div>
              <div><span>Hora efectiva actual</span><strong>{formatCompanyDateTime(selectedEvent.effectiveOccurredAt || selectedEvent.occurredAt, timeZone)}</strong></div>
            </div>

            <form onSubmit={(event) => void submitCorrection(event)} className="clock-correction-form">
              <label>
                <span>Nueva fecha y hora</span>
                <input
                  type="datetime-local"
                  value={correctedLocalDateTime}
                  onChange={(event) => setCorrectedLocalDateTime(event.target.value)}
                  required
                />
              </label>
              <label>
                <span>Motivo de la corrección</span>
                <textarea
                  value={correctionReason}
                  onChange={(event) => setCorrectionReason(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Ej.: El empleado comunicó que el fichaje se registró tres minutos tarde por una incidencia del terminal."
                  required
                />
              </label>

              {correctionError && <div className="workspace-alert"><i className="bi bi-exclamation-circle" /> {correctionError}</div>}

              <div className="clock-correction-form__actions">
                <button type="button" className="owner-action-button" onClick={closeCorrection} disabled={correctionSaving}>Cancelar</button>
                <button type="submit" className="owner-action-button owner-action-button--primary" disabled={correctionSaving}>
                  {correctionSaving ? <><span className="spinner-border spinner-border-sm" /> Guardando…</> : <><i className="bi bi-shield-check" /> Guardar corrección</>}
                </button>
              </div>
            </form>

            {(selectedEvent.correctionCount > 0 || historyLoading) && (
              <div className="clock-correction-history">
                <div className="clock-correction-history__heading">
                  <strong>Historial de correcciones</strong>
                  <span>{selectedEvent.correctionCount}</span>
                </div>
                {historyLoading ? (
                  <div className="clock-correction-history__loading"><span className="spinner-border spinner-border-sm" /> Cargando historial…</div>
                ) : history.map((entry) => (
                  <article key={entry.sequenceNo}>
                    <div>
                      <strong>Corrección #{entry.sequenceNo}</strong>
                      <small>{entry.appliedBy} · {formatCompanyDateTime(entry.appliedAt, timeZone)}</small>
                    </div>
                    <p>{formatCompanyTime(entry.previousEffectiveOccurredAt, timeZone)} → <strong>{formatCompanyTime(entry.correctedOccurredAt, timeZone)}</strong></p>
                    <span>{entry.reason}</span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
