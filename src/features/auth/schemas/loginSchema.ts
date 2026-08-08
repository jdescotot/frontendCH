import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Introduce tu correo electrónico.")
    .email("Introduce un correo electrónico válido.")
    .max(254, "El correo electrónico es demasiado largo."),
  password: z
    .string()
    .min(1, "Introduce tu contraseña.")
    .max(256, "La contraseña es demasiado larga."),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
