const supabase = require('../config/supabaseClient');

const normalizeSlot = (slotStr) => {
    if (!slotStr) return 'full';
    const prefix = slotStr.split('|')[0].toLowerCase().trim();
    if (prefix.includes('morning')) return 'morning';
    if (prefix.includes('evening')) return 'evening';
    if (prefix.includes('full')) return 'full';
    return prefix;
};

const isSlotConflicting = (existingSlotStr, requestedSlotStr) => {
    const existing = normalizeSlot(existingSlotStr);
    const requested = normalizeSlot(requestedSlotStr);
    if (existing === 'full' || requested === 'full') return true;
    return existing === requested;
};

const createBooking = async (req, res) => {
    const { driver_id, booking_date, time_slot, tourist_count } = req.body;
    const tourist_id = req.user.id;

    try {
        if (!booking_date) {
            return res.status(400).json({
                success: false,
                error: "Booking date is required."
            });
        }

        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        if (booking_date < todayStr) {
            return res.status(400).json({
                success: false,
                error: "Safari reservations cannot be made for past dates. Please choose today or a future date."
            });
        }

        const slotToBook = time_slot || 'morning';

        // Check if driver has a confirmed reservation on the same date and conflicting slot
        if (driver_id) {
            const { data: driverBookings, error: driverError } = await supabase
                .from('bookings')
                .select('id, time_slot, status')
                .eq('driver_id', driver_id)
                .eq('booking_date', booking_date)
                .in('status', ['CONFIRMED', 'APPROVED']);

            if (driverError) throw driverError;

            const driverConflict = driverBookings?.find(b => isSlotConflicting(b.time_slot, slotToBook));
            if (driverConflict) {
                return res.status(400).json({
                    success: false,
                    error: `The selected guide is already booked for this time slot on ${booking_date}. Please choose another time slot or date.`
                });
            }
        }

        // Check if tourist already has a reservation on the same date and conflicting slot
        const { data: touristBookings, error: touristError } = await supabase
            .from('bookings')
            .select('id, time_slot, status')
            .eq('tourist_id', tourist_id)
            .eq('booking_date', booking_date)
            .in('status', ['PENDING', 'CONFIRMED', 'APPROVED']);

        if (touristError) throw touristError;

        const touristConflict = touristBookings?.find(b => isSlotConflicting(b.time_slot, slotToBook));
        if (touristConflict) {
            return res.status(400).json({
                success: false,
                error: `You already have an active safari reservation for this time slot on ${booking_date}.`
            });
        }

        const { data, error } = await supabase
            .from('bookings')
            .insert([
                { 
                    tourist_id, 
                    driver_id, 
                    booking_date, 
                    time_slot: slotToBook,
                    tourist_count: Number(tourist_count) || 1, 
                    status: 'PENDING' 
                }
            ])
            .select();

        if (error) throw error;

        res.status(201).json({
            message: "Booking created successfully!",
            booking: data[0]
        });

    } catch (err) {
        console.error("💥 Error creating booking:", err);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

const updateBookingStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const driver_id = req.user.id;

    if (!['CONFIRMED', 'REJECTED', 'COMPLETED'].includes(status.toUpperCase())) {
        return res.status(400).json({ error: "Invalid status. Please use 'CONFIRMED', 'REJECTED', or 'COMPLETED'." });
    }

    try {
        const { data, error } = await supabase
            .from('bookings')
            .update({ status: status.toUpperCase() })
            .match({ id: id, driver_id: driver_id })
            .select();

        if (error) throw error;

        if (data.length === 0) {
            return res.status(404).json({ error: "Booking not found or not assigned to you." });
        }

        res.status(200).json({
            message: `Booking ${status.toLowerCase()} successfully!`,
            booking: data[0]
        });

    } catch (err) {
        console.error("💥 Error updating booking:", err);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

const getBookings = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    try {
        let query = supabase.from('bookings').select(`
            *,
            tourist:users!tourist_id(full_name)
        `);

        if (role === 'TOURIST') {
            query = query.eq('tourist_id', userId);
        } else if (role === 'DRIVER') {
            query = query.eq('driver_id', userId);
        }

        const { data: bookings, error: bookingsError } = await query;

        if (bookingsError) throw bookingsError;

        const bookingsWithLastMessage = await Promise.all(
            bookings.map(async (booking) => {

                const { data: messages } = await supabase
                    .from('messages')
                    .select('created_at')
                    .eq('booking_id', booking.id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                const { count: unreadCount, error: countError } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('booking_id', booking.id)
                    .neq('sender_id', userId)
                    .eq('is_read', false);

                const lastMessageTime = (messages && messages.length > 0)
                    ? messages[0].created_at
                    : (booking.created_at || booking.booking_date);

                return {
                    ...booking,
                    tourist_name: booking.tourist ? booking.tourist.full_name : 'Tourist Booking',
                    last_message_time: lastMessageTime,
                    unread_count: unreadCount || 0
                };
            })
        );

        bookingsWithLastMessage.sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));

        res.status(200).json({
            message: "Bookings retrieved successfully!",
            count: bookingsWithLastMessage.length,
            bookings: bookingsWithLastMessage
        });

    } catch (err) {
        console.error("💥 Error fetching bookings:", err);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

const cancelBooking = async (req, res) => {
    const { id } = req.params;
    const tourist_id = req.user.id;

    try {
        const { data, error } = await supabase
            .from('bookings')
            .update({ status: 'CANCELLED' })
            .match({ id: id, tourist_id: tourist_id })
            .select();

        if (error) throw error;

        if (data.length === 0) {
            return res.status(404).json({ error: "Booking not found or not created by you." });
        }

        res.status(200).json({
            message: "Booking cancelled successfully!",
            booking: data[0]
        });

    } catch (err) {
        console.error("💥 Error cancelling booking:", err);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

module.exports = { createBooking, updateBookingStatus, getBookings, cancelBooking };