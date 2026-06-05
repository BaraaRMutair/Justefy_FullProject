const odoo = require("./odooService");
const redis = require("./redisService");

// =========================
// FIND LEAD (email only)
// =========================
const findLead = async (email) => {
  if (!email) return null;

  const cached = await redis.getLeadCache(email);
  if (cached?.leadId) return { id: cached.leadId };

  // جلب الـ id والـ description لضمان عدم مسح البيانات القديمة عند التحديث
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

  const newNotes = `
-----------------------------------------
[تحديث جديد - ${new Date().toLocaleDateString('ar-SA')}]
Source: ${source || "Chatbot"}
Service: ${service || "NOT_SET"}
Notes: ${notes || "بدون ملاحظات إضافية"}
-----------------------------------------`;

  // UPDATE
  if (existing?.id) {
    // جلب الوصف القديم إذا كان موجوداً لمنع اختفائه في Odoo 19
    const oldDescription = existing.description || "";
    
    const payload = {
      name: `${name || "Lead"} - ${service || "General"}`,
      contact_name: name,
      email_from: email,
      description: `${oldDescription}\n${newNotes}`, // دمج النوتس القديمة مع الجديدة
    };

    await odoo.updateLead(existing.id, payload);
    await redis.setLeadCache(email, existing.id);

    return {
      ok: true,
      mode: "updated",
      leadId: existing.id,
    };
  }

  // CREATE
  const payload = {
    name: `${name || "Lead"} - ${service || "General"}`,
    contact_name: name,
    email_from: email,
    description: newNotes,
  };

  const id = await odoo.createLead(payload);
  await redis.setLeadCache(email, id);

  return {
    ok: true,
    mode: "created",
    leadId: id,
  };
};

module.exports = { upsertLead };