const express = require('express');
const { resources } = require('../models/resources');
const { createResourceController } = require('../controllers/resource.controller');
const appointmentController = require('../controllers/appointment.controller');
const inventoryController = require('../controllers/inventory.controller');
const reportController = require('../controllers/report.controller');
const chatbotController = require('../controllers/chatbot.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
const allowed = (...roles) => [authenticate, authorize(...roles)];
const resourceRoutes = {
  pacientes: ['admin', 'recepcionista', 'odontologo'],
  profesionales: ['admin'],
  sillones: ['admin'],
  historias: ['admin', 'odontologo'],
  tratamientos: ['admin', 'odontologo'],
  pagos: ['admin', 'finanzas'],
  odontogramas: ['admin', 'odontologo'],
  'archivos-clinicos': ['admin', 'odontologo'],
};

router.post('/chatbot', ...allowed('admin', 'recepcionista', 'odontologo', 'finanzas'), chatbotController);

for (const [path, roles] of Object.entries(resourceRoutes)) {
  const resource = resources[path];
  const controller = createResourceController(resource, path);
  const route = express.Router();
  route.get('/', ...allowed(...roles), controller.list);
  route.get('/:id', ...allowed(...roles), controller.get);
  route.post('/', ...allowed(...roles), controller.create);
  route.put('/:id', ...allowed(...roles), controller.update);
  route.delete('/:id', ...allowed(...roles), controller.delete);
  router.use(`/${path}`, route);
}

const appointments = express.Router();
appointments.get('/eventos', ...allowed('admin', 'recepcionista', 'odontologo'), appointmentController.stream);
appointments.get('/', ...allowed('admin', 'recepcionista', 'odontologo'), appointmentController.list);
appointments.get('/:id', ...allowed('admin', 'recepcionista', 'odontologo'), appointmentController.get);
appointments.post('/', ...allowed('admin', 'recepcionista', 'odontologo'), appointmentController.create);
appointments.put('/:id', ...allowed('admin', 'recepcionista', 'odontologo'), appointmentController.update);
appointments.delete('/:id', ...allowed('admin', 'recepcionista', 'odontologo'), appointmentController.delete);
router.use('/citas', appointments);

const inventory = express.Router();
inventory.get('/', ...allowed('admin', 'recepcionista', 'odontologo'), inventoryController.list);
inventory.get('/:id/movimientos', ...allowed('admin', 'recepcionista', 'odontologo'), inventoryController.movements);
inventory.post('/:id/movimientos', ...allowed('admin', 'recepcionista', 'odontologo'), inventoryController.createMovement);
inventory.get('/:id', ...allowed('admin', 'recepcionista', 'odontologo'), inventoryController.get);
inventory.post('/', ...allowed('admin', 'recepcionista', 'odontologo'), inventoryController.create);
inventory.put('/:id', ...allowed('admin', 'recepcionista', 'odontologo'), inventoryController.update);
inventory.delete('/:id', ...allowed('admin', 'recepcionista', 'odontologo'), inventoryController.delete);
router.use('/inventario', inventory);

const reports = express.Router();
reports.get('/', ...allowed('admin', 'finanzas', 'recepcionista', 'odontologo'), reportController.overview);
reports.get('/citas', ...allowed('admin', 'finanzas', 'recepcionista', 'odontologo'), reportController.appointments);
reports.get('/inventario', ...allowed('admin', 'finanzas', 'recepcionista', 'odontologo'), reportController.inventoryAlerts);
reports.get('/pagos', ...allowed('admin', 'finanzas'), reportController.payments);
router.use('/reportes', reports);

module.exports = router;
