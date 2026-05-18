require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const pool = require('./src/config/db');

// routes
const chatRoutes = require('./src/routes/chatRoutes');
const odooRoutes = require('./src/routes/odooRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const authRoutes = require('./src/routes/authRoutes');
const leadRoutes = require('./src/routes/leadRoutes');

const dashboardRoutes = require("./src/routes/dashboardRoutes");

const app = express();

/**
 * =========================
 * SECURITY MIDDLEWARES
 * =========================
 */

// CORS (secure config)
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

// JSON parser
app.use(express.json());

// Cookies
app.use(cookieParser());

/**
 * =========================
 * ROUTES
 * =========================
 */

app.use('/api/chat', chatRoutes);
app.use('/api/odoo', odooRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/dashboard', dashboardRoutes);

/**
 * =========================
 * HEALTH CHECK
 * =========================
 */

app.get('/', (req, res) => {
    res.send('Justefy Backend is running...');
});

/**
 * =========================
 * DB CHECK
 * =========================
 */

const checkDbConnection = async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Database connected successfully.');
    } catch (err) {
        console.error('❌ DB connection failed:', err.message);
    }
};

checkDbConnection();

/**
 * =========================
 * GLOBAL ERROR HANDLER
 * =========================
 */

app.use((err, req, res, next) => {
    console.error("🔥 Error:", err);

    res.status(err.status || 500).json({
        status: "Error",
        message: err.message || "Internal Server Error"
    });
});

/**
 * =========================
 * START SERVER
 * =========================
 */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});