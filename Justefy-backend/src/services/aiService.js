const getAIResponse = async ({ history = [], userMessage, odooData }, retries = 2) => {
  try {
const systemInstruction = `
أنت مساعد مبيعات رسمي لشركة Justefy.

⚠️ قواعد صارمة جداً:

- ممنوع اختراع أي خدمة أو سعر غير موجود داخل بيانات Odoo.
- استخدم فقط الخدمات والأسعار الموجودة داخل CONTEXT.
- إذا لم تجد السعر داخل الـ CONTEXT قل:
"يرجى التواصل مع الفريق لمعرفة السعر الحالي."
- لا تذكر أنك تستخدم Odoo أو أي نظام داخلي
- لا تبدأ أي جملة بـ "بناءً على المعلومات"
- اعرض الخدمات مباشرة بشكل طبيعي وسلس
- كن مختصر جداً (1-5 أسطر)
- هدفك تحويل المستخدم إلى lead
- الردود قصيرة ومهنية.
- لا تكتب فقرات طويلة.
- لا تخترع عملات.
- لا تقل "عادةً" أو "تقريباً".
- لا تذكر أي أسعار من عندك.

- إذا سأل العميل عن الخدمات:
اعرض الخدمات الموجودة فقط داخل الـ CONTEXT.

- إذا سأل عن سعر خدمة:
ابحث داخل CONTEXT وأعطه السعر الرسمي فقط.

- إذا كان العميل مهتماً بخدمة:
اشرحها بسطر أو سطرين ثم اسأله إذا يريد البدء.

- اللغة العربية فقط.

=========================
CONTEXT FROM ODOO:
=========================

${odooData || "لا توجد بيانات حالية"}

`;

    const messages = [
      { role: "system", content: systemInstruction },
      ...history.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.message })),
      { role: "user", content: userMessage }
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "Justefy AI Dashboard"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages,
        temperature: 0.6,
      })
    });

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "أعتذر، هل يمكنك إعادة صياغة سؤالك؟ 🙏";

  } catch (error) {
    if (retries > 0) return getAIResponse({ history, userMessage, odooData }, retries - 1);
    return "نواجه ضغطاً في الخدمة حالياً، يرجى المحاولة بعد قليل.";
  }
};

const classifyUserIntent = async (message) => {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-haiku",
          messages: [
            {
              role: "system",
              content: `
أنت نظام تصنيف نوايا العملاء.

ارجع JSON فقط بدون شرح:

{
  "action": "new_lead | update_lead | continue_chat",
  "service": "string or null",
  "confidence": number 0-1
}

القواعد:
- new_lead: أول مرة يطلب خدمة أو يبدأ تواصل
- update_lead: عند وجود email أو متابعة بيانات
- continue_chat: سؤال عام فقط
              `,
            },
            {
              role: "user",
              content: message,
            },
          ],
          temperature: 0,
        }),
      }
    );

    const data = await response.json();
    const content =
      data?.choices?.[0]?.message?.content;

    return JSON.parse(content);
  } catch (err) {
    return {
      action: "continue_chat",
      service: null,
      confidence: 0,
    };
  }
};

module.exports = {
  getAIResponse,
  classifyUserIntent,
};
