const express = require('express');
const {
    registerUser,
    loginUser,
    changePassword,
    sendOtp,
    verifyOtp,
    sendEmailOtp,
    checkAuthorityExists,
    registerAuthority
} = require('../controllers/authController');

const router = express.Router();

router.get('/check-authority', checkAuthorityExists);

router.post('/register-authority', registerAuthority);

router.post('/register', registerUser);

router.post('/login', loginUser);

router.post('/send-otp', sendOtp);

router.post('/verify-otp', verifyOtp);

router.post('/send-email-otp', sendEmailOtp);

router.get('/test', (req, res) => {
    res.send("✅ Auth routes are perfectly working!");
});

router.post('/change-password', changePassword);

module.exports = router;
