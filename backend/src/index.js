require('dotenv').config();
const app = require('./app');
const { getPool } = require('./config/database');

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

async function start() {
  await getPool().query('SELECT 1');
  const server = app.listen(port, host, () => {
    console.log(`SIGO Backend escuchando en http://${host}:${port}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal}: cerrando SIGO Backend`);
    server.close(async (error) => {
      if (error) {
        console.error('Error al cerrar el servidor:', error);
        process.exitCode = 1;
      }
      await getPool().end();
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  console.error('No fue posible iniciar SIGO Backend:', error.message);
  process.exitCode = 1;
});
