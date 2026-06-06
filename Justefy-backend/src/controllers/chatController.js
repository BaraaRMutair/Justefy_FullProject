const { getAIResponse } = require("../services/aiService");
const { upsertLead } = require("../services/leadService");
const redis = require("../services/redisService");
const { getProductsCached } = require("../services/productService");

const MAX_MESSAGES = 25; 
const MAX_TOKENS = 10000;

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
// HANDMADE CHECKS (صمام الأمان اليدوي)
// =========================
const detectService = (msg = "") => {
  const text = msg.toLowerCase();
  const services = [
    { keywords: ["seo", "سيو", "تحسين محركات"], name: "SEO" },
    { keywords: ["google", "ads", " جوجل ادز", "جوجل"], name: "Google Ads" },
    { keywords: ["سوشيال", "meta", "انستغرام", "تيكتوك"], name: "Social Media Ads" },
    { keywords: ["موقع", "ويب", "website"], name: "Website Development" },
    { keywords: ["بريد", "ايميل", "email", "حملات"], name: "Email Marketing" },
  ];
  return services.find(s => s.keywords.some(k => text.includes(k))) || null;
};

// فحص مخصص للترحيب والسؤال عن الحال لمنع الفلترة الخاطئة من AI
const isFriendlyGreeting = (msg = "") => {
  const text = msg.toLowerCase().trim();
  const greetings = [
    "مرحبا", "هلا", "اهلين", "كيفك", "كيف حالك", "اخبارك", "منور", 
    "السلام عليكم", "سلام", "انت منيح", "شلونك", "يا هلا"
  ];
  return greetings.some(g => text.includes(g));
};

const detectIntent = (msg = "") => {
  const text = msg.toLowerCase();
  if (["تهبل", "اتهبل", "بمزح", "طخ", "العاب", "نكتة"].some(w => text.includes(w))) return false;
  
  return ["مهتم", "ابدأ", "اشترك", "تواصل", "احجز", "اطلب"].some(w => text.includes(w)) ||
         (["بدي", "اريد"].some(w => text.includes(w)) && ["سيو", "seo", "اعلان", "موقع", "ويب", "خدمة", "باقة", "سعر", "اسعار"].some(w => text.includes(w)));
};

const isAffirmative = (msg = "") => {
  const text = msg.toLowerCase();
  if (["افكر", "بفكر", "بعدين", "مش عارف"].some(w => text.includes(w))) return false;
  return ["تمام", "اوك", "ok", "نعم", "موافق", "يلا", "خلينا"].some(w => text.includes(w));
};

const isInFlow = (session) => {
  return session?.step === "name" || session?.step === "email" || session?.step === "force_collect";
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
  session.step = null; 
  session.closedAt = Date.now();
  const fullConversationLog = formatChatHistoryForOdoo(session.history);

  try {
    const allInterests = session.history
      .map(h => h.role === "user" ? detectService(h.text) : null)
      .filter(s => s !== null)
      .map(s => s.name);
      
    const uniqueInterests = [...new Set(allInterests)];
    const interestsSummary = uniqueInterests.length > 0 ? uniqueInterests.join(" + ") : (session.lead.service || "استفسار عام");

    await upsertLead({
      name: session.lead.name || "عميل شات استهلك الموارد",
      email: session.lead.email || `no-email-${userId}@justefy.com`, 
      service: interestsSummary,
      notes: `🤖 [تقرير محادثة Justefy AI التلقائي]:\n\nسبب الإغلاق: ${
        reason === "misbehave" ? "طرد بسبب سلوك خارج النطاق الرسمي" : 
        reason === "token_exhausted_force_collect" ? "انتهاء التوكنز وتم سحب البيانات إجبارياً في آخر رسالة" : "إتمام خطوات تجميع البيانات بنجاح"
      }\n\nسجل الحوار بالتفصيل:\n\n${fullConversationLog}`,
      source: reason === "misbehave" ? "chatbot_misbehave_kick" : "chatbot_token_exhausted",
    });
    console.log(`✅ [Odoo] تم تحويل وحفظ العميل ${userId} بنجاح. السبب: ${reason}`);
  } catch (odooError) {
    console.error("❌ فشل إرسال البيانات لأودو:", odooError);
  }

  // حفظ الجلسة كمغلقة في Redis
  await saveSession(userId, session);

  return {
    status: "closed",
    aiResponse: reason === "misbehave" 
      ? "عذراً، تم حظر استخدام الشات مؤقتاً لخروج المحادثة عن سياق الأعمال الرسمي لشركة Justefy."
      : "شكراً لك. تم حفظ بياناتك بنجاح ونقل ملف استفسارك لطاقم المبيعات والتسويق في Justefy، وسنتواصل معك حياً ومباشرة عبر الهاتف أو الواتساب لمتابعة طلبك! نهارك سعيد. 🚀",
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
        step: null, status: "open", lead: {}, 
        history: [{ role: "ai", text: "مرحباً، كيف يمكننا مساعدتك اليوم؟" }],
        stats: { messagesCount: 0, totalTokens: 0, startedAt: Date.now(), lastActivity: Date.now() }
      };
    }

    if (session.status === "closed") {
      return res.json({ status: "closed", aiResponse: "تم إيصال طلبكم لخدمة العملاء بنجاح، وسيتم التواصل معكم في أقرب وقت." });
    }

    // تسجيل رسالة المستخدم وزيادة العداد
    session.history.push({ role: "user", text });
    session.stats.messagesCount += 1;
    session.stats.lastActivity = Date.now();
    await saveSession(userId, session);

    // ========================================================
    // 🚨 1. خطوة الطوارئ الإجبارية (Force Collect Flow) - أعلى سلطة بكود الفلو
    // ========================================================
    if (session.step === "force_collect") {
      const words = text.split(/\s+/);
      const foundEmail = words.find(w => isValidEmail(w.toLowerCase()));
      
      if (foundEmail) {
        session.lead.email = foundEmail.toLowerCase();
        session.lead.name = text.replace(foundEmail, "").trim() || "عميل نفاد توكنز";
      } else {
        session.lead.name = text; // نعتبر النص كاملاً هو الاسم/الهاتف ونغلق فوراً لإنقاذ الـ Lead
      }

      const finalClosedResult = await closeChat(userId, session, "token_exhausted_force_collect");
      return res.json(finalClosedResult);
    }

    // ========================================================
    // 🎯 2. معالجة الـ Flows العادية (Name / Email)
    // ========================================================
    const inFlow = isInFlow(session);

    if (session.step === "name") {
      session.lead.name = text;
      session.step = "email";
      const aiResponse = "ممتاز 👌 ممكن الإيميل للتواصل؟";
      session.history.push({ role: "ai", text: aiResponse });
      await saveSession(userId, session);
      return res.json({ status: "ok", aiResponse });
    }

    if (session.step === "email") {
      const email = text.toLowerCase();
      if (!isValidEmail(email)) {
        const aiResponse = "الإيميل غير صحيح ❌ اكتب مثال: name@gmail.com";
        session.history.push({ role: "ai", text: aiResponse });
        await saveSession(userId, session);
        return res.json({ status: "ok", aiResponse });
      }
      session.lead.email = email;
      const closedResult = await closeChat(userId, session, "form_completed");
      return res.json(closedResult);
    }

    // التقاط نية الشراء الفورية لبدء تجميع الداتا يدوياً (صمام أمان)
    if (detectIntent(text) && !inFlow) {
      session.step = "name";
      session.lead.notes = text;
      const aiResponse = "ممتاز 🚀 خلينا نبدأ بالاسم 👇";
      session.history.push({ role: "ai", text: aiResponse });
      await saveSession(userId, session);
      return res.json({ status: "ok", aiResponse });
    }

    if (isAffirmative(text) && session.lead.service && !inFlow) {
      session.step = "name";
      const aiResponse = `تمام 👌 خلينا نكمل عرض ${session.lead.service}\n\nممكن اسمك؟`;
      session.history.push({ role: "ai", text: aiResponse });
      await saveSession(userId, session);
      return res.json({ status: "ok", aiResponse });
    }

    // تحديث بيانات الخدمة المهتم بها يدوياً في الخلفية
    const service = detectService(text);
    if (service && !inFlow) {
      session.lead.service = session.lead.service ? `${session.lead.service} + ${service.name}` : service.name;
    }

    // ========================================================
    // 🛡️ 3. استدعاء الـ AI للدردشة وحساب التوكنز وفحص الحظر
    // ========================================================
    const products = await buildProductsContext();
    const aiResult = await getAIResponse({
      history: session.history, 
      userMessage: text,
      odooData: products,
    });

    // 💡 تعديل صمام الحماية: لو العميل بيسلم أو بيسأل عن الحال، الغِ تفعيل قرار الحظر التلقائي من AI
    const friendly = isFriendlyGreeting(text);
    if (aiResult.shouldForceClose && !friendly) {
      const forceClosed = await closeChat(userId, session, "misbehave");
      return res.json(forceClosed);
    }

    // تسجيل استهلاك التوكنز للجلسة الحالية
    session.stats.totalTokens += aiResult.tokensUsed || 0;

    // 🚨 الفحص الحاسم لنفاذ التوكنز أو الرسائل العامة
    if (session.stats.totalTokens >= MAX_TOKENS || session.stats.messagesCount >= MAX_MESSAGES) {
      // أ) لو العميل كاتب بياناته مسبقاً، نقفل الشات فوراً ونصبها بأودو
      if (session.lead.name && session.lead.email) {
        const closed = await closeChat(userId, session, "max_resources_reached");
        return res.json(closed);
      }

      // ب) لو البيانات ناقصة، نحشره إجبارياً بـ force_collect ونطلب بياناته فوراً كآخر رسالة!
      session.step = "force_collect";
      const emergencyResponse = "⚠️ **تنويه:** لقد استهلكت الجلسة الحالية الحد الأقصى من الدعم الآلي الفوري المتوفر للاستفسارات العامة.\n\nمن فضلك، **اكتب لنا الآن (اسمك الكريم + إيميلك أو رقم هاتفك)** في رسالة واحدة هنا بالأسفل، ليقوم مستشار المبيعات والتسويق في Justefy بالتواصل المباشر معك حياً فوراً ومتابعة طلبك! 👇";
      
      session.history.push({ role: "ai", text: emergencyResponse });
      await saveSession(userId, session);
      return res.json({ status: "ok", aiResponse: emergencyResponse });
    }

    // إذا كان كل شيء سليم ونقاش طبيعي، نرسل رد الـ AI للمستخدم
    const finalAiResponse = aiResult.aiResponse || "أعتذر، هل يمكنك إعادة صياغة سؤالك؟ 🙏";
    session.history.push({ role: "ai", text: finalAiResponse });
    await saveSession(userId, session);

    return res.json({ status: "ok", aiResponse: finalAiResponse });

  } catch (error) {
    console.error("Chat Error:", error);
    return res.status(500).json({ status: "error", aiResponse: "تعذر الرد حالياً، حاول لاحقاً." });
  }
};

module.exports = { handleChat };