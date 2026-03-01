import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;
  
  const publicRoutes = ["/login", "/register", "/forgot-password"];
  
  // Agar public route hai to allow karo (yeh dashboard mein exist nahi karte, isliye yahan aayega hi nahi)
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Agar token nahi hai → website ke login page pe redirect karo
  if (!token) {
    const websiteLoginUrl = "https://website-ten-lemon-5x7d9qtg7q.vercel.app/login";
    return NextResponse.redirect(websiteLoginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"], // Sirf protected routes ke liye
};