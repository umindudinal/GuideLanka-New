const express = require('express');
const { logSighting, getSightings } = require('../controllers/sightingController');

const router = express.Router();

router.post('/', logSighting);

router.get('/', getSightings);

module.exports = router;
