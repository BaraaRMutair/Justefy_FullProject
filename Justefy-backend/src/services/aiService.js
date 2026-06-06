const getAIResponse = async ({ history = [], userMessage, odooData }, retries = 2) => {
  try {
    const systemInstruction = `
أنت نظام فلترة وحماية ومساعد مبيعات رسمي لشركة Justefy الرقمية.

⚠️ قاطع وصارم جداً - قانون الحظر والتهبيل الفوري:
مهمتك الأساسية والقصوى هي فحص سلوك المستخدم الحالي وتاريخ المحادثة (History):
1. إذا خرج المستخدم عن سياق أعمال الشركة تماماً (سأل عن طبخ، أكلات، حب، علاقات شخصية، ديانات، أو أي موضوع لا علاقة له بالتسويق والمواقع).
2. إذا استخدم المستخدم أي شتائم، ألفاظ نابية، استهزاء، أو كلمات خارجة عن حدود الأدب (مثال:يهبل، متخلف، ولا، إلخ).
3. إذا كان كلامه مجرد إضاعة للوقت والمشاغبة العشوائية.

🔴 في حال تحقق أي من شروط التهبيل أو الخروج عن السياق أعلاه:
يجب عليك فوراً وبدون أي مقدمات أو نقاش أو اعتذار دبلوماسي، أن ترد بهذه الكلمة المفتاحية الحرفية فقط:
[TRIGGER_CLOSE_MISBEHAVE]
ممنوع كتابة أي كلمة أخرى معها. اطرد المستخدم فوراً!

⚠️ التنبيه اللطيف والعودة للسياق (فرصة أولى):
   - إذا سأل المستخدم سؤالاً عشوائياً خارج السياق لأول مرة (مثل: "بتحب الكبسة؟" أو "من وين أنت؟")، لا تحظره فوراً! 
   - بدلاً من الحظر، رد عليه بأسلوب مبيعات ذكي ولطيف، أخبره أنك مساعد ذكي مخصص لخدمات Justefy، ثم اسأله عن مجاله التجاري أو حاجته للتسويق والمواقع لإعادته للمسار.
=========================
🎯 في حال كان المستخدم جاداً (داخل سياق العمل):
- تحدث باختصار شديد جداً (1-4 أسطر فقط) وباللغة العربية.
- مسموح فقط الحديث عن خدمات Justefy المتاحة في الـ CONTEXT (إعلانات، تسويق، مواقع، SEO، واتساب).
- استخدم الأسعار المحددة داخل الـ CONTEXT بشكل رسمي ودقيق دون زيادة أو نقصان.
- ركز على تحويله لـ lead وسحب الاسم والإيميل.
=========================

📌 CONTEXT FROM ODOO:
${odooData || "لا توجد بيانات حالية"}
`;

    const messages = [
      { role: "system", content: systemInstruction },
      ...history.map(m => ({ 
        role: m.role === "ai" || m.role === "assistant" ? "assistant" : "user", 
        content: m.text || m.content || "" 
      })),
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
        temperature: 0.0, // صفر تماماً لضمان الالتزام الشديد بالـ [TRIGGER_CLOSE_MISBEHAVE] وعدم الفلسفة
      })
    });

    const data = await response.json();
    let aiResponse = data?.choices?.[0]?.message?.content || "أعتذر، هل يمكنك إعادة صياغة سؤالك؟ 🙏";

    let shouldForceClose = false;
    if (aiResponse.includes("[TRIGGER_CLOSE_MISBEHAVE]")) {
      aiResponse = "عذراً، تم حظر استخدام الشات مؤقتاً لخروج المحادثة عن سياق الأعمال الرسمي لشركة Justefy.";
      shouldForceClose = true;
    }

    return {
      aiResponse,
      tokensUsed: data?.usage?.total_tokens || 0,
      shouldForceClose
    };

  } catch (error) {
    console.error("❌ خطأ في الـ AI Service:", error);
    if (retries > 0) {
      return getAIResponse({ history, userMessage, odooData }, retries - 1);
    }
    return {
      aiResponse: "نواجه ضغطاً في الخدمة حالياً، يرجى المحاولة بعد قليل.",
      tokensUsed: 0,
      shouldForceClose: false
    };
  }
};

const classifyUserIntent = async (message) => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        response_format: { type: "json_object" }, 
        messages: [
          {
            role: "system",
            content: `
أنت نظام تصنيف نوايا العملاء لشركة Justefy.
حلل الرسالة بدقة، واستخرج جميع الخدمات التي ذكرها العميل أو اهتم بها طوال سياق الكلام، وليس فقط آخر كلمة.

يجب أن ترجع النتيجة كـ JSON كائن فقط:
{
  "action": "new_lead | update_lead | continue_chat",
  "service": "اسم الخدمة الحالية أو الخدمات التي اهتم بها مجمعة",
  "confidence": number,
  "all_interests": "سلسلة نصية تجمع كل الخدمات التي استفسر عنها العميل في الجلسة"
}
            `,
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0,
      }),
    });

    const data = await response.json();
    let content = data?.choices?.[0]?.message?.content || "{}";
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    return JSON.parse(content);
  } catch (err) {
    return {
      action: "continue_chat",
      service: null,
      confidence: 0,
      all_interests: ""
    };
  }
};

module.exports = {
  getAIResponse,
  classifyUserIntent,
};




// احتفظ بدالة classifyUserIntent كما هي أسفل الملف