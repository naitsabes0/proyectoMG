const { getPool } = require('../config/database');
const { resources } = require('../models/resources');
const { AppointmentRepository } = require('../repositories/appointment.repository');
const { ResourceRepository } = require('../repositories/resource.repository');
const { validateResourceInput, parseId } = require('../utils/validation');
const { AppError } = require('../utils/errors');
const { appointmentEvents } = require('./event-bus');

const appointmentModel = resources.citas;
const appointmentRepository = new AppointmentRepository();
const baseRepository = new ResourceRepository(appointmentModel);

function lockNames(appointment) {
  const locks = [];
  if (appointment.profesional_id && appointment.fecha && appointment.hora) {
    locks.push(`sigo:prof:${appointment.profesional_id}:${appointment.fecha}:${appointment.hora}`);
  }
  if (appointment.sillon_id && appointment.fecha && appointment.hora) {
    locks.push(`sigo:sillon:${appointment.sillon_id}:${appointment.fecha}:${appointment.hora}`);
  }
  return locks.sort();
}

async function acquireLocks(connection, names) {
  const acquired = [];
  try {
    for (const name of names) {
      const [rows] = await connection.execute('SELECT GET_LOCK(?, 10) AS acquired', [name]);
      if (rows[0].acquired !== 1) throw new AppError(409, 'No fue posible reservar el horario; inténtelo nuevamente.');
      acquired.push(name);
    }
    return acquired;
  } catch (error) {
    for (const name of acquired.reverse()) {
      await connection.execute('SELECT RELEASE_LOCK(?)', [name]);
    }
    throw error;
  }
}

async function releaseLocks(connection, names) {
  for (const name of [...names].reverse()) {
    await connection.execute('SELECT RELEASE_LOCK(?)', [name]);
  }
}

async function validateAvailability(appointment, excludeId, connection) {
  if (appointment.estado === 'cancelada') return;
  const professional = await appointmentRepository.professionalState(appointment.profesional_id, connection);
  if (!professional) throw new AppError(400, 'El profesional indicado no existe.');
  if (professional.estado !== 'activo') throw new AppError(409, 'El profesional no está activo.');

  if (appointment.sillon_id) {
    const chair = await appointmentRepository.chairState(appointment.sillon_id, connection);
    if (!chair) throw new AppError(400, 'El sillón indicado no existe.');
    if (chair.estado !== 'disponible') throw new AppError(409, 'El sillón no está disponible.');
  }

  const conflict = await appointmentRepository.findConflict({
    profesionalId: appointment.profesional_id,
    sillonId: appointment.sillon_id,
    fecha: appointment.fecha,
    hora: appointment.hora,
    excludeId,
  }, connection);
  if (conflict) {
    if (conflict.profesional_id === appointment.profesional_id) {
      throw new AppError(409, 'El profesional ya tiene una cita en esa fecha y hora.');
    }
    throw new AppError(409, 'El sillón ya tiene una cita en esa fecha y hora.');
  }
}

async function create(body) {
  validateResourceInput(appointmentModel, body, true);
  const data = { ...body };
  if (!data.estado) data.estado = 'programada';
  const connection = await getPool().getConnection();
  let locks = [];
  try {
    locks = await acquireLocks(connection, lockNames(data));
    await connection.beginTransaction();
    await validateAvailability(data, null, connection);
    const appointment = await appointmentRepository.create(data, connection);
    await connection.commit();
    return appointment;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    if (locks.length) await releaseLocks(connection, locks);
    connection.release();
  }
}

async function update(rawId, body) {
  const id = parseId(rawId);
  validateResourceInput(appointmentModel, body, false);
  const current = await appointmentRepository.findById(id);
  if (!current) return null;

  const desired = { ...current, ...body };
  const connection = await getPool().getConnection();
  let locks = [];
  let oldStatus;
  let updated;
  try {
    locks = await acquireLocks(connection, [...new Set([...lockNames(current), ...lockNames(desired)])].sort());
    await connection.beginTransaction();
    const [lockedRows] = await connection.execute('SELECT id, paciente_id, profesional_id, sillon_id, fecha, hora, motivo, estado, created_at FROM citas WHERE id = ? FOR UPDATE', [id]);
    if (!lockedRows.length) {
      await connection.rollback();
      return null;
    }
    const latest = lockedRows[0];
    const next = { ...latest, ...body };
    await validateAvailability(next, id, connection);
    oldStatus = latest.estado;
    updated = await appointmentRepository.update(id, body, connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    if (locks.length) await releaseLocks(connection, locks);
    connection.release();
  }

  if (oldStatus !== updated.estado) {
    appointmentEvents.emit('appointment:statusChanged', {
      appointmentId: updated.id,
      previousStatus: oldStatus,
      status: updated.estado,
      changedAt: new Date().toISOString(),
    });
  }
  return updated;
}

module.exports = {
  list: (limit, offset) => baseRepository.list(limit, offset),
  findById: (rawId) => baseRepository.findById(parseId(rawId)),
  create,
  update,
  delete: (rawId) => baseRepository.delete(parseId(rawId)),
};
