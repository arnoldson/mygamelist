import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuthenticated = !!token

  // Define protected routes
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/dashboard")

  // Define authentication routes
  const isAuthRoute =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register")

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Redirect unauthenticated users to login page
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

// Only run middleware on specific paths
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
}
