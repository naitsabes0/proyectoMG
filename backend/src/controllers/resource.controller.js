const { ResourceRepository } = require('../repositories/resource.repository');
const { validateResourceInput, parseId } = require('../utils/validation');
const { AppError } = require('../utils/errors');
const { validateRelations } = require('../services/relationship.service');

function pagination(req) {
  const limit = req.query.limit === undefined ? 100 : Number(req.query.limit);
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100
    || !Number.isSafeInteger(offset) || offset < 0) {
    throw new AppError(400, 'limit debe estar entre 1 y 100 y offset debe ser un entero no negativo.');
  }
  return { limit, offset };
}

function createResourceController(resource, resourceKey) {
  const repository = new ResourceRepository(resource);
  return {
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
      validateResourceInput(resource, req.body, true);
      await validateRelations(resourceKey, req.body);
      const item = await repository.create(req.body);
      res.status(201).json({ data: item });
    },
    update: async (req, res) => {
      const id = parseId(req.params.id);
      validateResourceInput(resource, req.body, false);
      const current = await repository.findById(id);
      if (!current) throw new AppError(404, 'Registro no encontrado.');
      await validateRelations(resourceKey, req.body, current);
      const item = await repository.update(id, req.body);
      if (!item) throw new AppError(404, 'Registro no encontrado.');
      res.json({ data: item });
    },
    delete: async (req, res) => {
      const deleted = await repository.delete(parseId(req.params.id));
      if (!deleted) throw new AppError(404, 'Registro no encontrado.');
      res.status(204).end();
    },
  };
}

module.exports = { createResourceController };
