const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const apiRoutes = require('./routes/api.routes');
const { errorHandler } = require('./middlewares/error-handler');

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SIGO Backend funcionando' });
});
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use(errorHandler);

module.exports = app;
