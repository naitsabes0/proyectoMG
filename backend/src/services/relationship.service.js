const { getPool } = require('../config/database');
const { AppError } = require('../utils/errors');

async function validateRelations(resourceKey, data, current = {}) {
  const effective = { ...current, ...data };
  if (resourceKey === 'pagos' && effective.tratamiento_id) {
    const [rows] = await getPool().execute(
      'SELECT historias_clinicas.paciente_id FROM tratamientos INNER JOIN historias_clinicas ON historias_clinicas.id = tratamientos.historia_id WHERE tratamientos.id = ?',
      [effective.tratamiento_id],
    );
    if (!rows.length) throw new AppError(400, 'El tratamiento indicado no existe.');
    if (Number(rows[0].paciente_id) !== Number(effective.paciente_id)) {
      throw new AppError(400, 'El tratamiento no pertenece al paciente indicado.');
    }
  }
  if (resourceKey === 'archivos-clinicos' && effective.historia_id) {
    const [rows] = await getPool().execute(
      'SELECT paciente_id FROM historias_clinicas WHERE id = ?',
      [effective.historia_id],
    );
    if (!rows.length) throw new AppError(400, 'La historia clínica indicada no existe.');
    if (Number(rows[0].paciente_id) !== Number(effective.paciente_id)) {
      throw new AppError(400, 'La historia clínica no pertenece al paciente indicado.');
    }
  }
}

module.exports = { validateRelations };
