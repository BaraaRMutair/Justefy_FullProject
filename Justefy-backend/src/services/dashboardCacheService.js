const redis = require("./redisService");
const odooService = require("./odooService");
const { sendEmail } = require("../config/mail");

// =========================
// BUILD DASHBOARD DATA
// =========================
const buildDashboardData = async () => {
  try {
    console.log("🐢 [Odoo 19] جاري جلب بيانات فريش وسحب إيميلات العملاء...");

    // ✅ تم التعديل إلى الحقل المخصص الصحيح x_x_is_subscription وإضافة الحقول المطلوبة
    const data = await odooService.execute(
      "sale.order",
      "search_read",
      [[["x_x_is_subscription", "=", true]]],
      { 
        fields: ["id", "name", "partner_id", "amount_total", "next_invoice_date", "state", "currency_id"] 
      }
    );

    console.log("🔍 ODOO RESULT COUNT =", data ? data.length : 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const subscriptions = await Promise.all((data || []).map(async (sub) => {
      let status = "PENDING"; // الحالة الافتراضية
      const expiryDateStr = sub.next_invoice_date;
      
      // 1️⃣ أولاً: نحدد هل العميل نشط في أودو بناءً على حالة الطلب
      const isOrderActive = sub.state === 'sale' || sub.state === 'done';
      if (isOrderActive) {
          status = "ACTIVE";
      }

      // 2️⃣ ثانياً: فحص التواريخ والتحكم في الإرسال
      if (expiryDateStr) {
          const expiryDate = new Date(expiryDateStr);
          expiryDate.setHours(0, 0, 0, 0);
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
              status = "EXPIRED"; // منتهي فعلياً
          } 
          else if (diffDays >= 0 && diffDays <= 7) {
              // نغير الحالة لـ EXPIRING فقط إذا كان العقد نشطاً لكي يظهر باللون البرتقالي
              if (isOrderActive) {
                  status = "EXPIRING";
              }

              // 3️⃣ ثالثاً: نظام الإرسال الذكي والمحمي بقفل الـ Redis
              if (isOrderActive) {
                  const todayStr = today.toISOString().split('T')[0];
                  const emailLockKey = `email_sent:${sub.id}:${todayStr}`;
                  
                  const hasSentToday = await redis.get(emailLockKey);

                  if (!hasSentToday) {
                      let clientEmail = "baraamutair2003@gmail.com"; // الإيميل الافتراضي

                      // جلب إيميل العميل الحقيقي من ريكورد res.partner في أودو
                      if (sub.partner_id && sub.partner_id[0]) {
                          try {
                              const partnerId = sub.partner_id[0];
                              const partnerData = await odooService.execute(
                                  "res.partner",
                                  "search_read",
                                  [[["id", "=", partnerId]]],
                                  { fields: ["email"] }
                              );
                              
                              if (partnerData && partnerData[0] && partnerData[0].email) {
                                  clientEmail = partnerData[0].email;
                                  console.log(`🔍 [Odoo Contact] تم العثور على إيميل العميل: ${clientEmail}`);
                              }
                          } catch (partnerErr) {
                              console.error("⚠️ فشل جلب إيميل العميل من res.partner:", partnerErr.message);
                          }
                      }
                      
                      // تنفيذ إرسال الإيميل الفعلي
                      try {
                          await sendEmail(
                              clientEmail,
                              "تنبيه تجديد اشتراك - Justefy",
                              `<div dir="rtl" style="font-family: Arial, sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                                  <h2 style="color: #f97316;">مرحباً ${sub.partner_id[1]}</h2>
                                  <p>نود تنبيهك بأن اشتراكك في خدمة <b>Justefy SaaS</b> ينتهي بتاريخ <b>${expiryDateStr}</b>.</p>
                                  <p>بقي لك <b>${diffDays}</b> أيام فقط على انتهاء الخدمة لتجنب انقطاعها.</p>
                                  <hr style="border: 0; border-top: 1px solid #eee;" />
                                  <p style="font-size: 12px; color: #666;">تم إنتاج هذا التنبيه آلياً بواسطة نظام CRM لـ Justefy.</p>
                              </div>`
                          );
                          console.log(`📧 [Redis Lock] تم إرسال إيميل بنجاح لـ ${sub.partner_id[1]} إلى: ${clientEmail}`);
                          
                          // حفظ القفل في Redis لمدة 24 ساعة لعدم تكرار الإرسال اليوم عند عمل Refresh
                          await redis.set(emailLockKey, "true", 86400);
                      } catch (e) {
                          console.error("❌ فشل إرسال الإيميل الفعلي:", e.message);
                      }
                  } else {
                      console.log(`🔒 [Redis Lock] تم إرسال تنبيه لـ ${sub.partner_id[1]} مسبقاً اليوم، تم التخطي لحماية السيرفر.`);
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