const xmlrpc = require("xmlrpc");

const config = {
  url: process.env.ODOO_URL,
  db: process.env.ODOO_DB,
  username: process.env.ODOO_USERNAME,
  password: process.env.ODOO_PASSWORD,
};

const client = xmlrpc.createClient({
  url: `${config.url}/xmlrpc/2/object`,
});

const commonClient = xmlrpc.createClient({
  url: `${config.url}/xmlrpc/2/common`,
});

let cachedUid = null;
let lastAuthTime = 0;
const AUTH_TTL = 1000 * 60 * 30;

const authenticate = async () => {
  const now = Date.now();

  if (cachedUid && now - lastAuthTime < AUTH_TTL) {
    return cachedUid;
  }

  return new Promise((resolve, reject) => {
    commonClient.methodCall(
      "authenticate",
      [config.db, config.username, config.password, {}],
      (err, uid) => {
        if (err || !uid) return reject(err || new Error("Odoo Auth Failed"));

        cachedUid = uid;
        lastAuthTime = now;

        resolve(uid);
      }
    );
  });
};

const execute = async (model, method, args = [], kwargs = {}) => {
  try {
    const uid = await authenticate();

    return new Promise((resolve, reject) => {
      client.methodCall(
        "execute_kw",
        [config.db, uid, config.password, model, method, args, kwargs],
        (err, res) => {
          if (err) {
            console.error(`Odoo Execute Error [${model}.${method}]:`, err.message);
            return reject(err);
          }
          resolve(res);
        }
      );
    });
  } catch (err) {
    console.error(`Odoo Wrapper Error [${model}.${method}]:`, err.message);
    throw err;
  }
};

const getProducts = async () => {
  try {
    const data = await execute(
      "product.template",
      "search_read",
      [[["sale_ok", "=", true]]],
      { fields: ["name", "list_price"] }
    );

    return { ok: true, data };
  } catch {
    return { ok: false, data: [] };
  }
};

const createLead = async (payload) => {
  return await execute("crm.lead", "create", [payload]);
};

const updateLead = async (id, payload) => {
  return await execute("crm.lead", "write", [[id], payload]);
};

const searchLead = async ({ phone, email }) => {
  try {
    const domain = [];

    if (phone) domain.push(["phone", "=", phone]);

    if (email) {
      if (domain.length) domain.push("|");
      domain.push(["email_from", "=", email]);
    }

    const data = await execute(
      "crm.lead",
      "search_read",
      [domain],
      {
        fields: ["id", "name", "email_from", "phone", "stage_id"],
        limit: 1,
      }
    );

    return data?.[0] || null;
  } catch {
    return null;
  }
};

const getCustomers = async () => {
  try {
    const data = await execute(
      "res.partner",
      "search_read",
      [[]],
      {
        fields: ["name", "email", "phone", "x_x_subscription_end_date"],
      }
    );

    return { ok: true, data };
  } catch {
    return { ok: false, data: [] };
  }
};

const getSubscriptions = async () => {
  try {
    const data = await execute(
      "sale.order",
      "search_read",
      [[["state", "!=", "cancel"]]],
      {
        fields: ["name", "partner_id", "amount_total", "state"],
      }
    );

    return { ok: true, data };
  } catch {
    return { ok: false, data: [] };
  }
};

const pingOdoo = async () => {
  try {
    await authenticate();
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  execute,
  getProducts,
  createLead,
  updateLead,
  searchLead,
  getCustomers,
  getSubscriptions,
  pingOdoo,
};