const supabase = require('../src/config/supabaseClient');

async function run() {
    console.log("=== RUNNING DASHBOARD QUERIES ===");

    const { data: drivers, error: uErr } = await supabase
      .from('users')
      .select('*, driver_profile:driver_profiles(*)')
      .eq('role', 'DRIVER');
    console.log("Drivers fetch error:", uErr);
    console.log("Drivers count:", drivers?.length);

    const { data: bookingsData, error: bErr } = await supabase
      .from('bookings')
      .select('*, tourist:users!tourist_id(full_name, email), driver:users!driver_id(full_name, phone_number)')
      .order('booking_date', { ascending: false });
    console.log("Bookings fetch error:", bErr);
    console.log("Bookings fetched:", JSON.stringify(bookingsData, null, 2));

    const { data: touristsData, error: tErr } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'TOURIST');
    console.log("Tourists fetch error:", tErr);
    console.log("Tourists count:", touristsData?.length);
}
run();
