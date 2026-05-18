const cron = require('node-cron');
const odooService = require('./odooService');
const redis = require('./redisService'); // استيراد خدمة ريديس
const { sendEmail } = require('../config/mail');

const updateDashboardAndMonitor = async () => {
    try {
        console.log("🔄 [Cron Job] جاري تحديث بيانات Redis وفحص الاشتراكات الحرجة...");

        // 1. جلب البيانات من أودو باستخدام الحقول اللي اتفقنا عليها
        // بنستخدم res.partner لأننا بنبعت إيميلات
        const customers = await odooService.execute(
            'res.partner',
            'search_read',
            [[['x_x_subscription_end_date', '!=', false]]],
            { fields: ['name', 'email', 'x_x_subscription_end_date'] }
        );

        const today = new Date();
        const expiringNow = [];

        if (customers && customers.length > 0) {
            for (const customer of customers) {
                const endDate = new Date(customer.x_x_subscription_end_date);
                const diffInDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

                // إذا باقي 3 أيام أو أقل
                if (diffInDays >= 0 && diffInDays <= 3) {
                    expiringNow.push({
                        name: customer.name,
                        email: customer.email,
                        daysLeft: diffInDays
                    });

                    // 2. إرسال إيميل تلقائي
                    if (customer.email) {
                        await sendEmail(
                            customer.email,
                            "تنبيه: اشتراكك في Justefy أوشك على الانتهاء",
                            `<div style="direction: rtl; text-align: right;">
                                <h3>أهلاً ${customer.name}،</h3>
                                <p>نود تذكيرك أن اشتراكك سينتهي خلال <b>${diffInDays}</b> أيام.</p>
                                <p>يرجى التجديد لضمان استمرار الخدمة.</p>
                             </div>`
                        ).catch(err => console.error(`❌ إيميل فاشل: ${customer.email}`));
                    }
                }
            }
        }

        // 3. تخزين النتائج في Redis بدل الـ Local Variable
        // هيك بنخلي الـ Dashboard يقرأ منها لو احتاج بيانات الـ Expiring
        await redis.set('monitor:expiring', expiringNow, 86400); // كاش ليوم كامل
        await redis.set('monitor:last_run', new Date().toISOString(), 86400);

        console.log(`✅ تم الفحص. تم العثور على (${expiringNow.length}) اشتراكات حرجة.`);
    } catch (error) {
        console.error("❌ فشل المراقبة الدورية:", error.message);
    }
};

// تشغيل الفحص التلقائي كل يوم الساعة 8 صباحاً
cron.schedule('0 8 * * *', updateDashboardAndMonitor);

module.exports = {
    forceUpdate: updateDashboardAndMonitor
};