import { useState, type InputHTMLAttributes } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  registration: UseFormRegisterReturn;
  error?: string;
}

export function PasswordField({
  registration,
  error,
  id = "password",
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="form-label login-label" htmlFor={id}>
        Contraseña
      </label>
      <div className={`login-input-group ${error ? "is-invalid" : ""}`}>
        <i className="bi bi-lock login-input-icon" aria-hidden="true" />
        <input
          {...props}
          {...registration}
          id={id}
          type={visible ? "text" : "password"}
          className="form-control login-control"
          autoComplete="current-password"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
        >
          <i
            className={`bi ${visible ? "bi-eye-slash" : "bi-eye"}`}
            aria-hidden="true"
          />
        </button>
      </div>
      {error && (
        <div id={`${id}-error`} className="login-field-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
