const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Ensure .env is loaded regardless of process current working directory
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
require('dotenv').config();

const DEFAULT_SUPABASE_URL = 'https://dhxnklebmsjncmjaxcna.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_nn-SW7V2D051wBJNhkehHw_0kqkh2Zo';

const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || DEFAULT_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Error: SUPABASE_URL and SUPABASE_KEY must be provided in .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

