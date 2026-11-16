# Backend SIGO

API REST con Express y MySQL (`mysql2/promise`). No crea ni altera tablas: los modelos corresponden al esquema existente de `sigo_db`.

## Puesta en marcha

1. Instala dependencias con `npm install`.
2. Configura las variables de conexión MySQL, `OLLAMA_URL`, `OLLAMA_MODEL`, `JWT_SECRET` y `INITIAL_ADMIN_TOKEN` en `.env`. Usa `.env.example` como referencia; conserva las credenciales locales existentes.
3. Inicia con `npm run dev` o `npm start`. El servidor valida la conexión a MySQL al arrancar.
4. Si `usuarios` está vacía, configura un `INITIAL_ADMIN_TOKEN` aleatorio y crea el primer administrador con `POST /api/auth/bootstrap`:

   ```json
   {
     "token": "secreto-configurado-en-INITIAL_ADMIN_TOKEN",
     "nombre": "Administrador",
     "email": "admin@example.com",
     "password": "una-clave-de-al-menos-12-caracteres"
   }
   ```

   El bootstrap solo funciona mientras `usuarios` no tenga registros. Al terminar, quita `INITIAL_ADMIN_TOKEN` de `.env`. La contraseña se guarda como hash bcrypt; el token de sesión debe enviarse como `Authorization: Bearer <token>`.

El endpoint `GET /api/health` es público. El resto de recursos requiere inicio de sesión y permisos según el rol guardado en `usuarios`.

## API

- CRUD: `/api/pacientes`, `/api/profesionales`, `/api/citas`, `/api/historias`, `/api/tratamientos`, `/api/pagos`, `/api/inventario`, `/api/sillones`, `/api/odontogramas` y `/api/archivos-clinicos`.
- Informes: `/api/reportes` y sus vistas `/citas`, `/inventario` y `/pagos`.
- El stock se modifica mediante `POST /api/inventario/:id/movimientos` (`entrada` o `salida`), que también registra cada movimiento en MySQL.
- `GET /api/citas/eventos` ofrece eventos SSE de cambios de estado de citas.
- `POST /api/chatbot` recibe `{ "prompt": "..." }`. Consulta únicamente agregados operativos autorizados de MySQL y entrega ese contexto a Ollama; no permite SQL generado por el modelo ni expone historias clínicas individuales.

Las listas aceptan `limit` (1–100) y `offset`. Las respuestas de CRUD usan `{ "data": ... }`; salud y chatbot conservan sus contratos definidos en `agente.md`.

## Pruebas

Ejecuta `npm test` para las pruebas de validación.
