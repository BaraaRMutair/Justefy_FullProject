const redis = require("./redisService");
const odooService = require("./odooService");
const { sendEmail } = require("../config/mail");

// =========================
// BUILD DASHBOARD DATA
// =========================

const buildDashboardData = async () => {
  try {
    console.log("🐢 جاري جلب بيانات فريش من أودو وسحب إيميلات العملاء...");

    // طلب البيانات المستقرة من أودو
    const data = await odooService.execute(
      "sale.order",
      "search_read",
      [[["is_subscription", "=", true]]],
      { 
        fields: ["id","name", "partner_id", "amount_total", "next_invoice_date", "state"] 
      }
      
    );
console.log("ODOO RESULT =", data);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const subscriptions = await Promise.all((data || []).map(async (sub) => {
      let status = "PENDING";
      const expiryDateStr = sub.next_invoice_date;
      
      if (expiryDateStr) {
        const expiryDate = new Date(expiryDateStr);
        expiryDate.setHours(0, 0, 0, 0);
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          status = "EXPIRED";
        } 
        else if (diffDays >= 0 && diffDays <= 7) {
          status = "EXPIRING";
          
          // 1. إنشاء مفتاح فريد لكل عقد باليوم الحالي داخل Redis لمنع السبام
          const todayStr = today.toISOString().split('T')[0];
          const emailLockKey = `email_sent:${sub.id}:${todayStr}`;
          
          // 2. الفحص هل تم إرسال الإيميل اليوم مسبقاً؟
          const hasSentToday = await redis.get(emailLockKey);

          if (!hasSentToday) {
            let clientEmail = "baraamutair2003@gmail.com"; // الإيميل الافتراضي كـ Fallback

            // 3. سحب الإيميل الحقيقي للعميل ديناميكياً من قائمة العملاء res.partner
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
                  console.log(`🔍 [Odoo Contact] تم العثور على إيميل العميل الحقيقي: ${clientEmail}`);
                }
              } catch (partnerErr) {
                console.error("⚠️ فشل جلب إيميل العميل من res.partner، سيتم استخدام الإيميل الافتراضي:", partnerErr.message);
              }
            }
            
            // 4. إرسال التنبيه التلقائي
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
              
              // 5. قفل الإرسال لهذا العميل لمدة 24 ساعة (86400 ثانية)
              await redis.set(emailLockKey, "true", 86400);
            } catch (e) {
              console.error("❌ فشل إرسال الإيميل:", e.message);
            }
          } else {
            console.log(`🔒 [Redis Lock] تم إرسال تنبيه لـ ${sub.partner_id[1]} مسبقاً اليوم، تم التخطي لحماية السيرفر.`);
          }
        } else if (sub.state === 'sale' || sub.state === 'done') {
          status = "ACTIVE";
        }
      }

      return {
        id: sub.id,
        client: sub.partner_id?.[1] || "Unknown",
        expiry: expiryDateStr || "N/A",
        status: status,
        amount: Number(sub.amount_total || 0),
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
    await redis.set("dashboard:data", JSON.stringify(freshData), 3000);
    console.log("♻️ Dashboard Cache Refreshed");
    return freshData;
  } catch (err) {
    console.error("REFRESH ERROR:", err);
    return { success: false };
  }
};

module.exports = {
  getDashboardCached,
  refreshDashboardCache,
};