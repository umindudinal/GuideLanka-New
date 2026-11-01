const express = require('express');
const router = express.Router();
const { calculateBestRoute } = require('../controllers/routeController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/optimize', authMiddleware, calculateBestRoute);

module.exports = router;
