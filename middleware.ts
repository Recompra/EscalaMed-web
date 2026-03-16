import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  "/home",
  "/ai",
  "/admin",
  "/medicos",
  "/directory",
  "/groups",
  "/import",
  "/account",
  "/support",
  "/visit-request/requests",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  );

  if (!isProtected) return NextResponse.next();

  const allCookies = req.cookies.getAll();
  const hasSession = allCookies.some((c) => c.name.startsWith("sb_"));

  if (!hasSession) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|opengraph-image.png|.*\\.svg|.*\\.png).*)",
  ],
};