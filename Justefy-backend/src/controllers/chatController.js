const { getAIResponse } = require("../services/aiService");
const { upsertLead } = require("../services/leadService");
const redis = require("../services/redisService");
const { getProductsCached } = require("../services/productService");

const MAX_MESSAGES = 2; // للفحص: رسالتين كحد أقصى طوال الجلسة
const MAX_TOKENS = 5000;

// =========================
// HELPERS
// =========================
const isValidEmail = (email = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const formatChatHistoryForOdoo = (historyArray = []) => {
  if (!historyArray.length) return "لا يوجد سجل رسائل متاح.";
  return historyArray
    .map(msg => {
      const sender = msg.role === "user" ? "العميل" : "Justefy AI";
      return `[${sender}]: ${msg.text}`;
    })
    .join("\n-------------------------\n");
};

// =========================
// SERVICE DETECTION
// =========================
const detectService = (msg = "") => {
  const text = msg.toLowerCase();
  const services = [
    { keywords: ["seo", "سيو", "تحسين محركات"], name: "SEO" },
    { keywords: ["google", "ads", " جوجل ادز", "جوجل"], name: "Google Ads" },
    { keywords: ["سوشيال", "meta", "انستغرام", "تيكتوك"], name: "Social Media Ads" },
    { keywords: ["موقع", "ويب", "website"], name: "Website Development" },
  ];
  return services.find(s => s.keywords.some(k => text.includes(k))) || null;
};

// تحسين الفحص البرمجي لمنع الكلمات العشوائية من تفعيل نية الشراء كذباً
const detectIntent = (msg = "") => {
  const text = msg.toLowerCase();
  if (["تهبل", "اتهبل", "بمزح", "طخ", "العاب", "نكتة"].some(w => text.includes(w))) return false;
  
  return ["مهتم", "ابدأ", "اشترك", "تواصل", "احجز", "اطلب"].some(w => text.includes(w)) ||
         (["بدي", "اريد"].some(w => text.includes(w)) && ["سيو", "seo", "اعلان", "موقع", "ويب", "خدمة", "باقة"].some(w => text.includes(w)));
};

const isAffirmative = (msg = "") => {
  const text = msg.toLowerCase();
  // تجنب اعتبار العبارات السلبية المركبة كموافقة تامة
  if (["افكر", "بفكر", "بعدين", "مش عارف"].some(w => text.includes(w))) return false;
  return ["تمام", "اوك", "ok", "نعم", "موافق", "يلا", "خلينا"].some(w => text.includes(w));
};

const isInFlow = (session) => {
  return session?.step === "name" || session?.step === "email";
};

const getSession = async (id) => await redis.getSession(id);
const saveSession = async (id, session) => redis.setSession(id, session);

const buildProductsContext = async () => {
  try {
    const res = await getProductsCached();
    if (!res?.ok || !res?.data?.length) return "";
    return res.data.map(p => `- ${p.name}: ${p.list_price} ₪`).join("\n");
  } catch {
    return "";
  }
};

// =========================
// CLOSE CHAT FUNCTION
// =========================
const closeChat = async (userId, session, reason = "auto_close") => {
  session.status = "closed";
  session.step = null; // 🚀 حاسم جداً: نسف خطوة الخط التدفقي لمنع الاختراقات العكسية لاحقاً
  session.closedAt = Date.now();
  const fullConversationLog = formatChatHistoryForOdoo(session.history);

  if (session.lead && (session.lead.service || session.lead.notes || session.lead.name || session.lead.email)) {
    try {
      const allInterests = session.history
        .map(h => h.role === "user" ? detectService(h.text) : null)
        .filter(s => s !== null)
        .map(s => s.name);
        
      const uniqueInterests = [...new Set(allInterests)];
      const interestsSummary = uniqueInterests.length > 0 ? uniqueInterests.join(" + ") : (session.lead.service || "استفسار عام");

      await upsertLead({
        name: session.lead.name || "عميل من الشات",
        email: session.lead.email || "no-email@justefy.com", 
        service: interestsSummary,
        notes: `🤖 [تقرير محادثة Justefy AI التلقائي]:\n\nسبب الإغلاق: ${reason === "misbehave" ? "طرد بسبب سلوك عشوائي خارج النطاق" : "إتمام الخطوات أو استهلاك الحد الأقصى"}\n\nإحصائيات الجلسة:\n- عدد الرسائل: ${session.stats.messagesCount}\n- إجمالي التوكنز المستهلكة: ${session.stats.totalTokens}\n\nسجل الحوار بالتفصيل:\n\n${fullConversationLog}`,
        source: reason === "misbehave" ? "chatbot_misbehave_kick" : "chatbot_auto_close",
      });
      console.log(`✅ [Odoo] تم تحويل العميل ${userId} بنجاح. السبب: ${reason}`);
    } catch (odooError) {
      console.error("❌ فشل إرسال البيانات لأودو:", odooError);
    }
  }

  if (redis.setClosedSession) {
    await redis.setClosedSession(userId, session);
  } else {
    await redis.setSession(userId, session);
  }

  return {
    status: "closed",
    aiResponse: reason === "misbehave" 
      ? "عذراً، تم حظر استخدام الشات مؤقتاً لخروج المحادثة عن سياق الأعمال الرسمي لشركة Justefy."
      : "تم إيصال طلبكم لخدمة العملاء بنجاح، وسيتم التواصل معكم في أقرب وقت.",
  };
};

// =========================
// MAIN HANDLE CHAT
// =========================
const handleChat = async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ status: "error", aiResponse: "بيانات غير مكتملة" });
    }

    let session = await getSession(userId);
    const text = message.trim();

    if (!session) {
      session = {
        step: null, status: "open", lead: {}, history: [],
        stats: { messagesCount: 0, totalTokens: 0, startedAt: Date.now(), lastActivity: Date.now() }
      };
    } else {
      session.history = session.history || [];
      session.stats = session.stats || { messagesCount: 0, totalTokens: 0, startedAt: Date.now(), lastActivity: Date.now() };
    }

    if (session.status === "closed") {
      return res.json({ status: "closed", aiResponse: "تم إيصال طلبكم لخدمة العملاء وسيتم التواصل معكم في أقرب وقت." });
    }

    // تسجيل رسالة المستخدم وزيادة العداد فوراً
    session.history.push({ role: "user", text });
    session.stats.messagesCount += 1;
    session.stats.lastActivity = Date.now();
    await saveSession(userId, session);

    // دالة مساعدة معيارية لإرسال الردود والتحقق من سقف الرسائل
    const checkMessageLimitAndSend = async (responsePayload) => {
      if (session.stats.messagesCount >= MAX_MESSAGES && session.status !== "closed") {
        const closedResult = await closeChat(userId, session, "max_messages_reached");
        return res.json(closedResult);
      }
      return res.json(responsePayload);
    };

    // ========================================================
    // 🛡️ [تعديل هيكلي فوري وصارم لفلترة التهبيل والتحرش عبر الـ AI أولاً]
    // ========================================================
    // نقوم بتمرير أي رسالة يشتبه بها خارج التدفق الثابت والنمطي لـ Claude فوراً ليفحصها قبل الشروط الصلبة
    if (!isInFlow(session)) {
      const products = await buildProductsContext();
      const aiResult = await getAIResponse({
        history: session.history.slice(0, -1),
        userMessage: text,
        odooData: products,
      });

      // إذا اكتشف الذكاء الاصطناعي شتائم أو تهبيل (مثل: بدي اتهبل عليك) سيقذف علم الحظر فوراً
      if (aiResult.shouldForceClose) {
        const forceClosed = await closeChat(userId, session, "misbehave");
        return res.json(forceClosed);
      }

      // إذا مر بسلام والعميل طبيعي، نخزن التوكنز والرد للخطوات العامة لاحقاً
      session.stats.totalTokens += aiResult.tokensUsed || 0;
      
      if (session.stats.totalTokens >= MAX_TOKENS) {
        const closed = await closeChat(userId, session, "max_tokens_reached");
        return res.json(closed);
      }

      // حفظ رد الـ AI مؤقتاً لنقرر استعماله بالأسفل إذا لم يطابق شروط الخدمات الثابتة
      session.currentAiResponse = aiResult.aiResponse;
    }

    // =========================
    // STEP 1: NAME FLOW
    // =========================
    if (session.step === "name") {
      session.lead.name = text;
      session.step = "email";
      const aiResponse = "ممتاز 👌 ممكن الإيميل للتواصل؟";
      session.history.push({ role: "ai", text: aiResponse });
      await saveSession(userId, session);

      return checkMessageLimitAndSend({ status: "ok", aiResponse });
    }

    // =========================
    // STEP 2: EMAIL FLOW
    // =========================
    if (session.step === "email") {
      const email = text.toLowerCase();
      if (!isValidEmail(email)) {
        const aiResponse = "الإيميل غير صحيح ❌ اكتب مثال: name@gmail.com";
        session.history.push({ role: "ai", text: aiResponse });
        await saveSession(userId, session);
        return checkMessageLimitAndSend({ status: "ok", aiResponse });
      }

      session.lead.email = email;
      session.step = null;
      const closedResult = await closeChat(userId, session, "form_completed");
      return res.json(closedResult);
    }

    // =========================
    // SERVICE DETECTED FLOW
    // =========================
    const service = detectService(text);
    if (service && !isInFlow(session)) {
      session.lead.service = session.lead.service ? `${session.lead.service} + ${service.name}` : service.name;
      session.lead.notes = text;
      
      // نستخدم الرد الذكي المجهز مسبقاً من الـ AI بالأعلى بدلاً من استدعائه مرتين
      const finalAiResponse = session.currentAiResponse || `أهلاً بك، نحن في Justefy نقدم خدمة ${service.name} باحترافية عالية.`;
      
      session.history.push({ role: "ai", text: finalAiResponse });
      delete session.currentAiResponse; // تنظيف الجلسة
      await saveSession(userId, session);

      return checkMessageLimitAndSend({ status: "ok", aiResponse: finalAiResponse });
    }

    const inFlow = isInFlow(session);

    // =========================
    // CONTINUE FLOW
    // =========================
    if (isAffirmative(text) && session.lead.service && !inFlow) {
      session.step = "name";
      const aiResponse = `تمام 👌 خلينا نكمل عرض ${session.lead.service}\n\nممكن اسمك؟`;
      session.history.push({ role: "ai", text: aiResponse });
      delete session.currentAiResponse;
      await saveSession(userId, session);
      return checkMessageLimitAndSend({ status: "ok", aiResponse });
    }

    // =========================
    // START INTENT
    // =========================
    if (detectIntent(text) && !inFlow) {
      session.step = "name";
      session.lead.notes = text;
      const aiResponse = "ممتاز 🚀 خلينا نبدأ بالاسم 👇";
      session.history.push({ role: "ai", text: aiResponse });
      delete session.currentAiResponse;
      await saveSession(userId, session);
      return checkMessageLimitAndSend({ status: "ok", aiResponse });
    }

    // =========================
    // FALLBACK AI (General Conversation)
    // =========================
    if (!inFlow) {
      const finalAiResponse = session.currentAiResponse || "أعتذر، هل يمكنك إعادة صياغة سؤالك؟ 🙏";
      session.history.push({ role: "ai", text: finalAiResponse });
      delete session.currentAiResponse;
      await saveSession(userId, session);

      return checkMessageLimitAndSend({ status: "ok", aiResponse: finalAiResponse });
    }

    // Fallback inside flow
    const fallbackResponse = "تمام 👌 خلينا نكمل الخطوات.";
    session.history.push({ role: "ai", text: fallbackResponse });
    await saveSession(userId, session);
    return checkMessageLimitAndSend({ status: "ok", aiResponse: fallbackResponse });

  } catch (error) {
    console.error("Chat Error:", error);
    return res.status(500).json({ status: "error", aiResponse: "تعذر الرد حالياً، حاول لاحقاً." });
  }
};

module.exports = { handleChat };