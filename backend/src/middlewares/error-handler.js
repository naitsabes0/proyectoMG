const { AppError } = require('../utils/errors');

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = error.status || 500;
  let message = error.status && error.status < 500 ? error.message : 'Error interno del servidor.';
  if (error.code === 'ER_DUP_ENTRY') {
    status = 409;
    message = 'Ya existe un registro con esos datos únicos.';
  } else if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
    status = 409;
    message = 'No se puede eliminar el registro porque está relacionado con otros datos.';
  } else if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
    status = 400;
    message = 'Una de las relaciones indicadas no existe.';
  } else if (!(error instanceof AppError) && status >= 500) {
    console.error('Error de API:', error);
    message = 'Error interno del servidor.';
  }

  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
