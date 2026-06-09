const odoo = require("./odooService");
const redis = require("./redisService");

const DEFAULT_SOURCE = "Chatbot";

const normalizeEmail = (email) => {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

// 🔥 FIX: لا تكسر رقم الهاتف + حافظ على 0 و +
const normalizePhone = (phone) => {
  if (!phone || typeof phone !== "string") return "";
  return phone
    .replace(/[^\d+]/g, "")   // فقط أرقام و +
    .replace(/\s+/g, "")
    .trim();
};

const compact = (value) =>
  typeof value === "string" ? value.trim() : "";

// =========================
// CACHE KEYS
// =========================
const buildLeadCacheKeys = ({ email, phone }) => {
  const keys = [];
  if (email) keys.push(`email:${email}`);
  if (phone) keys.push(`phone:${phone}`);
  return keys;
};

const getCachedLeadId = async ({ email, phone }) => {
  for (const key of buildLeadCacheKeys({ email, phone })) {
    const cached = await redis.getLeadCache(key);
    if (cached?.leadId) return cached.leadId;
  }
  return null;
};

const setLeadCaches = async ({ email, phone, leadId }) => {
  if (!leadId) return;

  const keys = buildLeadCacheKeys({ email, phone });

  await Promise.all(
    keys.map((key) => redis.setLeadCache(key, { leadId }))
  );
};

// =========================
// FIND LEAD
// =========================
const findLead = async (emailInput, phoneInput) => {
  const email = normalizeEmail(emailInput);
  const phone = normalizePhone(phoneInput);

  if (!email && !phone) return null;

  const cachedLeadId = await getCachedLeadId({ email, phone });
  if (cachedLeadId) {
    return {
      id: cachedLeadId,
      email_from: email,
      phone,
      description: "",
    };
  }

  const domain =
    email && phone
      ? ["|", ["email_from", "=", email], ["phone", "=", phone]]
      : email
      ? [["email_from", "=", email]]
      : [["phone", "=", phone]];

  const leads = await odoo.searchLead(domain, [
    "id",
    "name",
    "contact_name",
    "email_from",
    "phone",
    "mobile",
    "description",
  ]);

  const lead = Array.isArray(leads) ? leads[0] : null;

  if (lead?.id) {
    await setLeadCaches({
      email: lead.email_from || email,
      phone: lead.phone || lead.mobile || phone,
      leadId: lead.id,
    });
  }

  return lead;
};

// =========================
// NOTES
// =========================
const buildNotesBlock = ({ source, service, notes }) => {
  const date = new Date().toLocaleString("ar-SA", { hour12: false });

  return [
    "",
    "-------------------------",
    `[${date}] Source: ${compact(source) || DEFAULT_SOURCE} | Service: ${compact(service) || "NOT_SET"}`,
    `Notes: ${compact(notes) || "بدون ملاحظات"}`,
    "-------------------------",
  ].join("\n");
};

// =========================
// UPSERT LEAD (FINAL FIXED)
// =========================
const upsertLead = async (params = {}) => {
  const name = compact(params.name) || "Lead";

  const email = normalizeEmail(params.email);

  // 🔥 FIX مهم: لا تقتل الرقم
  const phone = normalizePhone(params.phone);

  const service = compact(params.service) || "General";
  const notes = compact(params.notes);
  const source = compact(params.source) || DEFAULT_SOURCE;

  const allowCRM = params.allowCRM !== false;
  const leadScore = Number(params.leadScore || 0);

  // =========================
  // 1. VALIDATION (SMART)
  // =========================
  const hasContact = Boolean(email || phone);

  if (!allowCRM) {
    return { ok: false, mode: "blocked", reason: "crm_disabled" };
  }

  // 🔥 FIX مهم: لا تمنع بدري جداً
  if (!hasContact && leadScore < 3) {
    return { ok: false, mode: "ignored", reason: "low_intent_no_contact" };
  }

  if (!hasContact && leadScore >= 3) {
    return { ok: false, mode: "blocked", reason: "missing_contact_high_intent" };
  }

  // =========================
  // 2. FIND EXISTING
  // =========================
  const existing = await findLead(email, phone);

  const newNotes = buildNotesBlock({ source, service, notes });

  // =========================
  // 3. PAYLOAD SAFE
  // =========================
  const payload = {
    name: existing ? existing.name : `${name} - ${service}`,
    contact_name: name,
    description: `${existing?.description || ""}${newNotes}`,
  };

  if (email) payload.email_from = email;

if (phone) {
  payload.phone = phone;
}

  // =========================
  // 4. UPDATE / CREATE
  // =========================
  if (existing?.id) {
    await odoo.updateLead(existing.id, payload);

    await setLeadCaches({
      email: email || existing.email_from,
      phone: phone || existing.phone || existing.mobile,
      leadId: existing.id,
    });

    return { ok: true, mode: "updated", leadId: existing.id };
  }

  const leadId = await odoo.createLead(payload);

  await setLeadCaches({
    email,
    phone,
    leadId,
  });

  return { ok: true, mode: "created", leadId };
};

module.exports = {
  upsertLead,
  findLead,
};