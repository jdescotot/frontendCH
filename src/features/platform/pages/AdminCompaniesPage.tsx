import { FormEvent, useEffect, useState } from "react";
import { ApiError } from "../../../shared/api/apiError";
import { PlatformShell } from "../components/PlatformShell";
import { platformApi, type PlatformCompany } from "../api/platformApi";

function statusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Activa";
    case "SUSPENDED":
      return "Suspendida";
    case "INACTIVE":
      return "Inactiva";
    case "CLOSED":
      return "Cerrada";
    default:
      return status;
  }
}

export function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<PlatformCompany[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCompanies() {
      try {
        setLoading(true);
        const response = await platformApi.getCompanies(appliedSearch);
        if (!active) return;
        setCompanies(response.data.items);
        setTotal(response.data.total);
        setError("");
      } catch (requestError) {
        if (!active) return;
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "No se pudieron cargar las empresas.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCompanies();
    return () => {
      active = false;
    };
  }, [appliedSearch]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedSearch(search.trim());
  }

  function clearSearch() {
    setSearch("");
    setAppliedSearch("");
  }

  return (
    <PlatformShell
      eyebrow="CLIENTES"
      title="Empresas"
      description="Directorio global de empresas registradas en la plataforma. Los datos se consultan directamente desde la API."
      actions={
        <button type="button" className="btn platform-primary-button" disabled>
          <i className="bi bi-plus-lg" aria-hidden="true" />
          Nuevo cliente
          <span className="platform-button-badge">MFA</span>
        </button>
      }
    >
      <section className="platform-table-card">
        <div className="platform-table-toolbar">
          <div>
            <strong>{loading ? "Cargando empresas…" : `${total} empresa${total === 1 ? "" : "s"}`}</strong>
            <span>Consulta de solo lectura por ahora</span>
          </div>

          <form className="platform-search" onSubmit={submitSearch}>
            <i className="bi bi-search" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar empresa, CIF/NIF…"
              aria-label="Buscar empresas"
            />
            {search && (
              <button type="button" aria-label="Limpiar búsqueda" onClick={clearSearch}>
                <i className="bi bi-x" aria-hidden="true" />
              </button>
            )}
          </form>
        </div>

        {error && (
          <div className="platform-alert m-3" role="alert">
            <i className="bi bi-exclamation-triangle" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {!error && !loading && companies.length === 0 && (
          <div className="platform-empty-state">
            <span><i className="bi bi-buildings" aria-hidden="true" /></span>
            <h2>No encontramos empresas</h2>
            <p>Prueba con otro término de búsqueda.</p>
            {appliedSearch && (
              <button type="button" className="platform-link-button" onClick={clearSearch}>
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}

        {!error && companies.length > 0 && (
          <div className="table-responsive">
            <table className="table platform-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Estado</th>
                  <th>Miembros</th>
                  <th>Propietarios</th>
                  <th>Zona horaria</th>
                  <th>Alta</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <div className="platform-company-cell">
                        <span>{(company.tradeName || company.legalName).charAt(0).toUpperCase()}</span>
                        <div>
                          <strong>{company.tradeName || company.legalName}</strong>
                          <small>{company.legalName}</small>
                          {company.taxId && <small>{company.taxId}</small>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`platform-status platform-status--${company.status.toLowerCase()}`}>
                        {statusLabel(company.status)}
                      </span>
                    </td>
                    <td>{company.membersCount}</td>
                    <td>{company.ownersCount}</td>
                    <td>{company.timeZone}</td>
                    <td>{new Date(company.createdAt).toLocaleDateString("es-ES")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PlatformShell>
  );
}
