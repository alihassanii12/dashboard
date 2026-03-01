// dashboard/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;
    // Public routes jo bina token ke access ho sakte hain
  const publicRoutes = ["/login", "/register", "/forgot-password"];
  
  // Agar public route hai to allow karo
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  // Agar token nahi hai → redirect to login
  if (!token) {
    return NextResponse.redirect("http://localhost:3000/login");
  }

  return NextResponse.next();
}

// Apply only to protected routes
export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};