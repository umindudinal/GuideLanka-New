const express = require('express');
const { sendMessage, getMessages, markMessagesAsRead } = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/sendMessage', sendMessage);

router.post('/markRead', markMessagesAsRead);

router.get('/:booking_id', authMiddleware, getMessages);

module.exports = router;
