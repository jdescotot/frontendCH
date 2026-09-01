import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../../shared/api/apiError";
import { AppLogo } from "../../../shared/components/AppLogo";
import { jobsApi, type PublicJob } from "../api/jobsApi";

const modeLabel = { ONSITE: "Presencial", HYBRID: "Híbrido", REMOTE: "Remoto" } as const;

export function PublicJobsPage() {
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    jobsApi.listPublic()
      .then((response) => setJobs(response.data.items))
      .catch((reason) => setError(reason instanceof ApiError ? reason.message : "No se pudieron cargar las ofertas."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="jobs-public-page">
      <header className="jobs-public-header">
        <Link to="/empleos" aria-label="HosturJaén Empleo"><AppLogo /></Link>
        <Link className="jobs-login-link" to="/login">Acceso empresas <i className="bi bi-arrow-right" /></Link>
      </header>
      <section className="jobs-hero">
        <span className="jobs-kicker">HOSTURJAÉN EMPLEO</span>
        <h1>Tu próximo trabajo en hostelería empieza aquí.</h1>
        <p>Ofertas directas de empresas que gestionan sus equipos con HosturJaén. Solicita sin crear una cuenta.</p>
      </section>
      <section className="jobs-public-content" aria-labelledby="jobs-title">
        <div className="jobs-section-heading">
          <div><span>OPORTUNIDADES ABIERTAS</span><h2 id="jobs-title">Ofertas disponibles</h2></div>
          {!loading && <strong>{jobs.length} {jobs.length === 1 ? "oferta" : "ofertas"}</strong>}
        </div>
        {error && <div className="jobs-alert"><i className="bi bi-exclamation-circle" /> {error}</div>}
        {loading ? (
          <div className="jobs-loading"><span className="spinner-border spinner-border-sm" /> Buscando oportunidades…</div>
        ) : jobs.length === 0 ? (
          <div className="jobs-empty"><i className="bi bi-briefcase" /><h2>No hay ofertas abiertas ahora mismo</h2><p>Vuelve pronto para descubrir nuevas oportunidades.</p></div>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <article className="job-public-card" key={job.id}>
                <div className="job-public-card__company"><span>{job.companyName.slice(0, 1).toUpperCase()}</span><strong>{job.companyName}</strong></div>
                <h2>{job.title}</h2>
                <p>{job.summary}</p>
                <div className="job-public-card__meta">
                  <span><i className="bi bi-geo-alt" /> {job.location}</span>
                  <span><i className="bi bi-building" /> {modeLabel[job.workplaceMode]}</span>
                  {job.employmentType && <span><i className="bi bi-clock" /> {job.employmentType}</span>}
                </div>
                <div className="job-public-card__footer">
                  <small>{job.availablePositions} {job.availablePositions === 1 ? "plaza" : "plazas"}</small>
                  <Link to={`/empleos/${job.id}`}>Ver oferta <i className="bi bi-arrow-up-right" /></Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
