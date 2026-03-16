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

  // Só bloqueia rotas explicitamente protegidas
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  );

  if (!isProtected) return NextResponse.next();

  // Verifica cookie de sessão do Supabase
  const allCookies = req.cookies.getAll();
  const hasSession = allCookies.some((c) => c.name.includes("auth-token"));

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