const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verifyLiveMapSightings() {
    try {
        console.log("=== CHECKING LIVE MAP SIGHTINGS ===");
        const timeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: sightings, error } = await supabase
            .from('sightings')
            .select(`
                id,
                animal_type,
                location_lat,
                location_lng,
                description,
                created_at,
                driver:users!driver_id(full_name)
            `)
            .gte('created_at', timeLimit)
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log(`Active Sightings on Live Map: ${sightings.length}\n`);
        const icons = { Elephant: '🐘', Leopard: '🐆', Bear: '🐻', Deer: '🦌', Peacock: '🦚' };

        sightings.forEach((s, idx) => {
            const emoji = icons[s.animal_type] || '🐾';
            const timeAgoMins = Math.round((Date.now() - new Date(s.created_at).getTime()) / 60000);
            console.log(`${idx + 1}. ${emoji} [${s.animal_type}] at Lat: ${s.location_lat.toFixed(5)}, Lng: ${s.location_lng.toFixed(5)} (${timeAgoMins} mins ago)`);
            console.log(`   Guide: ${s.driver?.full_name || 'Safari Guide'}`);
            console.log(`   Description: ${s.description}\n`);
        });
    } catch (e) {
        console.error("Verification failed:", e.message);
    }
}

verifyLiveMapSightings();

