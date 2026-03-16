import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

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

  // Só protege as rotas listadas
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Cria cliente Supabase com gerenciamento de cookies customizado
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
            req.cookies.set(name, value); // Atualiza request (para chain)
            // Atualiza response para enviar Set-Cookie
            const response = NextResponse.next({
              request: {
                headers: req.headers,
              },
            });
            response.cookies.set(name, value, options);
            // Retorna a response modificada no final
          });
        },
      },
    }
  );

  // Valida a sessão de verdade (refresh automático se necessário)
  const { data: { session } } = await supabase.auth.getSession();

  // Ou use getUser() se preferir (mais estrito)
  // const { data: { user } } = await supabase.auth.getUser();

  if (!session) {  // ou !user se usar getUser()
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/"; // ou "/login" se tiver página de login dedicada
    redirectUrl.searchParams.set("redirect", pathname); // Opcional: redireciona de volta após login
    return NextResponse.redirect(redirectUrl);
  }

  // Se logado, prossegue (e middleware pode atualizar cookies se refresh ocorreu)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png, etc.
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|opengraph-image.png|.*\\.svg|.*\\.png).*)",
  ],
};