const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verifyTourists() {
    try {
        console.log("=== VERIFYING TOURISTS ===");
        const { data: tourists, error: tErr } = await supabase
            .from('users')
            .select('id, full_name, email, phone_number, role, created_at')
            .eq('role', 'TOURIST')
            .order('created_at', { ascending: true });

        if (tErr) throw tErr;

        const { data: bookings, error: bErr } = await supabase
            .from('bookings')
            .select('*, driver:users!driver_id(full_name)');

        if (bErr) throw bErr;

        console.log(`Total Registered Tourists: ${tourists.length}`);
        console.log(`Total Bookings in Database: ${bookings?.length || 0}\n`);

        tourists.forEach((t, idx) => {
            const userBookings = bookings ? bookings.filter(b => b.tourist_id === t.id) : [];
            console.log(`${idx + 1}. [Registered: ${t.created_at.split('T')[0]}] ${t.full_name} (${t.email})`);
            console.log(`   Phone: ${t.phone_number}`);
            if (userBookings.length > 0) {
                userBookings.forEach(b => {
                    console.log(`   Safari: ${b.booking_date} | Slot: ${b.time_slot} | Status: ${b.status} | Driver: ${b.driver?.full_name || 'N/A'}`);
                });
            } else {
                console.log(`   No bookings yet.`);
            }
            console.log();
        });

    } catch (e) {
        console.error("Verification failed:", e.message);
    }
}

verifyTourists();

