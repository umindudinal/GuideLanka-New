const supabase = require('../src/config/supabaseClient');

async function run() {
    console.log("=== INSERTING MOCK SIGHTINGS ===");

    const { data: dataYala, error: errYala } = await supabase
      .from('sightings')
      .insert([
        {
          driver_id: 'c4f58b55-6de3-4624-9e1b-059305a88171',
          animal_type: 'Leopard',
          location_lat: 6.375,
          location_lng: 81.518,
          description: 'Mock Leopard Sighting near route-1 in Yala'
        }
      ])
      .select();

    console.log("Yala insert error:", errYala);
    console.log("Yala insert data:", dataYala);

    const { data: dataElephant, error: errElephant } = await supabase
      .from('sightings')
      .insert([
        {
          driver_id: 'c4f58b55-6de3-4624-9e1b-059305a88171',
          animal_type: 'Elephant',
          location_lat: 6.340,
          location_lng: 81.240,
          description: 'Mock Elephant Sighting near Yala Block 6 corridor'
        }
      ])
      .select();

    console.log("Elephant insert error:", errElephant);
    console.log("Elephant insert data:", dataElephant);

    const { data: dataCroc, error: errCroc } = await supabase
      .from('sightings')
      .insert([
        {
          driver_id: 'c4f58b55-6de3-4624-9e1b-059305a88171',
          animal_type: 'Crocodile',
          location_lat: 6.380,
          location_lng: 81.520,
          description: 'Mock Crocodile spotted near Yala block 5 lagoon area'
        }
      ])
      .select();

    console.log("Crocodile insert error:", errCroc);
    console.log("Crocodile insert data:", dataCroc);
}
run();
