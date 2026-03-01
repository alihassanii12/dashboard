import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;
  
  // Public routes - dashboard mein koi public page nahi hai
  // Sab protected routes hain
  
  // Agar token nahi hai → website ke login page pe redirect
  if (!token) {
    const websiteLoginUrl = "https://website-ten-lemon-5x7d9qtg7q.vercel.app/login";
    console.log(`🔄 No token, redirecting to: ${websiteLoginUrl}`);
    return NextResponse.redirect(websiteLoginUrl);
  }

  return NextResponse.next();
}

// Apply to all dashboard routes
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};