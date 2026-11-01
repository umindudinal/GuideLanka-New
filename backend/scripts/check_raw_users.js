const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

const supabase = createClient(url, key);

async function check() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'DRIVER');

        if (error) throw error;

        console.log(`Direct query found ${data.length} drivers:`);
        data.forEach(d => {
            console.log(`- ${d.full_name} (${d.email})`);
        });
    } catch (e) {
        console.error(e.message);
    }
}

check();
