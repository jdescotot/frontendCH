import { LoginForm } from "../components/LoginForm";
import { LoginVisualPanel } from "../components/LoginVisualPanel";
import { AppLogo } from "../../../shared/components/AppLogo";

export function LoginPage() {
  return (
    <main className="login-page">
      <div className="container-fluid p-0 min-vh-100">
        <div className="row g-0 min-vh-100">
          <div className="col-lg-7 col-xl-7">
            <LoginVisualPanel />
          </div>

          <div className="col-12 col-lg-5 col-xl-5 login-form-column">
            <div className="login-mobile-brand d-lg-none">
              <AppLogo light />
            </div>

            <section className="login-card" aria-labelledby="login-title">
              <div className="login-card__heading">
                <span className="login-card__kicker">ACCESO SEGURO</span>
                <h2 id="login-title">Bienvenido de nuevo</h2>
                <p>Accede para continuar con tu jornada.</p>
              </div>

              <LoginForm />

              <footer className="login-card__footer">
                <i className="bi bi-shield-lock" aria-hidden="true" />
                Acceso seguro y protegido
              </footer>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
