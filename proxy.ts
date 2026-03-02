import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  // Check multiple possible token locations
  const tokenFromCookie = req.cookies.get("token")?.value;
  const tokenFromHeader = req.headers.get("authorization")?.startsWith("Bearer ") 
    ? req.headers.get("authorization")?.substring(7) 
    : null;
  
  const token = tokenFromCookie || tokenFromHeader;
  
  const { pathname } = req.nextUrl;
  
  console.log(`🔍 Dashboard Middleware - Path: ${pathname}`);
  console.log(`🔍 Token present: ${!!token}`);
  
  // Public routes in dashboard (if any)
  const publicRoutes = ["/login", "/register"];
  
  // Agar token nahi hai → WEBSITE login page pe redirect
  if (!token && !publicRoutes.includes(pathname)) {
    const websiteLoginUrl = "https://website-ten-lemon-5x7d9qtg7q.vercel.app/login";
    console.log(`🔄 No token, redirecting to website login: ${websiteLoginUrl}`);
    return NextResponse.redirect(websiteLoginUrl);
  }

  // Token hai to dashboard access allow
  console.log(`✅ Token found, allowing access to dashboard`);
  return NextResponse.next();
}

// Apply to all dashboard routes
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};