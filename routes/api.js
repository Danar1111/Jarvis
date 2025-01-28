const express = require('express');
const router = express.Router();
const { validateQuery } = require('../middleware/validator');
const mainController = require('../controllers/mainController');
const streamController = require('../controllers/streamController');

router.post('/query', validateQuery, mainController.handleQuery);
router.post('/stream', streamController.handleAudioStream);

module.exports = router;