const { getPool } = require('../config/database');

class ResourceRepository {
  constructor(resource) {
    this.resource = resource;
  }

  async list(limit = 100, offset = 0) {
    const columns = this.resource.columns.join(', ');
    const [rows] = await getPool().execute(
      `SELECT ${columns} FROM ${this.resource.table} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [limit, offset],
    );
    return rows;
  }

  async findById(id) {
    const columns = this.resource.columns.join(', ');
    const [rows] = await getPool().execute(
      `SELECT ${columns} FROM ${this.resource.table} WHERE id = ?`,
      [id],
    );
    return rows[0] || null;
  }

  async create(data) {
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    const [result] = await getPool().execute(
      `INSERT INTO ${this.resource.table} (${fields.join(', ')}) VALUES (${placeholders})`,
      fields.map((field) => data[field]),
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const fields = Object.keys(data);
    const assignments = fields.map((field) => `${field} = ?`).join(', ');
    await getPool().execute(
      `UPDATE ${this.resource.table} SET ${assignments} WHERE id = ?`,
      [...fields.map((field) => data[field]), id],
    );
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await getPool().execute(`DELETE FROM ${this.resource.table} WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = { ResourceRepository };
