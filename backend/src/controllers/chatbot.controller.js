const chatbotService = require('../services/chatbot.service');
const { AppError } = require('../utils/errors');

module.exports = async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw new AppError(400, 'El cuerpo debe ser un objeto JSON.');
  }
  const unknown = Object.keys(req.body).filter((key) => key !== 'prompt');
  if (unknown.length) throw new AppError(400, `Campos no permitidos: ${unknown.join(', ')}.`);
  const result = await chatbotService.ask(req.body.prompt, req.auth.role);
  res.json(result);
};
