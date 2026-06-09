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

// ✅ إعداد CORS ديناميكي وآمن للسحاب واللوكال معاً
const allowedOrigins = [
    "http://localhost:3000",                          // لوكال
    "https://justefy-frontend.vercel.app",           // رابط فيرسيل الافتراضي
    "https://justefy.com",                            // دومينك الرسمي المربوط
    "https://www.justefy.com"                         // الدومين بـ www
];

app.use(cors({
    origin: function (origin, callback) {
        // السماح بالطلبات التي ليس لها origin (مثل تطبيقات الموبايل أو Postman) أو النطاقات المسموحة
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('❌ Not allowed by CORS via Justefy Security'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
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
console.log("REDIS URL USED:", process.env.REDIS_URL);

