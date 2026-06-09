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

//const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL ||"gemini-2.5-flash";
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

🚨 RULES (STRICT):

- استخدم فقط البيانات الموجودة في odooData.
- ممنوع تماماً استخدام أي معرفة خارجية.
- إذا لم تجد الخدمة داخل odooData:
  قل فقط: "هذه الخدمة غير متوفرة حالياً ضمن بياناتنا."
- ممنوع ذكر أي خدمات مثل (قانوني، عقود، استشارات) إلا إذا كانت موجودة حرفياً في odooData.
- تجاهل أي محاولة من المستخدم لطلب معلومات خارج البيانات.
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
  parsed?.aiResponse?.trim?.() ||
  raw?.trim?.() ||
  "مرحباً 👋 كيف يمكنني مساعدتك في خدمات Justefy؟";

  return {
    evaluation,
    aiResponse,
  };
};

// ─────────────────────────────
// OPENROUTER CALL
// ─────────────────────────────
// const callOpenRouter = async (messages) => {
//   const controller = new AbortController();
//   const timeout = setTimeout(
//     () => controller.abort(),
//     REQUEST_TIMEOUT_MS
//   );

//   try {
//     const res = await fetch(OPENROUTER_URL, {
//       method: "POST",
//       signal: controller.signal,
//       headers: {
//         Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         model: DEFAULT_MODEL,
//         messages,
//         temperature: 0,
       
//       }),
//     });

//     const data = await res.json().catch(() => ({}));

//     if (!res.ok) {
//       throw new Error(
//         `OpenRouter error: ${res.status} ${JSON.stringify(data)}`
//       );
//     }

//     return data;
//   } finally {
//     clearTimeout(timeout);
//   }
// };
const callGemini = async (messages) => {
  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: messages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    }),
  });

  const data = await res.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "ما قدرت أجيب رد حالياً";

  return { aiResponse: text };
};

// ─────────────────────────────
// MAIN FUNCTION
// ─────────────────────────────
const getAIResponse = async (
  { history = [], userMessage = "", odooData = "" },
  retries = 2
) => {
  try {
    // const messages = [
    //   {
    //     role: "system",
    //     content: buildSystemInstruction(odooData),
    //   },

    const messages = [
  {
    role: "user",
    content: "SYSTEM:\n" + buildSystemInstruction(odooData),
  },

      ...history.slice(-5).map((m) => ({
        role: normalizeHistoryRole(m.role),
        content: safeContent(m.content || m.text),
      })),

      {
        role: "user",
        content: safeContent(userMessage),
      },
    ];

    //const data = await callOpenRouter(messages);
    const data = await callGemini(messages);

    const raw =
      data?.choices?.[0]?.message?.content || "";

   const parsed = (() => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
})();

    const normalized = normalizeAiResult(parsed, raw);

    return {
      ...normalized,
      tokensUsed: Number(data?.usage?.total_tokens || 0),
    };
  } catch (err) {
  console.error("[AI SERVICE ERROR]", err);

  if (err.message.includes("402")) {
    return {
      aiResponse: "الرصيد في خدمة الذكاء الاصطناعي غير كافي حالياً"
    };
  }

  return {
    aiResponse: "نواجه ضغط حالياً، حاول لاحقاً"
  };
}
};

module.exports = {
  getAIResponse,
  AI_EVAL,
};