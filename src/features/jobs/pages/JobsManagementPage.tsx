import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ApiError } from "../../../shared/api/apiError";
import {
  jobsApi, type ApplicationStatus, type JobApplication, type JobPostingInput,
  type WorkspaceApplication, type WorkspaceJob,
} from "../api/jobsApi";

const emptyJob: JobPostingInput & { closesOn: string } = {
  title: "", summary: "", description: "", employmentType: "", location: "Jaén",
  workplaceMode: "ONSITE", availablePositions: 1, closesAt: null, closesOn: "", status: "PUBLISHED",
};

const jobLabels = { DRAFT: "Borrador", PUBLISHED: "Publicada", PAUSED: "Pausada", FILLED: "Cubierta", CLOSED: "Cerrada" } as const;
const applicationLabels: Record<ApplicationStatus, string> = {
  SUBMITTED: "Recibida", REVIEWING: "En revisión", SHORTLISTED: "Finalista",
  REJECTED: "Descartada", HIRED: "Contratada", WITHDRAWN: "Retirada",
};

export function JobsManagementPage() {
  const navigate = useNavigate();
  const { selectedMembership, session } = useAuth();
  const [jobs, setJobs] = useState<WorkspaceJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<WorkspaceJob | null>(null);
  const [applications, setApplications] = useState<WorkspaceApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [form, setForm] = useState(emptyJob);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canManage = selectedMembership?.roles.some((role) => role === "OWNER" || role === "MANAGER") ?? false;
  const companyId = selectedMembership?.companyId ?? "";
  const csrfToken = session?.csrfToken ?? "";

  async function loadJobs() {
    if (!companyId) return;
    setLoading(true);
    try {
      const response = await jobsApi.listWorkspace(companyId);
      setJobs(response.data.items);
      if (selectedJob) setSelectedJob(response.data.items.find((item) => item.id === selectedJob.id) ?? null);
      setError("");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudieron cargar las ofertas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadJobs(); }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!canManage) return <Navigate to="/app/inicio" replace />;

  async function createJob(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const closesAt = form.closesOn ? new Date(`${form.closesOn}T23:59:59`).toISOString() : null;
      await jobsApi.createWorkspace(companyId, csrfToken, { ...form, closesAt, employmentType: form.employmentType || null });
      setShowForm(false);
      setForm(emptyJob);
      await loadJobs();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo crear la oferta.");
    } finally {
      setSubmitting(false);
    }
  }

  async function changeJobStatus(job: WorkspaceJob, status: "PUBLISHED" | "PAUSED" | "CLOSED") {
    try {
      await jobsApi.updateWorkspaceStatus(companyId, csrfToken, job.id, status);
      await loadJobs();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo actualizar la oferta.");
    }
  }

  async function openApplications(job: WorkspaceJob) {
    setSelectedJob(job);
    setSelectedApplication(null);
    try {
      const response = await jobsApi.listApplications(companyId, job.id);
      setApplications(response.data.items);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudieron cargar las candidaturas.");
    }
  }

  async function openApplication(applicationId: string) {
    try {
      const response = await jobsApi.getWorkspaceApplication(companyId, applicationId);
      setSelectedApplication(response.data);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo cargar la candidatura.");
    }
  }

  async function refreshApplication() {
    if (!selectedApplication || !selectedJob) return;
    await openApplication(selectedApplication.id);
    const response = await jobsApi.listApplications(companyId, selectedJob.id);
    setApplications(response.data.items);
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!selectedApplication || !message.trim()) return;
    setSubmitting(true);
    try {
      await jobsApi.sendWorkspaceMessage(companyId, csrfToken, selectedApplication.id, message);
      setMessage("");
      await refreshApplication();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo enviar el mensaje.");
    } finally {
      setSubmitting(false);
    }
  }

  async function setApplicationStatus(status: "REVIEWING" | "SHORTLISTED" | "REJECTED") {
    if (!selectedApplication) return;
    try {
      await jobsApi.updateApplicationStatus(companyId, csrfToken, selectedApplication.id, status);
      await refreshApplication();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo actualizar la candidatura.");
    }
  }

  function hireApplicant() {
    if (!selectedApplication) return;
    const params = new URLSearchParams({
      jobApplicationId: selectedApplication.id,
      firstName: selectedApplication.firstName,
      lastName: selectedApplication.lastName,
      email: selectedApplication.email,
      phone: selectedApplication.phone ?? "",
      jobTitle: selectedApplication.jobTitle,
    });
    navigate(`/app/empleados?${params.toString()}`);
  }

  const threadClosed = selectedApplication ? ["REJECTED", "HIRED", "WITHDRAWN"].includes(selectedApplication.status) : true;

  return (
    <section className="workspace-page container-xxl jobs-management-page">
      <div className="workspace-page-heading workspace-page-heading--actions">
        <div><span className="workspace-eyebrow">RECLUTAMIENTO</span><h1>Portal de empleo</h1><p>Publica puestos, revisa candidaturas y conversa con candidatos.</p></div>
        <button className="owner-action-button owner-action-button--primary" type="button" onClick={() => setShowForm(true)}><i className="bi bi-plus-lg" /> Nueva oferta</button>
      </div>
      {error && <div className="workspace-alert"><i className="bi bi-exclamation-circle" /> {error}</div>}
      {loading ? <div className="owner-loading-state"><span className="spinner-border spinner-border-sm" /> Cargando ofertas…</div> : jobs.length === 0 ? (
        <div className="jobs-admin-empty"><i className="bi bi-briefcase" /><h2>Todavía no has publicado ofertas</h2><p>Crea la primera para empezar a recibir candidaturas sin exigir una cuenta.</p></div>
      ) : (
        <div className="jobs-admin-grid">
          {jobs.map((job) => (
            <article className="jobs-admin-card" key={job.id}>
              <div className="jobs-admin-card__top"><span className={`jobs-admin-status is-${job.status.toLowerCase()}`}>{jobLabels[job.status]}</span><small>{job.applicationCount} candidaturas</small></div>
              <h2>{job.title}</h2><p>{job.summary}</p>
              <div className="jobs-admin-card__meta"><span><i className="bi bi-geo-alt" /> {job.location}</span><span>{job.filledPositions}/{job.availablePositions} plazas cubiertas</span></div>
              <div className="jobs-admin-card__actions">
                <button type="button" onClick={() => void openApplications(job)}>Candidaturas {job.activeApplicationCount > 0 && <b>{job.activeApplicationCount}</b>}</button>
                {job.status === "PUBLISHED" && <button type="button" onClick={() => void changeJobStatus(job, "PAUSED")}>Pausar</button>}
                {(job.status === "DRAFT" || job.status === "PAUSED") && <button type="button" onClick={() => void changeJobStatus(job, "PUBLISHED")}>Publicar</button>}
                {!(["FILLED", "CLOSED"] as string[]).includes(job.status) && <button className="is-danger" type="button" onClick={() => void changeJobStatus(job, "CLOSED")}>Cerrar</button>}
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm && <div className="employee-modal-layer" role="dialog" aria-modal="true" aria-labelledby="job-form-title">
        <button className="employee-modal-backdrop" type="button" aria-label="Cerrar" onClick={() => setShowForm(false)} />
        <div className="employee-modal-card jobs-form-modal">
          <div className="employee-modal-card__header"><div><span className="workspace-eyebrow">NUEVA OPORTUNIDAD</span><h2 id="job-form-title">Crear oferta</h2></div><button type="button" className="btn-close" onClick={() => setShowForm(false)} /></div>
          <form onSubmit={createJob}><div className="row g-3">
            <div className="col-12"><label className="form-label">Título *</label><input className="form-control" required minLength={3} maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="col-12"><label className="form-label">Resumen *</label><textarea className="form-control" required minLength={10} maxLength={320} rows={2} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
            <div className="col-12"><label className="form-label">Descripción *</label><textarea className="form-control" required minLength={20} maxLength={10000} rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="col-md-6"><label className="form-label">Ubicación *</label><input className="form-control" required maxLength={160} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="col-md-6"><label className="form-label">Tipo de contrato</label><input className="form-control" maxLength={80} placeholder="Ej. Indefinido" value={form.employmentType ?? ""} onChange={(e) => setForm({ ...form, employmentType: e.target.value })} /></div>
            <div className="col-md-4"><label className="form-label">Modalidad</label><select className="form-select" value={form.workplaceMode} onChange={(e) => setForm({ ...form, workplaceMode: e.target.value as JobPostingInput["workplaceMode"] })}><option value="ONSITE">Presencial</option><option value="HYBRID">Híbrido</option><option value="REMOTE">Remoto</option></select></div>
            <div className="col-md-4"><label className="form-label">Plazas *</label><input className="form-control" type="number" min={1} max={100} value={form.availablePositions} onChange={(e) => setForm({ ...form, availablePositions: Number(e.target.value) })} /></div>
            <div className="col-md-4"><label className="form-label">Cierre opcional</label><input className="form-control" type="date" value={form.closesOn} onChange={(e) => setForm({ ...form, closesOn: e.target.value })} /></div>
            <div className="col-12"><label className="form-label">Publicación</label><select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "DRAFT" | "PUBLISHED" })}><option value="PUBLISHED">Publicar ahora</option><option value="DRAFT">Guardar borrador</option></select></div>
          </div><div className="employee-modal-card__footer"><button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancelar</button><button className="owner-action-button owner-action-button--primary" disabled={submitting}>{submitting ? "Guardando…" : "Guardar oferta"}</button></div></form>
        </div>
      </div>}

      {selectedJob && <div className="employee-modal-layer" role="dialog" aria-modal="true" aria-labelledby="applications-title">
        <button className="employee-modal-backdrop" type="button" aria-label="Cerrar" onClick={() => { setSelectedJob(null); setSelectedApplication(null); }} />
        <div className="employee-modal-card jobs-applications-modal">
          <div className="employee-modal-card__header"><div><span className="workspace-eyebrow">CANDIDATURAS</span><h2 id="applications-title">{selectedJob.title}</h2></div><button type="button" className="btn-close" onClick={() => { setSelectedJob(null); setSelectedApplication(null); }} /></div>
          <div className="jobs-applications-layout">
            <aside className="jobs-applicant-list">{applications.length === 0 ? <p>No hay candidaturas todavía.</p> : applications.map((item) => <button className={selectedApplication?.id === item.id ? "is-active" : ""} type="button" key={item.id} onClick={() => void openApplication(item.id)}><strong>{item.firstName} {item.lastName}</strong><span>{item.email}</span><small>{applicationLabels[item.status]} · {item.messageCount} mensajes</small></button>)}</aside>
            <div className="jobs-applicant-detail">{!selectedApplication ? <div className="jobs-select-applicant"><i className="bi bi-person-lines-fill" /><p>Selecciona una candidatura para revisar sus datos y conversación.</p></div> : <>
              <div className="jobs-applicant-heading"><div><h3>{selectedApplication.firstName} {selectedApplication.lastName}</h3><a href={`mailto:${selectedApplication.email}`}>{selectedApplication.email}</a>{selectedApplication.phone && <a href={`tel:${selectedApplication.phone}`}>{selectedApplication.phone}</a>}</div><span className={`application-status is-${selectedApplication.status.toLowerCase()}`}>{applicationLabels[selectedApplication.status]}</span></div>
              {selectedApplication.coverMessage && <div className="jobs-cover-message"><strong>Presentación</strong><p>{selectedApplication.coverMessage}</p></div>}
              <div className="application-thread is-company-view">{selectedApplication.messages.map((item) => <article className={`application-message is-${item.sender.toLowerCase()}`} key={item.id}><strong>{item.sender === "COMPANY" ? "Empresa" : selectedApplication.firstName}</strong><p>{item.body}</p><time>{new Date(item.createdAt).toLocaleString("es-ES")}</time></article>)}</div>
              {!threadClosed && <form className="application-reply" onSubmit={sendMessage}><textarea required maxLength={4000} rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Responder al candidato…" /><button disabled={submitting}>Enviar</button></form>}
              {!threadClosed && <div className="jobs-review-actions"><button type="button" onClick={() => void setApplicationStatus("REVIEWING")}>En revisión</button><button type="button" onClick={() => void setApplicationStatus("SHORTLISTED")}>Finalista</button><button className="is-danger" type="button" onClick={() => void setApplicationStatus("REJECTED")}>Descartar</button><button className="is-hire" type="button" onClick={hireApplicant}><i className="bi bi-person-check" /> Contratar y dar de alta</button></div>}
            </>}</div>
          </div>
        </div>
      </div>}
    </section>
  );
}
