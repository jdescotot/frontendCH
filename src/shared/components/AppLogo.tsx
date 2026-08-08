interface AppLogoProps {
  compact?: boolean;
  light?: boolean;
}

export function AppLogo({ compact = false, light = false }: AppLogoProps) {
  return (
    <div className={`app-logo ${light ? "app-logo--light" : ""}`}>
      <span className="app-logo__mark" aria-hidden="true">
        <svg viewBox="0 0 52 52" role="img">
          <path d="M15 33c8-1 14-7 18-18 4 12 1 21-8 24-5 2-9 0-10-6Z" />
          <path className="app-logo__stem" d="M24 39c1-8 5-15 12-21" />
          <circle cx="17" cy="17" r="3.5" />
        </svg>
      </span>
      {!compact && (
        <span className="app-logo__text">
          <strong>Control</strong>
          <span>Horario</span>
        </span>
      )}
    </div>
  );
}
