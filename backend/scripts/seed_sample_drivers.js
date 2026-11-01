const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const sampleDrivers = [
    {
        full_name: 'Sunimal Rajapaksha',
        email: 'sunimal.rajapaksha@guidelanka.com',
        phone_number: '+94771234501',
        created_at: '2026-03-15T08:30:00.000Z',
        vehicle_id: 'SP-NC-4821 • Toyota Hilux 4x4 (6 Seats)',
        vehicle_model: 'Toyota Hilux 4x4 (6 Seats)',
        license_no: 'B-4821901',
        price_per_safari: 18000,
        is_active: true,
        experience_years: 12,
        experience: 'Over 12 years guiding in Yala National Park. Special focus on leopard behavior, elephant corridors, and bird photography.',
        reviews: [
            {
                rating: 5,
                comment: 'Sunimal was phenomenal! We spotted two leopards within our first hour in Block 1. Highly recommended!',
                tourist_name: 'Charlotte Davies',
                tourist_email: 'charlotte.d@example.co.uk',
                created_at: '2026-04-10T14:20:00.000Z'
            },
            {
                rating: 5,
                comment: 'Very professional, respectful of wildlife distances, and has incredible eyesight for camouflaged birds.',
                tourist_name: 'Markus Weber',
                tourist_email: 'm.weber@example.de',
                created_at: '2026-06-18T16:45:00.000Z'
            },
            {
                rating: 5,
                comment: 'The best safari guide in Yala! Great vehicle comfort and unmatched tracking skills.',
                tourist_name: 'Liam O’Connor',
                tourist_email: 'liam.oc@example.com',
                created_at: '2026-08-04T11:10:00.000Z'
            }
        ]
    },
    {
        full_name: 'Kasun Jayawardena',
        email: 'kasun.jayawardena@guidelanka.com',
        phone_number: '+94712345672',
        created_at: '2026-05-02T10:15:00.000Z',
        vehicle_id: 'SP-QD-9154 • Toyota Land Cruiser 70 (8 Seats)',
        vehicle_model: 'Toyota Land Cruiser 70 (8 Seats)',
        license_no: 'B-9154218',
        price_per_safari: 20000,
        is_active: true,
        experience_years: 9,
        experience: 'Specialist in Block 1 and Block 5 tracks. Expert tracker for sloth bears and big cats with customized high-rise safari seating.',
        reviews: [
            {
                rating: 5,
                comment: 'Incredible day with Kasun! We saw a mother sloth bear with her cub near Heenwewa. Truly unforgettable.',
                tourist_name: 'Sophie Martin',
                tourist_email: 'sophie.m@example.fr',
                created_at: '2026-05-28T09:30:00.000Z'
            },
            {
                rating: 4,
                comment: 'Great custom Land Cruiser with excellent visibility for DSLR telephoto lenses. Very safe driver.',
                tourist_name: 'Daniel Tanaka',
                tourist_email: 'daniel.t@example.jp',
                created_at: '2026-07-15T15:00:00.000Z'
            }
        ]
    },
    {
        full_name: 'Nuwan Wickramasinghe',
        email: 'nuwan.wickramasinghe@guidelanka.com',
        phone_number: '+94769876543',
        created_at: '2026-06-20T11:45:00.000Z',
        vehicle_id: 'SP-NE-3120 • Mitsubishi L200 Safari Spec (6 Seats)',
        vehicle_model: 'Mitsubishi L200 Safari Spec (6 Seats)',
        license_no: 'B-3120674',
        price_per_safari: 15000,
        is_active: true,
        experience_years: 7,
        experience: 'Certified eco-safari guide with extensive knowledge of endemic birds, wetland biodiversity, and quiet border tracks.',
        reviews: [
            {
                rating: 5,
                comment: 'Nuwan showed us hornbills, crested hawk-eagles, and even an elusive fishing cat at twilight. Top notch eco-guide!',
                tourist_name: 'Emma Watson',
                tourist_email: 'emma.nature@example.co.uk',
                created_at: '2026-07-22T13:10:00.000Z'
            },
            {
                rating: 5,
                comment: 'Patient, courteous, and polite. Explain things with passion and care for the ecosystem.',
                tourist_name: 'Hans Zimmer',
                tourist_email: 'hzimmer@example.de',
                created_at: '2026-09-02T10:40:00.000Z'
            }
        ]
    },
    {
        full_name: 'Dinesh Kumara',
        email: 'dinesh.kumara@guidelanka.com',
        phone_number: '+94785432104',
        created_at: '2026-07-30T07:20:00.000Z',
        vehicle_id: 'SP-QA-7742 • Toyota Hilux Revo Custom (6 Seats)',
        vehicle_model: 'Toyota Hilux Revo Custom (6 Seats)',
        license_no: 'B-7742193',
        price_per_safari: 16000,
        is_active: true,
        experience_years: 5,
        experience: 'Passionate wildlife photographer and navigator. Equipped with open-top photography stands and high-ground clearance.',
        reviews: [
            {
                rating: 5,
                comment: 'Dinesh knows exact spots where leopards bask during early morning sun. Got award-worthy shots!',
                tourist_name: 'Alexandre Roy',
                tourist_email: 'alex.roy@example.ca',
                created_at: '2026-08-14T17:15:00.000Z'
            },
            {
                rating: 4,
                comment: 'Very polite guide, great vehicle with phone chargers and cooler box for water. Highly recommended.',
                tourist_name: 'Jessica Miller',
                tourist_email: 'jmiller@example.com',
                created_at: '2026-09-25T12:00:00.000Z'
            }
        ]
    },
    {
        full_name: 'Chaminda Perera',
        email: 'chaminda.perera@guidelanka.com',
        phone_number: '+94701122335',
        created_at: '2026-08-25T15:10:00.000Z',
        vehicle_id: 'SP-ND-5683 • Land Rover Defender 110 (7 Seats)',
        vehicle_model: 'Land Rover Defender 110 (7 Seats)',
        license_no: 'B-5683349',
        price_per_safari: 22000,
        is_active: true,
        experience_years: 14,
        experience: 'Senior safari driver operating since 2012. Renowned for patience, extensive knowledge of park history, and strict wildlife ethics.',
        reviews: [
            {
                rating: 5,
                comment: 'Chaminda is a true legend of Yala. His understanding of animal signs and sounds is unmatched.',
                tourist_name: 'Arthur Pendelton',
                tourist_email: 'arthur.p@example.com',
                created_at: '2026-09-10T14:30:00.000Z'
            },
            {
                rating: 5,
                comment: 'The classic Defender gave us an authentic safari feeling, and Chaminda delivered on all fronts. Saw three leopards!',
                tourist_name: 'Elena Rostova',
                tourist_email: 'elena.r@example.org',
                created_at: '2026-10-12T16:00:00.000Z'
            }
        ]
    },
    {
        full_name: 'Asanka Fernando',
        email: 'asanka.fernando@guidelanka.com',
        phone_number: '+94723456786',
        created_at: '2026-09-18T09:05:00.000Z',
        vehicle_id: 'SP-QC-1129 • Toyota Land Cruiser Prado (5 Seats)',
        vehicle_model: 'Toyota Land Cruiser Prado (5 Seats)',
        license_no: 'B-1129882',
        price_per_safari: 17500,
        is_active: true,
        experience_years: 6,
        experience: 'Great with families and first-time safari visitors. Speaks fluent English, patient, cheerful, and safety-focused.',
        reviews: [
            {
                rating: 5,
                comment: 'Asanka made our family safari with two young kids effortless and educational. Kids loved spotting wild elephants!',
                tourist_name: 'David and Sarah Chen',
                tourist_email: 'chen.family@example.com.au',
                created_at: '2026-09-29T11:20:00.000Z'
            },
            {
                rating: 5,
                comment: 'Super calm driver, smooth driving even over rocky tracks. Very informative and polite.',
                tourist_name: 'Chloe Dubois',
                tourist_email: 'chloe.dubois@example.fr',
                created_at: '2026-10-15T18:10:00.000Z'
            }
        ]
    },
    {
        full_name: 'Roshan Senanayake',
        email: 'roshan.senanayake@guidelanka.com',
        phone_number: '+94754321097',
        created_at: '2026-10-05T12:25:00.000Z',
        vehicle_id: 'SP-NE-8402 • Isuzu D-Max V-Cross 4x4 (6 Seats)',
        vehicle_model: 'Isuzu D-Max V-Cross 4x4 (6 Seats)',
        license_no: 'B-8402456',
        price_per_safari: 14000,
        is_active: true,
        experience_years: 4,
        experience: 'Specialized in dawn and dusk game drives. Highly knowledgeable about elephant herd movements near water holes.',
        reviews: [
            {
                rating: 5,
                comment: 'Early morning game drive was sensational! Large elephant herd bathing in the morning mist.',
                tourist_name: 'Peter Van Der Beek',
                tourist_email: 'peter.vdb@example.nl',
                created_at: '2026-10-19T09:15:00.000Z'
            }
        ]
    },
    {
        full_name: 'Dilshan Madushanka',
        email: 'dilshan.madushanka@guidelanka.com',
        phone_number: '+94741239878',
        created_at: '2026-10-24T14:50:00.000Z',
        vehicle_id: 'SP-NC-6391 • Toyota Hilux Invincible (6 Seats)',
        vehicle_model: 'Toyota Hilux Invincible (6 Seats)',
        license_no: 'B-6391027',
        price_per_safari: 13000,
        is_active: false,
        experience_years: 3,
        experience: 'Newly registered safari navigator trained under Sri Lanka Wildlife Conservation guidelines. Friendly and safety-first.',
        reviews: [
            {
                rating: 4,
                comment: 'Very enthusiastic young guide. Vehicle is brand new and spotless. Looking forward to our next safari with him.',
                tourist_name: 'Kavinda Perera',
                tourist_email: 'kavinda.p@example.lk',
                created_at: '2026-10-26T16:30:00.000Z'
            }
        ]
    }
];

async function seedDrivers() {
    console.log('🚀 Seeding sample drivers with diverse registration dates...');
    
    // Default password for all sample drivers: 'Driver@1234'
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Driver@1234', salt);

    let successCount = 0;

    for (const d of sampleDrivers) {
        try {
            console.log(`\nProcessing driver: ${d.full_name} (${d.email})`);

            // Check if user already exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', d.email)
                .maybeSingle();

            let userId;

            if (existingUser) {
                console.log(`Driver already exists with ID: ${existingUser.id}. Updating...`);
                userId = existingUser.id;

                const { error: updateErr } = await supabase
                    .from('users')
                    .update({
                        full_name: d.full_name,
                        phone_number: d.phone_number,
                        created_at: d.created_at
                    })
                    .eq('id', userId);

                if (updateErr) console.error(`Error updating user ${d.email}:`, updateErr.message);
            } else {
                const { data: newUser, error: insertErr } = await supabase
                    .from('users')
                    .insert([{
                        full_name: d.full_name,
                        email: d.email,
                        password: hashedPassword,
                        role: 'DRIVER',
                        phone_number: d.phone_number,
                        created_at: d.created_at
                    }])
                    .select();

                if (insertErr) {
                    console.error(`Error creating user ${d.email}:`, insertErr.message);
                    continue;
                }
                userId = newUser[0].id;
                console.log(`Created user with ID: ${userId} and registered date: ${d.created_at}`);
            }

            // Upsert driver profile
            const profileData = {
                id: userId,
                vehicle_id: d.vehicle_id,
                vehicle_model: d.vehicle_model,
                license_no: d.license_no,
                price_per_safari: d.price_per_safari,
                is_active: d.is_active,
                experience_years: d.experience_years,
                experience: d.experience
            };

            const { error: profileErr } = await supabase
                .from('driver_profiles')
                .upsert(profileData);

            if (profileErr) {
                console.error(`Error upserting profile for ${d.full_name}:`, profileErr.message);
            } else {
                console.log(`Upserted driver_profile for ${d.full_name}`);
            }

            // Insert reviews
            if (d.reviews && d.reviews.length > 0) {
                // Delete any old reviews for this driver to avoid duplicate seeding
                await supabase.from('driver_reviews').delete().eq('driver_id', userId);

                const reviewsToInsert = d.reviews.map(r => ({
                    driver_id: userId,
                    rating: r.rating,
                    comment: r.comment,
                    tourist_name: r.tourist_name,
                    tourist_email: r.tourist_email,
                    created_at: r.created_at
                }));

                const { error: revErr } = await supabase
                    .from('driver_reviews')
                    .insert(reviewsToInsert);

                if (revErr) {
                    console.error(`Error inserting reviews for ${d.full_name}:`, revErr.message);
                } else {
                    console.log(`Added ${d.reviews.length} reviews for ${d.full_name}`);
                }
            }

            successCount++;
        } catch (err) {
            console.error(`Failed processing ${d.full_name}:`, err.message);
        }
    }

    console.log(`\n🎉 Successfully seeded ${successCount} out of ${sampleDrivers.length} sample drivers!`);
    console.log('Login credentials for all sample drivers:');
    console.log('Password: Driver@1234');
}

seedDrivers();

