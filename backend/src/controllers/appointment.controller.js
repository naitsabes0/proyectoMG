const service = require('../services/appointment.service');
const { parseId } = require('../utils/validation');
const { AppError } = require('../utils/errors');

function pagination(req) {
  const limit = req.query.limit === undefined ? 100 : Number(req.query.limit);
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100
    || !Number.isSafeInteger(offset) || offset < 0) {
    throw new AppError(400, 'limit debe estar entre 1 y 100 y offset debe ser un entero no negativo.');
  }
  return { limit, offset };
}

module.exports = {
  list: async (req, res) => {
    const { limit, offset } = pagination(req);
    res.json({ data: await service.list(limit, offset) });
  },
  get: async (req, res) => {
    const item = await service.findById(req.params.id);
    if (!item) throw new AppError(404, 'Cita no encontrada.');
    res.json({ data: item });
  },
  create: async (req, res) => {
    res.status(201).json({ data: await service.create(req.body) });
  },
  update: async (req, res) => {
    const item = await service.update(req.params.id, req.body);
    if (!item) throw new AppError(404, 'Cita no encontrada.');
    res.json({ data: item });
  },
  delete: async (req, res) => {
    const deleted = await service.delete(req.params.id);
    if (!deleted) throw new AppError(404, 'Cita no encontrada.');
    res.status(204).end();
  },
  stream: (req, res) => {
    const { appointmentEvents } = require('../services/event-bus');
    res.status(200).set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });
    res.flushHeaders();
    res.write(': conectado\n\n');
    const listener = (event) => res.write(`event: appointment-status-changed\ndata: ${JSON.stringify(event)}\n\n`);
    appointmentEvents.on('appointment:statusChanged', listener);
    const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 25000);
    req.on('close', () => {
      clearInterval(heartbeat);
      appointmentEvents.off('appointment:statusChanged', listener);
    });
  },
};
