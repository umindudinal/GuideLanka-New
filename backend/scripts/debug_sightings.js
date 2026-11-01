const supabase = require('../src/config/supabaseClient');

async function run() {
    console.log("=== RUNNING SIGHTINGS QUERY ===");
    const { data: sightings, error: err } = await supabase
      .from('sightings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    console.log("Error:", err);
    console.log("Sightings count:", sightings?.length);
    console.log("Sightings:", JSON.stringify(sightings, null, 2));
}
run();
