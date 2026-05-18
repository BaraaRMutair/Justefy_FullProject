const odoo = require("./odooService");
const redis = require("./redisService");

// =========================
// FIND LEAD (email only)
// =========================
const findLead = async (email) => {
  if (!email) return null;

  const cached = await redis.getLeadCache(email);
  if (cached?.leadId) return { id: cached.leadId };

  const leads = await odoo.searchLead([
    ["email_from", "=", email],
  ]);

  const lead = leads?.[0] || null;

  if (lead?.id) {
    await redis.setLeadCache(email, lead.id);
  }

  return lead;
};

// =========================
// UPSERT (PRODUCTION SAFE)
// =========================
const upsertLead = async ({
  name,
  email,
  service,
  notes,
  source,
}) => {
  if (!email) return { ok: false, error: "email required" };

  const existing = await findLead(email);

  const payload = {
    name: `${name || "Lead"} - ${service || "General"}`,
    contact_name: name,
    email_from: email,
    description: `
Source: ${source}
Service: ${service || "NOT_SET"}
Notes: ${notes || ""}
    `,
  };

  // UPDATE
  if (existing?.id) {
    await odoo.updateLead(existing.id, payload);

    await redis.setLeadCache(email, existing.id);

    return {
      ok: true,
      mode: "updated",
      leadId: existing.id,
    };
  }

  // CREATE
  const id = await odoo.createLead(payload);

  await redis.setLeadCache(email, id);

  return {
    ok: true,
    mode: "created",
    leadId: id,
  };
};

module.exports = { upsertLead };