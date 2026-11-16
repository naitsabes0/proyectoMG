const { AppError } = require('./errors');

const isValidDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

function validateResourceInput(resource, body, isCreate) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(400, 'El cuerpo debe ser un objeto JSON.');
  }

  const fields = Object.keys(body);
  const unknown = fields.filter((field) => !resource.writable.includes(field));
  if (unknown.length) throw new AppError(400, `Campos no permitidos: ${unknown.join(', ')}.`);
  if (isCreate) {
    const missing = resource.required.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
    if (missing.length) throw new AppError(400, `Campos obligatorios: ${missing.join(', ')}.`);
  } else if (fields.length === 0) {
    throw new AppError(400, 'Debe enviar al menos un campo para actualizar.');
  }

  for (const [field, value] of Object.entries(body)) {
    const rule = resource.rules[field];
    if (value === null) {
      if (!rule.nullable) throw new AppError(400, `${field} no admite null.`);
      continue;
    }
    if (value === '') {
      if (rule.nullable) {
        body[field] = null;
        continue;
      }
      throw new AppError(400, `${field} no puede estar vacío.`);
    }

    switch (rule.type) {
      case 'string':
      case 'email':
        if (typeof value !== 'string' || !value.trim() || (rule.max && value.length > rule.max)) {
          throw new AppError(400, `${field} debe ser texto${rule.max ? ` de hasta ${rule.max} caracteres` : ''}.`);
        }
        if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new AppError(400, `${field} debe ser un correo válido.`);
        }
        break;
      case 'id':
        if (!Number.isSafeInteger(value) || value < 1 || value > 2147483647) {
          throw new AppError(400, `${field} debe ser un identificador entero positivo válido.`);
        }
        break;
      case 'integer':
        if (!Number.isSafeInteger(value) || value < rule.min || (rule.max && value > rule.max)) {
          throw new AppError(400, `${field} debe ser un entero dentro del rango permitido.`);
        }
        break;
      case 'money':
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0
          || value > 99999999.99 || Math.abs(value * 100 - Math.round(value * 100)) > 1e-7) {
          throw new AppError(400, `${field} debe ser un importe válido con hasta dos decimales.`);
        }
        break;
      case 'date':
        if (!isValidDate(value)) throw new AppError(400, `${field} debe ser una fecha válida en formato YYYY-MM-DD.`);
        break;
      case 'time':
        if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)) {
          throw new AppError(400, `${field} debe tener formato HH:MM o HH:MM:SS.`);
        }
        break;
      case 'datetime':
        if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
          throw new AppError(400, `${field} debe ser una fecha y hora válidas.`);
        }
        break;
      case 'enum':
        if (typeof value !== 'string' || !rule.values.includes(value)) {
          throw new AppError(400, `${field} debe ser uno de: ${rule.values.join(', ')}.`);
        }
        break;
      default:
        throw new AppError(500, `No existe una regla de validación para ${field}.`);
    }
  }
  return body;
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new AppError(400, 'El identificador debe ser un entero positivo.');
  return id;
}

module.exports = { validateResourceInput, parseId, isValidDate };
