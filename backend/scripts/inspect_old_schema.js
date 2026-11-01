const { createClient } = require('@supabase/supabase-js');

const oldUrl = 'https://iewemsnxwuenkxrreczi.supabase.co';
const oldKey = 'sb_publishable_eM0_kYgay_FyqRqMs5HyjA_Ip7tAVUn';

const oldSupabase = createClient(oldUrl, oldKey);

const tables = [
    'users',
    'driver_profiles',
    'driver_reviews',
    'bookings',
    'messages',
    'sightings',
    'wildlife_sightings',
    'alerts',
    'emergency_alerts'
];

async function inspect() {
    console.log('=== OLD SCHEMA COLUMNS ===');
    for (const table of tables) {
        try {
            const { data, error } = await oldSupabase.from(table).select('*').limit(1);
            if (error) {
                console.error(`Error reading table ${table}:`, error.message);
                continue;
            }
            if (data && data.length > 0) {
                console.log(`Table "${table}" columns:`, Object.keys(data[0]));
            } else {
                console.log(`Table "${table}" is empty, cannot inspect columns.`);
            }
        } catch (err) {
            console.error(`Failed inspecting table ${table}:`, err.message);
        }
    }
}

inspect();
