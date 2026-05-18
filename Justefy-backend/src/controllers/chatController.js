const { getAIResponse } = require("../services/aiService");
const { upsertLead } = require("../services/leadService");
const redis = require("../services/redisService");
const { getProductsCached } = require("../services/productService");

// =========================
// HELPERS
// =========================
const isValidEmail = (email = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// =========================
// SERVICE DETECTION
// =========================
const detectService = (msg = "") => {
  const text = msg.toLowerCase();

  const services = [
    { keywords: ["seo", "سيو", "تحسين محركات"], name: "SEO" },
    { keywords: ["google", "ads", "جوجل"], name: "Google Ads" },
    { keywords: ["سوشيال", "meta", "انستغرام", "تيكتوك"], name: "Social Media Ads" },
    { keywords: ["موقع", "ويب", "website"], name: "Website Development" },
  ];

  return services.find(s =>
    s.keywords.some(k => text.includes(k))
  ) || null;
};

// =========================
// INTENT DETECTION
// =========================
const detectIntent = (msg = "") => {
  const text = msg.toLowerCase();

  return ["مهتم", "ابدأ", "بدي", "اريد", "تواصل", "احجز", "اطلب"]
    .some(w => text.includes(w));
};

// =========================
// AFFIRMATION
// =========================
const isAffirmative = (msg = "") => {
  const text = msg.toLowerCase();

  return ["تمام", "اوك", "ok", "نعم", "موافق", "يلا", "خلينا"]
    .some(w => text.includes(w));
};

// =========================
// FLOW LOCK (IMPORTANT)
// =========================
const isInFlow = (session) => {
  return session?.step === "name" || session?.step === "email";
};

// =========================
// SESSION
// =========================
const getSession = async (id) =>
  (await redis.getSession(id)) || { step: null, lead: {} };

const saveSession = async (id, session) =>
  redis.setSession(id, session);

// =========================
// PRODUCTS (CACHED FROM ODOO)
// =========================
const buildProductsContext = async () => {
  try {
    const res = await getProductsCached();

    if (!res?.ok || !res?.data?.length) return "";

    return res.data
      .map(p => `- ${p.name}: ${p.list_price} ₪`)
      .join("\n");

  } catch {
    return "";
  }
};

// =========================
// MAIN CONTROLLER
// =========================
const handleChat = async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        status: "error",
        aiResponse: "بيانات غير مكتملة",
      });
    }

    let session = await getSession(userId);
    const text = message.trim();

    const inFlow = isInFlow(session);

    // =========================
    // STEP 1: NAME
    // =========================
    if (session.step === "name") {
      session.lead.name = text;
      session.step = "email";

      await saveSession(userId, session);

      return res.json({
        status: "ok",
        aiResponse: "ممتاز 👌 ممكن الإيميل للتواصل؟",
      });
    }

    // =========================
    // STEP 2: EMAIL
    // =========================
    if (session.step === "email") {
      const email = text.toLowerCase();

      if (!isValidEmail(email)) {
        return res.json({
          status: "ok",
          aiResponse: "الإيميل غير صحيح ❌ اكتب مثال: name@gmail.com",
        });
      }

      const result = await upsertLead({
        name: session.lead.name,
        email,
        service: session.lead.service || "SEO",
        notes: session.lead.notes || "",
        source: "chatbot",
      });

      session = { step: null, lead: {} };
      await saveSession(userId, session);

      return res.json({
        status: "ok",
        aiResponse:
          result?.mode === "updated"
            ? "تم تحديث طلبك السابق 🔄"
            : "تم تسجيل طلبك بنجاح 🚀",
      });
    }

    // =========================
    // SERVICE DETECTED FLOW
    // =========================
    const service = detectService(text);

    if (service) {
      session.lead.service = service.name;
      session.lead.notes = text;

      await saveSession(userId, session);

      const products = await buildProductsContext();

      const aiResponse = await getAIResponse({
        userMessage: `العميل مهتم بـ ${service.name}\n\n${text}`,
        odooData: products,
        systemHint: "Explain service professionally without inventing prices.",
      });

      return res.json({ status: "ok", aiResponse });
    }

    // =========================
    // CONTINUE FLOW (IMPORTANT FIX)
    // =========================
    if (isAffirmative(text) && session.lead.service && !inFlow) {
      session.step = "name";
      await saveSession(userId, session);

      return res.json({
        status: "ok",
        aiResponse: `تمام 👌 خلينا نكمل عرض ${session.lead.service}\n\nممكن اسمك؟`,
      });
    }

    // =========================
    // START INTENT (SAFE)
    // =========================
    if (detectIntent(text) && !inFlow) {
      session.step = "name";
      session.lead.notes = text;

      await saveSession(userId, session);

      return res.json({
        status: "ok",
        aiResponse: "ممتاز 🚀 خلينا نبدأ بالاسم 👇",
      });
    }

    // =========================
    // FALLBACK AI (ONLY OUT OF FLOW)
    // =========================
    if (!inFlow) {
      const products = await buildProductsContext();

      const aiResponse = await getAIResponse({
        userMessage: text,
        odooData: products,
      });

      return res.json({ status: "ok", aiResponse });
    }

    // fallback inside flow
    return res.json({
      status: "ok",
      aiResponse: "تمام 👌 خلينا نكمل الخطوات.",
    });

  } catch (error) {
    console.error("Chat Error:", error);

    return res.status(500).json({
      status: "error",
      aiResponse: "تعذر الرد حالياً، حاول لاحقاً.",
    });
  }
};

module.exports = { handleChat };