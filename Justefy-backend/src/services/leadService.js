const odoo = require("./odooService");
const redis = require("./redisService");

const findLead = async (email, phone) => {
  // البحث في الكاش
  if (email) {
    const cached = await redis.getLeadCache(email);
    if (cached?.leadId) return { id: cached.leadId, email_from: email, phone: phone, description: "" };
  }
  if (phone) {
    const cached = await redis.getLeadCache(phone);
    if (cached?.leadId) return { id: cached.leadId, email_from: email, phone: phone, description: "" };
  }

  // البحث في Odoo
  const domain = ["|"];
  domain.push(["email_from", "=", email || "NEVER_MATCH_EMPTY_EMAIL"]);
  domain.push(["phone", "=", phone || "NEVER_MATCH_EMPTY_PHONE"]);

  const leads = await odoo.searchLead(domain, ["id", "name", "email_from", "phone", "description"]);
  const lead = leads?.[0] || null;

  if (lead?.id) {
    if (email) await redis.setLeadCache(email, lead.id);
    if (phone) await redis.setLeadCache(phone, lead.id);
  }

  return lead; // يرجع الهيكل المطلوب (id, email_from, phone, description)
};

const upsertLead = async (params) => {
  const {
    name,
    email,
    phone,
    service,
    notes,
    source,
    allowCRM = true,
    leadScore = 0
  } = params;

  // 🚨 FIREWALL: حظر الضعفاء فقط إذا كانوا بدون وسيلة تواصل
  // التعديل: لن نحظر العميل الضعيف إذا كان لديه وسيلة تواصل (ممكن المبيعات تعالجه)
  const isBadLead = leadScore < 3;
  const isMissingContact = !email && !phone;

  if (!allowCRM || (isBadLead && isMissingContact)) {
    console.warn("🛑 Lead blocked from Odoo CRM (Criteria Not Met):", params);
    return { ok: false, mode: "blocked", reason: "low_quality_or_abusive_lead" };
  }

  // الآن نبدأ الـ Processing بعد التأكد من أن الـ Firewall سمح بالمرور
  const existing = await findLead(email, phone);

  const newNotes = `\n-------------------------\n[${new Date().toLocaleDateString('ar-SA')}] Source: ${source || "Chatbot"} | Service: ${service || "NOT_SET"}\nNotes: ${notes || "بدون ملاحظات"}\n-------------------------`;

  if (existing?.id) {
    const payload = {
      name: `${name || "Lead"} - ${service || "General"}`,
      contact_name: name,
      email_from: email || existing.email_from || "",
      phone: phone || existing.phone || "",
      description: `${existing.description || ""}${newNotes}`,
    };

    await odoo.updateLead(existing.id, payload);
    if (email) await redis.setLeadCache(email, existing.id);
    if (phone) await redis.setLeadCache(phone, existing.id);

    return { ok: true, mode: "updated", leadId: existing.id };
  }

  const payload = {
    name: `${name || "Lead"} - ${service || "General"}`,
    contact_name: name,
    email_from: email || "",
    phone: phone || "",
    description: newNotes,
  };

  const id = await odoo.createLead(payload);
  if (email) await redis.setLeadCache(email, id);
  if (phone) await redis.setLeadCache(phone, id);

  return { ok: true, mode: "created", leadId: id };
};

module.exports = { upsertLead };