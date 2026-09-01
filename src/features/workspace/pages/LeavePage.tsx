import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ApiError } from "../../../shared/api/apiError";
import { workspaceApi, type LeaveRequest, type LeaveType } from "../api/workspaceApi";

function today() { const date = new Date(); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
const statusLabels = { PENDING: "Pendiente", APPROVED: "Aprobada", REJECTED: "Rechazada", CANCELLED: "Cancelada" };

export function LeavePage() {
  const { session, selectedMembership } = useAuth();
  const canManage = selectedMembership?.roles.some((role) => role === "OWNER" || role === "MANAGER") ?? false;
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [form, setForm] = useState({ leaveTypeId: "", startDate: today(), endDate: today(), reason: "" });
  const companyId = selectedMembership?.companyId;

  async function load() {
    if (!companyId) return;
    setLoading(true); setError("");
    try {
      const [requestResponse, typeResponse] = await Promise.all([workspaceApi.getLeaveRequests(companyId), workspaceApi.getLeaveTypes(companyId)]);
      setItems(requestResponse.data.items); setTypes(typeResponse.data.items);
      if (!form.leaveTypeId && typeResponse.data.items[0]) setForm((current) => ({ ...current, leaveTypeId: typeResponse.data.items[0].id }));
    } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "No se pudieron cargar las vacaciones."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [companyId]);

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!companyId || !session || submitting) return;
    setSubmitting(true); setError("");
    try { await workspaceApi.createLeaveRequest(companyId, session.csrfToken, { leaveTypeId: form.leaveTypeId, startDate: form.startDate, endDate: form.endDate, reason: form.reason || null }); setShowForm(false); await load(); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "No se pudo enviar la solicitud."); }
    finally { setSubmitting(false); }
  }

  async function review(item: LeaveRequest, status: "APPROVED" | "REJECTED") {
    if (!companyId || !session || reviewingId) return;
    const note = status === "REJECTED" ? window.prompt("Motivo del rechazo (opcional)") ?? "" : "";
    setReviewingId(item.id); setError("");
    try { await workspaceApi.reviewLeaveRequest(companyId, session.csrfToken, item.id, status, note); await load(); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "No se pudo revisar la solicitud."); }
    finally { setReviewingId(null); }
  }

  const pending = items.filter((item) => item.status === "PENDING").length;
  const approved = items.filter((item) => item.status === "APPROVED").length;
  return <section className="workspace-page container-xxl">
    <div className="workspace-page-heading workspace-page-heading--actions"><div><span className="workspace-eyebrow">AUSENCIAS</span><h1>{canManage ? "Vacaciones del equipo" : "Mis vacaciones"}</h1><p>{canManage ? "Revisa y resuelve solicitudes sin perder el historial." : "Solicita vacaciones y consulta el estado real de cada petición."}</p></div><button className="owner-action-button owner-action-button--primary" type="button" onClick={() => setShowForm(true)} disabled={types.length === 0}><i className="bi bi-plus-lg" /> Solicitar vacaciones</button></div>
    <div className="task-summary-grid"><article><span>Pendientes</span><strong>{pending}</strong><small>por revisar</small></article><article><span>Aprobadas</span><strong>{approved}</strong><small>confirmadas</small></article><article><span>Total</span><strong>{items.length}</strong><small>solicitudes visibles</small></article></div>
    {types.length === 0 && !loading && <div className="workspace-alert"><i className="bi bi-info-circle" /> Esta empresa todavía no tiene un tipo de ausencia activo. Aplica la migración 004 antes de aceptar solicitudes.</div>}
    {error && <div className="workspace-alert" role="alert"><i className="bi bi-exclamation-circle" /> {error}</div>}
    <article className="workspace-list-card">{loading ? <div className="owner-loading-state"><span className="spinner-border spinner-border-sm" /> Cargando solicitudes…</div> : items.length === 0 ? <div className="workspace-empty-inline"><i className="bi bi-sun" /><div><strong>No hay solicitudes todavía.</strong><span>Las vacaciones y ausencias aparecerán aquí.</span></div></div> : <div className="leave-list">{items.map((item) => <article className="leave-card" key={item.id}><span className="leave-card__icon"><i className="bi bi-calendar2-heart" /></span><div className="leave-card__main"><strong>{item.employeeName}</strong><span>{item.leaveType} · {item.startDate} — {item.endDate}</span>{item.reason && <small>{item.reason}</small>}{item.reviewNote && <small>Revisión: {item.reviewNote}</small>}</div><span className={`leave-status leave-status-${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span>{canManage && item.status === "PENDING" && <div className="leave-card__actions"><button type="button" className="is-approve" disabled={reviewingId === item.id} onClick={() => void review(item, "APPROVED")}><i className="bi bi-check-lg" /> Aprobar</button><button type="button" disabled={reviewingId === item.id} onClick={() => void review(item, "REJECTED")}><i className="bi bi-x-lg" /> Rechazar</button></div>}</article>)}</div>}</article>
    {showForm && <div className="employee-modal-layer" role="dialog" aria-modal="true"><button className="employee-modal-backdrop" type="button" aria-label="Cerrar" onClick={() => setShowForm(false)} /><form className="employee-modal-card leave-form" onSubmit={submit}><div className="employee-modal-card__header"><div><span className="workspace-eyebrow">NUEVA SOLICITUD</span><h2>Solicitar vacaciones</h2></div><button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setShowForm(false)} /></div><div className="row g-3"><div className="col-12"><label className="form-label">Tipo de ausencia</label><select className="form-select" required value={form.leaveTypeId} onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}>{types.map((type) => <option value={type.id} key={type.id}>{type.name}{type.paid ? " · remunerada" : ""}</option>)}</select></div><div className="col-md-6"><label className="form-label">Desde</label><input className="form-control" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: e.target.value > form.endDate ? e.target.value : form.endDate })} /></div><div className="col-md-6"><label className="form-label">Hasta</label><input className="form-control" type="date" min={form.startDate} required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div><div className="col-12"><label className="form-label">Comentario</label><textarea className="form-control" rows={3} maxLength={1000} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div></div><div className="employee-modal-card__footer"><button type="button" className="owner-action-button" onClick={() => setShowForm(false)}>Cancelar</button><button type="submit" className="owner-action-button owner-action-button--primary" disabled={submitting || !form.leaveTypeId}>{submitting ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-send" />} Enviar solicitud</button></div></form></div>}
  </section>;
}

