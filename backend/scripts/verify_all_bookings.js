const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verifyAllBookings() {
    try {
        console.log("=== CHECKING ALL BOOKINGS IN DATABASE ===");
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select(`
                id,
                booking_date,
                time_slot,
                status,
                tourist_count,
                zone,
                created_at,
                tourist:users!tourist_id(full_name, email),
                driver:users!driver_id(full_name)
            `)
            .order('booking_date', { ascending: false });

        if (error) throw error;

        console.log(`Total Bookings in Database: ${bookings.length}`);

        const todayStr = '2026-10-28';
        const todayBookings = bookings.filter(b => b.booking_date === todayStr);
        console.log(`Today's Bookings (${todayStr}): ${todayBookings.length}`);

        const thisWeekBookings = bookings.filter(b => b.booking_date >= '2026-10-25' && b.booking_date <= '2026-11-01');
        console.log(`This Week's Bookings: ${thisWeekBookings.length}\n`);

        const statusMap = {};
        bookings.forEach(b => {
            statusMap[b.status] = (statusMap[b.status] || 0) + 1;
        });
        console.log("Status distribution across all bookings:", statusMap);

        console.log("\n--- This Week's Safari Schedule ---");
        thisWeekBookings.forEach(b => {
            console.log(`[${b.booking_date}] [${b.status.padEnd(9)}] ${b.tourist?.full_name?.padEnd(20)} | Driver: ${b.driver?.full_name?.padEnd(22)} | ${b.time_slot} (${b.tourist_count} guests)`);
        });

    } catch (e) {
        console.error("Verification failed:", e.message);
    }
}

verifyAllBookings();

