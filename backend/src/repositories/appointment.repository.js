const { getPool } = require('../config/database');

class AppointmentRepository {
  async findById(id, executor = getPool()) {
    const [rows] = await executor.execute('SELECT id, paciente_id, profesional_id, sillon_id, fecha, hora, motivo, estado, created_at FROM citas WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findConflict({ profesionalId, sillonId, fecha, hora, excludeId }, executor) {
    const clauses = ['fecha = ?', 'hora = ?', "(estado IS NULL OR estado <> 'cancelada')"];
    const values = [fecha, hora];
    const resources = ['profesional_id = ?'];
    const resourceValues = [profesionalId];
    if (sillonId) {
      resources.push('sillon_id = ?');
      resourceValues.push(sillonId);
    }
    clauses.push(`(${resources.join(' OR ')})`);
    values.push(...resourceValues);
    if (excludeId) {
      clauses.push('id <> ?');
      values.push(excludeId);
    }
    const [rows] = await executor.execute(`SELECT id, profesional_id, sillon_id FROM citas WHERE ${clauses.join(' AND ')} LIMIT 1`, values);
    return rows[0] || null;
  }

  async professionalState(id, executor) {
    const [rows] = await executor.execute('SELECT estado FROM profesionales WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async chairState(id, executor) {
    const [rows] = await executor.execute('SELECT estado FROM sillones WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async create(data, executor) {
    const fields = Object.keys(data);
    const [result] = await executor.execute(
      `INSERT INTO citas (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
      fields.map((field) => data[field]),
    );
    return this.findById(result.insertId, executor);
  }

  async update(id, data, executor) {
    const fields = Object.keys(data);
    await executor.execute(
      `UPDATE citas SET ${fields.map((field) => `${field} = ?`).join(', ')} WHERE id = ?`,
      [...fields.map((field) => data[field]), id],
    );
    return this.findById(id, executor);
  }
}

module.exports = { AppointmentRepository };
