import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/visit-request",
  "/premium",
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // Rotas públicas — passa direto sem verificar sessão
  const isPublic = PUBLIC_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  );

  if (isPublic) return res;

  // Verifica sessão apenas para rotas protegidas
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    // Sem sessão em rota protegida → vai para landing
    if (!session) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/";
      return NextResponse.redirect(redirectUrl);
    }

    return res;

  } catch {
    // Se der qualquer erro na verificação, deixa passar
    return res;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|opengraph-image.png|.*\\.svg|.*\\.png).*)",
  ],
};