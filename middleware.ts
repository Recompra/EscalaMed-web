import { createServerClient } from "@supabase/ssr";
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
  "/visit-request/requests",
  "/owner",
];

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/register",
  "/support",
  "/visit-request",
];

const PREMIUM_ROUTES: string[] = [];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Supabase client criado ANTES dos early returns para que getUser()
  // rode em toda request e o refresh do token funcione corretamente.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Deve ser chamado imediatamente após createServerClient, sem lógica no meio.
  // É esta chamada que renova o access token quando necessário.
  const { data: { user } } = await supabase.auth.getUser();

  // Rotas públicas: retorna response (não NextResponse.next()) para propagar
  // os cookies renovados caso o token tenha sido atualizado acima.
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  if (isPublic) return response;

  // Rotas não listadas: mesma lógica.
  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  if (!isProtected) return response;

  // Rota protegida sem sessão ativa: redireciona copiando os cookies de response
  // para que tokens renovados não sejam perdidos.
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};