const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

const supabase = createClient(url, key);

async function analyze() {
    try {
        const { data: users } = await supabase.from('users').select('*').eq('role', 'DRIVER');
        const { data: reviews } = await supabase.from('driver_reviews').select('*');
        const { data: bookings } = await supabase.from('bookings').select('*');
        const { data: sightings } = await supabase.from('sightings').select('*');

        console.log('=== DRIVER PERFORMANCE STATS ===\n');

        const scoreMap = users.map(d => {
            const dReviews = reviews.filter(r => r.driver_id === d.id);
            const avgRating = dReviews.length > 0
                ? parseFloat((dReviews.reduce((sum, r) => sum + r.rating, 0) / dReviews.length).toFixed(1))
                : 4.8;

            const dBookings = bookings.filter(b => b.driver_id === d.id && (b.status === 'CONFIRMED' || b.status === 'COMPLETED'));
            const tripsCount = dBookings.length;

            const dSightings = sightings.filter(s => s.driver_id === d.id);
            const sightingsCount = dSightings.length;

            const score = (avgRating * 2) + (tripsCount * 0.5) + (sightingsCount * 0.3);

            return {
                name: d.full_name,
                avgRating,
                reviewsCount: dReviews.length,
                tripsCount,
                sightingsCount,
                score
            };
        });

        scoreMap.sort((a, b) => b.score - a.score);

        scoreMap.forEach((d, idx) => {
            console.log(`${idx + 1}. ${d.name}`);
            console.log(`   - Avg Rating: ${d.avgRating} (${d.reviewsCount} reviews)`);
            console.log(`   - Trips Count: ${d.tripsCount}`);
            console.log(`   - Sightings Count: ${d.sightingsCount}`);
            console.log(`   - Score = (${d.avgRating} * 2) + (${d.tripsCount} * 0.5) + (${d.sightingsCount} * 0.3) = ${d.score.toFixed(2)}`);
            console.log();
        });

    } catch (e) {
        console.error(e.message);
    }
}

analyze();
