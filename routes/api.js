const express = require('express');
const router = express.Router();
const { validateQuery } = require('../middleware/validator');
const mainController = require('../controllers/mainController');
const streamController = require('../controllers/streamController');
const uploadController = require('../controllers/uploadController');

router.post('/query', validateQuery, mainController.handleQuery);
router.post('/stream', streamController.handleAudioStream);
router.post('/upload',
    uploadController.upload,
    uploadController.handleController
); 
module.exports = router;