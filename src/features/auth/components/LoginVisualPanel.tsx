import { AppLogo } from "../../../shared/components/AppLogo";

const benefits = [
  "Fichajes claros y verificables",
  "Equipos y empresas conectados",
  "Información disponible cuando la necesitas",
];

export function LoginVisualPanel() {
  return (
    <section className="login-visual d-none d-lg-flex" aria-label="Presentación">
      <div className="login-visual__glow" aria-hidden="true" />
      <div className="olive-orbit olive-orbit--one" aria-hidden="true" />
      <div className="olive-orbit olive-orbit--two" aria-hidden="true" />

      <div className="login-visual__content">
        <AppLogo light />

        <div className="login-visual__copy">
          <span className="eyebrow">CONTROL Y ORGANIZACIÓN</span>
          <h1>Tu jornada, clara. Tu equipo, conectado.</h1>
          <p>
            Registra horarios, organiza tareas y gestiona tus centros desde un
            único espacio seguro.
          </p>

          <ul className="benefit-list">
            {benefits.map((benefit) => (
              <li key={benefit}>
                <span className="benefit-list__icon">
                  <i className="bi bi-check2" aria-hidden="true" />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="clock-preview" aria-hidden="true">
          <div className="clock-preview__top">
            <span className="clock-preview__avatar">CH</span>
            <div>
              <strong>Equipo conectado</strong>
              <small>Centro de trabajo</small>
            </div>
            <span className="clock-preview__status">En turno</span>
          </div>
          <div className="clock-preview__time">
            <span>Entrada registrada</span>
            <strong>Ahora</strong>
          </div>
          <div className="clock-preview__footer">
            <span><i className="bi bi-geo-alt" /> Ubicación verificada</span>
            <span><i className="bi bi-shield-check" /> Registro seguro</span>
          </div>
        </div>
      </div>
    </section>
  );
}
