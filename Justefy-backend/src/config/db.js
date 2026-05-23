const { Pool } = require('pg');

let pool;

// =========================================================
// 🌐 تهيئة الاتصال الديناميكي (السحاب أو الجهاز المحلي)
// =========================================================
if (process.env.DATABASE_URL) {
  // إذا كنا على Render ومتوفر رابط السحاب المدمج
  console.log("🌐 [Postgres] Connecting to Cloud PostgreSQL on Render...");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      // إجباري لقواعد البيانات السحابية لتأمين وتجاوز فحص شهادة الأمان
      rejectUnauthorized: false 
    }
  });
} else {
  // الوضع الافتراضي عند التشغيل لوكال على جهازك
  console.log("💻 [Postgres] Connecting to Local PostgreSQL...");
  pool = new Pool({
    user: process.env.DB_USER || 'openpg',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'justefy_db',
    password: process.env.DB_PASSWORD || '123456',
    port: process.env.DB_PORT || 5432,
  });
}

// =========================================================
// 🔍 اختبار الاتصال الفوري عند إقلاع السيرفر
// =========================================================
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ [Postgres Error] Failed to connect to database:', err.message);
  }
  console.log('✅ [Postgres] Connected to PostgreSQL Database successfully!');
  release(); // تحرير العميل وإعادته للمجموعة (Pool) فوراً
});

module.exports = pool;