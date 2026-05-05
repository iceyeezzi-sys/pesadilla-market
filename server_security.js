/**
 * Security Configuration for Node.js/Express Backend
 * This template includes CORS and Security Headers (Helmet).
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// 1. Security Headers (using Helmet)
// This sets X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, etc.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://fonts.googleapis.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            upgradeInsecureRequests: [],
        },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// 2. Configure CORS
// Only allow requests from your specific application domain
const allowedOrigins = [
    'https://your-pesadilla-store.com', // Replace with your production domain
    'http://localhost:3000',           // Local development
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// 3. Other security best practices
app.disable('x-powered-by'); // Hide server info

// Sample Route
app.get('/', (req, res) => {
    res.send('Secure Backend is Running');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
