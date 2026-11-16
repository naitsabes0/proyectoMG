const { resources } = require('../models/resources');
const { ResourceRepository } = require('../repositories/resource.repository');
const service = require('../services/inventory.service');
const { parseId } = require('../utils/validation');
const { validateResourceInput } = require('../utils/validation');
const { AppError } = require('../utils/errors');

const repository = new ResourceRepository(resources.inventario);

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
    res.json({ data: await repository.list(limit, offset) });
  },
  get: async (req, res) => {
    const item = await repository.findById(parseId(req.params.id));
    if (!item) throw new AppError(404, 'Registro no encontrado.');
    res.json({ data: item });
  },
  create: async (req, res) => {
    validateResourceInput(resources.inventario, req.body, true);
    res.status(201).json({ data: await repository.create(req.body) });
  },
  update: async (req, res) => {
    const id = parseId(req.params.id);
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'cantidad')) {
      throw new AppError(400, 'Use el endpoint de movimientos para modificar la cantidad.');
    }
    validateResourceInput(resources.inventario, req.body, false);
    const item = await repository.update(id, req.body);
    if (!item) throw new AppError(404, 'Registro no encontrado.');
    res.json({ data: item });
  },
  delete: async (req, res) => {
    const deleted = await repository.delete(parseId(req.params.id));
    if (!deleted) throw new AppError(404, 'Registro no encontrado.');
    res.status(204).end();
  },
  movements: async (req, res) => {
    const { limit, offset } = pagination(req);
    const id = parseId(req.params.id);
    const item = await repository.findById(id);
    if (!item) throw new AppError(404, 'Artículo de inventario no encontrado.');
    res.json({ data: await service.listMovements(id, limit, offset) });
  },
  createMovement: async (req, res) => {
    const result = await service.createMovement(parseId(req.params.id), req.body);
    res.status(201).json({ data: result.movement, cantidad_actual: result.newQuantity });
  },
};
