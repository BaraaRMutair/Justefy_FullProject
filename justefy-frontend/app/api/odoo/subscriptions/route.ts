import { NextResponse } from "next/server";

// إعدادات الربط مع أودو من ملف .env
const ODOO_CONFIG = {
    url: process.env.ODOO_URL!,
    db: process.env.ODOO_DB!,
    username: process.env.ODOO_USERNAME!,
    password: process.env.ODOO_PASSWORD!,
};

// تعريف نوع البيانات لمنع الأخطاء في TypeScript
interface TransformedSub {
    id: number;
    name: string;
    client: string;
    price: number;
    currency: string;
    expiry: string;
    status: string;
}

async function odooRequest(body: any) {
    const res = await fetch(`${ODOO_CONFIG.url}/jsonrpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
    });

    const data = await res.json();
    if (data.error) {
        throw new Error(data.error.data?.message || data.error.message);
    }
    return data.result;
}

export async function GET() {
    try {
        // 1. عملية تسجيل الدخول (Authentication)
        const uid = await odooRequest({
            jsonrpc: "2.0",
            method: "call",
            params: {
                service: "common",
                method: "authenticate",
                args: [ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.password, {}],
            },
            id: Date.now(),
        });

        if (!uid) throw new Error("فشل الاتصال: تأكد من بيانات المستخدم في ملف .env");

        // 2. جلب البيانات باستخدام الحقل المخصص x_x_is_subscription
        let subscriptions;
        try {
            subscriptions = await odooRequest({
                jsonrpc: "2.0",
                method: "call",
                params: {
                    service: "object",
                    method: "execute_kw",
                    args: [
                        ODOO_CONFIG.db,
                        uid,
                        ODOO_CONFIG.password,
                        "sale.order", 
                        "search_read",
                        [[["x_x_is_subscription", "=", true]]], // الفلتر المخصص تبعك
                        {
                            fields: [
                                "id", 
                                "name", 
                                "partner_id", 
                                "amount_total", 
                                "next_invoice_date", 
                                "state", 
                                "currency_id"
                            ],
                            limit: 100,
                        },
                    ],
                },
                id: Date.now() + 1,
            });
        } catch (e) {
            // الخطة البديلة: إذا فشل الحقل المخصص، اجلب كل أوامر البيع لضمان ظهور بيانات
            console.warn("⚠️ الحقل المخصص غير موجود، يتم جلب البيانات العامة...");
            subscriptions = await odooRequest({
                jsonrpc: "2.0",
                method: "call",
                params: {
                    service: "object",
                    method: "execute_kw",
                    args: [
                        ODOO_CONFIG.db, uid, ODOO_CONFIG.password,
                        "sale.order", "search_read", [[]], 
                        { fields: ["id", "name", "partner_id", "amount_total", "state"], limit: 10 }
                    ],
                },
                id: Date.now() + 2,
            });
        }

        // 3. تحويل البيانات وتنسيقها للفرونت إند (Transformation)
        const transformed: TransformedSub[] = (subscriptions || []).map((sub: any) => ({
            id: sub.id,
            name: sub.name,
            client: sub.partner_id?.[1] || "عميل Justefy",
            price: Number(sub.amount_total || 0),
            currency: sub.currency_id?.[1] === "ILS" ? "₪" : (sub.currency_id?.[1] || "₪"),
            expiry: sub.next_invoice_date || "غير محدد",
            status: ["sale", "done"].includes(sub.state) ? "ACTIVE" : "PENDING",
        }));

        // 4. حساب الإحصائيات للكروت العلوية والشارت
        const stats = {
            totalActive: transformed.filter((s) => s.status === "ACTIVE").length,
            totalRevenue: transformed.reduce((sum, s) => sum + s.price, 0),
            totalExpiring: transformed.filter((s) => s.status === "PENDING").length,
            totalExpired: 0
        };

        return NextResponse.json({ 
            success: true, 
            subscriptions: transformed, 
            stats 
        });

    } catch (error: any) {
        console.error("🚨 Odoo API Error:", error.message);
        return NextResponse.json({ 
            success: false, 
            error: error.message,
            stats: { totalActive: 0, totalRevenue: 0, totalExpiring: 0, totalExpired: 0 }
        }, { status: 500 });
    }
}