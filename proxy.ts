import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  // Check multiple possible token locations
  const tokenFromCookie = req.cookies.get("token")?.value;
  const sessionFromCookie = req.cookies.get("sessionId")?.value;
  
  // Also check headers (if token sent via Authorization header)
  const authHeader = req.headers.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  
  const token = tokenFromCookie || sessionFromCookie || tokenFromHeader;
  
  const { pathname } = req.nextUrl;
  
  console.log(`🔍 Dashboard Proxy - Path: ${pathname}`);
  console.log(`🔍 Token from cookie: ${!!tokenFromCookie}`);
  console.log(`🔍 Session from cookie: ${!!sessionFromCookie}`);
  console.log(`🔍 Token from header: ${!!tokenFromHeader}`);
  console.log(`🔍 Final token present: ${!!token}`);
  
  // Agar token nahi hai → website ke login page pe redirect
  if (!token) {
    const websiteLoginUrl = "https://website-ten-lemon-5x7d9qtg7q.vercel.app/login";
    console.log(`🔄 No token, redirecting to: ${websiteLoginUrl}`);
    return NextResponse.redirect(websiteLoginUrl);
  }

  console.log(`✅ Token found, allowing access`);
  return NextResponse.next();
}

// Apply to all dashboard routes
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};