const redisService = require("./redisService");
const odooService = require("./odooService");

// =========================
// GET PRODUCTS WITH CACHE
// =========================
const getProductsCached = async () => {
  try {
    // 1. Redis first
    const cached = await redisService.getProductsCache();

    if (cached) {
      return {
        ok: true,
        data: cached,
        source: "redis",
      };
    }

    // 2. Odoo fallback
    const result = await odooService.getProducts();

    if (!result.ok) {
      return result;
    }

    // 3. Save to redis
    await redisService.setProductsCache(result.data);

    return {
      ok: true,
      data: result.data,
      source: "odoo",
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
    };
  }
};

module.exports = {
  getProductsCached,
};