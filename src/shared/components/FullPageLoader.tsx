import { AppLogo } from "./AppLogo";

export function FullPageLoader() {
  return (
    <main className="full-page-loader" aria-live="polite" aria-busy="true">
      <AppLogo light />
      <div className="spinner-border spinner-border-sm" role="status">
        <span className="visually-hidden">Cargando</span>
      </div>
    </main>
  );
}
