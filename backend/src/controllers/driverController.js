const supabase = require('../config/supabaseClient');
const fs = require('fs');
const path = require('path');

exports.getDriverProfile = async (req, res) => {
    try {

        const driverId = req.user.id;

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('full_name, phone_number, profile_image')
            .eq('id', driverId)
            .single();

        if (userError || !user) {
            console.error("❌ User Fetch Error:", userError?.message);
            return res.status(404).json({ message: "Driver not found in users table" });
        }

        const { data: profile, error: profileError } = await supabase
            .from('driver_profiles')
            .select('vehicle_id, license_no, price_per_safari, is_active, experience_years, experience')
            .eq('id', driverId)
            .single();

        if (profileError) {
            console.warn("⚠️ Profile Fetch Warning:", profileError.message);
        }

        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('id')
            .eq('driver_id', driverId)
            .in('status', ['CONFIRMED', 'COMPLETED']);

        if (bookingsError) {
            console.warn("⚠️ Bookings Fetch Warning:", bookingsError.message);
        }

        const { data: reviews, error: reviewsError } = await supabase
            .from('driver_reviews')
            .select('rating')
            .eq('driver_id', driverId);

        if (reviewsError) {
            console.warn("⚠️ Reviews Fetch Warning:", reviewsError.message);
        }

        const confirmedCount = bookings ? bookings.length : 0;
        const pricePerSafari = profile?.price_per_safari || 12500;
        const totalRevenue = confirmedCount * pricePerSafari;

        let averageRating = null;
        if (reviews && reviews.length > 0) {
            const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
            averageRating = Number((totalRating / reviews.length).toFixed(1));
        }

        let avatarUrl = null;
        if (user.profile_image) {
            const avatarPath = path.join(__dirname, '../../uploads/avatars', `${driverId}.jpg`);
            if (!fs.existsSync(avatarPath)) {
                try {
                    const base64Data = user.profile_image.replace(/^data:image\/\w+;base64,/, "");
                    const buffer = Buffer.from(base64Data, 'base64');
                    const uploadDir = path.dirname(avatarPath);
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }
                    fs.writeFileSync(avatarPath, buffer);
                } catch (err) {
                    console.error("Error reconstructing avatar file:", err);
                }
            }
            const host = req.get('host');
            const protocol = req.protocol;
            avatarUrl = `${protocol}://${host}/uploads/avatars/${driverId}.jpg`;
        } else {
            const avatarPath = path.join(__dirname, '../../uploads/avatars', `${driverId}.jpg`);
            const hasAvatar = fs.existsSync(avatarPath);
            if (hasAvatar) {
                const host = req.get('host');
                const protocol = req.protocol;
                avatarUrl = `${protocol}://${host}/uploads/avatars/${driverId}.jpg`;
            }
        }

        const responseData = {
            name: user.full_name,
            mobile: user.phone_number || "Not Updated",
            licenseNo: profile?.license_no || "Not Updated",
            vehicleNo: profile ? profile.vehicle_id : "Not Updated",
            pricePerSafari: pricePerSafari,
            experienceYears: profile?.experience_years !== undefined && profile?.experience_years !== null ? profile.experience_years : 5,
            totalSafaris: confirmedCount,
            revenue: totalRevenue,
            rating: averageRating,
            isActive: profile ? (profile.is_active !== false) : true,
            avatarUrl: avatarUrl,
            experience: profile?.experience || ""
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Profile Fetch Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.updateDriverProfile = async (req, res) => {
    try {
        const driverId = req.user.id;
        const { name, mobile, licenseNo, vehicleNo, pricePerSafari, experienceYears, experience } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: "Name is required" });
        }

        function formatPhoneWithPlus(phone) {
            if (!phone) return '';
            let cleaned = phone.replace(/\D/g, '');
            if (cleaned.startsWith('0')) {
                cleaned = '94' + cleaned.substring(1);
            } else if (!cleaned.startsWith('94')) {
                cleaned = '94' + cleaned;
            }
            return '+' + cleaned;
        }

        const formattedMobile = mobile ? formatPhoneWithPlus(mobile) : mobile;

        const { error: userError } = await supabase
            .from('users')
            .update({
                full_name: name,
                phone_number: formattedMobile
            })
            .eq('id', driverId);

        if (userError) {
            console.error("❌ User Update Error:", userError.message);
            return res.status(400).json({ success: false, error: userError.message });
        }

        const { data: testData } = await supabase
            .from('driver_profiles')
            .select('*')
            .limit(1);

        let hasExperienceColumn = false;
        if (testData && testData.length > 0) {
            hasExperienceColumn = ('experience' in testData[0]);
        } else {
            const { error: colError } = await supabase
                .from('driver_profiles')
                .select('experience')
                .limit(1);
            hasExperienceColumn = !colError;
        }

        const profileUpdate = {
            id: driverId,
            vehicle_id: vehicleNo,
            license_no: licenseNo,
            price_per_safari: pricePerSafari ? Number(pricePerSafari) : undefined,
            experience_years: experienceYears ? Number(experienceYears) : undefined
        };

        if (hasExperienceColumn && experience !== undefined) {
            profileUpdate.experience = experience;
        }

        const { error: profileError } = await supabase
            .from('driver_profiles')
            .upsert(profileUpdate);

        if (profileError) {
            console.error("❌ Profile Update Error:", profileError.message);
            return res.status(400).json({ success: false, error: profileError.message });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully!"
        });

    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

exports.uploadProfilePicture = async (req, res) => {
    try {
        const driverId = req.user.id;
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ success: false, error: "Image data is required" });
        }

        let dbImage = image;
        if (!dbImage.startsWith('data:image/')) {
            dbImage = `data:image/jpeg;base64,${dbImage}`;
        }

        const { error: dbError } = await supabase
            .from('users')
            .update({ profile_image: `/uploads/avatars/${driverId}.jpg` })
            .eq('id', driverId);

        if (dbError) {
            console.error("❌ Database Avatar Update Error:", dbError.message);
        }

        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        const uploadDir = path.join(__dirname, '../../uploads/avatars');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, `${driverId}.jpg`);
        fs.writeFileSync(filePath, buffer);

        const host = req.get('host');
        const protocol = req.protocol;
        const fullUrl = `${protocol}://${host}/uploads/avatars/${driverId}.jpg`;

        res.status(200).json({
            success: true,
            message: "Profile picture uploaded successfully!",
            url: image,
            fileUrl: fullUrl
        });
    } catch (error) {
        console.error("Profile Picture Upload Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

exports.updateDriverStatus = async (req, res) => {
    try {
        const driverId = req.user.id;
        const { isActive } = req.body;

        if (isActive === undefined) {
            return res.status(400).json({ success: false, error: "isActive is required" });
        }

        const { error } = await supabase
            .from('driver_profiles')
            .update({
                is_active: isActive
            })
            .eq('id', driverId);

        if (error) {
            console.error("❌ Status Update Error:", error.message);
            return res.status(400).json({ success: false, error: error.message });
        }

        res.status(200).json({
            success: true,
            message: `Driver status updated to ${isActive ? 'Online' : 'Offline'}`
        });
    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

exports.getDriverReviews = async (req, res) => {
    try {
        const { driverId } = req.params;

        const { data: reviews, error } = await supabase
            .from('driver_reviews')
            .select('*')
            .eq('driver_id', driverId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({ success: true, reviews: reviews || [] });
    } catch (error) {
        console.error("Error fetching driver reviews from Supabase:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

exports.addDriverReview = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { rating, comment, tourist_name, tourist_email } = req.body;

        if (!rating || !comment) {
            return res.status(400).json({ success: false, error: "Rating and comment are required." });
        }

        const { data: newReview, error } = await supabase
            .from('driver_reviews')
            .insert([{
                driver_id: driverId,
                rating: Number(rating),
                comment: comment,
                tourist_name: tourist_name || 'Anonymous Explorer',
                tourist_email: tourist_email || 'anonymous@guidelanka.com'
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, review: newReview });
    } catch (error) {
        console.error("Error adding driver review to Supabase:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};


exports.updateDriverByAdmin = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { full_name, phone_number, vehicle_id, vehicle_model, price_per_safari, experience_years, is_active, profile_image } = req.body;

        if (!driverId) {
            return res.status(400).json({ success: false, error: "Driver ID is required" });
        }

        const userUpdates = {};
        if (full_name !== undefined) userUpdates.full_name = full_name;
        if (phone_number !== undefined) {
            let cleaned = phone_number.replace(/\D/g, '');
            if (cleaned.startsWith('0')) cleaned = '94' + cleaned.substring(1);
            else if (!cleaned.startsWith('94')) cleaned = '94' + cleaned;
            userUpdates.phone_number = '+' + cleaned;
        }

        if (profile_image !== undefined) {
            if (profile_image) {
                let dbImage = profile_image;
                if (!dbImage.startsWith('data:image/')) {
                    dbImage = `data:image/jpeg;base64,${dbImage}`;
                }
                userUpdates.profile_image = `/uploads/avatars/${driverId}.jpg`;

                try {
                    const base64Data = profile_image.replace(/^data:image\/\w+;base64,/, "");
                    const buffer = Buffer.from(base64Data, 'base64');
                    const uploadDir = path.join(__dirname, '../../uploads/avatars');
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }
                    const filePath = path.join(uploadDir, `${driverId}.jpg`);
                    fs.writeFileSync(filePath, buffer);
                } catch (fsErr) {
                    console.error("Error writing driver avatar on admin update:", fsErr);
                }
            } else {
                userUpdates.profile_image = null;
                try {
                    const filePath = path.join(__dirname, '../../uploads/avatars', `${driverId}.jpg`);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (fsErr) {
                    console.error("Error deleting driver avatar file:", fsErr);
                }
            }
        }

        if (Object.keys(userUpdates).length > 0) {
            const { error: userError } = await supabase
                .from('users')
                .update(userUpdates)
                .eq('id', driverId);
            if (userError) throw userError;
        }

        const profileUpdates = { id: driverId };
        if (vehicle_id !== undefined) profileUpdates.vehicle_id = vehicle_id;
        if (vehicle_model !== undefined) profileUpdates.vehicle_model = vehicle_model;
        if (price_per_safari !== undefined) profileUpdates.price_per_safari = Number(price_per_safari);
        if (experience_years !== undefined) profileUpdates.experience_years = Number(experience_years);
        if (is_active !== undefined) profileUpdates.is_active = Boolean(is_active);

        const { error: profileError } = await supabase
            .from('driver_profiles')
            .upsert(profileUpdates);

        if (profileError) {
            console.error("❌ Admin Profile Update Error:", profileError.message);
            return res.status(400).json({ success: false, error: profileError.message });
        }

        res.status(200).json({
            success: true,
            message: "Driver details updated successfully!"
        });
    } catch (error) {
        console.error("Admin Update Driver Error:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to update driver" });
    }
};

exports.deleteDriver = async (req, res) => {
    try {
        const { driverId } = req.params;

        if (!driverId) {
            return res.status(400).json({ success: false, error: "Driver ID is required" });
        }

        const { error: reviewsError } = await supabase
            .from('driver_reviews')
            .delete()
            .eq('driver_id', driverId);

        if (reviewsError) {
            console.warn("⚠️ Reviews Delete Warning:", reviewsError.message);
        }

        const { error: bookingsError } = await supabase
            .from('bookings')
            .update({ driver_id: null })
            .eq('driver_id', driverId);

        if (bookingsError) {
            console.warn("⚠️ Bookings Update Warning:", bookingsError.message);
        }

        const { error: profileError } = await supabase
            .from('driver_profiles')
            .delete()
            .eq('id', driverId);

        if (profileError) {
            console.error("❌ Profile Delete Error:", profileError.message);
        }

        const { error: userError } = await supabase
            .from('users')
            .delete()
            .eq('id', driverId);

        if (userError) {
            console.error("❌ User Delete Error:", userError.message);
            return res.status(400).json({ success: false, error: userError.message });
        }

        res.status(200).json({
            success: true,
            message: "Driver deleted successfully!"
        });

    } catch (error) {
        console.error("Delete Driver Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};
