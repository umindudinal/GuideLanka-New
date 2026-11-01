const supabase = require('../config/supabaseClient');

const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: user, error } = await supabase
            .from('users')
            .select('id, full_name, email, role, phone_number, profile_image, created_at')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({
            message: "Welcome to your protected profile!",
            user_details: user
        });
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const uploadUserProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ success: false, error: "Image data is required" });
        }

        const { data, error } = await supabase
            .from('users')
            .update({ profile_image: image })
            .eq('id', userId)
            .select();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully!",
            profile_image: image
        });
    } catch (error) {
        console.error("Profile Picture Upload Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error", details: error.message });
    }
};

module.exports = { getMyProfile, uploadUserProfilePicture };
