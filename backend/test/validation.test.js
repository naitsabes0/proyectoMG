const test = require('node:test');
const assert = require('node:assert/strict');
const { resources } = require('../src/models/resources');
const { validateResourceInput, isValidDate } = require('../src/utils/validation');

test('resource definitions only allow declared writable columns', () => {
  for (const resource of Object.values(resources)) {
    for (const field of resource.writable) {
      assert.ok(resource.columns.includes(field), `${resource.table}.${field} must be a selected column`);
    }
  }
  assert.throws(
    () => validateResourceInput(resources.pacientes, { nombre: 'Ana', apellido: 'Pérez', activo: true }, true),
    /Campos no permitidos/,
  );
});

test('appointment input validates status, date, and nullable chair', () => {
  const appointment = {
    paciente_id: 1,
    profesional_id: 2,
    sillon_id: null,
    fecha: '2026-11-17',
    hora: '09:30',
    estado: 'programada',
  };
  assert.equal(validateResourceInput(resources.citas, appointment, true), appointment);
  assert.throws(
    () => validateResourceInput(resources.citas, { ...appointment, estado: 'confirmado' }, true),
    /estado debe ser uno/,
  );
  assert.equal(isValidDate('2026-02-30'), false);
});

test('money validation accepts cents without binary floating-point false rejection', () => {
  const payment = { paciente_id: 1, concepto: 'Consulta', monto: 1.15 };
  assert.equal(validateResourceInput(resources.pagos, payment, true), payment);
  assert.throws(
    () => validateResourceInput(resources.pagos, { ...payment, monto: 1.155 }, true),
    /importe válido/,
  );
});

test('inventory defaults may be omitted but non-nullable stock fields reject null', () => {
  const item = { nombre: 'Guantes' };
  assert.equal(validateResourceInput(resources.inventario, item, true), item);
  assert.throws(
    () => validateResourceInput(resources.inventario, { nombre: 'Guantes', cantidad: null }, true),
    /cantidad no admite null/,
  );
});
