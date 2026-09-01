import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../../../shared/api/apiError";
import { AppLogo } from "../../../shared/components/AppLogo";
import { jobsApi, type JobApplication } from "../api/jobsApi";

const statusLabels = {
  SUBMITTED: "Recibida", REVIEWING: "En revisión", SHORTLISTED: "Finalista",
  REJECTED: "No seleccionada", HIRED: "Contratado/a", WITHDRAWN: "Retirada",
} as const;

export function JobApplicationPage() {
  const { applicationId = "" } = useParams();
  const [token, setToken] = useState("");
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const fragmentToken = params.get("token") ?? "";
    const saved = window.localStorage.getItem(`job-application:${applicationId}`) ?? "";
    const resolved = fragmentToken || saved;
    if (fragmentToken) {
      window.localStorage.setItem(`job-application:${applicationId}`, fragmentToken);
      window.history.replaceState(null, "", window.location.pathname);
    }
    setToken(resolved);
  }, [applicationId]);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Este dispositivo no tiene el acceso privado de la candidatura. Abre el enlace completo que recibiste al solicitar el empleo.");
      return;
    }
    setLoading(true);
    try {
      const response = await jobsApi.getApplication(applicationId, token);
      setApplication(response.data);
      setError("");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo cargar la candidatura.");
    } finally {
      setLoading(false);
    }
  }, [applicationId, token]);

  useEffect(() => { void load(); }, [load]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await jobsApi.sendApplicantMessage(applicationId, token, message);
      setMessage("");
      await load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  async function withdraw() {
    if (!window.confirm("¿Quieres retirar tu candidatura? Esta acción cerrará la conversación.")) return;
    try {
      await jobsApi.withdraw(applicationId, token);
      await load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo retirar la candidatura.");
    }
  }

  async function copyPrivateAccess() {
    const privateURL = `${window.location.origin}/mi-candidatura/${applicationId}#token=${encodeURIComponent(token)}`;
    await navigator.clipboard.writeText(privateURL);
  }

  const closed = application ? ["REJECTED", "HIRED", "WITHDRAWN"].includes(application.status) : true;

  return (
    <main className="jobs-public-page application-access-page">
      <header className="jobs-public-header"><Link to="/empleos"><AppLogo /></Link><Link className="jobs-login-link" to="/empleos">Ver ofertas</Link></header>
      <section className="application-access-card">
        {loading ? <div className="jobs-loading"><span className="spinner-border spinner-border-sm" /> Cargando candidatura…</div> : error && !application ? (
          <div className="jobs-empty"><i className="bi bi-shield-lock" /><h1>Acceso privado necesario</h1><p>{error}</p></div>
        ) : application && (
          <>
            <div className="application-access-heading">
              <div><span className="jobs-kicker">TU CANDIDATURA</span><h1>{application.jobTitle}</h1><p>{application.companyName}</p></div>
              <span className={`application-status is-${application.status.toLowerCase()}`}>{statusLabels[application.status]}</span>
            </div>
            {error && <div className="jobs-alert">{error}</div>}
            <div className="application-thread">
              {application.messages.map((item) => (
                <article className={`application-message is-${item.sender.toLowerCase()}`} key={item.id}>
                  <strong>{item.sender === "COMPANY" ? application.companyName : "Tú"}</strong>
                  <p>{item.body}</p><time>{new Date(item.createdAt).toLocaleString("es-ES")}</time>
                </article>
              ))}
            </div>
            {!closed && <form className="application-reply" onSubmit={send}><textarea required maxLength={4000} rows={3} placeholder="Escribe un mensaje a la empresa…" value={message} onChange={(e) => setMessage(e.target.value)} /><button disabled={sending}>{sending ? "Enviando…" : "Enviar"}</button></form>}
            <div className="application-access-actions"><button type="button" onClick={() => void copyPrivateAccess()}><i className="bi bi-link-45deg" /> Copiar acceso privado</button><button type="button" onClick={() => void load()}><i className="bi bi-arrow-clockwise" /> Actualizar</button>{!closed && <button className="is-danger" type="button" onClick={() => void withdraw()}>Retirar candidatura</button>}</div>
          </>
        )}
      </section>
    </main>
  );
}
