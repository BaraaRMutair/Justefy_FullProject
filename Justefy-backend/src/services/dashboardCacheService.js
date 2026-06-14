const redis = require("./redisService");
const odooService = require("./odooService");
const { sendEmail } = require("../config/mail");

// =========================
// BUILD DASHBOARD DATA
// =========================
const buildDashboardData = async () => {
  try {
    console.log("🐢 [Odoo 19] جاري جلب بيانات فريش وسحب إيميلات العملاء...");

    // 1️⃣ جلب الاشتراكات بطلب واحد مجمع من أودو
    const data = await odooService.execute(
      "sale.order",
      "search_read",
      [[["is_subscription", "=", true]]],
      { 
        fields: ["id", "name", "partner_id", "amount_total", "next_invoice_date", "state", "currency_id"] 
      }
    );

    console.log("🔍 ODOO RESULT COUNT =", data ? data.length : 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // 2️⃣ ⚡ الطلب المجمع (Bulk Read): جلب كل إيميلات العملاء بطلب واحد لمنع البطء
    const partnerIds = (data || []).map(sub => sub.partner_id && sub.partner_id[0]).filter(Boolean);
    let partnersEmailMap = {};

    if (partnerIds.length > 0) {
      try {
        console.log(`⚡ جاري جلب إيميلات لـ ${partnerIds.length} عملاء دفعة واحدة...`);
        const partnersData = await odooService.execute(
          "res.partner",
          "search_read",
          [[["id", "in", partnerIds]]],
          { fields: ["id", "email"] }
        );
        
        // تحويل المصفوفة إلى قاموس لسرعة القراءة في الذاكرة
        partnersData.forEach(p => {
          if (p.id && p.email) {
            partnersEmailMap[p.id] = p.email;
          }
        });
      } catch (err) {
        console.error("⚠️ فشل جلب إيميلات العملاء مجمعة من res.partner:", err.message);
      }
    }

    // 3️⃣ معالجة البيانات وفحص التواريخ والتحكم في الإرسال
    const subscriptions = await Promise.all((data || []).map(async (sub) => {
      let status = "PENDING"; 
      const expiryDateStr = sub.next_invoice_date;
      
      const isOrderActive = sub.state === 'sale' || sub.state === 'done';
      if (isOrderActive) {
          status = "ACTIVE";
      }

      if (expiryDateStr) {
          const expiryDate = new Date(expiryDateStr);
          expiryDate.setHours(0, 0, 0, 0);
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
              status = "EXPIRED"; 
          } 
          else if (diffDays >= 0 && diffDays <= 7) {
              if (isOrderActive) {
                  status = "EXPIRING";
              }

              if (isOrderActive) {
                  const emailLockKey = `email_sent:${sub.id}:${todayStr}`;
                  const hasSentToday = await redis.get(emailLockKey);

                  if (!hasSentToday) {
                      // ✅ قفل الـ Redis يُحجز هنا فوراً لمنع التكرار أثناء المعالجة في الخلفية
                      await redis.set(emailLockKey, "true", 86400);

                      const clientEmail = partnersEmailMap[sub.partner_id?.[0]] || "baraamutair2003@gmail.com";

                      // ⚡ إطلاق الإرسال في الخلفية (Background Task) بدون await لإنهاء تعليق الشاشة
                      sendEmail(
                          clientEmail,
                          "تنبيه تجديد اشتراك - Justefy",
                          `<div dir="rtl" style="font-family: Arial, sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                              <h2 style="color: #f97316;">مرحباً ${sub.partner_id?.[1] || "عميلنا العزيز"}</h2>
                              <p>نود تنبيهك بأن اشتراكك في خدمة <b>Justefy SaaS</b> ينتهي بتاريخ <b>${expiryDateStr}</b>.</p>
                              <p>بقي لك <b>${diffDays}</b> أيام فقط على انتهاء الخدمة لتجنب انقطاعها.</p>
                              <hr style="border: 0; border-top: 1px solid #eee;" />
                              <p style="font-size: 12px; color: #666;">تم إنتاج هذا التنبيه آلياً بواسطة نظام CRM لـ Justefy.</p>
                          </div>`
                      )
                      .then(() => {
                          console.log(`📧 [Background Mail] تم إرسال إيميل بنجاح لـ ${sub.partner_id?.[1]} إلى: ${clientEmail}`);
                      })
                      .catch(async (emailErr) => {
                          console.error(`❌ [Background Mail] فشل إرسال الإيميل لـ ${sub.partner_id?.[1]}:`, emailErr.message);
                          try {
                              // إذا فشل الإرسال (مثل الـ Timeout)، نحذف القفل فوراً لإتاحة المحاولة مجدداً لاحقاً
                              await redis.del(emailLockKey);
                              console.log(`🔓 [Redis Lock] تم تحرير القفل لـ ${sub.partner_id?.[1]} لإعادة المحاولة.`);
                          } catch (redisErr) {
                              console.error("❌ فشل حذف مفتاح الـ Redis:", redisErr.message);
                          }
                      });
                  } else {
                      console.log(`🔒 [Redis Lock] تم إرسال تنبيه لـ ${sub.partner_id?.[1]} مسبقاً اليوم، تم التخطي لحماية السيرفر.`);
                  }
              }
          }
      }

      return {
          id: sub.id,
          name: sub.name,
          client: sub.partner_id?.[1] || "عميل Justefy",
          expiry: expiryDateStr || "غير محدد",
          status: status,
          amount: Number(sub.amount_total || 0),
          currency: sub.currency_id?.[1] === "ILS" ? "₪" : (sub.currency_id?.[1] || "₪")
      };
    }));

    const stats = {
      totalActive: subscriptions.filter(s => s.status === "ACTIVE").length,
      totalExpired: subscriptions.filter(s => s.status === "EXPIRED").length,
      totalExpiring: subscriptions.filter(s => s.status === "EXPIRING").length,
      totalRevenue: subscriptions.reduce((sum, s) => sum + s.amount, 0),
    };

    return { success: true, subscriptions, stats, updatedAt: new Date() };

  } catch (err) {
    console.error("BUILD ERROR:", err);
    throw err;
  }
};

// =========================
// GET DASHBOARD CACHED
// =========================
const getDashboardCached = async () => {
  try {
    const cacheKey = "dashboard:data";
    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log("⚡ Dashboard From Redis");
      return JSON.parse(cached);
    }

    const freshData = await buildDashboardData();
    await redis.set(cacheKey, JSON.stringify(freshData), 300);
    return freshData;
  } catch (err) {
    console.error("CACHE ERROR:", err);
    return { success: false, subscriptions: [], stats: {} };
  }
};

// =========================
// FORCE REFRESH
// =========================
const refreshDashboardCache = async () => {
  try {
    const freshData = await buildDashboardData();
    await redis.set("dashboard:data", JSON.stringify(freshData), 300); // 5 دقائق كاش
    console.log("♻️ Dashboard Cache Refreshed");
    return freshData;
  } catch (err) {
    console.error("REFRESH ERROR:", err);
    return { success: false, subscriptions: [], stats: {} };
  }
};

module.exports = {
  getDashboardCached,
  refreshDashboardCache,
};