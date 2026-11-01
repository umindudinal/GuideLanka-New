const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const weeklyBookings = [
    // --- Sunday, Oct 25, 2026 ---
    {
        tourist_email: 'liam.oconnor@example.com',
        driver_email: 'sunimal.rajapaksha@guidelanka.com',
        booking_date: '2026-10-25',
        time_slot: 'Morning (6:00 AM - 10:00 AM)|foreign',
        tourist_count: 2,
        status: 'COMPLETED',
        zone: 'YALA_BLOCK_1',
        created_at: '2026-10-23T10:00:00.000Z'
    },
    {
        tourist_email: 'kavinda.perera@example.lk',
        driver_email: 'dinesh.kumara@guidelanka.com',
        booking_date: '2026-10-25',
        time_slot: 'Evening (2:30 PM - 6:30 PM)|local',
        tourist_count: 4,
        status: 'COMPLETED',
        zone: 'YALA_BLOCK_5',
        created_at: '2026-10-24T14:30:00.000Z'
    },

    // --- Monday, Oct 26, 2026 ---
    {
        tourist_email: 'sophie.martin@example.fr',
        driver_email: 'kasun.jayawardena@guidelanka.com',
        booking_date: '2026-10-26',
        time_slot: 'Full Day Safari (6:00 AM - 6:00 PM)|foreign',
        tourist_count: 2,
        status: 'COMPLETED',
        zone: 'YALA_BLOCK_1',
        created_at: '2026-10-24T09:15:00.000Z'
    },
    {
        tourist_email: 'thilini.jayasinghe@example.lk',
        driver_email: 'nuwan.wickramasinghe@guidelanka.com',
        booking_date: '2026-10-26',
        time_slot: 'Morning (6:00 AM - 10:00 AM)|local',
        tourist_count: 3,
        status: 'REJECTED',
        zone: 'YALA_BLOCK_1',
        created_at: '2026-10-25T11:20:00.000Z'
    },

    // --- Tuesday, Oct 27, 2026 ---
    {
        tourist_email: 'markus.weber@example.de',
        driver_email: 'chaminda.perera@guidelanka.com',
        booking_date: '2026-10-27',
        time_slot: 'Morning (6:00 AM - 10:00 AM)|foreign',
        tourist_count: 3,
        status: 'COMPLETED',
        zone: 'YALA_BLOCK_1',
        created_at: '2026-10-25T16:00:00.000Z'
    },
    {
        tourist_email: 'daniel.tanaka@example.jp',
        driver_email: 'asanka.fernando@guidelanka.com',
        booking_date: '2026-10-27',
        time_slot: 'Evening (2:30 PM - 6:30 PM)|saarc',
        tourist_count: 2,
        status: 'CANCELLED',
        zone: 'YALA_BLOCK_5',
        created_at: '2026-10-26T08:45:00.000Z'
    },

    // --- Wednesday, Oct 28, 2026 (TODAY) ---
    {
        tourist_email: 'emma.watson@example.co.uk',
        driver_email: 'sunimal.rajapaksha@guidelanka.com',
        booking_date: '2026-10-28',
        time_slot: 'Morning (6:00 AM - 10:00 AM)|foreign',
        tourist_count: 2,
        status: 'COMPLETED',
        zone: 'YALA_BLOCK_1',
        created_at: '2026-10-26T14:10:00.000Z'
    },
    {
        tourist_email: 'alexandre.roy@example.ca',
        driver_email: 'dilshan.madushanka@guidelanka.com',
        booking_date: '2026-10-28',
        time_slot: 'Evening (2:30 PM - 6:30 PM)|foreign',
        tourist_count: 2,
        status: 'CONFIRMED',
        zone: 'YALA_BLOCK_1',
        created_at: '2026-10-27T10:30:00.000Z'
    },
    {
        tourist_email: 'kavinda.perera@example.lk',
        driver_email: 'roshan.senanayake@guidelanka.com',
        booking_date: '2026-10-28',
        time_slot: 'Morning (6:00 AM - 10:00 AM)|local',
        tourist_count: 3,
        status: 'CONFIRMED',
        zone: 'YALA_BLOCK_5',
        created_at: '2026-10-27T15:20:00.000Z'
    },

    // --- Thursday, Oct 29, 2026 (Tomorrow) ---
    {
        tourist_email: 'sarah.chen@example.com.au',
        driver_email: 'kasun.jayawardena@guidelanka.com',
        booking_date: '2026-10-29',
        time_slot: 'Morning (6:00 AM - 10:00 AM)|foreign',
        tourist_count: 3,
        status: 'CONFIRMED',
        zone: 'YALA_BLOCK_1',
        created_at: '2026-10-27T17:00:00.000Z'
    },
    {
        tourist_email: 'malith.bandara@example.lk',
        driver_email: 'nuwan.wickramasinghe@guidelanka.com',
        booking_date: '2026-10-29',
        time_slot: 'Evening (2:30 PM - 6:30 PM)|local',
        tourist_count: 4,
        status: 'APPROVED',
        zone: 'YALA_BLOCK_5',
        created_at: '2026-10-28T09:00:00.000Z'
    },

    // --- Friday, Oct 30, 2026 ---
    {
        tourist_email: 'liam.oconnor@example.com',
        driver_email: 'chaminda.perera@guidelanka.com',
        booking_date: '2026-10-30',
        time_slot: 'Full Day Safari (6:00 AM - 6:00 PM)|foreign',
        tourist_count: 2,
        status: 'CONFIRMED',
        zone: 'YALA_BLOCK_1',
        created_at: '2026-10-28T11:45:00.000Z'
    },
    {
        tourist_email: 'daniel.tanaka@example.jp',
        driver_email: 'dinesh.kumara@guidelanka.com',
        booking_date: '2026-10-30',
        time_slot: 'Morning (6:00 AM - 10:00 AM)|foreign',
        tourist_count: 1,
        status: 'PENDING',
        zone: 'YALA_BLOCK_1',
        created_at: '2026-10-28T13:15:00.000Z'
    },

    // --- Saturday, Oct 31, 2026 (Weekend) ---
    {
        tourist_email: 'sophie.martin@example.fr',
        driver_email: 'asanka.fernando@guidelanka.com',
        booking_date: '2026-10-31',
        time_slot: 'Morning (6:00 AM - 10:00 AM)|foreign',
        tourist_count: 2,
        status: 'CONFIRMED',
        zone: 'YALA_BLOCK_1',
        created_at: '2026-10-28T14:30:00.000Z'
    },
    {
        tourist_email: 'thilini.jayasinghe@example.lk',
        driver_email: 'sunimal.rajapaksha@guidelanka.com',
        booking_date: '2026-10-31',
        time_slot: 'Evening (2:30 PM - 6:30 PM)|local',
        tourist_count: 5,
        status: 'PENDING',
        zone: 'YALA_BLOCK_5',
        created_at: '2026-10-28T15:00:00.000Z'
    },
    {
        tourist_email: 'markus.weber@example.de',
        driver_email: 'kasun.jayawardena@guidelanka.com',
        booking_date: '2026-10-31',
        time_slot: 'Morning (6:00 AM - 10:00 AM)|saarc',
        tourist_count: 4,
        status: 'PENDING',
        zone: 'YALA_BLOCK_1',
        created_at: '2026-10-28T16:20:00.000Z'
    },

    // --- Sunday, Nov 01, 2026 ---
    {
        tourist_email: 'malith.bandara@example.lk',
        driver_email: 'roshan.senanayake@guidelanka.com',
        booking_date: '2026-11-01',
        time_slot: 'Morning (6:00 AM - 10:00 AM)|local',
        tourist_count: 4,
        status: 'PENDING',
        zone: 'YALA_BLOCK_5',
        created_at: '2026-10-28T18:10:00.000Z'
    },
    {
        tourist_email: 'alexandre.roy@example.ca',
        driver_email: 'nuwan.wickramasinghe@guidelanka.com',
        booking_date: '2026-11-01',
        time_slot: 'Evening (2:30 PM - 6:30 PM)|foreign',
        tourist_count: 2,
        status: 'PENDING',
        zone: 'YALA_BLOCK_1',
        created_at: '2026-10-28T19:00:00.000Z'
    }
];

async function seedWeeklyBookings() {
    console.log('🚀 Seeding realistic bookings for this week (Oct 25 - Nov 01, 2026)...');

    // Fetch tourists and drivers to map IDs
    const { data: tourists, error: tErr } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('role', 'TOURIST');

    if (tErr || !tourists || tourists.length === 0) {
        console.error("Error fetching tourists:", tErr?.message || "No tourists found");
        return;
    }

    const { data: drivers, error: dErr } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('role', 'DRIVER');

    if (dErr || !drivers || drivers.length === 0) {
        console.error("Error fetching drivers:", dErr?.message || "No drivers found");
        return;
    }

    const touristMap = {};
    tourists.forEach(t => { touristMap[t.email.toLowerCase()] = t; });

    const driverMap = {};
    drivers.forEach(d => { driverMap[d.email.toLowerCase()] = d; });

    // Clean existing bookings within this week range to avoid duplicates
    const minDate = '2026-10-25';
    const maxDate = '2026-11-01';

    console.log(`Cleaning old bookings between ${minDate} and ${maxDate}...`);
    const { error: delErr } = await supabase
        .from('bookings')
        .delete()
        .gte('booking_date', minDate)
        .lte('booking_date', maxDate);

    if (delErr) {
        console.warn("Delete warning:", delErr.message);
    }

    let insertedCount = 0;
    const statusCounts = {};

    for (const b of weeklyBookings) {
        const tourist = touristMap[b.tourist_email.toLowerCase()];
        const driver = driverMap[b.driver_email.toLowerCase()];

        if (!tourist) {
            console.warn(`Tourist not found for email: ${b.tourist_email}`);
            continue;
        }
        if (!driver) {
            console.warn(`Driver not found for email: ${b.driver_email}`);
            continue;
        }

        const insertPayload = {
            tourist_id: tourist.id,
            driver_id: driver.id,
            booking_date: b.booking_date,
            time_slot: b.time_slot,
            tourist_count: b.tourist_count,
            status: b.status,
            zone: b.zone,
            created_at: b.created_at
        };

        const { error: insErr } = await supabase
            .from('bookings')
            .insert([insertPayload]);

        if (insErr) {
            console.error(`Error inserting booking on ${b.booking_date} for ${tourist.full_name}:`, insErr.message);
        } else {
            insertedCount++;
            statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
            console.log(`✓ [${b.status}] ${b.booking_date} | ${tourist.full_name} with ${driver.full_name} (${b.time_slot.split('|')[0]})`);
        }
    }

    console.log(`\n🎉 Successfully inserted ${insertedCount} bookings for this week!`);
    console.log('Status breakdown:', statusCounts);
}

seedWeeklyBookings();

