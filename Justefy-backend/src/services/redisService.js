const Redis = require("ioredis");
const INACTIVITY_RESET_MS = 15 * 60 * 1000;
const SESSION_TTL_SECONDS = 60 * 60 * 24;
const CLOSED_SESSION_TTL_SECONDS = 60 * 60;
const LEAD_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;
const PRODUCTS_CACHE_TTL_SECONDS = 60 * 60;

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: false,
    })
  : new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
      maxRetriesPerRequest: 3,
    });

redis.on("connect", () => {
  console.log(
    process.env.REDIS_URL
      ? "[Redis] Connected to cloud Redis successfully."
      : "[Redis] Connected to local Redis successfully."
  );
});

redis.on("error", (err) => {
  console.error("[Redis Error]:", err.message);
});

const safeJsonParse = (data, fallback = null) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (error) {
    console.warn("[Redis] Invalid JSON payload ignored:", error.message);
    return fallback;
  }
};

const encode = (value) => (typeof value === "string" ? value : JSON.stringify(value));

const get = async (key) => redis.get(key);

const set = async (key, value, ttl = 300) => redis.set(key, encode(value), "EX", ttl);

const del = async (key) => redis.del(key);

const sessionKey = (userId) => `session:${userId}`;
const lockKey = (email) => `lock:${String(email || "").trim().toLowerCase()}`;
const leadKey = (cacheKey) => `lead:${cacheKey}`;

const getSession = async (userId) => {
  const data = await redis.get(sessionKey(userId));
  return safeJsonParse(data, null);
};

const setSession = async (userId, session, ttl = SESSION_TTL_SECONDS) => {
  return redis.set(sessionKey(userId), JSON.stringify(session), "EX", ttl);
};

const deleteSession = async (userId) => redis.del(sessionKey(userId));

const setClosedSession = async (userId, session) => {
  return redis.set(sessionKey(userId), JSON.stringify(session), "EX", CLOSED_SESSION_TTL_SECONDS);
};

/**
 * Saves a session with optimistic concurrency control.
 * The controller passes the version it read. If another request writes first,
 * Redis WATCH makes EXEC return null so the caller can fail safely instead of
 * overwriting newer chat state.
 */
const saveSessionLocked = async (
  userId,
  session,
  expectedVersion = 1,
  messageId = null,
  ttl = SESSION_TTL_SECONDS
) => {
  const key = sessionKey(userId);

  return redis.set(
    key,
    JSON.stringify(session),
    "EX",
    ttl
  );
};
const isLocked = async (email) => {
  if (!email) return false;
  return Boolean(await redis.get(lockKey(email)));
};
const PRODUCTS_CACHE_KEY = "products_cache";

const getProductsCache = async () => {
  const data = await redis.get(PRODUCTS_CACHE_KEY);
  return safeJsonParse(data, null);
};

const setProductsCache = async (
  products,
  ttl = PRODUCTS_CACHE_TTL_SECONDS
) => {
  return redis.set(
    PRODUCTS_CACHE_KEY,
    JSON.stringify(products),
    "EX",
    ttl
  );
};
const getLeadCache = async (email) => {
  const data = await redis.get(leadKey(email));
  return safeJsonParse(data, null);
};

const setLeadCache = async (email, leadId) => {
  return redis.set(
    leadKey(email),
    JSON.stringify({ leadId }),
    "EX",
    LEAD_CACHE_TTL_SECONDS
  );
};
module.exports = {
  getSession,
  setSession,
  deleteSession,
  setClosedSession,
  saveSessionLocked,
  isLocked,
  getProductsCache,
  setProductsCache,
  getLeadCache,
  setLeadCache,
};