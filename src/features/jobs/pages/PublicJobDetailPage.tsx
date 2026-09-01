import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../../shared/api/apiError";
import { AppLogo } from "../../../shared/components/AppLogo";
import { jobsApi, type PublicApplicationInput, type PublicJob } from "../api/jobsApi";

const emptyForm: PublicApplicationInput = {
  firstName: "", lastName: "", email: "", phone: "", coverMessage: "",
  privacyAccepted: false, website: "",
};

export function PublicJobDetailPage() {
  const { jobId = "" } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<PublicJob | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    jobsApi.getPublic(jobId)
      .then((response) => setJob(response.data))
      .catch((reason) => setError(reason instanceof ApiError ? reason.message : "No se pudo cargar la oferta."))
      .finally(() => setLoading(false));
  }, [jobId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await jobsApi.apply(jobId, form);
      const { applicationId, accessToken } = response.data;
      window.localStorage.setItem(`job-application:${applicationId}`, accessToken);
      navigate(`/mi-candidatura/${applicationId}#token=${encodeURIComponent(accessToken)}`);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo enviar la candidatura.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="jobs-public-page jobs-detail-page">
      <header className="jobs-public-header">
        <Link to="/empleos"><AppLogo /></Link>
        <Link className="jobs-login-link" to="/empleos"><i className="bi bi-arrow-left" /> Todas las ofertas</Link>
      </header>
      {loading ? <div className="jobs-loading"><span className="spinner-border spinner-border-sm" /> Cargando oferta…</div> : !job ? (
        <div className="jobs-empty"><i className="bi bi-briefcase" /><h1>Oferta no disponible</h1><p>{error}</p><Link to="/empleos">Ver otras ofertas</Link></div>
      ) : (
        <div className="job-detail-layout">
          <article className="job-detail-copy">
            <span className="jobs-kicker">{job.companyName}</span>
            <h1>{job.title}</h1>
            <p className="job-detail-summary">{job.summary}</p>
            <div className="job-detail-tags">
              <span><i className="bi bi-geo-alt" /> {job.location}</span>
              <span><i className="bi bi-building" /> {job.workplaceMode === "REMOTE" ? "Remoto" : job.workplaceMode === "HYBRID" ? "Híbrido" : "Presencial"}</span>
              {job.employmentType && <span><i className="bi bi-clock" /> {job.employmentType}</span>}
            </div>
            <h2>Sobre el puesto</h2>
            <div className="job-detail-description">{job.description}</div>
          </article>
          <aside className="job-application-card" id="solicitar">
            <span className="jobs-kicker">CANDIDATURA RÁPIDA</span>
            <h2>Solicitar este empleo</h2>
            <p>No necesitas crear una cuenta. Al terminar recibirás un acceso privado para conversar con la empresa.</p>
            <form onSubmit={submit}>
              {error && <div className="jobs-alert">{error}</div>}
              <div className="job-form-grid">
                <label>Nombre *<input required maxLength={100} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></label>
                <label>Apellidos *<input required maxLength={160} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></label>
              </div>
              <label>Correo electrónico *<input type="email" required maxLength={320} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label>Teléfono<input maxLength={40} value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              <label>Cuéntanos brevemente sobre ti<textarea rows={5} maxLength={4000} value={form.coverMessage ?? ""} onChange={(e) => setForm({ ...form, coverMessage: e.target.value })} /></label>
              <label className="job-honeypot" aria-hidden="true">Sitio web<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></label>
              <label className="job-consent"><input type="checkbox" required checked={form.privacyAccepted} onChange={(e) => setForm({ ...form, privacyAccepted: e.target.checked })} /><span>Acepto que mis datos se compartan con {job.companyName} para gestionar esta candidatura.</span></label>
              <button type="submit" disabled={submitting}>{submitting ? "Enviando…" : "Enviar candidatura"} <i className="bi bi-arrow-right" /></button>
            </form>
          </aside>
        </div>
      )}
    </main>
  );
}
