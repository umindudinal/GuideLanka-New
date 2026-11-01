const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const sampleTourists = [
    {
        full_name: 'Liam O’Connor',
        email: 'liam.oconnor@example.com',
        phone_number: '+447911123456',
        created_at: '2026-03-22T09:30:00.000Z',
        visitor_type: 'foreign',
        booking: {
            date_offset_days: -120, // 4 months ago
            time_slot: 'Morning (6:00 AM - 10:00 AM)|foreign',
            tourist_count: 2,
            status: 'COMPLETED'
        }
    },
    {
        full_name: 'Sophie Martin',
        email: 'sophie.martin@example.fr',
        phone_number: '+33612345678',
        created_at: '2026-04-14T14:15:00.000Z',
        visitor_type: 'foreign',
        booking: {
            date_offset_days: -90, // 3 months ago
            time_slot: 'Evening (2:30 PM - 6:30 PM)|foreign',
            tourist_count: 2,
            status: 'COMPLETED'
        }
    },
    {
        full_name: 'Markus Weber',
        email: 'markus.weber@example.de',
        phone_number: '+4915123456789',
        created_at: '2026-05-18T10:45:00.000Z',
        visitor_type: 'foreign',
        booking: {
            date_offset_days: -60, // 2 months ago
            time_slot: 'Full Day Safari (6:00 AM - 6:00 PM)|foreign',
            tourist_count: 3,
            status: 'COMPLETED'
        }
    },
    {
        full_name: 'Kavinda Perera',
        email: 'kavinda.perera@example.lk',
        phone_number: '+94718899112',
        created_at: '2026-06-05T16:20:00.000Z',
        visitor_type: 'local',
        booking: {
            date_offset_days: -45, // 1.5 months ago
            time_slot: 'Morning (6:00 AM - 10:00 AM)|local',
            tourist_count: 4,
            status: 'COMPLETED'
        }
    },
    {
        full_name: 'Emma Watson',
        email: 'emma.watson@example.co.uk',
        phone_number: '+447822987654',
        created_at: '2026-07-12T11:00:00.000Z',
        visitor_type: 'foreign',
        booking: {
            date_offset_days: -30, // 1 month ago
            time_slot: 'Morning (6:00 AM - 10:00 AM)|foreign',
            tourist_count: 2,
            status: 'COMPLETED'
        }
    },
    {
        full_name: 'Daniel Tanaka',
        email: 'daniel.tanaka@example.jp',
        phone_number: '+819012345678',
        created_at: '2026-08-08T08:35:00.000Z',
        visitor_type: 'foreign',
        booking: {
            date_offset_days: -15, // 2 weeks ago
            time_slot: 'Evening (2:30 PM - 6:30 PM)|foreign',
            tourist_count: 1,
            status: 'COMPLETED'
        }
    },
    {
        full_name: 'Thilini Jayasinghe',
        email: 'thilini.jayasinghe@example.lk',
        phone_number: '+94773344556',
        created_at: '2026-08-28T15:50:00.000Z',
        visitor_type: 'local',
        booking: {
            date_offset_days: -5, // 5 days ago
            time_slot: 'Morning (6:00 AM - 10:00 AM)|local',
            tourist_count: 5,
            status: 'COMPLETED'
        }
    },
    {
        full_name: 'Alexandre Roy',
        email: 'alexandre.roy@example.ca',
        phone_number: '+15145550199',
        created_at: '2026-09-19T13:10:00.000Z',
        visitor_type: 'foreign',
        booking: {
            date_offset_days: 0, // Today!
            time_slot: 'Morning (6:00 AM - 10:00 AM)|foreign',
            tourist_count: 2,
            status: 'CONFIRMED'
        }
    },
    {
        full_name: 'Sarah Chen',
        email: 'sarah.chen@example.com.au',
        phone_number: '+61412345678',
        created_at: '2026-10-08T17:25:00.000Z',
        visitor_type: 'foreign',
        booking: {
            date_offset_days: 2, // In 2 days
            time_slot: 'Morning (6:00 AM - 10:00 AM)|foreign',
            tourist_count: 3,
            status: 'CONFIRMED'
        }
    },
    {
        full_name: 'Malith Bandara',
        email: 'malith.bandara@example.lk',
        phone_number: '+94762233445',
        created_at: '2026-10-25T11:40:00.000Z',
        visitor_type: 'local',
        booking: {
            date_offset_days: 4, // In 4 days
            time_slot: 'Evening (2:30 PM - 6:30 PM)|local',
            tourist_count: 4,
            status: 'PENDING'
        }
    }
];

function getDateWithOffset(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function seedTourists() {
    console.log('🚀 Seeding sample tourists with diverse registration dates...');

    // Fetch existing drivers to link bookings
    const { data: drivers, error: dErr } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'DRIVER');

    if (dErr) {
        console.error("Error fetching drivers for bookings:", dErr.message);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Tourist@1234', salt);

    let successCount = 0;
    let bookingCount = 0;

    for (let i = 0; i < sampleTourists.length; i++) {
        const t = sampleTourists[i];
        try {
            console.log(`\nProcessing tourist: ${t.full_name} (${t.email})`);

            // Check if user already exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', t.email)
                .maybeSingle();

            let userId;

            if (existingUser) {
                console.log(`Tourist already exists with ID: ${existingUser.id}. Updating...`);
                userId = existingUser.id;

                const { error: updateErr } = await supabase
                    .from('users')
                    .update({
                        full_name: t.full_name,
                        phone_number: t.phone_number,
                        created_at: t.created_at
                    })
                    .eq('id', userId);

                if (updateErr) console.error(`Error updating user ${t.email}:`, updateErr.message);
            } else {
                const { data: newUser, error: insertErr } = await supabase
                    .from('users')
                    .insert([{
                        full_name: t.full_name,
                        email: t.email,
                        password: hashedPassword,
                        role: 'TOURIST',
                        phone_number: t.phone_number,
                        created_at: t.created_at
                    }])
                    .select();

                if (insertErr) {
                    console.error(`Error creating tourist ${t.email}:`, insertErr.message);
                    continue;
                }
                userId = newUser[0].id;
                console.log(`Created tourist with ID: ${userId} and registered date: ${t.created_at}`);
            }

            // Create or update sample booking for this tourist
            if (t.booking && drivers && drivers.length > 0) {
                const assignedDriver = drivers[i % drivers.length];
                const bookingDate = getDateWithOffset(t.booking.date_offset_days);

                // Clean old bookings for this tourist to avoid duplicates
                await supabase.from('bookings').delete().eq('tourist_id', userId);

                const { data: newBooking, error: bErr } = await supabase
                    .from('bookings')
                    .insert([{
                        tourist_id: userId,
                        driver_id: assignedDriver.id,
                        booking_date: bookingDate,
                        time_slot: t.booking.time_slot,
                        tourist_count: t.booking.tourist_count,
                        status: t.booking.status
                    }])
                    .select();

                if (bErr) {
                    console.error(`Error creating booking for ${t.full_name}:`, bErr.message);
                } else {
                    console.log(`Created ${t.booking.status} booking for ${bookingDate} with driver: ${assignedDriver.full_name}`);
                    bookingCount++;
                }
            }

            successCount++;
        } catch (err) {
            console.error(`Failed processing tourist ${t.full_name}:`, err.message);
        }
    }

    console.log(`\n🎉 Successfully seeded ${successCount} out of ${sampleTourists.length} sample tourists!`);
    console.log(`📅 Created ${bookingCount} realistic safari bookings linked to drivers.`);
    console.log('Login credentials for all sample tourists:');
    console.log('Password: Tourist@1234');
}

seedTourists();

