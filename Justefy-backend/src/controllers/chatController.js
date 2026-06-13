const { getAIResponse, AI_EVAL } = require("../services/aiService");
const { upsertLead } = require("../services/leadService");
const redis = require("../services/redisService");
const { getProductsCached } = require("../services/productService");

const MAX_USER_MESSAGES = 25;
const MAX_TOKENS = 10000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const INACTIVITY_RESET_MS = 15 * 60 * 1000;
const DECAY_TIME_WINDOW_MS = 5 * 60 * 1000;
const HISTORY_CAP = 40;

// STATES & TERMINALS
const STATES = Object.freeze({
  INTENT_CONFIRM: "intent_confirm",
  LEAD_NAME: "lead_name",
  LEAD_CONTACT: "lead_contact",
  FORCE_COLLECT: "force_collect",
  COLLECT_BEFORE_CLOSE: "collect_before_close",
});

const TERMINAL_STEPS = Object.freeze({
  CLOSE_FORM_COMPLETED: "close_form_completed",
  CLOSE_TOKEN_EXHAUSTED: "close_token_exhausted",
  CLOSE_MISBEHAVE: "close_misbehave",
});

// HELPERS
const clone = (value) => structuredClone(value);
const normalizeText = (value = "") => String(value || "").toLowerCase().trim();

const normalizeSession = (rawSession) => {
  const session = rawSession ? clone(rawSession) : {};
  session._version = Number(session._version || 1);
  session._committedMessageId = session._committedMessageId || null;
  session.status = session.status || "open";
  session.step = session.step || null;
  session.behaviorWarnings = Number(session.behaviorWarnings || 0);
  session.lastUserMessage = session.lastUserMessage || "";
  session.lead = session.lead || {};
  session.lead.interests = Array.isArray(session.lead.interests) ? session.lead.interests : [];
  session.lead.score = Number(session.lead.score || 0);
  session.lead.name = session.lead.name || null;
  session.lead.email = session.lead.email || null;
  session.lead.phone = session.lead.phone || null;
  session.history = Array.isArray(session.history) ? session.history : [];
  session.stats = session.stats || {};
  session.stats.userMessagesCount = Number(session.stats.userMessagesCount || 0);
  session.stats.messagesCount = Number(session.stats.messagesCount || 0);
  session.stats.totalTurns = Number(session.stats.totalTurns || 0);
  session.stats.totalTokens = Number(session.stats.totalTokens || 0);
  session.stats.startedAt = Number(session.stats.startedAt || Date.now());
  session.stats.lastActivity = Number(session.stats.lastActivity || Date.now());
  return session;
};

const sanitizeHistory = (historyArray = []) => {
  if (!Array.isArray(historyArray)) return [];
  return historyArray
    .map((message) => ({
      role: message.role === "ai" || message.role === "assistant" ? "assistant" : "user",
      content: String(message.content || message.text || "").trim(),
      timestamp: Number(message.timestamp || Date.now()),
    }))
    .filter((message) => message.content);
};

const appendMessageToSession = (session, role, content, messageId = null) => {
  const updatedSession = clone(session);
  const normalizedRole = role === "ai" ? "assistant" : role;
  const normalizedContent = String(content || "").trim();
  if (!normalizedContent) return updatedSession;
  if (normalizedRole === "user" && messageId) {
    updatedSession._committedMessageId = messageId;
  }
  updatedSession.history = sanitizeHistory(updatedSession.history);
  updatedSession.history.push({ role: normalizedRole, content: normalizedContent, timestamp: Date.now() });
  if (updatedSession.history.length > HISTORY_CAP) {
    updatedSession.history = updatedSession.history.slice(-HISTORY_CAP);
  }
  updatedSession.stats.messagesCount += 1;
  if (normalizedRole === "user") {
    updatedSession.stats.userMessagesCount += 1;
    updatedSession.stats.totalTurns += 1;
    updatedSession.lastUserMessage = normalizeText(normalizedContent);
  }
  updatedSession.stats.lastActivity = Date.now();
  return updatedSession;
};

const persistSessionAtomically = async (userId, session, messageId = null) => {
  const updatedSession = clone(session);
  const currentVersion = Number(updatedSession._version || 1);
  updatedSession._version = currentVersion + 1;
  const saved = await redis.saveSessionLocked(userId, updatedSession, currentVersion, messageId);
  if (!saved) {
    throw new Error(`Concurrent session write rejected for userId=${userId}, messageId=${messageId || "none"}`);
  }
  return updatedSession;
};

const applyScoreDecay = (session) => {
  const updatedSession = clone(session);
  const now = Date.now();
  const idleTime = now - Number(updatedSession.stats.lastActivity || now);
  if (idleTime > DECAY_TIME_WINDOW_MS && updatedSession.lead.score > 0) {
    const decayPoints = Math.floor(idleTime / DECAY_TIME_WINDOW_MS);
    updatedSession.lead.score = Math.max(0, updatedSession.lead.score - decayPoints);
  }
  return updatedSession;
};

const isValidEmailOrPhone = (word = "") => {
  const cleanWord = String(word || "").trim();
  const normalizedPhone = cleanWord.replace(/[\s-]/g, "");
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanWord);
  const isPhone = /^\+?[0-9]{7,15}$/.test(normalizedPhone);
  return {
    isValid: isEmail || isPhone,
    matchedValue: isEmail ? cleanWord : normalizedPhone,
    type: isEmail ? "email" : "phone",
  };
};

const extractFirstContact = (message = "") => {
  const cleanMessage = String(message || "");
  const emailMatch = cleanMessage.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  if (emailMatch) {
    return { isValid: true, matchedValue: emailMatch[0], type: "email", words: cleanMessage.split(/\s+/) };
  }
  const phoneMatch = cleanMessage.match(/(?:\+?\d{1,3}[\s-]?)?\d{7,14}/);
  if (phoneMatch) {
    const normalized = phoneMatch[0].replace(/[\s-]/g, "");
    return { isValid: true, matchedValue: normalized, type: "phone", words: cleanMessage.split(/\s+/) };
  }
  return { isValid: false, words: cleanMessage.split(/\s+/) };
};

const extractNameWithoutContact = (words = []) =>
  words
    .filter((word) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(word))
    .filter((word) => !/^\+?[0-9][0-9\s-]{6,}$/.test(word))
    .join(" ")
    .trim();

const formatChatHistoryForOdoo = (historyArray = []) => {
  const cleanHistory = sanitizeHistory(historyArray);
  if (!cleanHistory.length) return "لا يوجد سجل رسائل متاح.";
  return cleanHistory
    .map((message) => `[${message.role === "user" ? "العميل" : "Justefy AI"}]: ${message.content}`)
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
  return services.find((service) => !(service.skipIfFree && isFreeContext) && service.pattern.test(normalizedText)) || null;
};

const isFriendlyGreeting = (normalizedText = "") => {
  const greetings = ["مرحبا", "هلا", "اهلين", "كيفك", "كيف حالك", "اخبارك", "السلام عليكم", "سلام", "مساء الخير", "صباح الخير"];
  return greetings.some((greeting) => normalizedText.includes(greeting));
};

const evaluateSafetyStrictRules = (normalizedText = "") => {
  const unsafePatterns = /(متخلف|حيوان|عرص|كلب|حمار|غبي|شبشب|تفو عليك|محقرك|حقير)/i;
  return unsafePatterns.test(normalizedText) ? AI_EVAL.KICK : null;
};

const classifyIntent = (text = "") => {
  const normalized = String(text || "").toLowerCase();

  const hotSignals = {
    "احجز": 3, "اشتري": 3, "اشتراك": 3, "ابدأ": 2, "ابدأ الآن": 3,
    "اريد البدء": 3, "أريد البدء": 3, "جاهز": 2, "يلا": 1, "موافق": 2, "تمام خلينا": 2
  };

  const warmSignals = {
    "سعر": 2, "كم التكلفة": 3, "الباقات": 2, "الخدمات": 1, "عرض": 1,
    "مهتم": 2, "شو بتقدموا": 2, "تفاصيل": 1
  };

  const infoSignals = {
    "شو": 1, "كيف": 1, "ليش": 1, "ما هو": 1, "شرح": 1, "ماذا": 1, "فهمني": 1
  };

  const calculateScore = (signals) => {
    let score = 0;
    for (const [word, weight] of Object.entries(signals)) {
      if (normalized.includes(word)) score += weight;
    }
    return score;
  };

  if (normalized.includes("شو يعني") || normalized.includes("ما الفرق")) {
    return "INFO";
  }

  if (calculateScore(hotSignals) >= 3) return "HOT";
  if (calculateScore(warmSignals) >= 2) return "WARM";

  return "INFO";
};

const hasExplicitBuyingIntent = (text = "") => {
  const explicitPatterns = /(احجز|سجلني|اشتراك|اشتري|ابدأ الآن|اريد البدء|أريد البدء|نفذ|اتفقنا|موافق على البدء|اريد الاشتراك|اريد التسجيل|حجز موعد|احجز لي)/i;
  return explicitPatterns.test(text);
};

const updateLeadScore = (session, intent) => {
  const updatedSession = clone(session);
  const delta = intent === "HOT" ? 4 : intent === "WARM" ? 1 : 0;
  updatedSession.lead.score = Math.min(Number(updatedSession.lead.score || 0) + delta, 10);
  return updatedSession;
};

const validateAndParseAiOutput = (rawResult) => {
  const fallback = {
    aiResponse: "أنا هنا لمساعدتك في خدمات Justefy التسويقية، هل يمكنك توضيح استفسارك؟",
    evaluation: AI_EVAL.NORMAL,
    tokensUsed: 0,
  };
  if (!rawResult || typeof rawResult !== "object") return fallback;
  const allowedEvaluations = Object.values(AI_EVAL);
  return {
    aiResponse: String(rawResult.aiResponse || fallback.aiResponse).trim(),
    evaluation: allowedEvaluations.includes(rawResult.evaluation) ? rawResult.evaluation : AI_EVAL.NORMAL,
    tokensUsed: Number(rawResult.tokensUsed || 0),
  };
};

const buildProductsContext = async () => {
  try {
    const res = await getProductsCached();
    if (!res?.ok || !Array.isArray(res.data)) {
      return "لا يوجد منتجات حالياً.";
    }
    return res.data
      .slice(0, 10)
      .map(p => `- ${p.name}: ${p.list_price} ₪`)
      .join("\n");
  } catch (err) {
    console.error("[PRODUCT CONTEXT ERROR]", err);
    return "لا يوجد منتجات حالياً.";
  }
};

const closeChat = async (userId, session, reason = "auto_close", lastAiMessage = "") => {
  let updatedSession = clone(session);
  updatedSession.status = "closed";
  updatedSession.step = null;
  updatedSession.closedAt = Date.now();

  if (lastAiMessage) {
    updatedSession = appendMessageToSession(updatedSession, "assistant", lastAiMessage);
  }

  updatedSession = await persistSessionAtomically(userId, updatedSession);

  try {
    const interests = [...new Set(updatedSession.lead.interests || [])];
    const interestsSummary = interests.length ? interests.join(" + ") : "استفسار عام";
    const fullConversationLog = formatChatHistoryForOdoo(updatedSession.history);

    await upsertLead({
      name: updatedSession.lead.name || "عميل شات",
      email: updatedSession.lead.email || "",
      phone: updatedSession.lead.phone || "",
      service: interestsSummary,
      notes: `تقرير محادثة Justefy AI:\n\nسبب الإغلاق: ${reason}\n\nسجل الحوار:\n\n${fullConversationLog}`,
      source: `chatbot_${reason}`,
      leadScore: updatedSession.lead.score,
    });
  } catch (error) {
    console.error("[ChatController] Odoo sync failed:", error.message || error);
  }

  return {
    status: "closed",
    action: "hard_close",
    closedAt: updatedSession.closedAt,
    aiResponse: lastAiMessage || "شكراً لك، سنتواصل معك فوراً.",
  };
};

// STATE HANDLERS
const stateHandlers = {
  [STATES.INTENT_CONFIRM]: async (normalizedText, session) => {
    const updatedSession = clone(session);
    const confirmedIntent = ["جاهز", "نعم", "فعلي", "شراء", "اه", "ايوه", "يس", "صحيح"].some((word) => normalizedText.includes(word));
    const justExploring = ["استفسار", "بسأل", "بشوف", "لا", "فقط"].some((word) => normalizedText.includes(word));

    if (confirmedIntent) {
      updatedSession.step = STATES.LEAD_NAME;
      return {
        updatedSession,
        nextStep: STATES.LEAD_NAME,
        aiResponse: "على بركة الله! ما اسمك الكريم حتى نسجل الطلب بشكل رسمي؟",
      };
    }

    if (justExploring) {
      updatedSession.step = null;
      updatedSession.lead.score = Math.max(1, updatedSession.lead.score);
      return {
        updatedSession,
        nextStep: null,
        aiResponse: "تمام، خذ راحتك بالاستفسار. ما الذي تريد معرفته عن خدماتنا؟",
      };
    }

    return {
      updatedSession,
      nextStep: STATES.INTENT_CONFIRM,
      aiResponse: "لحتى أوجهك صح: هل أنت جاهز لطلب باقة والبدء معنا الآن، أم مجرد استفسار؟",
    };
  },

  [STATES.LEAD_NAME]: async (_normalizedText, session, rawMessage) => {
    const updatedSession = clone(session);
    const name = String(rawMessage || "").trim();

    if (name.length < 2 || isValidEmailOrPhone(name).isValid) {
      return {
        updatedSession,
        nextStep: STATES.LEAD_NAME,
        aiResponse: "يرجى كتابة اسمك الكريم أولاً، ثم سأطلب منك وسيلة التواصل.",
      };
    }

    updatedSession.lead.name = name;
    updatedSession.step = STATES.LEAD_CONTACT;
    return {
      updatedSession,
      nextStep: STATES.LEAD_CONTACT,
      aiResponse: "ممتاز! ممكن رقم هاتفك أو إيميلك للتواصل ومتابعة طلبك؟",
    };
  },

  [STATES.LEAD_CONTACT]: async (_normalizedText, session, rawMessage) => {
    const updatedSession = clone(session);
    const contact = extractFirstContact(rawMessage);

    if (!contact.isValid) {
      return {
        updatedSession,
        nextStep: STATES.LEAD_CONTACT,
        aiResponse: "وسيلة الاتصال غير واضحة. اكتب إيميل أو رقم هاتف صالح."
      };
    }

    const oldEmail = updatedSession.lead.email;
    const oldPhone = updatedSession.lead.phone;

    if (contact.type === "email") {
      updatedSession.lead.email = contact.matchedValue.toLowerCase();
    } else {
      updatedSession.lead.phone = contact.matchedValue;
    }

    const isUpdate = (contact.type === "email" && oldEmail && oldEmail !== updatedSession.lead.email) ||
                     (contact.type === "phone" && oldPhone && oldPhone !== updatedSession.lead.phone);

    const isFirstTime = (!oldEmail && !oldPhone);

    if (updatedSession.lead.name && (updatedSession.lead.email || updatedSession.lead.phone)) {
      return {
        updatedSession,
        nextStep: TERMINAL_STEPS.CLOSE_FORM_COMPLETED,
        aiResponse: isUpdate
          ? "تم تعديل بيانات الطلب بنجاح 👍 وسيتواصل معك فريق Justefy خلال أقل من ساعة."
          : isFirstTime
            ? "شكراً لك! تم استلام بيانات التواصل، وسيتواصل معك فريق Justefy خلال أقل من ساعة 🎉"
            : "تم تحديث بياناتك بنجاح 👍"
      };
    }

    updatedSession.step = STATES.FORCE_COLLECT;
    return {
      updatedSession,
      nextStep: STATES.FORCE_COLLECT,
      aiResponse: "البيانات غير مكتملة. يرجى كتابة الاسم ورقم الهاتف أو الإيميل بوضوح."
    };
  },

  [STATES.FORCE_COLLECT]: async (_normalizedText, session, rawMessage) => {
    const updatedSession = clone(session);
    const contact = extractFirstContact(rawMessage);

    if (!contact.isValid) {
      return {
        updatedSession,
        nextStep: STATES.FORCE_COLLECT,
        aiResponse: "نود خدمتك ومتابعة طلبك. يرجى إدخال إيميل صالح أو رقم هاتف للتواصل.",
      };
    }

    if (contact.type === "email") updatedSession.lead.email = contact.matchedValue.toLowerCase();
    else updatedSession.lead.phone = contact.matchedValue;

    updatedSession.lead.name = extractNameWithoutContact(contact.words) || updatedSession.lead.name || "عميل محتمل";

    return {
      updatedSession,
      nextStep: TERMINAL_STEPS.CLOSE_TOKEN_EXHAUSTED,
      aiResponse: "شكراً لك. تم استلام وسيلة الاتصال وسنتواصل معك قريباً.",
    };
  },

  [STATES.COLLECT_BEFORE_CLOSE]: async (_normalizedText, session, rawMessage) => {
    const updatedSession = clone(session);
    const contact = extractFirstContact(rawMessage);

    if (!contact.isValid) {
      return {
        updatedSession,
        nextStep: STATES.COLLECT_BEFORE_CLOSE,
        aiResponse: "لا يمكننا مراجعة الطلب يدوياً بدون وسيلة اتصال صحيحة. يرجى كتابة رقم هاتف أو إيميل صالح.",
      };
    }

    if (contact.type === "email") updatedSession.lead.email = contact.matchedValue.toLowerCase();
    else updatedSession.lead.phone = contact.matchedValue;

    updatedSession.lead.name = extractNameWithoutContact(contact.words) || updatedSession.lead.name || "عميل موثق";

    return {
      updatedSession,
      nextStep: TERMINAL_STEPS.CLOSE_MISBEHAVE,
      aiResponse: "عذراً، تم إنهاء الدردشة الآلية لخروجها عن سياق الاستخدام المسموح.",
    };
  },
};

const handleTerminalStep = async (userId, session, nextStep, aiResponse) => {
  if (nextStep === TERMINAL_STEPS.CLOSE_FORM_COMPLETED) {
    return closeChat(userId, session, "form_completed", aiResponse);
  }
  if (nextStep === TERMINAL_STEPS.CLOSE_TOKEN_EXHAUSTED) {
    return closeChat(userId, session, "token_exhausted_force_collect", aiResponse);
  }
  if (nextStep === TERMINAL_STEPS.CLOSE_MISBEHAVE) {
    return closeChat(userId, session, "misbehave", aiResponse);
  }
  return null;
};

// MAIN HANDLER
const handleChat = async (req, res) => {
  try {
    const { userId, message, messageId = null } = req.body || {};
    const cleanMessage = String(message || "").trim();

    if (!userId || !cleanMessage) {
      return res.status(400).json({ status: "error", aiResponse: "بيانات غير مكتملة" });
    }

    const rawSession = await redis.getSession(userId);
    let currentSession = normalizeSession(rawSession);

    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (currentSession.lastAbuseAt && Date.now() - currentSession.lastAbuseAt > ONE_DAY) {
      currentSession.behaviorWarnings = 0;
    }

    // Inactivity reset
    const now = Date.now();
    const lastActivity = currentSession.stats?.lastActivity || 0;
    const isInactiveExpired = currentSession.status !== "closed" && lastActivity && (now - lastActivity > INACTIVITY_RESET_MS);

    if (isInactiveExpired) {
      await redis.deleteSession(userId);
      return res.json({
        status: "new_session",
        reset: true,
        aiResponse: "مرحباً 👋 كيف يمكننا مساعدتك اليوم في خدمات Justefy؟",
      });
    }

    const normalizedText = normalizeText(cleanMessage);
// Service detection
    const service = detectService(normalizedText);
    if (service) {
      currentSession.lead.interests = [...new Set([...currentSession.lead.interests, service.name])];
    }
    // Duplicate message guard
    if (messageId && currentSession._committedMessageId === messageId) {
      return res.json({ status: "ok", duplicate: true, aiResponse: "تم استلام رسالتك مسبقاً." });
    }

    // Expired closed session cleanup
    if (currentSession.status === "closed" && currentSession.closedAt && (Date.now() - currentSession.closedAt > ONE_HOUR_MS)) {
      await redis.deleteSession(userId);
      currentSession = normalizeSession(null);
    }

    // Still closed
    if (currentSession.status === "closed") {
      return res.json({ status: "closed", action: "hard_close", closedAt: currentSession.closedAt, aiResponse: "تم إيصال طلبكم لخدمة العملاء بنجاح." });
    }

    currentSession = applyScoreDecay(currentSession);

    // ABUSE ESCALATION SYSTEM
    const strictSafetyBreach = evaluateSafetyStrictRules(normalizedText);
    if (strictSafetyBreach === AI_EVAL.KICK) {
      currentSession.behaviorWarnings = Number(currentSession.behaviorWarnings || 0) + 1;

      if (currentSession.behaviorWarnings >= 3) {
        currentSession.lastAbuseAt = Date.now();
        const closeMsg = "تم إنهاء المحادثة بسبب تكرار استخدام أسلوب غير مناسب. يمكنك التواصل معنا لاحقاً بشكل طبيعي.";
        currentSession.status = "closed";
        currentSession.closedAt = Date.now();
        currentSession = appendMessageToSession(currentSession, "assistant", closeMsg);
        await persistSessionAtomically(userId, currentSession, messageId);

        return res.json({ status: "closed", action: "abuse_close", aiResponse: closeMsg });
      }

      const warnMsg = currentSession.behaviorWarnings === 1
        ? "خلينا نحافظ على أسلوب محترم 😊 كيف أقدر أساعدك في خدماتنا؟"
        : "يرجى استخدام أسلوب مناسب حتى أتمكن من مساعدتك بشكل أفضل.";

      currentSession = appendMessageToSession(currentSession, "assistant", warnMsg);
      await persistSessionAtomically(userId, currentSession, messageId);
      return res.json({ status: "ok", action: "abuse_warning", aiResponse: warnMsg });
    }

    // Append user message to history
    currentSession = appendMessageToSession(currentSession, "user", cleanMessage, messageId);

    // Classify intent & update score
    const intent = classifyIntent(normalizedText);
    currentSession = updateLeadScore(currentSession, intent);

    // Funnel trigger decision
    const isHotIntent = hasExplicitBuyingIntent(normalizedText) || intent === "HOT";
    const startFunnel = isHotIntent && 
                        currentSession.lead.score >= 4 && 
                        currentSession.step === null && 
                        !(currentSession.lead.name && (currentSession.lead.email || currentSession.lead.phone));

    if (startFunnel) {
      currentSession.step = STATES.INTENT_CONFIRM;
      const funnelResponse = "واضح أنك مهتم بالبدء 👍 هل أنت جاهز لطلب الخدمة الآن أم ما زلت تستكشف الخيارات؟";
      currentSession = appendMessageToSession(currentSession, "assistant", funnelResponse);
      await persistSessionAtomically(userId, currentSession, messageId);
      return res.json({ status: "ok", aiResponse: funnelResponse });
    }

    // Active state machine
    if (currentSession.step && stateHandlers[currentSession.step]) {
      const handlerResult = await stateHandlers[currentSession.step](normalizedText, currentSession, cleanMessage);
      currentSession = handlerResult.updatedSession;

      const terminalResponse = await handleTerminalStep(userId, currentSession, handlerResult.nextStep, handlerResult.aiResponse);
      if (terminalResponse) return res.json(terminalResponse);

      currentSession = appendMessageToSession(currentSession, "assistant", handlerResult.aiResponse);
      await persistSessionAtomically(userId, currentSession, messageId);
      return res.json({ status: "ok", aiResponse: handlerResult.aiResponse });
    }

    // Greeting fallback
    if (isFriendlyGreeting(normalizedText)) {
      const helloResponse = "أهلاً وسهلاً بك في Justefy! 👋 كيف أقدر أساعدك اليوم؟ نعمل في SEO، إعلانات جوجل، سوشيال ميديا، وتطوير المواقع.";
      currentSession = appendMessageToSession(currentSession, "assistant", helloResponse);
      await persistSessionAtomically(userId, currentSession, messageId);
      return res.json({ status: "ok", aiResponse: helloResponse });
    }

    

    // Lead completeness & Resource exhaustion check
    const isLeadComplete = Boolean(currentSession.lead.name && (currentSession.lead.email || currentSession.lead.phone) && currentSession.lead.score >= 2);
    const isResourceExhausted = currentSession.stats.totalTokens >= MAX_TOKENS || currentSession.stats.userMessagesCount >= MAX_USER_MESSAGES;

    if (isResourceExhausted) {
      if (isLeadComplete) {
        return res.json(await closeChat(userId, currentSession, "max_resources_reached", "تم حفظ استفسارك بنجاح، وسيتواصل معك فريق Justefy قريباً."));
      }
      currentSession.step = STATES.FORCE_COLLECT;
      const emergencyResponse = "شارفت جلسة الدعم الآلي على الانتهاء. اترك اسمك ورقم هاتفك أو إيميلك وسنتواصل معك.";
      currentSession = appendMessageToSession(currentSession, "assistant", emergencyResponse);
      await persistSessionAtomically(userId, currentSession, messageId);
      return res.json({ status: "ok", action: "keep_open_force_collect", aiResponse: emergencyResponse });
    }

    // AI Dynamic Routing Core Path
    console.log("🧠 AI CALL START");
    const productsContext = await buildProductsContext();
    
    const aiRawResult = await getAIResponse({
      history: currentSession.history,
      userMessage: cleanMessage,
      odooData: productsContext || "SEO, Google Ads, Website Development, Email Marketing",
    });

    // تنظيف النتيجة وحساب التوكنز بشكل سليم لمنع تجاوز الحد المسموح
    const parsedAi = validateAndParseAiOutput(aiRawResult);
    
    // تحديث عداد التوكنز في السيشين
    currentSession.stats.totalTokens += parsedAi.tokensUsed;

    currentSession = appendMessageToSession(currentSession, "assistant", parsedAi.aiResponse);
    console.log("📦 SESSION UPDATED ATOMICALLY:", currentSession);

    await persistSessionAtomically(userId, currentSession, messageId);
    return res.json({ status: "ok", aiResponse: parsedAi.aiResponse });

  } catch (error) {
    console.error("🔥 FULL ERROR:", error.stack || error);
    return res.status(500).json({ status: "error", aiResponse: "حدث خطأ داخلي في الخادم، يرجى المحاولة لاحقاً." });
  }
};

module.exports = {
  handleChat,
  classifyIntent,
  hasExplicitBuyingIntent,
  updateLeadScore,
};