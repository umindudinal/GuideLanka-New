const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

const supabase = createClient(url, key);

async function debug() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select(`
                *,
                driver_profiles:driver_profiles!id(is_active, experience_years, vehicle_id, price_per_safari, experience),
                driver_reviews:driver_reviews!driver_id(rating)
            `)
            .eq('role', 'DRIVER');

        if (error) throw error;

        console.log(`Found ${data.length} drivers:`);
        data.forEach(d => {
            console.log(`- ${d.full_name} (${d.email})`);
            console.log(`  Profile exists: ${!!d.driver_profiles}`);
            console.log(`  Profile data:`, d.driver_profiles);
            console.log(`  Reviews count: ${d.driver_reviews?.length || 0}`);
            console.log();
        });
    } catch (e) {
        console.error(e.message);
    }
}

debug();
