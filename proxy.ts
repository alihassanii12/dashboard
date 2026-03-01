import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;
  
  const publicRoutes = ["/login", "/register", "/forgot-password"];
  
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  if (!token) {
    // ✅ Environment variable se website URL lo
    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://website-ten-lemon-5x7d9qtg7q.vercel.app";
    const loginUrl = `${websiteUrl}/login`;
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};