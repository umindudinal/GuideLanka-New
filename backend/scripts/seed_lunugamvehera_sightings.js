const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Accurate coordinates located on the Lunugamvehera / Yala Block 5 tracks shown in the map
const sightingsData = [
    {
        animal_type: 'Elephant',
        location_lat: 6.554390,
        location_lng: 81.273647,
        description: 'Herd of 6 wild elephants with a juvenile calf grazing near Lunugamvehera reservoir northern bank.',
        minutes_ago: 18,
        preferred_driver: 'sunimal.rajapaksha@guidelanka.com'
    },
    {
        animal_type: 'Leopard',
        location_lat: 6.484471,
        location_lng: 81.255473,
        description: 'Young male leopard resting on a granite rock outcrop beside the central trail.',
        minutes_ago: 38,
        preferred_driver: 'kasun.jayawardena@guidelanka.com'
    },
    {
        animal_type: 'Bear',
        location_lat: 6.459167,
        location_lng: 81.296156,
        description: 'Adult sloth bear observed foraging near termitary mounds on Sella Katharagama boundary track.',
        minutes_ago: 55,
        preferred_driver: 'chaminda.perera@guidelanka.com'
    },
    {
        animal_type: 'Deer',
        location_lat: 6.542205,
        location_lng: 81.287244,
        description: 'Large herd of ~15 spotted deer grazing peacefully on open grassland near Gonagan Ara track.',
        minutes_ago: 75,
        preferred_driver: 'nuwan.wickramasinghe@guidelanka.com'
    },
    {
        animal_type: 'Elephant',
        location_lat: 6.473792,
        location_lng: 81.141044,
        description: 'Solitary bull elephant crossing the western boundary track near Kithulkote corridor.',
        minutes_ago: 110,
        preferred_driver: 'dinesh.kumara@guidelanka.com'
    },
    {
        animal_type: 'Peacock',
        location_lat: 6.368718,
        location_lng: 81.236005,
        description: 'Two male peacocks displaying courtship plumage along the southern Seenukkuwa sand track.',
        minutes_ago: 135,
        preferred_driver: 'asanka.fernando@guidelanka.com'
    },
    {
        animal_type: 'Leopard',
        location_lat: 6.432348,
        location_lng: 81.298927,
        description: 'Female leopard quickly crossing the southeast safari track into scrub jungle.',
        minutes_ago: 165,
        preferred_driver: 'roshan.senanayake@guidelanka.com'
    },
    {
        animal_type: 'Deer',
        location_lat: 6.527673,
        location_lng: 81.271605,
        description: 'Pair of large sambar deer resting near forest watering pond.',
        minutes_ago: 210,
        preferred_driver: 'dilshan.madushanka@guidelanka.com'
    }
];

async function seedSightings() {
    console.log('🚀 Seeding wildlife sightings for Lunugamvehera / Yala Block 5 tracks...');

    // Fetch drivers
    const { data: drivers, error: dErr } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('role', 'DRIVER');

    if (dErr || !drivers || drivers.length === 0) {
        console.error("Error fetching drivers:", dErr?.message || "No drivers found");
        return;
    }

    const driverMap = {};
    drivers.forEach(d => { driverMap[d.email.toLowerCase()] = d; });
    const defaultDriver = drivers[0];

    const recordsToInsert = sightingsData.map(s => {
        const matchedDriver = driverMap[s.preferred_driver.toLowerCase()] || defaultDriver;
        const createdAt = new Date(Date.now() - s.minutes_ago * 60 * 1000).toISOString();

        return {
            driver_id: matchedDriver.id,
            animal_type: s.animal_type,
            location_lat: s.location_lat,
            location_lng: s.location_lng,
            description: s.description,
            created_at: createdAt
        };
    });

    // Optional: Clean up older sightings in this region (lat ~6.3 to 6.6, lng ~81.1 to 81.35)
    console.log('Cleaning old sightings in Lunugamvehera corridor...');
    await supabase
        .from('sightings')
        .delete()
        .gte('location_lat', 6.30)
        .lte('location_lat', 6.65)
        .gte('location_lng', 81.10)
        .lte('location_lng', 81.35);

    const { data: inserted, error: insErr } = await supabase
        .from('sightings')
        .insert(recordsToInsert)
        .select();

    if (insErr) {
        console.error("Error inserting sightings:", insErr.message);
        return;
    }

    console.log(`\n🎉 Successfully inserted ${inserted.length} wildlife sightings for Lunugamvehera!`);
    inserted.forEach((item, idx) => {
        const timeAgo = sightingsData[idx].minutes_ago;
        console.log(`${idx + 1}. [${item.animal_type}] at (${item.location_lat.toFixed(5)}, ${item.location_lng.toFixed(5)}) - ${timeAgo} mins ago`);
        console.log(`   Note: ${item.description}`);
    });
}

seedSightings();

