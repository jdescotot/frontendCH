import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ApiError } from "../../../shared/api/apiError";
import {
  workspaceApi,
  type EmployeeInvitation,
  type PendingEmployeeInvitation,
  type WorkspaceEmployee,
} from "../api/workspaceApi";

function statusLabel(status: WorkspaceEmployee["status"]) {
  switch (status) {
    case "WORKING": return ["En jornada", "is-working"] as const;
    case "BREAK": return ["En descanso", "is-break"] as const;
    case "FINISHED": return ["Finalizó", "is-finished"] as const;
    default: return ["Sin fichar", "is-pending"] as const;
  }
}

function formatDuration(seconds: number) {
  if (seconds <= 0) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function todayValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  taxId: "",
  employeeNumber: "",
  jobTitle: "",
  professionalCategory: "",
  contractType: "",
  weeklyHours: "40",
  startedOn: todayValue(),
};

export function EmployeesPage() {
  const { session, selectedMembership } = useAuth();
  const [items, setItems] = useState<WorkspaceEmployee[]>([]);
  const [invitations, setInvitations] = useState<PendingEmployeeInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [createdInvitation, setCreatedInvitation] = useState<EmployeeInvitation | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  const canManage = selectedMembership?.roles.some((role) => role === "OWNER" || role === "MANAGER") ?? false;

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
        if (canManage) {
          const [employeesResponse, invitationsResponse] = await Promise.all([
            workspaceApi.getEmployees(activeCompanyId),
            workspaceApi.getEmployeeInvitations(activeCompanyId),
          ]);
          if (!active) return;
          setItems(employeesResponse.data.items);
          setInvitations(invitationsResponse.data.items);
        } else {
          setItems([]);
          setInvitations([]);
        }
      } catch (requestError) {
        if (!active) return;
        setError(requestError instanceof ApiError ? requestError.message : "No se pudo cargar la plantilla.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [selectedMembership?.companyId, canManage]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    if (!term) return items;
    return items.filter((employee) =>
      `${employee.firstName} ${employee.lastName} ${employee.jobTitle ?? ""}`
        .toLocaleLowerCase("es")
        .includes(term),
    );
  }, [items, search]);

  if (!selectedMembership || !session) return null;

  const activeCompanyId: string = selectedMembership.companyId;
  const activeCsrfToken: string = session.csrfToken;

  async function refreshInvitations() {
    const response = await workspaceApi.getEmployeeInvitations(activeCompanyId);
    setInvitations(response.data.items);
  }

  async function submitEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;

    setSubmitting(true);
    setFormError("");
    setCreatedInvitation(null);
    try {
      const weeklyHours = form.weeklyHours.trim() === "" ? null : Number(form.weeklyHours);
      const response = await workspaceApi.createEmployeeInvitation(
        activeCompanyId,
        activeCsrfToken,
        {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          taxId: form.taxId.trim() || null,
          employeeNumber: form.employeeNumber.trim() || null,
          jobTitle: form.jobTitle.trim() || null,
          professionalCategory: form.professionalCategory.trim() || null,
          contractType: form.contractType.trim() || null,
          weeklyMinutes: weeklyHours === null ? null : Math.round(weeklyHours * 60),
          startedOn: form.startedOn,
        },
      );
      setCreatedInvitation(response.data);
      setForm(emptyForm);
      await refreshInvitations();
    } catch (requestError) {
      setFormError(requestError instanceof ApiError ? requestError.message : "No se pudo crear el empleado.");
    } finally {
      setSubmitting(false);
    }
  }

  async function renewInvitation(invitationId: string) {
    setRenewingId(invitationId);
    setError("");
    try {
      const response = await workspaceApi.renewEmployeeInvitation(
        activeCompanyId,
        activeCsrfToken,
        invitationId,
      );
      setCreatedInvitation(response.data);
      setShowForm(true);
      await refreshInvitations();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "No se pudo renovar la invitación.");
    } finally {
      setRenewingId(null);
    }
  }

  async function copyActivationLink() {
    if (!createdInvitation) return;
    await navigator.clipboard.writeText(createdInvitation.activationUrl);
  }

  return (
    <section className="workspace-page container-xxl">
      <div className="workspace-page-heading workspace-page-heading--actions">
        <div>
          <span className="workspace-eyebrow">EQUIPO</span>
          <h1>Empleados</h1>
          <p>Da de alta a una persona, prepara su relación laboral y envíale un enlace seguro para activar su cuenta.</p>
        </div>
        {canManage && (
          <button className="owner-action-button owner-action-button--primary" type="button" onClick={() => { setCreatedInvitation(null); setShowForm(true); }}>
            <i className="bi bi-person-plus" /> Nuevo empleado
          </button>
        )}
      </div>

      {!canManage ? (
        <article className="workspace-empty-card">
          <span className="workspace-empty-card__icon"><i className="bi bi-shield-lock" /></span>
          <h2>Gestión reservada a responsables</h2>
          <p>Solo propietario y gerente pueden consultar y dar de alta empleados.</p>
        </article>
      ) : (
        <>
          {invitations.length > 0 && (
            <section className="employee-invitations-panel mb-4">
              <div className="owner-section-heading owner-section-heading--compact">
                <div><span className="workspace-eyebrow">INCORPORACIONES</span><h2>Invitaciones pendientes</h2></div>
              </div>
              <div className="employee-invitation-list">
                {invitations.map((invitation) => (
                  <article className="employee-invitation-row" key={invitation.invitationId}>
                    <div>
                      <strong>{invitation.employeeName}</strong>
                      <span>{invitation.invitedEmail}</span>
                    </div>
                    <span className={`owner-status-pill ${invitation.status === "EXPIRED" ? "is-pending" : "is-break"}`}>
                      {invitation.status === "EXPIRED" ? "Caducada" : "Pendiente"}
                    </span>
                    <small>Caduca {new Date(invitation.expiresAt).toLocaleDateString("es-ES")}</small>
                    <button type="button" className="btn btn-sm btn-outline-secondary" disabled={renewingId === invitation.invitationId} onClick={() => void renewInvitation(invitation.invitationId)}>
                      <i className="bi bi-arrow-clockwise" /> {renewingId === invitation.invitationId ? "Generando…" : "Nuevo enlace"}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          <div className="workspace-toolbar">
            <label className="workspace-search">
              <i className="bi bi-search" aria-hidden="true" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar empleado…" aria-label="Buscar empleado" />
            </label>
            <div className="workspace-toolbar__meta">{items.length} empleados activos</div>
          </div>

          {error && <div className="workspace-alert"><i className="bi bi-exclamation-circle" /> {error}</div>}

          <article className="workspace-list-card">
            {loading ? (
              <div className="owner-loading-state"><span className="spinner-border spinner-border-sm" /> Cargando empleados…</div>
            ) : filteredItems.length === 0 ? (
              <div className="workspace-empty-inline">
                <i className="bi bi-people" />
                <div><strong>No encontramos empleados activos.</strong><span>Usa “Nuevo empleado” para iniciar la primera incorporación.</span></div>
              </div>
            ) : (
              <div className="employee-cards-grid">
                {filteredItems.map((employee) => {
                  const [label, className] = statusLabel(employee.status);
                  return (
                    <article className="employee-profile-card" key={employee.membershipId}>
                      <div className="employee-profile-card__top">
                        <span className="owner-employee-avatar owner-employee-avatar--large">{initials(employee.firstName, employee.lastName)}</span>
                        <span className={`owner-status-pill ${className}`}>{label}</span>
                      </div>
                      <h2>{employee.firstName} {employee.lastName}</h2>
                      <p>{employee.jobTitle || "Empleado"}</p>
                      <div className="employee-profile-card__stats">
                        <div><small>Hoy</small><strong>{formatDuration(employee.workedSeconds)}</strong></div>
                        <div><small>Roles</small><strong>{employee.roles.join(" · ") || "Empleado"}</strong></div>
                      </div>
                      <Link className="employee-profile-card__action" to={`/app/empleados/${employee.membershipId}`}>Abrir ficha <i className="bi bi-arrow-right" /></Link>
                    </article>
                  );
                })}
              </div>
            )}
          </article>
        </>
      )}

      {showForm && (
        <div className="employee-modal-layer" role="dialog" aria-modal="true" aria-labelledby="employee-modal-title">
          <button className="employee-modal-backdrop" type="button" aria-label="Cerrar" onClick={() => setShowForm(false)} />
          <div className="employee-modal-card">
            <div className="employee-modal-card__header">
              <div><span className="workspace-eyebrow">NUEVA INCORPORACIÓN</span><h2 id="employee-modal-title">Alta de empleado</h2></div>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setShowForm(false)} />
            </div>

            {createdInvitation ? (
              <div className="employee-invite-success">
                <span className="employee-invite-success__icon"><i className="bi bi-envelope-check" /></span>
                <h3>Invitación preparada</h3>
                <p><strong>{createdInvitation.employeeName}</strong> ya tiene preparada su incorporación a {createdInvitation.companyName}.</p>
                <label className="form-label">Enlace de activación</label>
                <div className="input-group">
                  <input className="form-control" readOnly value={createdInvitation.activationUrl} />
                  <button type="button" className="btn btn-dark" onClick={() => void copyActivationLink()}><i className="bi bi-copy" /> Copiar</button>
                </div>
                <small className="d-block mt-3 text-secondary">El enlace caduca en 7 días. Por ahora se comparte manualmente; el envío automático por correo lo conectaremos en una fase posterior.</small>
                <button type="button" className="owner-action-button owner-action-button--primary mt-4 w-100" onClick={() => setShowForm(false)}>Terminar</button>
              </div>
            ) : (
              <form onSubmit={submitEmployee}>
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="row g-3">
                  <div className="col-md-6"><label className="form-label">Nombre *</label><input className="form-control" required maxLength={100} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
                  <div className="col-md-6"><label className="form-label">Apellidos *</label><input className="form-control" required maxLength={160} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
                  <div className="col-md-7"><label className="form-label">Correo electrónico *</label><input className="form-control" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="col-md-5"><label className="form-label">Teléfono</label><input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="col-md-6"><label className="form-label">DNI / NIE</label><input className="form-control" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} /></div>
                  <div className="col-md-6"><label className="form-label">N.º empleado</label><input className="form-control" value={form.employeeNumber} onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })} /></div>
                  <div className="col-md-6"><label className="form-label">Puesto</label><input className="form-control" placeholder="Ej. Camarero/a" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} /></div>
                  <div className="col-md-6"><label className="form-label">Categoría profesional</label><input className="form-control" value={form.professionalCategory} onChange={(e) => setForm({ ...form, professionalCategory: e.target.value })} /></div>
                  <div className="col-md-6"><label className="form-label">Tipo de contrato</label><input className="form-control" placeholder="Ej. Indefinido" value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })} /></div>
                  <div className="col-md-3"><label className="form-label">Horas / semana</label><input className="form-control" type="number" min="0" max="168" step="0.5" value={form.weeklyHours} onChange={(e) => setForm({ ...form, weeklyHours: e.target.value })} /></div>
                  <div className="col-md-3"><label className="form-label">Inicio *</label><input className="form-control" type="date" required value={form.startedOn} onChange={(e) => setForm({ ...form, startedOn: e.target.value })} /></div>
                </div>
                <div className="employee-modal-card__footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Cancelar</button>
                  <button type="submit" className="owner-action-button owner-action-button--primary" disabled={submitting}>{submitting ? "Creando…" : "Crear e invitar"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
