# Despliegue estático en IONOS

1. Ejecuta `npm install`.
2. Ejecuta `npm run typecheck`.
3. Ejecuta `npm run build`.
4. Sube **el contenido de `dist/`** a la carpeta pública a la que apunta el dominio/subdominio.
5. Comprueba que `.htaccess` se haya subido; es necesario para React Router.

## API

El frontend puede publicarse antes que el backend, pero el login no funcionará hasta que `VITE_API_BASE_URL` apunte a una API Go accesible o hasta que `/api` sea redirigido al backend.

Si cambias `VITE_API_BASE_URL`, debes volver a ejecutar `npm run build`, porque Vite inserta estas variables en tiempo de compilación.
