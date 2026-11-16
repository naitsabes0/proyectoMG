const { ReportRepository } = require('../repositories/report.repository');

const repository = new ReportRepository();

module.exports = {
  overview: async (req, res) => {
    const report = {
      citas: await repository.appointmentSummary(),
      alertas_inventario: await repository.inventoryAlerts(),
    };
    if (req.auth.role === 'admin' || req.auth.role === 'finanzas') {
      report.pagos = await repository.paymentSummary();
    }
    res.json({ data: report });
  },
  appointments: async (req, res) => res.json({ data: await repository.appointmentSummary() }),
  inventoryAlerts: async (req, res) => res.json({ data: await repository.inventoryAlerts() }),
  payments: async (req, res) => res.json({ data: await repository.paymentSummary() }),
};
