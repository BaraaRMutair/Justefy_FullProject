import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // تمرير آمن ومفتوح، الحماية الكاملة رح تصبح جوا الـ Layout
    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};