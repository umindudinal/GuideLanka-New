const nodemailer = require('nodemailer');
const dns = require('dns');

// Prefer IPv4 over IPv6 to avoid ENETUNREACH on networks without IPv6 routing
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const sendVerificationEmail = async (email, otp, roleTitle = 'Safari Driver') => {
    console.log(`[EMAIL SENDER] Attempting to send verification email to: ${email} for role: ${roleTitle}`);

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';

    const isAuthority = roleTitle && roleTitle.toLowerCase().includes('authority');
    const displayRole = isAuthority ? 'Park Authority Administrator' : 'Safari Driver';
    const emailSubject = `GuideLanka ${displayRole} Email Verification`;
    const emailHeader = `GuideLanka ${displayRole} Registration`;
    const emailBodyText = isAuthority
        ? `You are registering as a <strong>Park Authority Administrator</strong> in the GuideLanka Wildlife & Safari Operations System.`
        : `You are being registered as an official <strong>Safari Driver</strong> in the GuideLanka Safari & Wildlife Operations System.`;

    if (smtpHost && smtpUser && smtpPass) {
        try {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: parseInt(smtpPort),
                secure: parseInt(smtpPort) === 465,
                connectionTimeout: 5000,
                greetingTimeout: 5000,
                socketTimeout: 5000,
                auth: {
                    user: smtpUser,
                    pass: smtpPass
                }
            });

            const mailOptions = {
                from: `"GuideLanka System" <${smtpUser}>`,
                to: email,
                subject: emailSubject,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <h2 style="color: #059669; font-size: 22px; font-weight: 800; margin: 0 0 6px 0;">${emailHeader}</h2>
                            <p style="color: #64748b; font-size: 13px; margin: 0;">GuideLanka Safari Operations Platform</p>
                        </div>
                        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 12px;">Hello,</p>
                        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">${emailBodyText}</p>
                        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Please enter the following 6-digit verification code to verify your email and complete registration:</p>
                        <div style="text-align: center; margin: 28px 0;">
                            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; background-color: #ecfdf5; padding: 14px 28px; border-radius: 12px; border: 1.5px solid #a7f3d0; color: #065f46; display: inline-block; box-shadow: 0 2px 6px rgba(5,150,105,0.1);">${otp}</span>
                        </div>
                        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 24px; text-align: center;">⏱️ This verification code is valid for <strong>10 minutes</strong>.<br>If you did not request this registration, please safely ignore this email.</p>
                        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">&copy; 2026 GuideLanka Safari & Park Authority Operations Portal</p>
                    </div>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully: ${info.messageId}`);
            return true;
        } catch (err) {
            console.error('❌ Failed to send email via SMTP, falling back to console:', err);
        }
    }

    console.log(`\n====================================`);
    console.log(`[EMAIL FALLBACK]`);
    console.log(`To: ${email}`);
    console.log(`Role: ${displayRole}`);
    console.log(`Subject: ${emailSubject}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`====================================\n`);
    return false;
};

module.exports = { sendVerificationEmail };
