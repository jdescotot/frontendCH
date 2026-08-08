import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../../shared/api/apiError";
import { useAuth } from "../../../app/providers/AuthProvider";
import {
  loginSchema,
  type LoginFormValues,
} from "../schemas/loginSchema";
import { PasswordField } from "./PasswordField";

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
    mode: "onTouched",
  });

  async function onSubmit(values: LoginFormValues) {
    setGeneralError(null);
    try {
      await login(values);
      navigate("/app", { replace: true });
    } catch (error) {
      setGeneralError(
        error instanceof ApiError
          ? error.message
          : "No hemos podido iniciar sesión. Inténtalo de nuevo.",
      );
    }
  }

  return (
    <form
      className="login-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-busy={isSubmitting}
    >
      {generalError && (
        <div className="login-alert" role="alert">
          <i className="bi bi-exclamation-circle" aria-hidden="true" />
          <span>{generalError}</span>
        </div>
      )}

      <div>
        <label className="form-label login-label" htmlFor="email">
          Correo electrónico
        </label>
        <div className={`login-input-group ${errors.email ? "is-invalid" : ""}`}>
          <i className="bi bi-envelope login-input-icon" aria-hidden="true" />
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nombre@empresa.es"
            className="form-control login-control"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <div id="email-error" className="login-field-error" role="alert">
            {errors.email.message}
          </div>
        )}
      </div>

      <PasswordField
        registration={register("password")}
        error={errors.password?.message}
        placeholder="Introduce tu contraseña"
      />

      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div className="form-check login-check">
          <input
            id="rememberMe"
            className="form-check-input"
            type="checkbox"
            {...register("rememberMe")}
          />
          <label className="form-check-label" htmlFor="rememberMe">
            Mantener mi sesión iniciada
          </label>
        </div>
        <span className="login-secondary-link" title="Disponible próximamente">
          ¿Has olvidado tu contraseña?
        </span>
      </div>

      <button
        type="submit"
        className="btn login-submit w-100"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            Iniciando sesión
          </>
        ) : (
          <>
            Iniciar sesión
            <i className="bi bi-arrow-right" aria-hidden="true" />
          </>
        )}
      </button>

      <div className="login-invite-note">
        <i className="bi bi-envelope-check" aria-hidden="true" />
        <span>
          ¿Has recibido una invitación? La activación de cuentas se incorporará
          en la siguiente fase.
        </span>
      </div>
    </form>
  );
}
