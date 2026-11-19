import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/sessionToken";

// Optimistic check only (signature + expiry). Pages and actions re-check via lib/session.ts,
// including the session version (PIN changes) and whether a personal PIN has been set.
export function proxy(req: NextRequest) {
  const signedIn = verifyToken(req.cookies.get(SESSION_COOKIE)?.value, Math.floor(Date.now() / 1000)) !== null;
  const isLogin = req.nextUrl.pathname === "/login";

  if (!signedIn && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  // Signed-in users visiting /login are sent on by the login page itself, which checks the
  // database. Doing it here would bounce stale sessions (e.g. after a PIN change) between / and /login.
  return NextResponse.next();
}

export const config = {
  // The manifest and icons must load before sign-in so phones can install the app.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
