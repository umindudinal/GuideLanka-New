const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendSMS } = require('../utils/smsSender');
const { sendVerificationEmail } = require('../utils/emailSender');

const emailOtpStore = {};

const isStrongPassword = (pwd) => {
    if (!pwd || typeof pwd !== 'string') return false;
    const minLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pwd);
    return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
};

const registerUser = async (req, res) => {
    const { full_name, email, password, role, phone_number, vehicle_id, verification_code, profile_image } = req.body;

    try {

        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) {
            return res.status(400).json({ error: "This email is already registered in the system." });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                error: "Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters."
            });
        }

        if (role === 'DRIVER') {
            if (!verification_code) {
                return res.status(400).json({ error: "Email verification code is required." });
            }

            const emailKey = email.toLowerCase();
            const record = emailOtpStore[emailKey];

            if (!record) {
                return res.status(400).json({ error: "No verification code requested or it has expired." });
            }

            if (Date.now() > record.expires) {
                delete emailOtpStore[emailKey];
                return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
            }

            if (record.otp !== verification_code) {
                return res.status(400).json({ error: "Invalid email verification code." });
            }

            delete emailOtpStore[emailKey];
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        function formatPhoneWithPlus(phone) {
            if (!phone) return '';
            let cleaned = phone.replace(/\D/g, '');
            if (cleaned.startsWith('0')) {
                cleaned = '94' + cleaned.substring(1);
            } else if (!cleaned.startsWith('94')) {
                cleaned = '94' + cleaned;
            }
            return '+' + cleaned;
        }

        const formattedPhone = phone_number ? formatPhoneWithPlus(phone_number) : '';
        const userData = { full_name, email, password: hashedPassword, role, phone_number: formattedPhone };

        if (profile_image) {
            let dbImage = profile_image;
            if (!dbImage.startsWith('data:image/')) {
                dbImage = `data:image/jpeg;base64,${dbImage}`;
            }
            userData.profile_image = dbImage;
        }

        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert([userData])
            .select();

        if (userError) throw userError;

        const userId = newUser[0].id;

        if (role === 'DRIVER') {
            const { error: profileError } = await supabase
                .from('driver_profiles')
                .insert([{
                    id: userId,
                    vehicle_id: vehicle_id || `SV-${Math.floor(Math.random() * 1000)}`
                }]);

            if (profileError) throw profileError;

            if (profile_image) {
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const base64Data = profile_image.replace(/^data:image\/\w+;base64,/, "");
                    const buffer = Buffer.from(base64Data, 'base64');
                    const uploadDir = path.join(__dirname, '../../uploads/avatars');
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }
                    const filePath = path.join(uploadDir, `${userId}.jpg`);
                    fs.writeFileSync(filePath, buffer);
                } catch (fsErr) {
                    console.error("Error writing registered driver avatar to disk:", fsErr);
                }
            }
        }

        res.status(201).json({
            message: "User registered successfully!",
            user: newUser[0]
        });

    } catch (err) {
        console.error("💥 Register Error:", err);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {

        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);

        if (error) throw error;

        if (users.length === 0) {
            return res.status(400).json({ error: "Invalid credentials (User not found)" });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials (Wrong password)" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        delete user.password;
        res.status(200).json({ message: "Login successful!", token, user });

    } catch (err) {
        console.error("💥 Login Error details:", err);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { user_id, old_password, new_password } = req.body;

        if (!user_id || !old_password || !new_password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (!isStrongPassword(new_password)) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters."
            });
        }

        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user_id);

        if (fetchError || !users || users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(old_password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(new_password, salt);

        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedNewPassword })
            .eq('id', user_id);

        if (updateError) {
            console.error("❌ Password Update Error:", updateError.message);
            return res.status(400).json({ success: false, message: updateError.message });
        }

        res.status(200).json({ success: true, message: 'Password changed successfully' });

    } catch (error) {
        console.error("💥 Error in changePassword:", error);
        res.status(500).json({ success: false, message: 'Server error while changing password' });
    }
};

const otpStore = {};

function normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '94' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
        cleaned = '94' + cleaned;
    }
    return cleaned;
}

const sendOtp = async (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
    }

    try {

        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'DRIVER');

        if (error) throw error;

        const inputNorm = normalizePhone(phone);
        const user = users.find(u => normalizePhone(u.phone_number) === inputNorm && u.phone_number);

        if (!user) {
            return res.status(400).json({ error: "No driver found registered with this phone number." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        otpStore[inputNorm] = {
            otp,
            expires: Date.now() + 5 * 60 * 1000
        };

        const smsMessage = `Your GuideLanka Verification Code is: ${otp}. Valid for 5 minutes.`;
        const smsSent = await sendSMS(user.phone_number, smsMessage);

        res.status(200).json({
            message: smsSent ? "OTP sent successfully to your mobile number!" : "OTP generated (could not send SMS, check server console).",
            otp: otp
        });

    } catch (err) {
        console.error("💥 Send OTP Error:", err);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

const verifyOtp = async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
        return res.status(400).json({ error: "Phone number and OTP are required" });
    }

    try {
        const inputNorm = normalizePhone(phone);
        const record = otpStore[inputNorm];

        if (!record) {
            return res.status(400).json({ error: "OTP not requested or expired." });
        }

        if (Date.now() > record.expires) {
            delete otpStore[inputNorm];
            return res.status(400).json({ error: "OTP has expired. Please request a new one." });
        }

        if (record.otp !== otp) {
            return res.status(400).json({ error: "Invalid OTP code." });
        }

        delete otpStore[inputNorm];

        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'DRIVER');

        if (error) throw error;

        const user = users.find(u => normalizePhone(u.phone_number) === inputNorm);
        if (!user) {
            return res.status(400).json({ error: "Driver not found." });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        delete user.password;
        res.status(200).json({ message: "Login successful!", token, user });

    } catch (err) {
        console.error("💥 Verify OTP Error:", err);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

const sendEmailOtp = async (req, res) => {
    const { email, roleTitle } = req.body;
    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', cleanEmail)
            .maybeSingle();

        if (existingUser) {
            return res.status(400).json({ error: "This email is already registered in the system. Please use a unique email address." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        emailOtpStore[cleanEmail] = {
            otp,
            expires: Date.now() + 10 * 60 * 1000
        };

        const emailSent = await sendVerificationEmail(cleanEmail, otp, roleTitle || 'Safari Driver');

        res.status(200).json({
            success: true,
            message: emailSent ? "Verification code sent to your email!" : "Verification code generated (fallback: check server console).",
            otp: otp
        });

    } catch (err) {
        console.error("💥 Send Email OTP Error:", err);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

const checkAuthorityExists = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .in('role', ['AUTHORITY', 'ADMIN']);

        if (error) throw error;

        const exists = Boolean(data && data.length > 0);
        return res.status(200).json({ exists, count: data ? data.length : 0 });
    } catch (err) {
        console.error("💥 Check Authority Error:", err);
        return res.status(500).json({ error: "Failed to check authority status", details: err.message });
    }
};

const registerAuthority = async (req, res) => {
    const { full_name, email, password, phone_number, verification_code } = req.body;

    if (!full_name || !email || !password) {
        return res.status(400).json({ error: "Please fill in all required fields." });
    }

    if (!isStrongPassword(password)) {
        return res.status(400).json({
            error: "Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters."
        });
    }

    if (!verification_code) {
        return res.status(400).json({ error: "Email verification code is required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = emailOtpStore[cleanEmail];

    if (!record) {
        return res.status(400).json({ error: "No verification code requested or it has expired." });
    }

    if (Date.now() > record.expires) {
        delete emailOtpStore[cleanEmail];
        return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    }

    if (record.otp !== verification_code.toString().trim()) {
        return res.status(400).json({ error: "Invalid email verification code." });
    }

    delete emailOtpStore[cleanEmail];

    try {
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', cleanEmail)
            .maybeSingle();

        if (existingUser) {
            return res.status(400).json({ error: "This email is already registered in the system. Please use a unique email address." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = {
            full_name,
            email: cleanEmail,
            password: hashedPassword,
            role: 'AUTHORITY',
            phone_number: phone_number || ''
        };

        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert([userData])
            .select();

        if (userError) throw userError;

        const user = newUser[0];

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        delete user.password;
        return res.status(201).json({
            message: "Park Authority registered successfully!",
            token,
            user
        });
    } catch (err) {
        console.error("💥 Register Authority Error:", err);
        return res.status(500).json({ error: "Server Error", details: err.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    changePassword,
    sendOtp,
    verifyOtp,
    sendEmailOtp,
    checkAuthorityExists,
    registerAuthority
};
