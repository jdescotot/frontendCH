# Control Horario — Frontend

Frontend inicial del login construido con React 18.3.1, TypeScript, Vite y Bootstrap 5.

## Desarrollo local

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

El backend debe estar disponible en `http://localhost:8080`, o configura otro destino en:

```env
VITE_DEV_API_PROXY_TARGET=http://localhost:8080
```

El backend debe tener:

```env
FRONTEND_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
```

## Comprobaciones

```powershell
npm run typecheck
npm run build
```

## Producción en el mismo dominio

Deja `VITE_API_BASE_URL` vacío. React solicitará `/api/v1/...` en el mismo dominio y el servidor web debe reenviar `/api` al backend Go.

## Producción con dominios diferentes

No basta con poner una URL completa en `VITE_API_BASE_URL`: el backend también necesita CORS con credenciales, cookies compatibles y una política de origen segura. Para este proyecto se recomienda un único dominio público.

## Rutas

- `/login`: inicio de sesión.
- `/app`: decide si debe abrir el selector de empresa o el panel.
- `/app/empresas`: selector para usuarios con varias empresas.
- `/app/inicio`: pantalla provisional posterior al login.

La sesión real permanece en una cookie `HttpOnly`; React nunca almacena el token de sesión.
