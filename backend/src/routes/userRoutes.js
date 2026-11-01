const express = require('express');
const { getMyProfile, uploadUserProfilePicture } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const router = express.Router();

router.get('/profile', authMiddleware, getMyProfile);

router.post('/profile/picture', authMiddleware, uploadUserProfilePicture);

router.get('/driver-only', authMiddleware, authorizeRoles('DRIVER'), (req, res) => {
    res.status(200).json({ message: "Success! You have DRIVER access." });
});

router.get('/tourist-only', authMiddleware, authorizeRoles('TOURIST'), (req, res) => {
    res.status(200).json({ message: "Success! You have TOURIST access." });
});

module.exports = router;
