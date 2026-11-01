const express = require('express');
const { receiveAlert, createSOSAlert, getActiveAlerts } = require('../controllers/alertController');
const router = express.Router();

router.post('/', receiveAlert);

router.post('/sos', createSOSAlert);

router.get('/', getActiveAlerts);

module.exports = router;
