const { AppError } = require('../utils/errors');
const { verifyToken } = require('../services/token.service');
const authService = require('../services/auth.service');

async function authenticate(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const payload = match && verifyToken(match[1]);
  if (!payload) return next(new AppError(401, 'Se requiere una sesión válida.'));
  const user = await authService.currentUser(payload.sub);
  req.auth = { id: user.id, role: user.rol, email: user.email };
  return next();
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return next(new AppError(403, 'No tiene permisos para realizar esta operación.'));
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
