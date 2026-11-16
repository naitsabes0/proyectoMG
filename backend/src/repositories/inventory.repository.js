const { getPool } = require('../config/database');

class InventoryRepository {
  async listMovements(inventoryId, limit, offset) {
    const [rows] = await getPool().execute(
      'SELECT id, inventario_id, tipo, cantidad, motivo, fecha FROM movimientos_inventario WHERE inventario_id = ? ORDER BY fecha DESC, id DESC LIMIT ? OFFSET ?',
      [inventoryId, limit, offset],
    );
    return rows;
  }

  async createMovement(inventoryId, tipo, cantidad, motivo) {
    const connection = await getPool().getConnection();
    try {
      await connection.beginTransaction();
      const [items] = await connection.execute('SELECT cantidad FROM inventario WHERE id = ? FOR UPDATE', [inventoryId]);
      if (!items.length) {
        await connection.rollback();
        return { missing: true };
      }
      const current = items[0].cantidad;
      if (tipo === 'salida' && current < cantidad) {
        await connection.rollback();
        return { insufficient: true, available: current };
      }
      if (tipo === 'entrada' && current + cantidad > 2147483647) {
        await connection.rollback();
        return { overflow: true };
      }
      const newQuantity = tipo === 'entrada' ? current + cantidad : current - cantidad;
      await connection.execute('UPDATE inventario SET cantidad = ? WHERE id = ?', [newQuantity, inventoryId]);
      const [inserted] = await connection.execute(
        'INSERT INTO movimientos_inventario (inventario_id, tipo, cantidad, motivo) VALUES (?, ?, ?, ?)',
        [inventoryId, tipo, cantidad, motivo],
      );
      const [rows] = await connection.execute(
        'SELECT id, inventario_id, tipo, cantidad, motivo, fecha FROM movimientos_inventario WHERE id = ?',
        [inserted.insertId],
      );
      await connection.commit();
      return { movement: rows[0], newQuantity };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = { InventoryRepository };
