const sendSMS = async (phone, message) => {
    const provider = process.env.SMS_PROVIDER || 'console';

    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '94' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
        cleaned = '94' + cleaned;
    }

    console.log(`[SMS SENDER] Sending via provider: ${provider} to phone: ${cleaned}`);

    if (provider === 'twilio') {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_NUMBER;

        if (!accountSid || !authToken || !fromNumber) {
            console.error("❌ Twilio configuration missing in .env!");
            return false;
        }

        const twilioPhone = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;

        try {
            const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
            const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    To: twilioPhone,
                    From: fromNumber,
                    Body: message
                })
            });

            const data = await response.json();
            if (response.ok) {
                console.log(`✅ SMS sent successfully via Twilio. Message SID: ${data.sid}`);
                return true;
            } else {
                console.error(`❌ Twilio Error:`, data);
                return false;
            }
        } catch (err) {
            console.error(`💥 Twilio Connection Error:`, err);
            return false;
        }
    }

    if (provider === 'notifylk') {
        const apiKey = process.env.NOTIFY_API_KEY;
        const userId = process.env.NOTIFY_USER_ID;
        const senderId = process.env.NOTIFY_SENDER_ID || 'NotifyDEMO';

        if (!apiKey || !userId) {
            console.error("❌ Notify.lk configuration missing in .env!");
            return false;
        }

        try {
            const url = `https://app.notify.lk/api/v1/send?api_key=${apiKey}&user_id=${userId}&sender_id=${senderId}&to=${cleaned}&message=${encodeURIComponent(message)}`;
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok && data.status === 'success') {
                console.log(`✅ SMS sent successfully via Notify.lk.`);
                return true;
            } else {
                console.error(`❌ Notify.lk Error:`, data);
                return false;
            }
        } catch (err) {
            console.error(`💥 Notify.lk Connection Error:`, err);
            return false;
        }
    }

    console.log(`\n====================================`);
    console.log(`[REAL SMS MOCK FALLBACK]`);
    console.log(`To: +${cleaned}`);
    console.log(`Message: ${message}`);
    console.log(`====================================\n`);
    return true;
};

module.exports = { sendSMS };
