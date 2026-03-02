import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  // Get all cookies
  const allCookies = req.cookies.getAll();
  console.log('🍪 All cookies:', allCookies.map(c => c.name));
  
  // Try multiple token sources
  const tokenFromCookie = req.cookies.get("token")?.value;
  const refreshTokenFromCookie = req.cookies.get("refreshToken")?.value;
  
  // Also check Authorization header (if sent from client)
  const authHeader = req.headers.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ") 
    ? authHeader.substring(7) 
    : null;
  
  const token = tokenFromCookie || tokenFromHeader;
  
  const { pathname, searchParams } = req.nextUrl;
  
  console.log(`🔍 Dashboard Path: ${pathname}`);
  console.log(`🔍 Token from cookie: ${!!tokenFromCookie}`);
  console.log(`🔍 Token from header: ${!!tokenFromHeader}`);
  console.log(`🔍 Final token present: ${!!token}`);
  
  // Public routes that don't need authentication
  const publicRoutes = ["/login", "/register", "/forgot-password", "/api"];
  
  // If it's a public route, allow access
  if (publicRoutes.includes(pathname) || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // If no token and not a public route, redirect to website login
  if (!token) {
    const loginUrl = new URL("/login", "https://website-ten-lemon-5x7d9qtg7q.vercel.app");
    // Add return URL to come back after login
    loginUrl.searchParams.set("returnUrl", pathname);
    console.log(`🔄 No token, redirecting to: ${loginUrl.toString()}`);
    return NextResponse.redirect(loginUrl);
  }

  console.log(`✅ Token found, allowing access to dashboard`);
  
  // Clone the request headers and add the token
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('Authorization', `Bearer ${token}`);
  
  // Return response with modified headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};