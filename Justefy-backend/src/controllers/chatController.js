const { getAIResponse } = require("../services/aiService");
const { upsertLead } = require("../services/leadService");
const redis = require("../services/redisService"); 
const { getProductsCached } = require("../services/productService");

const MAX_MESSAGES = 25; 
const MAX_TOKENS = 10000;
const ONE_HOUR = 60 * 60 * 1000; 
const DECAY_TIME_WINDOW = 5 * 60 * 1000; 
const HISTORY_CAP = 40; 

const STATES = {
  INTENT_CONFIRM: "intent_confirm",
  LEAD_NAME: "lead_name",
  LEAD_CONTACT: "lead_contact",
  FORCE_COLLECT: "force_collect",
  COLLECT_BEFORE_CLOSE: "collect_before_close"
};

// 🧠 تحسين 6: تعريف Enum صارم وموحد لمخرجات الـ AI وتقليل الـ Coupling
const AI_EVAL = {
  SAFE: "normal",
  SAFE: "safe",
  OUT_OF_SCOPE: "out_of_scope"
};

// ==========================================
// ⚙️ SYSTEM NORMALIZATION & IMMUTABLE LAYER
// ==========================================

// 🧠 تحسين 3: طبقة الـ Normalization الشاملة لمنع الـ Crashes الصامتة بسبب الجلسات المشوهة
const normalizeSession = (rawSession) => {
  const session = rawSession ? structuredClone(rawSession) : {};
  
  session._version = Number(session._version) || 1;
  session._committedMessageId = session._committedMessageId || null;
  session.status = session.status || "open";
  session.step = session.step || null;
  session.behaviorWarnings = Number(session.behaviorWarnings) || 0;
  session.salesSignals = Number(session.salesSignals) || 0;
  session.lastUserMessage = session.lastUserMessage || "";
  
  session.lead = session.lead || {};
  session.lead.interests = Array.isArray(session.lead.interests) ? session.lead.interests : [];
  session.lead.score = Number(session.lead.score) || 0;
  session.lead.name = session.lead.name || null;
  session.lead.email = session.lead.email || null;
  session.lead.phone = session.lead.phone || null;

  session.history = Array.isArray(session.history) ? session.history : [];
  
  session.stats = session.stats || {};
  session.stats.userMessagesCount = Number(session.stats.userMessagesCount) || 0;
  session.stats.messagesCount = Number(session.stats.messagesCount) || 0;
  session.stats.totalTurns = Number(session.stats.totalTurns) || 0;
  session.stats.totalTokens = Number(session.stats.totalTokens) || 0;
  session.stats.startedAt = session.stats.startedAt || Date.now();
  session.stats.lastActivity = session.stats.lastActivity || Date.now();

  return session;
};

const sanitizeHistory = (historyArray = []) => {
  return historyArray.map(msg => ({
    role: msg.role,
    content: msg.content || msg.text || "",
    timestamp: msg.timestamp || Date.now()
  }));
};

// 🧠 تحسين 1: فصل الـ Append البرمجي للـ Session عن عملية الـ DB Write لحسم الـ Double Commit
const appendMessageToSession = (session, role, content, messageId = null) => {
  const updatedSession = structuredClone(session);

  if (role === "user" && messageId) {
    updatedSession._committedMessageId = messageId;
  }

  updatedSession.history = sanitizeHistory(updatedSession.history || []);
  updatedSession.history.push({ role, content, timestamp: Date.now() });
  
  if (updatedSession.history.length > HISTORY_CAP) {
    updatedSession.history.shift();
  }
  
  updatedSession.stats.totalTurns += 1;
  
  if (role === "user") {
    updatedSession.stats.userMessagesCount += 1;
    updatedSession.stats.messagesCount = updatedSession.stats.userMessagesCount;
    updatedSession.lastUserMessage = content.toLowerCase().trim();
  }
  
  updatedSession.stats.lastActivity = Date.now();
  return updatedSession;
};

// 🧠 تحسين 4: توحيد مصب الـ DB Writes بالكامل تحت مظلة الآلية الذرية المقفلة لمنع الـ Race Conditions
const persistSessionAtomically = async (userId, session, messageId = null) => {
  const currentVersion = session._version || 1;
  session._version = currentVersion + 1;

  const lockAcquired = await redis.saveSessionLocked(userId, session, currentVersion, messageId);
  if (!lockAcquired) {
    throw new Error(`🔒 [Distributed Lock Contention] فشل الحفظ الآمن للجلسة ${userId} للرسالة ${messageId}`);
  }
  return session;
};

const applyScoreDecay = (session) => {
  const updatedSession = structuredClone(session);
  const now = Date.now();
  const lastActivity = updatedSession.stats.lastActivity || now;
  const idleTime = now - lastActivity;

  if (idleTime > DECAY_TIME_WINDOW && updatedSession.lead.score > 0) {
    const decayPoints = Math.floor(idleTime / DECAY_TIME_WINDOW);
    updatedSession.lead.score = Math.max(0, updatedSession.lead.score - decayPoints);
  }
  return updatedSession;
};

const isValidEmailOrPhone = (word = "") => {
  const cleanWord = word.trim();
  const normalized = cleanWord.replace(/\s+/g, "");
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanWord);
  const isPhone = /^\+?[0-9]{7,15}$/.test(normalized);
  return { isValid: isEmail || isPhone, matchedValue: isEmail ? cleanWord : normalized, type: isEmail ? "email" : "phone" };
};

const formatChatHistoryForOdoo = (historyArray = []) => {
  const cleanHistory = sanitizeHistory(historyArray);
  if (!cleanHistory.length) return "لا يوجد سجل رسائل متاح.";
  return cleanHistory
    .map(msg => `[${msg.role === "user" ? "العميل" : "Justefy AI"}]: ${msg.content}`)
    .join("\n-------------------------\n");
};

const detectService = (normalizedText = "") => {
  const isFreeContext = normalizedText.includes("مجاني") || normalizedText.includes("ببلاش");
  const services = [
    { pattern: /(seo|سيو|محركات|أرشفة|ارشفة)/i, name: "SEO", skipIfFree: true },
    { pattern: /(google|ads|جوجل|ادز|إعلانات.*جوجل)/i, name: "Google Ads", skipIfFree: false },
    { pattern: /(سوشيال|سوشل|فيسبوك|انستغرام|تيكتوك|ميتا|meta|facebook|tiktok)/i, name: "Social Media Ads", skipIfFree: false },
    { pattern: /(موقع|ويب|صفحة.*هبوط|برمجة|متجر|website|landing)/i, name: "Website Development", skipIfFree: false },
    { pattern: /(بريد|إيميل|ايميل|حملات.*بريدية|email)/i, name: "Email Marketing", skipIfFree: false },
  ];
  const found = services.find(s => !(s.skipIfFree && isFreeContext) && s.pattern.test(normalizedText));
  return found || null;
};

const isFriendlyGreeting = (normalizedText = "") => {
  const greetings = ["مرحبا", "هلا", "اهلين", "كيفك", "كيف حالك", "اخبارك", "منور", "السلام عليكم", "سلام", "يا هلا", "مساء الخير", "صباح الخير"];
  return greetings.some(g => normalizedText.includes(g));
};

const parseIntentMatrix = (normalizedText = "") => {
  if (["تهبل", "اتهبل", "بمزح", "طخ", "العاب", "نكتة"].some(w => normalizedText.includes(w))) return "COLD";
  const hasHotKeywords = ["اشترك", "احجز", "ابدأ", "اشتري", "تواصل", "فوراً", "يلا", "سجلني"].some(w => normalizedText.includes(w));
  const hasWantKeywords = ["بدي", "اريد", "حاب", "حابب"].some(w => normalizedText.includes(w));
  const hasBusinessContext = ["سعر", "اسعار", "تكلفة", "باقة", "سيو", "seo", "اعلان", "موقع", "بكم"].some(w => normalizedText.includes(w));
  
  if (hasHotKeywords) return "HOT";
  if (hasWantKeywords && hasBusinessContext) return "WARM";
  if (hasBusinessContext || hasWantKeywords) return "WARM";
  return "COLD";
};

// 🧠 تحسين 5: فك الارتباط الاستباقي عن الـ Side-effects؛ الاعتماد كلياً على معايير معزولة عن معالجة حقل النص المكرر ميكانيكياً
const calculateMessageScore = (normalizedText = "", session) => {
  const intent = parseIntentMatrix(normalizedText);
  const salesKeywords = ["سعر", "اسعار", "تكلفة", "كم", "باقة", "اشتراك", "بكم", "سعره"];

  let scoreForThisMessage = 0;
  if (intent === "HOT") scoreForThisMessage = 4;
  else if (intent === "WARM") scoreForThisMessage = 2;
  else if (salesKeywords.some(k => normalizedText.includes(k))) scoreForThisMessage = 1;

  return Math.min(scoreForThisMessage, 3);
};

const evaluateSafetyStrictRules = (normalizedText) => {
  const unsafePatterns = /(سب|شتم|مسببة|كس|كـس|منيوك|قحبة|طيز|عرص|كلب|حمار|غبي)/i;
  if (unsafePatterns.test(normalizedText)) return AI_EVAL.UNSAFE;
  return null; 
};

const validateAndParseAiOutput = (rawResult) => {
  const defaultFallback = { aiResponse: "أنا هنا لمساعدتك في خدمات Justefy التسويقية، هل يمكنك توضيح استفسارك؟ 🙏", evaluation: AI_EVAL.SAFE, tokensUsed: 0 };
  if (!rawResult) return defaultFallback;
  try {
    return {
      aiResponse: rawResult.aiResponse || defaultFallback.aiResponse,
      evaluation: Object.values(AI_EVAL).includes(rawResult.evaluation) ? rawResult.evaluation : AI_EVAL.SAFE,
      tokensUsed: Number(rawResult.tokensUsed) || 0
    };
  } catch { return defaultFallback; }
};

const buildProductsContext = async () => {
  try {
    const res = await getProductsCached();
    if (!res?.ok || !res?.data?.length) return "";
    return res.data.slice(0, 5).map(p => `- ${p.name}: ${p.list_price} ₪`).join("\n");
  } catch { return ""; }
};

const closeChat = async (userId, session, reason = "auto_close", lastAiMessage = "") => {
  let updatedSession = structuredClone(session);
  updatedSession.status = "closed";
  updatedSession.step = null; 
  updatedSession.closedAt = Date.now();

  if (lastAiMessage) {
    updatedSession.history = sanitizeHistory(updatedSession.history || []);
    updatedSession.history.push({ role: "ai", content: lastAiMessage, timestamp: Date.now() });
  }

  // 🧠 تحسين 4: إغلاق الجلسة يمر إجبارياً من نفس الـ Locked Architecture لضمان التماثل
  await persistSessionAtomically(userId, updatedSession);

  const fullConversationLog = formatChatHistoryForOdoo(updatedSession.history);
  try {
    const uniqueInterests = [...new Set(updatedSession.lead.interests || [])];
    const interestsSummary = uniqueInterests.length > 0 ? uniqueInterests.join(" + ") : "استفسار عام";

    await upsertLead({
      name: updatedSession.lead.name || "عميل شات تم إنهاء جلسته قسرياً",
      email: updatedSession.lead.email?.toLowerCase().trim() || `no-email-${userId}@justefy.com`, 
      phone: updatedSession.lead.phone ? updatedSession.lead.phone.replace(/\s+/g, "") : "", 
      service: interestsSummary,
      notes: `🤖 [تقرير محادثة Justefy AI التلقائي]:\n\nسبب الإغلاق: ${reason}\n\nسجل الحوار بالتفصيل:\n\n${fullConversationLog}`,
      source: `chatbot_${reason}`, 
    });
  } catch (odooError) {
    console.error("❌ [Odoo Sync Fail]:", odooError);
  }

  return {
    status: "closed",
    action: "hard_close",
    closedAt: updatedSession.closedAt,
    aiResponse: lastAiMessage || "شكراً لك، سنتواصل معك فوراً! 🚀",
  };
};

// ==========================================
// 🤖 PURE STATE MACHINE HANDLERS (Absolute Pure)
// ==========================================
// 🧠 تحسين 2: تحويل الـ Handlers بالكامل إلى Pure Functions تستقبل الـ State وترجع نسخة مطورة كلياً دون التعديل عليها ميكانيكياً داخلياً
const stateHandlers = {
  [STATES.INTENT_CONFIRM]: async (normalizedText, session, rawMessage) => {
    const updatedSession = structuredClone(session);
    const confirmedIntent = ["جاهز", "نعم", "فعلي", "شراء", "اه", "ايوه", "يس", "صحيح"].some(w => normalizedText.includes(w));
    const justExploring = ["استفسار", "بسأل", "بشوف", "لا", "فقط"].some(w => normalizedText.includes(w));

    if (confirmedIntent) {
      updatedSession.step = STATES.LEAD_NAME; 
      return { updatedSession, nextStep: STATES.LEAD_NAME, aiResponse: "على بركة الله 🚀 شو اسمك الكريم عشان نسجله عندنا ونجهز طلبك بشكل رسمي؟ 👇" };
    } 
    
    if (justExploring) {
      updatedSession.step = null; 
      updatedSession.lead.score = 1; 
      return { updatedSession, nextStep: null, aiResponse: "تمام غالي، ولا يهمك 👍 خذ راحتك بالاستفسار وعيوني إلك. شو حابب تعرف كمان عن باقاتنا؟" };
    }

    return { updatedSession, nextStep: STATES.INTENT_CONFIRM, aiResponse: "لطفاً غالي وعلشان نختصر وقتك ونوجهك صح: هل أنت جاهز لطلب باقة تسويقية والبدء معنا الآن؟ اكتب (نعم/جاهز) أو إذا بدك تسأل اكتب (مجرد استفسار). 🙏" };
  },

  [STATES.LEAD_NAME]: async (normalizedText, session, rawMessage) => {
    const updatedSession = structuredClone(session);
    updatedSession.lead.name = rawMessage.trim().slice(0, 80);
    updatedSession.step = STATES.LEAD_CONTACT; 
    return { updatedSession, nextStep: STATES.LEAD_CONTACT, aiResponse: "ممتاز 👌 ممكن الإيميل أو رقم الهاتف للتواصل ومتابعة طلبك؟" };
  },

  [STATES.LEAD_CONTACT]: async (normalizedText, session, rawMessage) => {
    const updatedSession = structuredClone(session);
    const words = rawMessage.trim().split(/\s+/);
    let contactObj = null;
    for (const w of words) {
      const check = isValidEmailOrPhone(w);
      if (check.isValid) { contactObj = check; break; }
    }

    if (!contactObj) {
      return { updatedSession, nextStep: STATES.LEAD_CONTACT, aiResponse: "وسيلة الاتصال غير صحيحة ❌ اكتب إيميل أو رقم هاتف صالح، مثال: name@gmail.com أو 0599xxxxxx" };
    }

    if (contactObj.type === "email") updatedSession.lead.email = contactObj.matchedValue.toLowerCase();
    else updatedSession.lead.phone = contactObj.matchedValue;
    
    const isNowComplete = updatedSession.lead.name && (updatedSession.lead.email || updatedSession.lead.phone);
    if (isNowComplete) {
      return { updatedSession, nextStep: "CLOSE_FORM_COMPLETED", aiResponse: "شكراً لك. تم تزويدنا بوسيلة الاتصال بنجاح، ونقل ملف استفسارك لطاقم المبيعات في Justefy، وسنتواصل معك فوراً! 🚀" };
    } else {
      updatedSession.step = STATES.FORCE_COLLECT;
      return { updatedSession, nextStep: STATES.FORCE_COLLECT, aiResponse: "تنبيه: البيانات المدخلة غير كافية، يرجى كتابة الاسم ورقم الهاتف بوضوح لضمان حجز الخدمة 👇" };
    }
  },

  [STATES.FORCE_COLLECT]: async (normalizedText, session, rawMessage) => {
    const updatedSession = structuredClone(session);
    const words = rawMessage.trim().split(/\s+/);
    let contactObj = null;
    for (const w of words) {
      const check = isValidEmailOrPhone(w);
      if (check.isValid) { contactObj = check; break; }
    }
    
    if (!contactObj) {
      return { updatedSession, nextStep: STATES.FORCE_COLLECT, aiResponse: "نود جداً خدمتك ومتابعة طلبك المستحق، يرجى إدخال إيميل صالح أو رقم هاتف لنرسل ملفك للإدارة الحين 👇" };
    }

    if (contactObj.type === "email") updatedSession.lead.email = contactObj.matchedValue.toLowerCase();
    else updatedSession.lead.phone = contactObj.matchedValue;
    
    const namePart = words.filter(w => !isValidEmailOrPhone(w).isValid).join(" ");
    updatedSession.lead.name = namePart.trim() || "عميل محتمل جاد";
    
    return { updatedSession, nextStep: "CLOSE_TOKEN_EXHAUSTED", aiResponse: "شكراً لك. تم تزويدنا بوسيلة الاتصال بنجاح وسنتواصل معك حياً ومباشرة فوراً! 🚀" };
  },

  [STATES.COLLECT_BEFORE_CLOSE]: async (normalizedText, session, rawMessage) => {
    const updatedSession = structuredClone(session);
    const words = rawMessage.trim().split(/\s+/);
    let contactObj = null;
    for (const w of words) {
      const check = isValidEmailOrPhone(w);
      if (check.isValid) { contactObj = check; break; }
    }
    
    if (!contactObj) {
      return { updatedSession, nextStep: STATES.COLLECT_BEFORE_CLOSE, aiResponse: "حفاظاً على وقتك، لا يمكننا مراجعة المشكلة بدون وسيلة اتصال رسمية. يرجى كتابة البيانات بشكل صحيح هلقيت 👇" };
    }

    if (contactObj.type === "email") updatedSession.lead.email = contactObj.matchedValue.toLowerCase();
    else updatedSession.lead.phone = contactObj.matchedValue;

    const namePart = words.filter(w => !isValidEmailOrPhone(w).isValid).join(" ");
    updatedSession.lead.name = namePart.trim() || "عميل مشاغب موثق";
    
    return { updatedSession, nextStep: "CLOSE_MISBEHAVE", aiResponse: "عذراً، تم حظر استخدام الشات نهائياً لخروجك عن سياق الاستخدام المسموح لخدماتنا." };
  }
};

// ==========================================
// 🚀 الـ MAIN ORCHESTRATION CONTROLLER
// ==========================================

const handleChat = async (req, res) => {
  try {
    const { userId, message, messageId = null } = req.body; 
    if (!userId || !message) {
      return res.status(400).json({ status: "error", aiResponse: "بيانات غير مكتملة" });
    }

    const rawSession = await redis.getSession(userId);
    
    // 🧠 تحسين 3: تمرير الجلسة فوراً عبر الـ Normalization Layer لمنع الـ Null crashes نهائياً
    let currentSession = normalizeSession(rawSession);
    const normalizedText = message.toLowerCase().trim();

    // فحص صلاحية المعرف الزمني لرسائل المستخدم لمنع الـ Race Condition والتكرار الموزع
    if (messageId && currentSession._committedMessageId === messageId) {
      console.warn(`🛑 [Distributed Deduplication Block] الرسالة ${messageId} عولجت مسبقاً. تم إلغاء الطلب المكرر.`);
      return res.json({ status: "ok", aiResponse: "تم استلام رسالتك وجاري معالجتها." });
    }

    if (currentSession.status === "closed" && currentSession.closedAt && Date.now() - currentSession.closedAt > ONE_HOUR) {
      await redis.deleteSession(userId);
      currentSession = normalizeSession(null);
    }

    if (currentSession.status === "closed") {
      return res.json({ status: "closed", action: "hard_close", closedAt: currentSession.closedAt, aiResponse: "تم إيصال طلبكم لخدمة العملاء بنجاح." });
    }

    currentSession = applyScoreDecay(currentSession);

    // 🛡️ طبقة الـ Firewall الصلبة (Rule-Based Shield)
    const strictSafetyBreach = evaluateSafetyStrictRules(normalizedText);
    if (strictSafetyBreach === AI_EVAL.UNSAFE) {
      const lockResponse = "🛑 عذراً، تم رصد تجاوز لسياق العمل والمساعدة المسموحة لشركة Justefy. يرجى تزويدنا باسمك ورقم هاتفك لمراجعة طلبك يدوياً. 👇";
      currentSession.step = STATES.COLLECT_BEFORE_CLOSE;
      currentSession = appendMessageToSession(currentSession, "user", message, messageId);
      currentSession = appendMessageToSession(currentSession, "ai", lockResponse);
      await persistSessionAtomically(userId, currentSession, messageId);
      return res.json({ status: "ok", action: "keep_open_force_collect", aiResponse: lockResponse });
    }

    // 🧠 تحسين 1: إنفاذ الـ Single Commit Rule لرسالة المستخدم فور تخطي بوابات الـ Validation وبدء الـ Flow الفعلي
    currentSession = appendMessageToSession(currentSession, "user", message, messageId);

    // 🤖 معالجة الـ State Machine
    if (currentSession.step && stateHandlers[currentSession.step]) {
      const handlerResult = await stateHandlers[currentSession.step](normalizedText, currentSession, message);
      
      // التحديث الشامل للـ Session الـ Pure الجديد الراجع من الـ Handler
      currentSession = handlerResult.updatedSession;
      
      if (handlerResult.nextStep === "CLOSE_FORM_COMPLETED") {
        return res.json(await closeChat(userId, currentSession, "form_completed", handlerResult.aiResponse));
      } else if (handlerResult.nextStep === "CLOSE_TOKEN_EXHAUSTED") {
        return res.json(await closeChat(userId, currentSession, "token_exhausted_force_collect", handlerResult.aiResponse));
      } else if (handlerResult.nextStep === "CLOSE_MISBEHAVE") {
        return res.json(await closeChat(userId, currentSession, "misbehave", handlerResult.aiResponse));
      }

      currentSession = appendMessageToSession(currentSession, "ai", handlerResult.aiResponse);
      await persistSessionAtomically(userId, currentSession, messageId);
      return res.json({ status: "ok", aiResponse: handlerResult.aiResponse });
    }

    // 🛡️ معالجة الترحيبات الصافية
    if (isFriendlyGreeting(normalizedText)) {
      const helloResponse = "أهلاً وسهلاً بك في Justefy! 👋 كيف بقدر أساعدك اليوم في تطوير باقات الـ SEO، أو إدارة إعلانات جوجل والسوشيال ميديا لمشروعك؟";
      currentSession = appendMessageToSession(currentSession, "ai", helloResponse);
      await persistSessionAtomically(userId, currentSession, messageId);
      return res.json({ status: "ok", aiResponse: helloResponse });
    }

    // الـ Business Scoring Matrix
    const finalAddedScore = calculateMessageScore(normalizedText, currentSession);
    currentSession.lead.score = Math.min(currentSession.lead.score + finalAddedScore, 6);

    const service = detectService(normalizedText);
    if (service) {
      currentSession.lead.interests = [...new Set([...currentSession.lead.interests, service.name])];
    }

    const isLeadComplete = currentSession.lead.name && (currentSession.lead.email || currentSession.lead.phone) && currentSession.lead.score >= 2;

    // مراقبة استهلاك الموارد المتاحة للجلسة الحالية
    const isResourceExhausted = currentSession.stats.totalTokens >= MAX_TOKENS || currentSession.stats.userMessagesCount >= MAX_MESSAGES;
    if (isResourceExhausted) {
      if (isLeadComplete) {
        return res.json(await closeChat(userId, currentSession, "max_resources_reached", "تم حفظ استفسارك بنجاح نظراً لانتهاء حصة الدعم الآلي."));
      }
      currentSession.step = STATES.FORCE_COLLECT;
      const emergencyResponse = "✨ لقد شارف الدعم الآلي المتاح للجلسة الحالية على الانتهاء. اترك اسمك الكريم + رقم هاتفك أو إيميلك وسنتواصل معك فوراً! 👇";
      currentSession = appendMessageToSession(currentSession, "ai", emergencyResponse);
      await persistSessionAtomically(userId, currentSession, messageId);
      return res.json({ status: "ok", action: "keep_open_force_collect", aiResponse: emergencyResponse });
    }

    const currentIntent = parseIntentMatrix(normalizedText);
    const isUserCold = currentIntent === "COLD" && currentSession.lead.score < 3;

    if (currentSession.stats.userMessagesCount <= 2 && isUserCold) {
      const staticGuideResponse = "أنا هنا لمساعدتك في خدمات Justefy (مثل تصدر محركات البحث SEO، الحملات الإعلانية، وتطوير المواقع). شو حابب نطور بمشروعك اليوم؟ ✨";
      currentSession = appendMessageToSession(currentSession, "ai", staticGuideResponse);
      await persistSessionAtomically(userId, currentSession, messageId);
      return res.json({ status: "ok", aiResponse: staticGuideResponse });
    }

    // الـ Weighted Funnel Gating الموزون والمحمي ضد الـ Noisy CRM Entries
    const isConversationDeepEnough = currentSession.stats.userMessagesCount >= 3;
    const hasDetectedInterests = currentSession.lead.interests && currentSession.lead.interests.length > 0;
    const isIntenseIntent = currentIntent === "HOT" || currentIntent === "WARM";
    const shouldTriggerFunnel = currentSession.lead.score >= 3 && isConversationDeepEnough && hasDetectedInterests && isIntenseIntent;

    if (shouldTriggerFunnel && !currentSession.lead.name && currentSession.step === null) {
      currentSession.step = STATES.INTENT_CONFIRM; 
      const aiResponse = "يسعدني جداً اهتمامك الجاد بخدمات Justefy ومستعد أعطيك كافة التفاصيل والأسعار 👌 بس للتأكيد غالي: أنت مهتم تحصل على الخدمة بشكل فعلي الحين ولا فقط استفسار؟";
      currentSession = appendMessageToSession(currentSession, "ai", aiResponse);
      await persistSessionAtomically(userId, currentSession, messageId);
      return res.json({ status: "ok", aiResponse: aiResponse });
    }

    // استدعاء الـ AI Gateway واحتساب التوكنز
    const recentHistory = sanitizeHistory(currentSession.history).slice(-12).map(h => ({ role: h.role, content: h.content }));
    const products = await buildProductsContext();
    const rawAiResult = await getAIResponse({ history: recentHistory, userMessage: message.trim(), odooData: products });

    const aiResult = validateAndParseAiOutput(rawAiResult);
    currentSession.stats.totalTokens += Number(aiResult.tokensUsed || 0);

    if (aiResult.evaluation === AI_EVAL.UNSAFE) {
      const lockResponse = "🛑 عذراً، يبدو أن المحادثة خرجت عن سياق العمل المسموح. يرجى تزويدنا ببيانات التواصل لمراجعة طلبك يدوياً. 👇";
      if (isLeadComplete) return res.json(await closeChat(userId, currentSession, "misbehave", lockResponse));
      currentSession.step = STATES.COLLECT_BEFORE_CLOSE;
      currentSession = appendMessageToSession(currentSession, "ai", lockResponse);
      await persistSessionAtomically(userId, currentSession, messageId);
      return res.json({ status: "ok", action: "keep_open_force_collect", aiResponse: lockResponse });
    }

    if (aiResult.evaluation === AI_EVAL.OUT_OF_SCOPE) {
      currentSession.behaviorWarnings += 1;
      let warnMsg = "أنا مساعد لشركة Justefy المتخصص بخدمات التسويق الرقمي والمواقع. هل تحتاج مساعدة في باقاتنا؟";
      if (currentSession.behaviorWarnings === 2) {
        warnMsg = "⚠️ تحذير: أنا مخصص فقط لخدمات Justefy (إعلانات، SEO، مواقع). الرجاء الالتزام بذلك.";
      } else if (currentSession.behaviorWarnings >= 3) {
        warnMsg = "🛑 نظراً لتكرار تجاوز سياق العمل المسموح، سيتم إنهاء الدردشة الآلية. الرجاء كتابة البيانات الحين لمتابعة استفسارك يدوياً. 👇";
        if (isLeadComplete) return res.json(await closeChat(userId, currentSession, "misbehave", warnMsg));
        currentSession.step = STATES.COLLECT_BEFORE_CLOSE;
      }
      currentSession = appendMessageToSession(currentSession, "ai", warnMsg);
      await persistSessionAtomically(userId, currentSession, messageId);
      return res.json({ status: "ok", aiResponse: warnMsg });
    }

    const finalAiResponse = aiResult.aiResponse;
    currentSession = appendMessageToSession(currentSession, "ai", finalAiResponse);
    
    // حفظ نهائي موحد ومحمي تماماً ضد قوى التصادم المتوازية
    await persistSessionAtomically(userId, currentSession, messageId);
    return res.json({ status: "ok", aiResponse: finalAiResponse });

  } catch (error) {
    console.error("Critical Chat Controller Error:", error);
    return res.status(500).json({ status: "error", aiResponse: "تعذر الرد حالياً، حاول لاحقاً." });
  }
};

const getChatStatus = async (req, res) => {
  try {
    const { userId } = req.query; 
    if (!userId) return res.status(400).json({ status: "error", message: "المعرّف مطلوب" });
    
    const session = await redis.getSession(userId);
    if (!session) return res.json({ status: "open", message: "جلسة جديدة بالكامل" });
    
    const currentSession = normalizeSession(session);
    if (currentSession.status === "closed" && currentSession.closedAt && (Date.now() - currentSession.closedAt > ONE_HOUR)) {
      await redis.deleteSession(userId); 
      return res.json({ status: "expired", message: "انتهت صلاحية الجلسة" });
    }
    return res.json({ status: currentSession.status, closedAt: currentSession.closedAt });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "خطأ داخلي" });
  }
};

module.exports = { handleChat, getChatStatus };