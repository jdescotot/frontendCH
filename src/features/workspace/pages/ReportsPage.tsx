import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ApiError } from "../../../shared/api/apiError";
import { workspaceApi, type AttendanceReport } from "../api/workspaceApi";

function inputDate(date: Date) { const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 10); }
function hours(seconds: number) { const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); return `${h}h ${String(m).padStart(2, "0")}m`; }
function time(value: string, zone: string) { return new Intl.DateTimeFormat("es-ES", { timeZone: zone, dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
const eventLabels = { CLOCK_IN: "Entrada", CLOCK_OUT: "Salida", BREAK_START: "Inicio descanso", BREAK_END: "Fin descanso" };

export function ReportsPage() {
  const { selectedMembership } = useAuth();
  const canManage = selectedMembership?.roles.some((role) => role === "OWNER" || role === "MANAGER") ?? false;
  const now = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(inputDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(inputDate(now));
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const companyId = selectedMembership?.companyId;
    if (!companyId || !canManage) { setLoading(false); return; }
    const activeCompanyId: string = companyId;
    let active = true;
    async function load() {
      setLoading(true); setError("");
      try { const response = await workspaceApi.getAttendanceReport(activeCompanyId, from, to); if (active) setReport(response.data); }
      catch (requestError) { if (active) setError(requestError instanceof ApiError ? requestError.message : "No se pudo cargar el reporte."); }
      finally { if (active) setLoading(false); }
    }
    void load(); return () => { active = false; };
  }, [selectedMembership?.companyId, canManage, from, to]);

  if (!canManage) return <section className="workspace-page container-xxl"><article className="workspace-empty-card"><span className="workspace-empty-card__icon"><i className="bi bi-shield-lock" /></span><h2>Reportes reservados a responsables</h2><p>Solo propietario y gerente pueden consultar datos agregados del equipo.</p></article></section>;
  const maxDay = Math.max(...(report?.days.map((day) => day.workedSeconds) || [1]), 1);
  return <section className="workspace-page container-xxl report-page">
    <div className="workspace-page-heading workspace-page-heading--actions"><div><span className="workspace-eyebrow">ANÁLISIS HORARIO</span><h1>Reportes de asistencia</h1><p>Totales diarios, detalle por empleado y trazabilidad de correcciones.</p></div><button type="button" className="owner-action-button owner-action-button--primary print-hidden" onClick={() => window.print()}><i className="bi bi-printer" /> Imprimir / guardar PDF</button></div>
    <div className="workspace-toolbar report-toolbar print-hidden"><label className="workspace-date-control"><span>Desde</span><input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label><label className="workspace-date-control"><span>Hasta</span><input type="date" min={from} value={to} onChange={(e) => setTo(e.target.value)} /></label>{report && <small><i className="bi bi-globe2" /> {report.timeZone}</small>}</div>
    {error && <div className="workspace-alert"><i className="bi bi-exclamation-circle" /> {error}</div>}
    <div className="time-summary-grid"><article><span>Horas efectivas</span><strong>{hours(report?.totals.workedSeconds || 0)}</strong><small>en el rango</small></article><article><span>Descansos</span><strong>{hours(report?.totals.breakSeconds || 0)}</strong><small>acumulados</small></article><article><span>Empleados</span><strong>{report?.totals.employees || 0}</strong><small>con actividad</small></article><article className="time-summary-grid__accent"><span>Marcas corregidas</span><strong>{report?.totals.correctedEvents || 0}</strong><small>original y efectiva visibles</small></article></div>
    <article className="workspace-list-card"><div className="owner-section-heading owner-section-heading--compact"><div><span className="workspace-eyebrow">EVOLUCIÓN</span><h2>Horas por día</h2></div></div>{loading ? <div className="owner-loading-state"><span className="spinner-border spinner-border-sm" /> Calculando reporte…</div> : <div className="attendance-chart">{report?.days.map((day) => <div className="attendance-chart__day" key={day.date}><div className="attendance-chart__track"><span style={{ height: `${Math.max(day.workedSeconds / maxDay * 100, day.workedSeconds ? 4 : 0)}%` }} /></div><strong>{day.workedSeconds ? hours(day.workedSeconds) : "—"}</strong><small>{day.date.slice(5)}</small></div>)}</div>}</article>
    <article className="workspace-list-card"><div className="owner-section-heading owner-section-heading--compact"><div><span className="workspace-eyebrow">EQUIPO</span><h2>Resumen por empleado</h2></div></div><div className="table-responsive"><table className="table report-table"><thead><tr><th>Empleado</th><th>Puesto</th><th className="text-end">Jornadas</th><th className="text-end">Horas</th><th className="text-end">Descansos</th></tr></thead><tbody>{report?.items.map((item) => <tr key={item.membershipId}><td><strong>{item.employeeName}</strong></td><td>{item.jobTitle || "Empleado"}</td><td className="text-end">{item.sessions}</td><td className="text-end">{hours(item.workedSeconds)}</td><td className="text-end">{hours(item.breakSeconds)}</td></tr>)}</tbody></table></div></article>
    <article className="workspace-list-card"><div className="owner-section-heading owner-section-heading--compact"><div><span className="workspace-eyebrow">TRAZABILIDAD</span><h2>Marcas originales y efectivas</h2></div></div><div className="table-responsive"><table className="table report-table"><thead><tr><th>Empleado</th><th>Tipo</th><th>Hora original</th><th>Hora efectiva</th><th>Corrección</th></tr></thead><tbody>{report?.events.map((event) => <tr className={event.corrected ? "report-event-corrected" : ""} key={event.id}><td>{event.employeeName}</td><td>{eventLabels[event.eventType]}</td><td>{time(event.originalOccurredAt, report.timeZone)}</td><td><strong>{time(event.effectiveOccurredAt, report.timeZone)}</strong></td><td>{event.corrected ? <span title={event.correctionReason || "Sin motivo"}><i className="bi bi-pencil" /> {event.correctionReason || "Corregida"}</span> : "—"}</td></tr>)}</tbody></table></div></article>
  </section>;
}

