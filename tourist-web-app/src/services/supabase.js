import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhxnklebmsjncmjaxcna.supabase.co';
const supabaseAnonKey = 'sb_publishable_nn-SW7V2D051wBJNhkehHw_0kqkh2Zo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
