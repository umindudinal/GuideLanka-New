const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verify() {
    try {
        console.log("=== VERIFYING DRIVERS ===");
        const { data: drivers, error } = await supabase
            .from('users')
            .select(`
                id,
                full_name,
                email,
                phone_number,
                role,
                created_at,
                driver_profiles:driver_profiles!id(is_active, experience_years, vehicle_id, price_per_safari, experience),
                driver_reviews:driver_reviews!driver_id(rating)
            `)
            .eq('role', 'DRIVER')
            .order('created_at', { ascending: true });

        if (error) throw error;

        console.log(`Total Drivers in DB: ${drivers.length}`);
        drivers.forEach((d, idx) => {
            const reviewCount = d.driver_reviews?.length || 0;
            const avgRating = reviewCount > 0 
                ? (d.driver_reviews.reduce((s, r) => s + r.rating, 0) / reviewCount).toFixed(1)
                : 'N/A';
            console.log(`${idx + 1}. [Registered: ${d.created_at.split('T')[0]}] ${d.full_name} (${d.email})`);
            console.log(`   Phone: ${d.phone_number} | Vehicle: ${d.driver_profiles?.vehicle_id}`);
            console.log(`   Price: LKR ${d.driver_profiles?.price_per_safari} | Exp: ${d.driver_profiles?.experience_years} yrs | Active: ${d.driver_profiles?.is_active}`);
            console.log(`   Rating: ${avgRating} ★ (${reviewCount} reviews)`);
        });
    } catch (e) {
        console.error("Verification failed:", e.message);
    }
}

verify();

