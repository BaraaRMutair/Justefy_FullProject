const { getAIResponse } = require("../services/aiService");
const { upsertLead } = require("../services/leadService");
const redis = require("../services/redisService");
const { getProductsCached } = require("../services/productService");

const MAX_MESSAGES = 25; 
const MAX_TOKENS = 10000;
const ONE_HOUR = 60 * 60 * 1000; 

const isValidEmailOrPhone = (word = "") => {
  const cleanWord = word.trim();
  const normalized = cleanWord.replace(/\s+/g, ""); 
  
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanWord);
  const isPhone = /^\+?[0-9]{7,15}$/.test(normalized); 
  
  return {
    isValid: isEmail || isPhone,
    matchedValue: isEmail ? cleanWord : normalized,
    type: isEmail ? "email" : "phone"
  };
};

const formatChatHistoryForOdoo = (historyArray = []) => {
  if (!historyArray.length) return "لا يوجد سجل رسائل متاح.";
  return historyArray
    .map(msg => `[${msg.role === "user" ? "العميل" : "Justefy AI"}]: ${msg.text}`)
    .join("\n-------------------------\n");
};

const detectService = (msg = "") => {
  const text = msg.toLowerCase();
  const services = [
    { keywords: ["seo", "سيو", "تحسين محركات"], name: "SEO" },
    { keywords: ["google", "ads", "جوجل", "ادز"], name: "Google Ads" },
    { keywords: ["سوشيال", "meta", "انستغرام", "تيكتوك", "سوشل"], name: "Social Media Ads" },
    { keywords: ["موقع", "ويب", "website", "برمجة"], name: "Website Development" },
    { keywords: ["بريد", "ايميل", "email", "حملات"], name: "Email Marketing" },
  ];
  return services.find(s => s.keywords.some(k => text.includes(k))) || null;
};

const isFriendlyGreeting = (msg = "") => {
  const text = msg.toLowerCase().trim();
  const greetings = ["مرحبا", "هلا", "اهلين", "كيفك", "كيف حالك", "اخبارك", "منور", "السلام عليكم", "سلام", "انت منيح", "شلونك", "يا هلا", "مساء الخير", "صباح الخير"];
  return greetings.some(g => text.includes(g));
};

const detectIntent = (msg = "") => {
  const text = msg.toLowerCase().trim();
  if (["تهبل", "اتهبل", "بمزح", "طخ", "العاب", "نكتة"].some(w => text.includes(w))) return false;
  
  const purchaseAction = ["مهتم", "ابدأ", "اشترك", "تواصل", "احجز", "اطلب", "اشتري", "معني"].some(w => text.includes(w));
  const wantsSomething = ["بدي", "اريد", "حاب", "حابب"].some(w => text.includes(w));
  const businessContext = ["سيو", "seo", "اعلان", "موقع", "ويب", "خدمة", "باقة", "سعر", "اسعار", "تكلفة", "تسويق"].some(w => text.includes(w));

  return purchaseAction || (wantsSomething && businessContext);
};

const getSession = async (id) => await redis.getSession(id);

const saveSession = async (id, session) => {
  if (session && session.stats) {
    session.stats.lastActivity = Date.now();
  }
  return redis.setSession(id, session);
};

const buildProductsContext = async () => {
  try {
    const res = await getProductsCached();
    if (!res?.ok || !res?.data?.length) return "";
    return res.data.map(p => `- ${p.name}: ${p.list_price} ₪`).join("\n");
  } catch { return ""; }
};

const closeChat = async (userId, session, reason = "auto_close") => {
  session.status = "closed";
  session.step = null; 
  session.closedAt = Date.now();
  const fullConversationLog = formatChatHistoryForOdoo(session.history);

  try {
    // 1️⃣ حماية إضافية وضمان تصفية تكرار الاهتمامات بشكل كامل عند الإغلاق
    const uniqueInterests = [...new Set(session.lead.interests || [])];
    const interestsSummary = uniqueInterests.length > 0 ? uniqueInterests.join(" + ") : "استفسار عام";

    await upsertLead({
      name: session.lead.name || "عميل شات تم إنهاء جلسته قسرياً",
      email: session.lead.email || `no-email-${userId}@justefy.com`, 
      phone: session.lead.phone || "",
      service: interestsSummary,
      notes: `🤖 [تقرير محادثة Justefy AI التلقائي]:\n\nسبب الإغلاق: ${reason}\n\nسجل الحوار بالتفصيل:\n\n${fullConversationLog}`,
      source: `chatbot_${reason}`, 
    });
    console.log(`✅ [Odoo] تم حفظ العميل ${userId} بنجاح. الـ Source: chatbot_${reason}`);
  } catch (odooError) {
    console.error("❌ فشل إرسال البيانات لأودو:", odooError);
  }

  await saveSession(userId, session);

  return {
    status: "closed",
    action: "hard_close",
    closedAt: session.closedAt,
    aiResponse: reason === "misbehave" 
      ? "عذراً، تم حظر استخدام الشات نهائياً لخروجك عن سياق الاستخدام المسموح لخدماتنا."
      : "شكراً لك. تم تزويدنا بوسيلة الاتصال بنجاح، ونقل ملف استفسارك لطاقم المبيعات والتسويق في Justefy، وسنتواصل معك حياً ومباشرة فوراً! نهارك سعيد. 🚀",
  };
};

const handleChat = async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ status: "error", aiResponse: "بيانات غير مكتملة" });
    }

    let session = await getSession(userId);
    const text = message.trim();

    // فحص تنظيف الجلسة المنتهية من Redis
    if (
      session?.status === "closed" &&
      session?.closedAt &&
      Date.now() - session.closedAt > ONE_HOUR
    ) {
      await redis.deleteSession(userId);
      session = null;
      console.log(`♻️ [Redis] تم حذف جلسة المستخدم ${userId} لمرور أكثر من ساعة.`);
    }

    if (!session) {
      session = {
        step: null, status: "open", 
        lead: { interests: [] }, 
        behaviorWarnings: 0, salesSignals: 0,
        history: [{ role: "ai", text: "مرحباً، كيف يمكننا مساعدتك اليوم؟" }],
        stats: { messagesCount: 0, totalTokens: 0, startedAt: Date.now(), lastActivity: Date.now() }
      };
    }

    if (session.status === "closed") {
      return res.json({ 
        status: "closed", 
        action: "hard_close", 
        closedAt: session.closedAt, 
        aiResponse: "تم إيصال طلبكم لخدمة العملاء بنجاح، وسيتم التواصل معكم في أقرب وقت." 
      });
    }

    // 🛡️ Resource Check
    const isResourceExhausted = session.stats.totalTokens >= MAX_TOKENS || session.stats.messagesCount >= MAX_MESSAGES;
    if (isResourceExhausted && session.step !== "force_collect" && session.step !== "collect_before_close") {
      if (session.lead.name && (session.lead.email || session.lead.phone)) {
        const closed = await closeChat(userId, session, "max_resources_reached");
        return res.json(closed);
      }
      session.step = "force_collect";
      const emergencyResponse = "⚠️ **تنويه:** لقد استهلكت الجلسة الحالية الحد الأقصى من الدعم الآلي المتوفر.\n\nمن فضلك، **اكتب لنا الآن (اسمك الكريم + إيميلك أو رقم هاتفك)** ليقوم مستشار المبيعات بالتواصل المباشر معك فوراً! 👇";
      session.history.push({ role: "ai", text: emergencyResponse });
      await saveSession(userId, session);
      return res.json({ status: "ok", action: "keep_open_force_collect", aiResponse: emergencyResponse });
    }

    // 🚨 Force Collect Flow
    if (session.step === "force_collect") {
      const words = text.split(/\s+/);
      let contactObj = null;
      for (const w of words) {
        const check = isValidEmailOrPhone(w);
        if (check.isValid) { contactObj = check; break; }
      }
      
      if (!contactObj) {
        return res.json({ 
          status: "ok", 
          action: "keep_open_force_collect", 
          aiResponse: "❌ يرجى إدخال بريد إلكتروني صالح أو رقم هاتف (مثال: name@gmail.com أو 0599xxxxxx) لنتمكن من حفظ طلبك 👇" 
        });
      }

      if (contactObj.type === "email") session.lead.email = contactObj.matchedValue.toLowerCase();
      else session.lead.phone = contactObj.matchedValue;
      
      const namePart = words.filter(w => !isValidEmailOrPhone(w).isValid).join(" ");
      session.lead.name = namePart.trim() || "عميل محتمل جاد";
      
      const finalClosedResult = await closeChat(userId, session, "token_exhausted_force_collect");
      return res.json(finalClosedResult);
    }

    // 🔥 Collect Before Close Flow
    if (session.step === "collect_before_close") {
      const words = text.split(/\s+/);
      let contactObj = null;
      for (const w of words) {
        const check = isValidEmailOrPhone(w);
        if (check.isValid) { contactObj = check; break; }
      }
      
      if (!contactObj) {
        return res.json({ 
          status: "ok", 
          action: "keep_open_force_collect", 
          aiResponse: "🛑 لا يمكن مراجعة طلبك بدون وسيلة تواصل صالحة. الرجاء كتابة (اسمك + إيميلك أو رقم هاتفك) بشكل صحيح هلقيت 👇" 
        });
      }

      if (contactObj.type === "email") session.lead.email = contactObj.matchedValue.toLowerCase();
      else session.lead.phone = contactObj.matchedValue;

      const namePart = words.filter(w => !isValidEmailOrPhone(w).isValid).join(" ");
      session.lead.name = namePart.trim() || "عميل مشاغب موثق";
      
      const finalClosedResult = await closeChat(userId, session, "misbehave");
      return res.json(finalClosedResult);
    }

    // 🎯 Name Flow
    if (session.step === "name") {
      session.lead.name = text;
      session.step = "email";
      const aiResponse = "ممتاز 👌 ممكن الإيميل أو رقم الهاتف للتواصل ومتابعة طلبك؟";
      session.history.push({ role: "user", text }, { role: "ai", text: aiResponse });
      session.stats.messagesCount += 1;
      await saveSession(userId, session);
      return res.json({ status: "ok", aiResponse });
    }

    // 🎯 Email/Phone Flow
    if (session.step === "email") {
      const words = text.split(/\s+/);
      let contactObj = null;
      for (const w of words) {
        const check = isValidEmailOrPhone(w);
        if (check.isValid) { contactObj = check; break; }
      }

      if (!contactObj) {
        const aiResponse = "وسيلة الاتصال غير صحيحة ❌ اكتب إيميل أو رقم هاتف صالح، مثال: name@gmail.com أو 0599xxxxxx";
        session.history.push({ role: "user", text }, { role: "ai", text: aiResponse });
        session.stats.messagesCount += 1;
        await saveSession(userId, session);
        return res.json({ status: "ok", aiResponse });
      }

      if (contactObj.type === "email") session.lead.email = contactObj.matchedValue.toLowerCase();
      else session.lead.phone = contactObj.matchedValue;

      session.history.push({ role: "user", text });
      session.stats.messagesCount += 1;
      const closedResult = await closeChat(userId, session, "form_completed");
      return res.json(closedResult);
    }

    // 🛡️ [LAYER 1]: HARD GUARD - منع الـ AI تماماً من استلام التحيات الصريحة
    if (isFriendlyGreeting(text)) {
      const helloResponse = "أهلاً وسهلاً بك في Justefy! 👋 نورتنا يا غالي. كيف بقدر أساعدك اليوم في تطوير باقات الـ SEO، أو إدارة إعلانات جوجل والسوشيال ميديا لمشروعك؟";
      
      session.history.push({ role: "user", text }, { role: "ai", text: helloResponse });
      session.stats.messagesCount += 1;
      await saveSession(userId, session);
      return res.json({ status: "ok", aiResponse: helloResponse });
    }

    // 🔎 [LAYER 2]: BUSINESS INTENT DETECTION 
    if (detectIntent(text) && session.step === null) {
      session.step = "name";
      session.lead.notes = text;
      const aiResponse = "ممتاز 🚀 خلينا نبدأ بالاسم الكريم لتسجيل طلبك وعمل اللازم 👇";
      session.history.push({ role: "user", text }, { role: "ai", text: aiResponse });
      session.stats.messagesCount += 1;
      await saveSession(userId, session);
      return res.json({ status: "ok", aiResponse });
    }

    // 1️⃣ رصد الخدمات وتخزينها الفوري بدون تكرار باستخدام الـ Set الـ Inline
    const service = detectService(text);
    if (service) {
      session.lead.interests = [...new Set([...session.lead.interests, service.name])];
    }

    // 3️⃣ الفرز الدقيق لمنع الـ Overlap لحالات الأسئلة التعليمية المدمجة مع نية حقيقية للشراء
    const salesKeywords = ["سعر", "اسعار", "تكلفة", "كم", "باقة", "اشتراك", "خدمة", "إعلان", "اعلان", "موقع", "سيو", "seo", "عملاء", "بكم", "تكلفتها", "تفاصيل"];
    const educationalKeywords = ["شو يعني", "ايش هو", "ما هو", "معنى", "تعريف", "كيف بيشتغل", "شرح"];
    
    const hasSalesSignal = salesKeywords.some(k => text.toLowerCase().includes(k));
    const isStrictlyEducational = educationalKeywords.some(k => text.toLowerCase().includes(k)) && 
                                  !["سعر", "تكلفة", "بكم", "كم", "باقة"].some(k => text.toLowerCase().includes(k));

    const validSignal = hasSalesSignal && !isStrictlyEducational;

    if (validSignal) {
      session.salesSignals = (session.salesSignals || 0) + 1;
    }

    session.history.push({ role: "user", text });
    session.stats.messagesCount += 1;

    // فحص تحويل العميل الجاد
    const shouldTriggerLeadForm = 
      (session.salesSignals >= 2) || 
      (service && session.stats.messagesCount >= 3 && session.salesSignals >= 1);

    if (shouldTriggerLeadForm && !session.lead.name && session.step === null) {
      session.step = "name";
      const aiResponse = "يسعدني جداً اهتمامك بخدمات التسويق الرقمي والمواقع في Justefy ومستعد أعطيك كافة التفاصيل والأسعار 👌 لكن قبل ما نكمل، شو اسمك الكريم عشان أسجله عندي؟";
      session.history.push({ role: "ai", text: aiResponse });
      await saveSession(userId, session);
      return res.json({ status: "ok", aiResponse: aiResponse });
    }

    // 🥉 [LAYER 3]: AI GATEWAY
    const recentHistory = session.history.slice(-12);
    const products = await buildProductsContext();
    const aiResult = await getAIResponse({
      history: recentHistory,
      userMessage: text, 
      odooData: products,
    });

    // 4️⃣ تحويل صريح وآمن لحماية العداد الفوري للتوكنز من الـ undefined أو الـ string
    session.stats.totalTokens += Number(aiResult.tokensUsed || 0);

    // 2️⃣ إضافة حالة الـ neutral الصريحة في طبقة القرار لمنع الـ Implicit Bias
    const isUnsafeAI = aiResult.evaluation === "unsafe" || aiResult.evaluation === "kick";
    const isOutOfScope = aiResult.evaluation === "out_of_scope";

    if (isUnsafeAI) {
      if (session.lead.name && (session.lead.email || session.lead.phone)) {
        const closed = await closeChat(userId, session, "misbehave");
        return res.json(closed);
      }
      session.step = "collect_before_close";
      const lockResponse = "🛑 عذراً، يبدو أن المحادثة خرجت عن سياق العمل والمساعدة المسموحة لشركة Justefy.\n\nقبل قفل الجلسة، **يرجى تزويدنا باسمك وإيميلك أو رقم هاتفك** لمراجعة طلبك يدوياً. 👇";
      session.history.push({ role: "ai", text: lockResponse });
      await saveSession(userId, session);
      return res.json({ status: "ok", action: "keep_open_force_collect", aiResponse: lockResponse });
    }

    if (isOutOfScope) {
      session.behaviorWarnings = (session.behaviorWarnings || 0) + 1;

      if (session.behaviorWarnings === 1) {
        const warnMsg = "أنا مساعد لشركة Justefy المتخصص بخدمات التسويق الرقمي والمواقع. هل تحتاج مساعدة في باقاتنا؟";
        session.history.push({ role: "ai", text: warnMsg });
        await saveSession(userId, session);
        return res.json({ status: "ok", aiResponse: warnMsg });
      } 
      
      if (session.behaviorWarnings === 2) {
        const warnMsg = "⚠️ تحذير: أنا مخصص فقط لخدمات Justefy (إعلانات، SEO، مواقع). الرجاء الالتزام بذلك وإلا سيتم إنهاء المحادثة.";
        session.history.push({ role: "ai", text: warnMsg });
        await saveSession(userId, session);
        return res.json({ status: "ok", aiResponse: warnMsg });
      }

      if (session.behaviorWarnings >= 3) {
        if (session.lead.name && (session.lead.email || session.lead.phone)) {
          const closed = await closeChat(userId, session, "misbehave");
          return res.json(closed);
        }
        session.step = "collect_before_close";
        const lockResponse = "🛑 نظراً لتكرار تجاوز سياق العمل المسموح، سيتم إنهاء الدردشة الآلية.\n\nالرجاء كتابة **اسمك + رقم هاتفك أو إيميلك** الحين لمتابعة استفسارك مع الإدارة يدوياً. 👇";
        session.history.push({ role: "ai", text: lockResponse });
        await saveSession(userId, session);
        return res.json({ status: "ok", action: "keep_open_force_collect", aiResponse: lockResponse });
      }
    }

    // 🛡️ Token Check
    if (session.stats.totalTokens >= MAX_TOKENS && !session.step) {
      if (!session.lead.name || (!session.lead.email && !session.lead.phone)) {
        session.step = "force_collect";
        const emergencyResponse = "⚠️ لقد وصلت للحد الأقصى من الاستشارات المجانية المتاحة عبر الجلسة. الرجاء كتابة اسمك وإيميلك أو رقم هاتفك للتواصل معك فوراً يدوياً.";
        session.history.push({ role: "ai", text: emergencyResponse });
        await saveSession(userId, session);
        return res.json({ status: "ok", action: "keep_open_force_collect", aiResponse: emergencyResponse });
      } else {
        const closed = await closeChat(userId, session, "max_resources_reached");
        return res.json(closed);
      }
    }

    // المسار الطبيعي (Safe / Neutral)
    const finalAiResponse = aiResult.aiResponse || "أعتذر، هل يمكنك إعادة صياغة سؤالك؟ 🙏";
    session.history.push({ role: "ai", text: finalAiResponse });
    await saveSession(userId, session);

    return res.json({ status: "ok", aiResponse: finalAiResponse });

  } catch (error) {
    console.error("Chat Error:", error);
    return res.status(500).json({ status: "error", aiResponse: "تعذر الرد حالياً، حاول لاحقاً." });
  }
};

const getChatStatus = async (req, res) => {
  try {
    const { userId } = req.query; 
    if (!userId) {
      return res.status(400).json({ status: "error", message: "المعرّف مطلوب" });
    }

    const session = await getSession(userId);
    if (!session) {
      return res.json({ status: "open", message: "جلسة جديدة بالكامل" });
    }

    if (
      session.status === "closed" && 
      session.closedAt && 
      (Date.now() - session.closedAt > ONE_HOUR)
    ) {
      await redis.deleteSession(userId); 
      return res.json({ 
        status: "expired", 
        message: "انتهت صلاحية الجلسة المغلقة وتم تصفيرها من قاعدة البيانات"
      });
    }

    return res.json({
      status: session.status || "open",
      closedAt: session.closedAt || null
    });
  } catch (error) {
    console.error("Status Sync Error:", error);
    return res.status(500).json({ status: "error", message: "خطأ داخلي في الخادم" });
  }
};

module.exports = { 
  handleChat,
  getChatStatus 
};