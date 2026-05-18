const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
});
// =========================
// BASIC WRAPPER
// =========================
const get = async (key) => redis.get(key);

const set = async (key, value, ttl = 300) => {
  // إذا كانت القيمة كائن، حولها لنص، إذا كانت نصاً اتركها كما هي
  const data = typeof value === 'string' ? value : JSON.stringify(value);
  return redis.set(key, data, "EX", ttl);
};

// =========================
// SESSION
// =========================
const getSession = async (userId) => {
  const data = await redis.get(`session:${userId}`);
  return data ? JSON.parse(data) : null;
};

const setSession = async (userId, session) => {
  return redis.set(
    `session:${userId}`,
    JSON.stringify(session),
    "EX",
    60 * 60 * 24
  );
};

// =========================
// EMAIL LOCK
// =========================
const isLocked = async (email) =>
  !!(await redis.get(`lock:${email}`));

const lockEmail = async (email, ttl = 300) =>
  redis.set(`lock:${email}`, "1", "EX", ttl);

// =========================
// LEADS CACHE
// =========================
const getLeadCache = async (email) => {
  const data = await redis.get(`lead:${email}`);
  return data ? JSON.parse(data) : null;
};

const setLeadCache = async (email, leadId) => {
  return redis.set(
    `lead:${email}`,
    JSON.stringify({ leadId }),
    "EX",
    60 * 60 * 24 * 7
  );
};

// =========================
// PRODUCTS CACHE
// =========================
const getProductsCache = async () => {
  const data = await redis.get("products");
  return data ? JSON.parse(data) : null;
};

const setProductsCache = async (products) => {
  return redis.set(
    "products",
    JSON.stringify(products),
    "EX",
    3600
  );
};

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
};