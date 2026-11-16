const { getPool } = require('../config/database');

class ChatbotRepository {
  async patientCount() {
    const [rows] = await getPool().execute('SELECT COUNT(*) AS cantidad FROM pacientes');
    return rows[0];
  }

  async appointmentSummary() {
    const [rows] = await getPool().execute(
      'SELECT estado, COUNT(*) AS cantidad, SUM(fecha >= CURRENT_DATE()) AS futuras FROM citas GROUP BY estado ORDER BY estado',
    );
    return rows;
  }

  async professionals() {
    const [rows] = await getPool().execute(
      "SELECT nombre, especialidad, estado FROM profesionales WHERE estado = 'activo' ORDER BY nombre LIMIT 100",
    );
    return rows;
  }

  async treatments() {
    const [rows] = await getPool().execute(
      'SELECT nombre, estado FROM tratamientos ORDER BY nombre LIMIT 100',
    );
    return rows;
  }

  async inventory() {
    const [rows] = await getPool().execute(
      'SELECT nombre, cantidad, stock_minimo, unidad FROM inventario ORDER BY nombre LIMIT 100',
    );
    return rows.map((item) => ({ ...item, alerta_stock: item.cantidad < item.stock_minimo }));
  }

  async paymentSummary() {
    const [rows] = await getPool().execute(
      'SELECT estado, COUNT(*) AS cantidad, SUM(monto) AS monto_total FROM pagos GROUP BY estado ORDER BY estado',
    );
    return rows;
  }
}

module.exports = { ChatbotRepository };
