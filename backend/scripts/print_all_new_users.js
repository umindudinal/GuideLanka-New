const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

const supabase = createClient(url, key);

async function printAll() {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        console.log(`New Database has ${data.length} users:`);
        data.forEach(u => {
            console.log(`- [${u.role}] ${u.full_name} (${u.email})`);
        });
    } catch (e) {
        console.error(e.message);
    }
}

printAll();
