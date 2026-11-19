import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/sessionToken";

// Optimistic check only (signature + expiry). Pages and actions re-check via lib/session.ts.
export function proxy(req: NextRequest) {
  const signedIn = verifyToken(req.cookies.get(SESSION_COOKIE)?.value, Math.floor(Date.now() / 1000)) !== null;
  const isLogin = req.nextUrl.pathname === "/login";

  if (!signedIn && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (signedIn && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
