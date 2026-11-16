const express = require('express');
const controller = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
router.post('/login', controller.login);
router.post('/bootstrap', controller.bootstrap);
router.get('/me', authenticate, controller.me);

module.exports = router;
