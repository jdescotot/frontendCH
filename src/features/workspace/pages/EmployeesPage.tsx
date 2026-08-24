import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ApiError } from "../../../shared/api/apiError";
import {
  workspaceApi,
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

export function EmployeesPage() {
  const { selectedMembership } = useAuth();
  const [items, setItems] = useState<WorkspaceEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!selectedMembership) return;
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await workspaceApi.getEmployees(selectedMembership.companyId);
        if (active) setItems(response.data.items);
      } catch (requestError) {
        if (!active) return;
        setError(requestError instanceof ApiError ? requestError.message : "No se pudo cargar la plantilla.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [selectedMembership]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    if (!term) return items;
    return items.filter((employee) =>
      `${employee.firstName} ${employee.lastName} ${employee.jobTitle ?? ""}`
        .toLocaleLowerCase("es")
        .includes(term),
    );
  }, [items, search]);

  if (!selectedMembership) return null;

  return (
    <section className="workspace-page container-xxl">
      <div className="workspace-page-heading workspace-page-heading--actions">
        <div>
          <span className="workspace-eyebrow">EQUIPO</span>
          <h1>Empleados</h1>
          <p>Consulta el estado de hoy y prepara la gestión laboral desde una ficha única por persona.</p>
        </div>
        <button className="owner-action-button owner-action-button--primary" type="button" disabled>
          <i className="bi bi-person-plus" /> Nuevo empleado
          <small>Próxima fase</small>
        </button>
      </div>

      <div className="workspace-toolbar">
        <label className="workspace-search">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar empleado…"
            aria-label="Buscar empleado"
          />
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
            <div><strong>No encontramos empleados.</strong><span>Prueba con otro término o añade el primer empleado cuando activemos el alta.</span></div>
          </div>
        ) : (
          <div className="employee-cards-grid">
            {filteredItems.map((employee) => {
              const [label, className] = statusLabel(employee.status);
              return (
                <article className="employee-profile-card" key={employee.membershipId}>
                  <div className="employee-profile-card__top">
                    <span className="owner-employee-avatar owner-employee-avatar--large">
                      {initials(employee.firstName, employee.lastName)}
                    </span>
                    <span className={`owner-status-pill ${className}`}>{label}</span>
                  </div>
                  <h2>{employee.firstName} {employee.lastName}</h2>
                  <p>{employee.jobTitle || "Empleado"}</p>
                  <div className="employee-profile-card__stats">
                    <div><small>Hoy</small><strong>{formatDuration(employee.workedSeconds)}</strong></div>
                    <div><small>Roles</small><strong>{employee.roles.join(" · ") || "Empleado"}</strong></div>
                  </div>
                  <button type="button" className="employee-profile-card__action" disabled>
                    Abrir ficha <i className="bi bi-arrow-right" />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
}
