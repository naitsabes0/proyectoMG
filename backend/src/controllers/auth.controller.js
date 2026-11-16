const authService = require('../services/auth.service');
const { AppError } = require('../utils/errors');

module.exports = {
  login: async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      throw new AppError(400, 'El cuerpo debe ser un objeto JSON.');
    }
    const unknown = Object.keys(req.body).filter((key) => !['email', 'password'].includes(key));
    if (unknown.length) throw new AppError(400, `Campos no permitidos: ${unknown.join(', ')}.`);
    res.json(await authService.login(req.body.email, req.body.password));
  },
  bootstrap: async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      throw new AppError(400, 'El cuerpo debe ser un objeto JSON.');
    }
    const allowed = ['token', 'nombre', 'email', 'password'];
    const unknown = Object.keys(req.body).filter((key) => !allowed.includes(key));
    if (unknown.length) throw new AppError(400, `Campos no permitidos: ${unknown.join(', ')}.`);
    res.status(201).json(await authService.bootstrap(req.body));
  },
  me: async (req, res) => {
    res.json({ user: await authService.currentUser(req.auth.id) });
  },
};
