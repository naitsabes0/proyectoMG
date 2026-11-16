const { getPool } = require('../config/database');
const { AppError } = require('../utils/errors');

class AuthRepository {
  async findByEmail(email) {
    const [rows] = await getPool().execute(
      'SELECT id, nombre, email, password_hash, rol, estado FROM usuarios WHERE email = ? LIMIT 1',
      [email],
    );
    return rows[0] || null;
  }

  async findPublicById(id) {
    const [rows] = await getPool().execute(
      'SELECT id, nombre, email, rol, estado FROM usuarios WHERE id = ? LIMIT 1',
      [id],
    );
    return rows[0] || null;
  }

  async bootstrapAdmin({ nombre, email, passwordHash }) {
    const connection = await getPool().getConnection();
    let lockAcquired = false;
    let transactionStarted = false;
    try {
      const [locks] = await connection.execute("SELECT GET_LOCK('sigo:auth:bootstrap', 10) AS acquired");
      if (locks[0].acquired !== 1) throw new AppError(409, 'El proceso de inicialización ya está en curso.');
      lockAcquired = true;
      await connection.beginTransaction();
      transactionStarted = true;
      const [users] = await connection.execute('SELECT COUNT(*) AS total FROM usuarios');
      if (users[0].total > 0) {
        await connection.rollback();
        transactionStarted = false;
        return null;
      }
      const [result] = await connection.execute(
        "INSERT INTO usuarios (nombre, email, password_hash, rol, estado) VALUES (?, ?, ?, 'admin', 'activo')",
        [nombre, email, passwordHash],
      );
      const user = { id: result.insertId, nombre, email, rol: 'admin', estado: 'activo' };
      await connection.commit();
      transactionStarted = false;
      return user;
    } catch (error) {
      if (transactionStarted) await connection.rollback();
      throw error;
    } finally {
      try {
        if (lockAcquired) await connection.execute("SELECT RELEASE_LOCK('sigo:auth:bootstrap')");
      } finally {
        connection.release();
      }
    }
  }
}

module.exports = { AuthRepository };
