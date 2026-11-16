const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { AuthRepository } = require('../repositories/auth.repository');
const { signToken } = require('./token.service');
const { AppError } = require('../utils/errors');

const repository = new AuthRepository();

async function login(email, password) {
  if (typeof email !== 'string' || email.length > 150
    || typeof password !== 'string' || !password || password.length > 1024) {
    throw new AppError(400, 'email y password son obligatorios.');
  }
  const user = await repository.findByEmail(email.trim());
  if (!user || user.estado !== 'activo' || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError(401, 'Correo o contraseña inválidos.');
  }
  return {
    token: signToken(user),
    user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
  };
}

async function currentUser(id) {
  const user = await repository.findPublicById(id);
  if (!user || user.estado !== 'activo') throw new AppError(401, 'La sesión ya no es válida.');
  return { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol };
}

async function bootstrap({ token, nombre, email, password }) {
  const configuredToken = process.env.INITIAL_ADMIN_TOKEN;
  if (!configuredToken) throw new AppError(503, 'El bootstrap de administrador no está habilitado.');
  if (typeof token !== 'string' || Buffer.byteLength(token) > 256) {
    throw new AppError(401, 'Token de inicialización inválido.');
  }
  const expected = Buffer.from(configuredToken);
  const supplied = Buffer.from(token);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
    throw new AppError(401, 'Token de inicialización inválido.');
  }
  if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 120
    || typeof email !== 'string' || email.length > 150
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || typeof password !== 'string' || Buffer.byteLength(password) < 12 || Buffer.byteLength(password) > 72) {
    throw new AppError(400, 'nombre, email válido y password de 12 a 72 bytes son obligatorios.');
  }

  const user = await repository.bootstrapAdmin({
    nombre: nombre.trim(),
    email: email.trim(),
    passwordHash: await bcrypt.hash(password, 12),
  });
  if (!user) throw new AppError(409, 'La inicialización ya se completó.');
  return {
    token: signToken(user),
    user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
  };
}

module.exports = { login, currentUser, bootstrap };
