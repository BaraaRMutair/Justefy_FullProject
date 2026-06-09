/**
 * aiService.improved.js (CLEAN VERSION)
 * ─────────────────────────────────────────
 * - إزالة التكرار
 * - تحسين evaluation safety
 * - تبسيط parsing
 * - hard guard أقوى
 * - نظام واضح ومستقر
 */

const AI_EVAL = Object.freeze({
  NORMAL: "normal",
  OUT_OF_SCOPE: "out_of_scope",
  KICK: "kick",
});

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL || "anthropic/claude-3-haiku";
const REQUEST_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 20000);

const safeContent = (v) => (typeof v === "string" ? v.trim() : "");

// ─────────────────────────────
// HARD SAFETY LAYER
// ─────────────────────────────
const forceNormalizeEval = (evalValue, text = "") => {
  const t = String(text || "").toLowerCase();

  const hardKickPattern =
    /(غبي|حيوان|كلب|عرص|حمار|fuck|shit|idiot|bitch)/i;

  if (hardKickPattern.test(t)) return AI_EVAL.KICK;

  if (evalValue === AI_EVAL.KICK) return AI_EVAL.KICK;
  if (evalValue === AI_EVAL.OUT_OF_SCOPE) return AI_EVAL.OUT_OF_SCOPE;

  return AI_EVAL.NORMAL;
};

const normalizeHistoryRole = (role) =>
  role === "ai" || role === "assistant" ? "assistant" : "user";

// ─────────────────────────────
// SYSTEM PROMPT (stable + strict)
// ─────────────────────────────

const buildSystemInstruction = (odooData) => `
أنت مساعد ذكي لشركة Justefy.

🎯 دورك الأساسي:
- شرح خدمات Justefy بشكل واضح وبسيط
- الإجابة على الأسئلة فقط
- مساعدة العميل على فهم الخدمة

🚫 ممنوعات صارمة:
- ممنوع طلب اسم أو هاتف أو إيميل بشكل مباشر
- ممنوع الإصرار على الشراء أو الإلحاح
- ممنوع استخدام أسلوب ضغط أو استعجال
- ممنوع بدء أي "تجميع بيانات" من نفسك

⚠️ مهم جداً (قاعدة التكامل مع النظام):
- عملية جمع البيانات (الاسم / الهاتف / الإيميل) تتم فقط عبر النظام (ChatController Funnel)
- إذا لم يكن هناك طلب مباشر من النظام في السياق، لا تطلب أي بيانات نهائياً
- إذا لاحظت نية شراء، قم فقط بالشرح والتوضيح وانتظر النظام ليبدأ الفانل

🧠 أسلوب الرد:
- عربي بسيط وواضح
- 2 إلى 4 أسطر فقط
- بدون مبالغة تسويقية
- بدون وعود قوية أو ضغط

📌 عند الأسئلة:
- INFO → شرح فقط
- WARM → شرح + تفاصيل بسيطة
- HOT → تحفيز هادئ بدون طلب بيانات

💡 أسلوب HOT الصحيح:
"ممتاز، هذه الخدمة مناسبة لك، إذا حابب أكمل معك التفاصيل الفريق رح يساعدك مباشرة"

❌ وليس:
"ما اسمك؟ رقمك؟"

📦 بيانات الشركة (للاستخدام في الشرح فقط):
${safeContent(odooData) || "لا يوجد بيانات"}

🎯 الهدف النهائي:
تجربة محادثة طبيعية + دعم نظام الـ funnel بدون أي تضارب أو تجاوزات
`;

 console.log("NEW AI PROMPT LOADED");

// ─────────────────────────────
// JSON EXTRACTION
// ─────────────────────────────
const extractJsonObject = (content) => {
  const cleaned = safeContent(content)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  if (!cleaned) return null;

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch (_) {
        return null;
      }
    }
    return null;
  }
};

// ─────────────────────────────
// NORMALIZE AI RESULT
// ─────────────────────────────
const normalizeAiResult = (parsed, raw = "") => {
  const evaluation = forceNormalizeEval(parsed?.evaluation, raw);

  const aiResponse =
    safeContent(parsed?.aiResponse) ||
    "مرحباً 👋 كيف يمكنني مساعدتك في خدمات Justefy؟";

  return {
    evaluation,
    aiResponse,
  };
};

// ─────────────────────────────
// OPENROUTER CALL
// ─────────────────────────────
const callOpenRouter = async (messages) => {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        `OpenRouter error: ${res.status} ${JSON.stringify(data)}`
      );
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
};

// ─────────────────────────────
// MAIN FUNCTION
// ─────────────────────────────
const getAIResponse = async (
  { history = [], userMessage = "", odooData = "" },
  retries = 2
) => {
  try {
    const messages = [
      {
        role: "system",
        content: buildSystemInstruction(odooData),
      },

      ...history.slice(-10).map((m) => ({
        role: normalizeHistoryRole(m.role),
        content: safeContent(m.content || m.text),
      })),

      {
        role: "user",
        content: safeContent(userMessage),
      },
    ];

    const data = await callOpenRouter(messages);

    const raw =
      data?.choices?.[0]?.message?.content || "";

    const parsed = extractJsonObject(raw);

    const normalized = normalizeAiResult(parsed, raw);

    return {
      ...normalized,
      tokensUsed: Number(data?.usage?.total_tokens || 0),
    };
  } catch (err) {
    console.error("[AI SERVICE ERROR]", err);

    if (retries > 0) {
      return getAIResponse(
        { history, userMessage, odooData },
        retries - 1
      );
    }

    return {
      evaluation: AI_EVAL.NORMAL,
      aiResponse: "نواجه ضغط حالياً، حاول لاحقاً.",
      tokensUsed: 0,
    };
  }
};

module.exports = {
  getAIResponse,
  AI_EVAL,
};