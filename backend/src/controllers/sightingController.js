const supabase = require('../config/supabaseClient');

const logSighting = async (req, res) => {
    const { driver_id, animal_type, location_lat, location_lng, description } = req.body;

    if (!driver_id || !animal_type || !location_lat || !location_lng) {
        return res.status(400).json({ success: false, error: "Missing required fields for sighting" });
    }

    try {

        const { data, error } = await supabase
            .from('sightings')
            .insert([
                {
                    driver_id: driver_id,
                    animal_type: animal_type,
                    location_lat: location_lat,
                    location_lng: location_lng,
                    description: description || 'Logged via mobile map'
                }
            ])
            .select();

        if (error) throw error;

        res.status(201).json({ success: true, message: "Sighting logged successfully!", data: data[0] });
    } catch (err) {
        console.error("💥 Error logging sighting:", err);
        res.status(500).json({ success: false, error: "Server Error while saving sighting" });
    }
};

const getSightings = async (req, res) => {
    try {

        const timeLimit = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('sightings')
            .select('*')
            .gte('created_at', timeLimit)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const animalTimeLimits = {
            'elephant': 60, // Elephant stays in an area ~60 minutes
            'leopard': 30,  // Leopard moves quickly ~30 minutes
            'bear': 30,     // Bear ~30 minutes
            'peacock': 20,  // Peacock/Birds ~20 minutes
            'deer': 15,     // Deer flees quickly ~15 minutes
            'other': 15
        };

        const now = new Date();

        const activeSightings = data.filter(sighting => {
            const sightingTime = new Date(sighting.created_at);

            const diffInMinutes = (now - sightingTime) / (1000 * 60);

            const maxAllowedMinutes = animalTimeLimits[(sighting.animal_type || '').toLowerCase()] || 60;

            return diffInMinutes <= maxAllowedMinutes;
        });

        res.status(200).json({ success: true, data: activeSightings });
    } catch (err) {
        console.error("💥 Error fetching sightings:", err);
        res.status(500).json({ success: false, error: "Server Error while fetching sightings" });
    }
};

module.exports = { logSighting, getSightings };
