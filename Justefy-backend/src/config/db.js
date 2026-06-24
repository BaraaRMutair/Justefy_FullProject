const { Pool } = require('pg');

let pool;

// =========================================================
// 🌐 تهيئة الاتصال الديناميكي (السحاب أو الجهاز المحلي)
// =========================================================
// التحقق مما إذا كان الهوست يشير إلى سيرفر ريندر الخارجي
const isCloud = process.env.DATABASE_URL || (process.env.DB_HOST && process.env.DB_HOST.includes('render.com'));

if (isCloud) {
  console.log("🌐 [Postgres] Connecting to Cloud PostgreSQL on Render...");
  
  // إذا كنت تستخدم الرابط الكامل أو المتغيرات المقسمة
  const config = process.env.DATABASE_URL 
    ? { connectionString: process.env.DATABASE_URL }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
      };

  // إضافة إعدادات الـ SSL الإجبارية للسحاب
  config.ssl = { rejectUnauthorized: false };
  
  pool = new Pool(config);
} else {
  // الوضع الافتراضي عند التشغيل لوكال على جهازك الشخصي
  console.log("💻 [Postgres] Connecting to Local PostgreSQL...");
  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'justefy_db',
    password: process.env.DB_PASSWORD || '123456',
    port: process.env.DB_PORT || 5432,
  });
}

// =========================================================
// 🛠️ سكربت إنشاء الجداول تلقائياً (جدول الـ users)
// =========================================================
const initDatabase = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(createTableQuery);
    console.log('✅ [Postgres] Tables checked/created successfully!');
  } catch (err) {
    console.error('❌ [Postgres Error] Failed to create tables:', err.message);
  }
};

// =========================================================
// 🔍 اختبار الاتصال الفوري عند إقلاع السيرفر
// =========================================================
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ [Postgres Error] Failed to connect to database:', err.message);
  }
  console.log('✅ [Postgres] Connected to PostgreSQL Database successfully!');
  release(); // تحرير العميل فوراً
  
  // تشغيل سكربت إنشاء الجداول بمجرد نجاح الاتصال
  initDatabase();
});

module.exports = pool;