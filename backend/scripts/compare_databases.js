const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const oldUrl = 'https://iewemsnxwuenkxrreczi.supabase.co';
const oldKey = 'sb_publishable_eM0_kYgay_FyqRqMs5HyjA_Ip7tAVUn';

const newUrl = process.env.SUPABASE_URL;
const newKey = process.env.SUPABASE_KEY;

const oldSupabase = createClient(oldUrl, oldKey);
const newSupabase = createClient(newUrl, newKey);

async function compare() {
    console.log('=== COMPARING USERS IN OLD & NEW DB ===');
    try {
        const { data: oldUsers, error: oldErr } = await oldSupabase.from('users').select('id, full_name, email, role, created_at');
        const { data: newUsers, error: newErr } = await newSupabase.from('users').select('id, full_name, email, role, created_at');

        if (oldErr) console.error('Error reading old users:', oldErr.message);
        if (newErr) console.error('Error reading new users:', newErr.message);

        console.log(`\nOLD DATABASE (${oldUsers ? oldUsers.length : 0} users):`);
        if (oldUsers) {
            oldUsers.forEach(u => console.log(`- [${u.role}] ${u.full_name} (${u.email}) created at ${u.created_at}`));
        }

        console.log(`\nNEW DATABASE (${newUsers ? newUsers.length : 0} users):`);
        if (newUsers) {
            newUsers.forEach(u => console.log(`- [${u.role}] ${u.full_name} (${u.email}) created at ${u.created_at}`));
        }

        console.log('\n=== COMPARING DRIVER PROFILES IN OLD & NEW DB ===');
        const { data: oldProfiles } = await oldSupabase.from('driver_profiles').select('*');
        const { data: newProfiles } = await newSupabase.from('driver_profiles').select('*');

        console.log(`OLD DATABASE profiles count: ${oldProfiles ? oldProfiles.length : 0}`);
        console.log(`NEW DATABASE profiles count: ${newProfiles ? newProfiles.length : 0}`);

    } catch (err) {
        console.error('Comparison error:', err.message);
    }
}

compare();
