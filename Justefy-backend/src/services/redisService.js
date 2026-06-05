const Redis = require("ioredis");

// =========================================================
// 🌐 تهيئة الاتصال الديناميكي (السحاب أو الجهاز المحلي)
// =========================================================
let redis;

if (process.env.REDIS_URL) {
  // إذا كنا على منصة الاستضافة ومتوفر رابط السحاب من Upstash
  redis = new Redis(process.env.REDIS_URL);
} else {
  // الوضع الافتراضي عند التشغيل لوكال على جهازك عبر Docker
  redis = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
  });
}

// مراقبة حالة الاتصال لطباعة تقرير نظيف في الـ Logs
redis.on("connect", () => {
  console.log(
    process.env.REDIS_URL 
      ? "🚀 [Redis] Connected to Cloud Redis (Upstash) successfully!" 
      : "💻 [Redis] Connected to Local Redis (Docker) successfully!"
  );
});

redis.on("error", (err) => {
  console.error("❌ [Redis Error]:", err.message);
});

// =========================================================
// 🛠️ BASIC WRAPPER
// =========================================================
const get = async (key) => redis.get(key);

const set = async (key, value, ttl = 300) => {
  // إذا كانت القيمة كائن (Object)، حولها لنص، وإذا كانت نصاً اتركها كما هي
  const data = typeof value === 'string' ? value : JSON.stringify(value);
  return redis.set(key, data, "EX", ttl);
};

// =========================================================
// 🔑 SESSION MANAGEMENT
// =========================================================
const getSession = async (userId) => {
  const data = await redis.get(`session:${userId}`);
  return data ? JSON.parse(data) : null;
};

const setSession = async (userId, session) => {
  return redis.set(
    `session:${userId}`,
    JSON.stringify(session),
    "EX",
    60 * 60 * 24 // صلاحية الجلسة 24 ساعة
  );
};

// =========================================================
// 🔒 EMAIL LOCK (ANTI-SPAM)
// =========================================================
const isLocked = async (email) =>
  !!(await redis.get(`lock:${email}`));

const lockEmail = async (email, ttl = 300) =>
  redis.set(`lock:${email}`, "1", "EX", ttl);

// =========================================================
// 📈 LEADS CACHE
// =========================================================
const getLeadCache = async (email) => {
  const data = await redis.get(`lead:${email}`);
  return data ? JSON.parse(data) : null;
};

const setLeadCache = async (email, leadId) => {
  return redis.set(
    `lead:${email}`,
    JSON.stringify({ leadId }),
    "EX",
    60 * 60 * 24 * 7 // كاش ليدز لمدة أسبوع
  );
};

// =========================================================
// 📦 PRODUCTS CACHE
// =========================================================
const getProductsCache = async () => {
  const data = await redis.get("products");
  return data ? JSON.parse(data) : null;
};

const setProductsCache = async (products) => {
  return redis.set(
    "products",
    JSON.stringify(products),
    "EX",
    3600 // كاش المنتجات لمدة ساعة
  );
};
const deleteSession = async (userId) => {
  return redis.del(`session:${userId}`);
};

const setClosedSession = async (userId, session) => {
  return redis.set(
    `session:${userId}`,
    JSON.stringify(session),
    "EX",
    60 * 60 // ساعة واحدة
  );
};
// تصدير الدوال للاستخدام في الـ Controllers والـ Routes
module.exports = {
  get,
  set,
  getSession,
  setSession,
  isLocked,
  lockEmail,
  getLeadCache,
  setLeadCache,
  getProductsCache,
  setProductsCache,
  deleteSession,
  setClosedSession,
};