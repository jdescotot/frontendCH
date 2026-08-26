import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ApiError } from "../../../shared/api/apiError";
import { AppLogo } from "../../../shared/components/AppLogo";
import { workspaceApi, type InvitationDetails } from "../api/workspaceApi";

export function InvitationActivationPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const token = params.get("token")?.trim() ?? "";

  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    let active = true;
    if (!token) {
      setLoading(false);
      setError("El enlace de invitación no es válido.");
      return;
    }

    async function load() {
      try {
        const response = await workspaceApi.getInvitation(token);
        if (active) setDetails(response.data);
      } catch (requestError) {
        if (!active) return;
        setError(requestError instanceof ApiError ? requestError.message : "No se pudo consultar la invitación.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [token]);

  async function acceptNewAccount() {
    if (password.length < 12) {
      setError("La contraseña debe tener al menos 12 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await workspaceApi.acceptInvitation(token, password);
      setAccepted(true);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "No se pudo activar la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  async function acceptExistingAccount() {
    if (!session) return;
    setSubmitting(true);
    setError("");
    try {
      await workspaceApi.acceptExistingInvitation(token, session.csrfToken);
      setAccepted(true);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "No se pudo aceptar la invitación.");
    } finally {
      setSubmitting(false);
    }
  }

  async function switchAccount() {
    await logout();
    navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
  }

  return (
    <main className="invitation-page">
      <div className="container py-4 py-md-5">
        <div className="invitation-brand"><AppLogo light /></div>
        <section className="invitation-card mx-auto">
          {loading ? (
            <div className="text-center py-5"><span className="spinner-border spinner-border-sm me-2" /> Comprobando invitación…</div>
          ) : accepted && details ? (
            <div className="invitation-success text-center">
              <span className="invitation-success__icon"><i className="bi bi-check2" /></span>
              <span className="workspace-eyebrow">INCORPORACIÓN COMPLETADA</span>
              <h1>Bienvenido a {details.companyName}</h1>
              <p>Tu relación con la empresa ya está activa. Ya puedes acceder al espacio de trabajo.</p>
              {session && session.user.email !== details.invitedEmail ? (
                <button type="button" className="owner-action-button owner-action-button--primary w-100" onClick={() => void switchAccount()}>
                  Cerrar la sesión actual e iniciar como empleado
                </button>
              ) : session ? (
                <a href="/app" className="owner-action-button owner-action-button--primary w-100">Continuar</a>
              ) : (
                <Link to="/login" className="owner-action-button owner-action-button--primary w-100">Iniciar sesión</Link>
              )}
            </div>
          ) : details ? (
            <>
              <div className="invitation-card__heading">
                <span className="workspace-eyebrow">INVITACIÓN DE EMPLEO</span>
                <h1>{details.employeeName}</h1>
                <p><strong>{details.companyName}</strong> te ha invitado a formar parte de su espacio de trabajo.</p>
              </div>

              {details.status !== "PENDING" ? (
                <div className="alert alert-warning mb-0">
                  {details.status === "EXPIRED" ? "Este enlace ha caducado. Pide a la empresa que genere uno nuevo." : "Esta invitación ya no está pendiente."}
                </div>
              ) : details.existingAccount ? (
                session?.user.email.toLowerCase() === details.invitedEmail.toLowerCase() ? (
                  <div className="invitation-existing-account">
                    <div className="alert alert-success"><i className="bi bi-person-check me-2" />Has iniciado sesión con la cuenta correcta.</div>
                    <button type="button" className="owner-action-button owner-action-button--primary w-100" disabled={submitting} onClick={() => void acceptExistingAccount()}>
                      {submitting ? "Aceptando…" : "Aceptar invitación"}
                    </button>
                  </div>
                ) : session ? (
                  <div>
                    <div className="alert alert-warning">Esta invitación pertenece a <strong>{details.invitedEmail}</strong>, pero tienes iniciada otra cuenta.</div>
                    <button type="button" className="owner-action-button w-100" onClick={() => void switchAccount()}>Cambiar de cuenta</button>
                  </div>
                ) : (
                  <div>
                    <p className="text-secondary">Este correo ya tiene una cuenta. Inicia sesión con <strong>{details.invitedEmail}</strong> para aceptar la invitación.</p>
                    <Link className="owner-action-button owner-action-button--primary w-100" to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}>Iniciar sesión</Link>
                  </div>
                )
              ) : (
                <div className="invitation-password-form">
                  <p className="text-secondary">Crea tu contraseña para activar la cuenta <strong>{details.invitedEmail}</strong>.</p>
                  <label className="form-label">Contraseña</label>
                  <input className="form-control mb-3" type="password" autoComplete="new-password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} />
                  <label className="form-label">Repite la contraseña</label>
                  <input className="form-control mb-3" type="password" autoComplete="new-password" minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
                  <small className="d-block text-secondary mb-3">Mínimo 12 caracteres. La contraseña se protege con Argon2id y nunca se almacena en texto plano.</small>
                  <button type="button" className="owner-action-button owner-action-button--primary w-100" disabled={submitting} onClick={() => void acceptNewAccount()}>
                    {submitting ? "Activando…" : "Activar mi cuenta"}
                  </button>
                </div>
              )}

              {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
            </>
          ) : (
            <div className="text-center py-4">
              <span className="invitation-error-icon"><i className="bi bi-link-45deg" /></span>
              <h1>Invitación no disponible</h1>
              <p>{error || "No hemos podido abrir este enlace."}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
