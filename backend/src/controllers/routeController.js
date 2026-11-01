const { optimizeRoutes } = require('../services/s2rAlgorithm');

const calculateBestRoute = async (req, res) => {
    try {
        const { currentLat, currentLng, availableRoutes } = req.body;

        if (!currentLat || !currentLng || !availableRoutes || availableRoutes.length === 0) {
            return res.status(400).json({ error: "Please provide current location and available routes." });
        }

        const analyzedRoutes = optimizeRoutes(currentLat, currentLng, availableRoutes);
        const bestRoute = analyzedRoutes[0];

        res.status(200).json({
            message: "Route optimization successful!",
            bestRoute: bestRoute,
            allRoutes: analyzedRoutes
        });

    } catch (err) {
        console.error("💥 Error optimizing route:", err);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

module.exports = { calculateBestRoute };
