const W1 = 0.5;
const W2 = 0.3;
const W3 = 0.2;

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const generateOptimalRoute = (currentLat, currentLng, availableRoutes) => {
    return availableRoutes.map(route => {
        const actualDistance = calculateDistance(currentLat, currentLng, route.location_lat, route.location_lng);

        const recency = route.sightingRecency || 50;
        const congestion = route.congestionDensity || 10;

        const score = (recency * 0.5) - (congestion * 0.3) - (actualDistance * 0.2);

        return {
            ...route,
            travelDistance_km: parseFloat(actualDistance.toFixed(2)),
            s2rScore: parseFloat(score.toFixed(2))
        };
    }).sort((a, b) => b.s2rScore - a.s2rScore);
};

module.exports = { generateOptimalRoute };
