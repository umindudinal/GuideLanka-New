const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {

    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Access Denied. No valid token provided." });
    }

    const token = authHeader.split(' ')[1];

    try {

        const verified = jwt.verify(token, process.env.JWT_SECRET);

        req.user = verified;

        next();
    }
    catch (err) {

        res.status(403).json({ error: "Invalid or expired token." });
    }
};

module.exports = authMiddleware;
