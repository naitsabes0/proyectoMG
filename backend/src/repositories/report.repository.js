const { getPool } = require('../config/database');

class ReportRepository {
  async appointmentSummary() {
    const [rows] = await getPool().execute(
      'SELECT estado, COUNT(*) AS cantidad, SUM(fecha >= CURRENT_DATE()) AS futuras FROM citas GROUP BY estado ORDER BY estado',
    );
    return rows;
  }

  async inventoryAlerts() {
    const [rows] = await getPool().execute(
      'SELECT id, nombre, cantidad, stock_minimo, unidad FROM inventario WHERE cantidad < stock_minimo ORDER BY nombre',
    );
    return rows;
  }

  async paymentSummary() {
    const [rows] = await getPool().execute(
      'SELECT estado, COUNT(*) AS cantidad, SUM(monto) AS monto_total FROM pagos GROUP BY estado ORDER BY estado',
    );
    return rows;
  }
}

module.exports = { ReportRepository };
