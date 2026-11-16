const { InventoryRepository } = require('../repositories/inventory.repository');
const { AppError } = require('../utils/errors');
const { parseId } = require('../utils/validation');

const repository = new InventoryRepository();

async function createMovement(rawId, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(400, 'El cuerpo debe ser un objeto JSON.');
  }
  const allowed = ['tipo', 'cantidad', 'motivo'];
  const unknown = Object.keys(body).filter((key) => !allowed.includes(key));
  if (unknown.length) throw new AppError(400, `Campos no permitidos: ${unknown.join(', ')}.`);
  if (!['entrada', 'salida'].includes(body.tipo)) throw new AppError(400, 'tipo debe ser entrada o salida.');
  if (!Number.isSafeInteger(body.cantidad) || body.cantidad <= 0 || body.cantidad > 2147483647) {
    throw new AppError(400, 'cantidad debe ser un entero positivo dentro del rango permitido.');
  }
  if (body.motivo !== undefined && body.motivo !== null && (typeof body.motivo !== 'string' || body.motivo.length > 200)) {
    throw new AppError(400, 'motivo debe ser texto de hasta 200 caracteres.');
  }

  const result = await repository.createMovement(parseId(rawId), body.tipo, body.cantidad, body.motivo || null);
  if (result.missing) throw new AppError(404, 'El artículo de inventario no existe.');
  if (result.insufficient) throw new AppError(409, `Stock insuficiente; cantidad disponible: ${result.available}.`);
  if (result.overflow) throw new AppError(409, 'El movimiento excede la capacidad de cantidad del inventario.');
  return result;
}

module.exports = {
  createMovement,
  listMovements: (id, limit, offset) => repository.listMovements(id, limit, offset),
};
