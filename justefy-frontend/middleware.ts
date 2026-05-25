import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // 1. جلب التوكن من الكوكيز
    const token = request.cookies.get("token")?.value;
    const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

    // 2. إذا حاول دخول الداشبورد وبدون توكن، بنوجهه لصفحة الـ login
    if (isDashboard && !token) {
        // بنمرر مسار التوجيه في الـ URL عشان يرجعله بعد ما يسجل دخول بنجاح
        const loginUrl = new URL("/auth/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

// تحديد المسارات المحمية
export const config = {
    matcher: ["/dashboard/:path*"],
};