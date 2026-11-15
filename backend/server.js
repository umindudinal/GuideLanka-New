const express = require('express');
const cors = require('cors');
const path = require('path');

// Ensure .env is loaded regardless of current working directory
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

const app = express();

app.use(cors());

const bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const sightingRoutes = require('./src/routes/sightingRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const routeRoutes = require('./src/routes/routeRoutes');
const driverRoutes = require('./src/routes/driverRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const alertRoutes = require('./src/routes/alertRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sightings', sightingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', require('./src/routes/bookingNotificationRoutes'));
app.use('/api/routes', routeRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('GuideLanka API with MVC Architecture is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});

module.exports = app;
