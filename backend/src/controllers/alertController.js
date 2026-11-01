const supabase = require('../config/supabaseClient');

const receiveAlert = async (req, res) => {
    const { driver_id, alert_type, location_lat, location_lng, status } = req.body;

    if (!driver_id || !alert_type || !location_lat || !location_lng) {
        return res.status(400).json({ success: false, error: "Missing alert data" });
    }

    try {

        const { data, error } = await supabase
            .from('alerts')
            .insert([
                {
                    driver_id,
                    alert_type,
                    location_lat,
                    location_lng,
                    status: status || 'Active'
                }
            ])
            .select();

        if (error) throw error;

        console.log(`🚨 EMERGENCY ALERT: ${alert_type} from Driver ${driver_id}`);

        res.status(201).json({ success: true, message: "Alert received and saved!", data: data[0] });
    } catch (err) {
        console.error("💥 Error saving alert:", err);
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

const createSOSAlert = async (req, res) => {
    try {
        const { driver_id, latitude, longitude, alert_type, status } = req.body;

        if (!driver_id || !latitude || !longitude) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const { data, error } = await supabase
            .from('emergency_alerts')
            .insert([{ driver_id, latitude, longitude, alert_type, status: status || 'PENDING' }]);

        if (error) {
            console.error("Database Error:", error);
            return res.status(500).json({ success: false, error: error.message });
        }

        res.status(201).json({ success: true, message: 'SOS Alert saved successfully', data });

    } catch (error) {
        console.error("💥 Error in createSOSAlert:", error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

const getActiveAlerts = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('emergency_alerts')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(5);

        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Error fetching alerts:", error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

module.exports = { receiveAlert, createSOSAlert, getActiveAlerts };
