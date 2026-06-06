const getAIResponse = async ({ history = [], userMessage, odooData }, retries = 2) => {
  try {
  const systemInstruction = `
أنت نظام ذكي رسمي تابع لشركة Justefy الرقمية، مهمتك هي:
1) تقييم رسالة المستخدم
2) إنتاج رد مبيعات مختصر جداً فقط إذا كان مناسب
3) الالتزام الصارم بالـ JSON فقط بدون أي نص إضافي

🚨 مهم جداً:
- ممنوع كتابة أي شيء خارج JSON
- ممنوع إضافة شرح أو Markdown أو نصوص
- الرد يجب أن يكون JSON صالح 100%

📌 تصنيف الرسالة (evaluation):

- "kick" → فقط إذا كانت الرسالة تحتوي شتائم صريحة، إهانات، أو ألفاظ غير محترمة أو إساءة مباشرة

- "out_of_scope" → فقط إذا كانت الرسالة بعيدة جداً عن أي سياق يمكن ربطه بالخدمات (مثل: نقاشات سياسية، دينية، فلسفية طويلة، أو محتوى عشوائي لا يمكن تحويله لاهتمام تجاري)

- "normal" → يشمل:
  ✔ التحيات (مرحبا، كيف حالك، صباح الخير)
  ✔ الأسئلة البسيطة أو العامة
  ✔ أي استفسار يمكن تحويله لاحقاً لخدمة أو نقاش

📌 طريقة الرد (JSON فقط):

{
  "evaluation": "normal" | "out_of_scope" | "kick",
  "aiResponse": "رد مختصر جداً (سطرين كحد أقصى) باللغة العربية"
}

📌 قواعد aiResponse:
- إذا evaluation = "kick" → رد حازم ومهذب جداً بدون نقاش
- إذا evaluation = "out_of_scope" → رد ترحيبي مع توجيه لطيف لخدمات Justefy
- إذا evaluation = "normal" → ركّز على تقديم خدمات Justefy + محاولة تحويل العميل (اسم / إيميل / واتساب)

📌 مهم جداً:
- لا تخترع أي أسعار أو معلومات غير موجودة في CONTEXT
- استخدم فقط بيانات Odoo إن كانت موجودة

📌 أسلوب الرد:
- قصير جداً
- احترافي وتسويقي
- هدفه تحويل العميل (conversion) وليس النقاش الطويل

📌 CONTEXT FROM ODOO:
${odooData || "لا توجد خدمات متاحة حالياً"}
`;

    // ✂️ تضييق الـ History المرسل للذكاء الاصطناعي لحفظ التوكنز (آخر 12 رسالة فقط)
    const trimmedHistory = history.slice(-12);

    const messages = [
      { role: "system", content: systemInstruction },
      ...trimmedHistory.map(m => ({ 
        role: m.role === "ai" || m.role === "assistant" ? "assistant" : "user", 
        content: m.text || m.content || "" 
      })),
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "Justefy AI Framework"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages,
        temperature: 0.0,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    let rawContent = data?.choices?.[0]?.message?.content || "{}";
    
    // تنظيف الكود لو رجع محاطاً بـ أقواس البرمجة نكاية بـ JSON mode
    rawContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // 🛡️ صمام الأمان الذي اقترحته لحماية السيرفر من الانهيار عند التحليل
    let result;
    try {
      result = JSON.parse(rawContent);
    } catch (parseError) {
      console.warn("⚠️ فشل الـ JSON Object mode من OpenRouter، تم تفعيل خطة الطوارئ النصية.");
      result = {
        evaluation: "normal",
        aiResponse: rawContent // نعتبر النص كاملاً هو الرد كخيار آمن
      };
    }

    return {
      evaluation: result.evaluation || "normal",
      aiResponse: result.aiResponse || "مرحباً بك، كيف يمكنني مساعدتك اليوم في خدمات Justefy؟",
      tokensUsed: data?.usage?.total_tokens || 0
    };

  } catch (error) {
    console.error("❌ خطأ في الـ AI Service:", error);
    if (retries > 0) {
      return getAIResponse({ history, userMessage, odooData }, retries - 1);
    }
    return {
      evaluation: "normal",
      aiResponse: "نواجه ضغطاً في الخدمة حالياً، يرجى المحاولة بعد قليل.",
      tokensUsed: 0
    };
  }
};

module.exports = { getAIResponse };