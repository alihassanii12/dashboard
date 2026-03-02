import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Try to get token from cookie
  const token = req.cookies.get("token")?.value;
  
  console.log(`🔍 Dashboard Middleware - Path: ${pathname}`);
  console.log(`🔍 Token present: ${!!token}`);
  
  // Public routes that don't need authentication
  const publicRoutes = ["/login", "/register", "/_next", "/favicon.ico"];
  
  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // ✅ If token exists and trying to access login/register, redirect to dashboard
  if (token && (pathname === "/login" || pathname === "/register")) {
    console.log('🔄 User already logged in, redirecting to dashboard');
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  // ❌ If NO token and trying to access protected route, redirect to website login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", "https://website-ten-lemon-5x7d9qtg7q.vercel.app");
    console.log(`🔄 No token, redirecting to website login: ${loginUrl.toString()}`);
    return NextResponse.redirect(loginUrl);
  }
  
  // ✅ Token exists or public route - allow access
  console.log('✅ Allowing access');
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};