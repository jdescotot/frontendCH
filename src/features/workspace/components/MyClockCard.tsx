import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ApiError } from "../../../shared/api/apiError";
import {
  workspaceApi,
  type ClockEventType,
  type MyClockStatus,
} from "../api/workspaceApi";

interface MyClockCardProps {
  onChanged?: () => void;
}

const stateCopy: Record<
  MyClockStatus["state"],
  { label: string; description: string; className: string }
> = {
  IDLE: {
    label: "Fuera de jornada",
    description: "Cuando empieces a trabajar, registra tu entrada.",
    className: "is-idle",
  },
  WORKING: {
    label: "En jornada",
    description: "Tu tiempo de trabajo se está registrando.",
    className: "is-working",
  },
  BREAK: {
    label: "En descanso",
    description: "El contador de trabajo está pausado hasta tu regreso.",
    className: "is-break",
  },
  INELIGIBLE: {
    label: "Fichaje no disponible",
    description: "Esta cuenta no tiene una relación laboral activa para fichar.",
    className: "is-ineligible",
  },
};

const eventLabels: Record<ClockEventType, string> = {
  CLOCK_IN: "Entrada",
  CLOCK_OUT: "Salida",
  BREAK_START: "Inicio de descanso",
  BREAK_END: "Fin de descanso",
};

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `clock-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function MyClockCard({ onChanged }: MyClockCardProps) {
  const { session, selectedMembership } = useAuth();
  const [status, setStatus] = useState<MyClockStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<ClockEventType | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

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
        const response = await workspaceApi.getMyClockStatus(activeCompanyId);
        if (active) setStatus(response.data);
      } catch (requestError) {
        if (!active) return;
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "No se pudo consultar tu jornada.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [selectedMembership?.companyId]);

  useEffect(() => {
    if (status?.state !== "WORKING") return;
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status?.state, status?.serverTime]);

  const liveWorkedSeconds = useMemo(() => {
    if (!status) return 0;
    if (status.state !== "WORKING") return status.todayWorkedSeconds;

    const serverTime = new Date(status.serverTime).getTime();
    const elapsedSinceResponse = Math.max(0, Math.floor((Date.now() - serverTime) / 1000));
    return status.todayWorkedSeconds + elapsedSinceResponse;
  }, [status, tick]);

  async function record(eventType: ClockEventType) {
    const companyId = selectedMembership?.companyId;
    const csrfToken = session?.csrfToken;
    if (!companyId || !csrfToken || submitting) return;

    const activeCompanyId: string = companyId;
    const activeCSRFToken: string = csrfToken;

    setSubmitting(eventType);
    setError("");
    try {
      const response = await workspaceApi.recordMyClockEvent(
        activeCompanyId,
        activeCSRFToken,
        eventType,
        createIdempotencyKey(),
      );
      setStatus(response.data);
      setTick(0);
      onChanged?.();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No se pudo registrar el fichaje.",
      );
    } finally {
      setSubmitting(null);
    }
  }

  if (!selectedMembership) return null;

  if (loading) {
    return (
      <article className="my-clock-card my-clock-card--loading" aria-busy="true">
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        Consultando tu jornada…
      </article>
    );
  }

  if (!status) {
    return error ? (
      <div className="workspace-alert" role="alert">
        <i className="bi bi-exclamation-circle" /> {error}
      </div>
    ) : null;
  }

  const copy = stateCopy[status.state];
  const startedAt = status.currentSession?.startedAt;

  return (
    <article className={`my-clock-card ${copy.className}`}>
      <div className="my-clock-card__status">
        <div className="my-clock-card__eyebrow">
          <span className="my-clock-card__pulse" aria-hidden="true" /> MI JORNADA
        </div>
        <h2>{copy.label}</h2>
        <p>{status.reason || copy.description}</p>
        {startedAt && (
          <small>
            Jornada iniciada a las {formatTime(startedAt, status.timeZone)}
          </small>
        )}
      </div>

      <div className="my-clock-card__timer" aria-live="polite">
        <span>TRABAJADO HOY</span>
        <strong>{formatDuration(liveWorkedSeconds)}</strong>
        {status.state === "BREAK" && <small>Tiempo de trabajo pausado</small>}
      </div>

      <div className="my-clock-card__actions">
        {status.allowedEvents.includes("CLOCK_IN") && (
          <button
            type="button"
            className="btn my-clock-action my-clock-action--primary"
            disabled={submitting !== null}
            onClick={() => void record("CLOCK_IN")}
          >
            {submitting === "CLOCK_IN" ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <i className="bi bi-play-fill" aria-hidden="true" />
            )}
            Iniciar jornada
          </button>
        )}

        {status.allowedEvents.includes("BREAK_START") && (
          <button
            type="button"
            className="btn my-clock-action"
            disabled={submitting !== null}
            onClick={() => void record("BREAK_START")}
          >
            {submitting === "BREAK_START" ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <i className="bi bi-cup-hot" aria-hidden="true" />
            )}
            Iniciar descanso
          </button>
        )}

        {status.allowedEvents.includes("BREAK_END") && (
          <button
            type="button"
            className="btn my-clock-action my-clock-action--primary"
            disabled={submitting !== null}
            onClick={() => void record("BREAK_END")}
          >
            {submitting === "BREAK_END" ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <i className="bi bi-arrow-repeat" aria-hidden="true" />
            )}
            Reanudar jornada
          </button>
        )}

        {status.allowedEvents.includes("CLOCK_OUT") && (
          <button
            type="button"
            className="btn my-clock-action my-clock-action--finish"
            disabled={submitting !== null}
            onClick={() => void record("CLOCK_OUT")}
          >
            {submitting === "CLOCK_OUT" ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <i className="bi bi-stop-fill" aria-hidden="true" />
            )}
            Finalizar jornada
          </button>
        )}
      </div>

      {status.lastEvent && (
        <div className="my-clock-card__last-event">
          <i className="bi bi-check2-circle" aria-hidden="true" />
          Último registro: {eventLabels[status.lastEvent.eventType]} · {formatTime(status.lastEvent.occurredAt, status.timeZone)}
        </div>
      )}

      {error && (
        <div className="my-clock-card__error" role="alert">
          <i className="bi bi-exclamation-circle" /> {error}
        </div>
      )}
    </article>
  );
}
