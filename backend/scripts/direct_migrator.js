const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const oldUrl = 'https://iewemsnxwuenkxrreczi.supabase.co';
const oldKey = 'sb_publishable_eM0_kYgay_FyqRqMs5HyjA_Ip7tAVUn';

const newUrl = process.env.SUPABASE_URL;
const newKey = process.env.SUPABASE_KEY;

if (!newUrl || !newKey) {
    console.error('Error: New credentials not found in backend/.env');
    process.exit(1);
}

const oldSupabase = createClient(oldUrl, oldKey);
const newSupabase = createClient(newUrl, newKey);

async function startMigration() {
    console.log('=== STARTING ROBUST DATABASE MIGRATION ===');

    console.log('Migrating Users...');
    const { data: users, error: userError } = await oldSupabase.from('users').select('*');
    if (userError) {
        console.error('Error reading users from old database:', userError.message);
        return;
    }

    const validUserIds = new Set(users.map(u => u.id));
    const { error: usersInsertError } = await newSupabase.from('users').upsert(users, { onConflict: 'id' });
    if (usersInsertError) {
        console.error('Error writing users:', usersInsertError.message);
        return;
    }
    console.log(`Successfully migrated ${users.length} users.`);

    async function migrateWithFilter(tableName, filterFn) {
        console.log(`Migrating ${tableName}...`);
        const { data, error } = await oldSupabase.from(tableName).select('*');
        if (error) {
            console.error(`Error reading ${tableName}:`, error.message);
            return [];
        }

        const filteredData = data.filter(filterFn);
        if (filteredData.length < data.length) {
            console.log(`Filtered out ${data.length - filteredData.length} orphan records from ${tableName}.`);
        }

        if (filteredData.length === 0) {
            console.log(`No records to migrate for ${tableName}.`);
            return [];
        }

        const { error: insertError } = await newSupabase.from(tableName).upsert(filteredData, { onConflict: 'id' });
        if (insertError) {
            console.error(`Error writing ${tableName}:`, insertError.message);
            return [];
        }
        console.log(`Successfully migrated ${filteredData.length} records for ${tableName}.`);
        return filteredData;
    }

    await migrateWithFilter('driver_profiles', dp => validUserIds.has(dp.id));

    await migrateWithFilter('driver_reviews', dr => validUserIds.has(dr.driver_id));

    const migratedBookings = await migrateWithFilter('bookings', b =>
        validUserIds.has(b.tourist_id) && validUserIds.has(b.driver_id)
    );
    const validBookingIds = new Set(migratedBookings.map(b => b.id));

    await migrateWithFilter('messages', m =>
        validBookingIds.has(m.booking_id) && validUserIds.has(m.sender_id)
    );

    await migrateWithFilter('sightings', s => !s.driver_id || validUserIds.has(s.driver_id));

    await migrateWithFilter('wildlife_sightings', ws => true);

    await migrateWithFilter('alerts', a => !a.driver_id || validUserIds.has(a.driver_id));

    await migrateWithFilter('emergency_alerts', ea => !ea.driver_id || validUserIds.has(ea.driver_id));

    console.log('\n=== MIGRATION COMPLETED SUCCESSFULY ===');
}

startMigration();
