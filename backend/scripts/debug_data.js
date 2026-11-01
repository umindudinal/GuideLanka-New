const supabase = require('../src/config/supabaseClient');

async function run() {
    const { data: bookings, error: bErr } = await supabase.from('bookings').select('*');
    const { data: users, error: uErr } = await supabase.from('users').select('*');

    console.log("=== BOOKINGS ===");
    console.log(JSON.stringify(bookings, null, 2));

    console.log("=== USERS ===");
    console.log(JSON.stringify(users, null, 2));
}
run();
