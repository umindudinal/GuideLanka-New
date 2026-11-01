const express = require('express');
const { createBooking, updateBookingStatus, getBookings, cancelBooking } = require('../controllers/bookingController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');

const router = express.Router();

router.post('/', authMiddleware, authorizeRoles('TOURIST'), createBooking);

router.patch('/:id/cancel', authMiddleware, authorizeRoles('TOURIST'), cancelBooking);

router.patch('/:id/status', authMiddleware, authorizeRoles('DRIVER'), updateBookingStatus);

router.get('/', authMiddleware, getBookings);

module.exports = router;
