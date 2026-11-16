
# BACKEND SIGO - SISTEMA INTEGRAL DE GESTIÓN ODONTOLÓGICA

Desarrollar un servidor API REST utilizando Node.js y Express.

## 1. BASE DE DATOS

Nombre: sigo_db

Motor: MySQL.
Conexión: mysql2/promise.
Configuración: variables de entorno .env.

Las tablas existentes son:

- usuarios
- profesionales
- pacientes
- sillones
- citas
- historias_clinicas
- tratamientos
- pagos
- inventario
- movimientos_inventario
- archivos_clinicos
- odontogramas

No recrear las tablas. Utilizar las existentes.

## 2. ARQUITECTURA

Implementar patrón MVC:

- Models: consultas SQL.
- Controllers: lógica de negocio.
- Routes: endpoints REST.
- Config: conexión a MySQL.
- Middlewares: validaciones y manejo de errores.

Implementar patrón Repository para separar
las consultas SQL de la lógica de negocio.

Implementar una conexión Singleton mediante
un único pool compartido de MySQL.

## 3. APIs CRUD

Crear endpoints GET, GET/:id, POST,
PUT/:id y DELETE/:id para:

- /api/pacientes
- /api/profesionales
- /api/citas
- /api/historias
- /api/tratamientos
- /api/pagos
- /api/inventario

Crear endpoints adicionales para:

- /api/sillones
- /api/odontogramas
- /api/archivos-clinicos
- /api/reportes

## 4. REGLAS DE NEGOCIO

- No permitir agendar dos citas en el mismo
  sillón, fecha y horario.
- Verificar disponibilidad del profesional.
- Permitir cambiar estados de las citas.
- Registrar los tratamientos asociados a historias.
- Registrar entradas y salidas de inventario.
- Generar alertas cuando el stock sea inferior
  al mínimo establecido.
- Registrar pagos asociados a pacientes.
- Validar relaciones entre registros.

Utilizar transacciones SQL cuando una operación
modifique varios registros relacionados.

## 5. CHATBOT DE INTELIGENCIA ARTIFICIAL

Crear:

POST /api/chatbot

Utilizar Ollama con Gemma 3.

El chatbot debe consultar MySQL en tiempo real
antes de responder.

Debe acceder únicamente a información necesaria
y autorizada de SIGO, incluyendo:

- Cantidad de pacientes registrados.
- Citas programadas y sus estados.
- Profesionales y especialidades.
- Tratamientos disponibles y registrados.
- Información administrativa.
- Estado general del inventario.
- Alertas de stock.

El chatbot debe:

1. Recibir { "prompt": "pregunta del usuario" }.
2. Consultar los datos correspondientes en MySQL.
3. Construir un contexto dinámico.
4. Enviar el contexto y la pregunta a Ollama.
5. Recibir la respuesta del modelo.
6. Devolver { "response": "respuesta de la IA" }.

El asistente debe responder exclusivamente
preguntas relacionadas con SIGO.

No debe inventar pacientes, citas, precios,
profesionales ni datos financieros.

No debe revelar contraseñas, credenciales,
historias clínicas privadas ni información
personal a usuarios no autorizados.

No debe permitir que la IA ejecute consultas
SQL arbitrarias.

## 6. PATRÓN OBSERVER

Implementar un mecanismo de notificaciones
cuando una cita cambie de estado.

Ejemplo:

Cuando una cita pasa de "en_espera"
a "en_consultorio", notificar a las vistas
correspondientes.

Utilizar eventos internos de Node.js para
desacoplar los módulos.

## 7. RESPUESTAS Y SEGURIDAD

- Utilizar códigos HTTP correctos.
- Validar datos recibidos.
- Manejar errores centralizadamente.
- No exponer variables de entorno.
- Utilizar consultas SQL parametrizadas.
- No almacenar contraseñas en texto plano.

## 8. SERVIDOR

GET /api/health

Debe responder:

{ "status": "ok", "message": "SIGO Backend funcionando" }

Puerto: 3000.
