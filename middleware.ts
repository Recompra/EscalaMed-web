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
];

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/register",
  "/support",
  "/visit-request",
];

const PREMIUM_ROUTES = [
  "/groups",
  "/directory",
  "/visit-request/requests",
  "/ai",
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  if (isPublic) return NextResponse.next();

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  if (!isProtected) return NextResponse.next();

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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Guard Premium
  const isPremiumRoute = PREMIUM_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isPremiumRoute) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("end_date")
      .eq("user_id", user.id)
      .order("end_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const endDate = subscription?.end_date ? new Date(subscription.end_date) : null;
    const isActive = endDate && endDate > new Date();

    if (!isActive) {
      await supabase
        .from("profiles")
        .update({ is_premium: false, plan: null })
        .eq("user_id", user.id);

      const url = request.nextUrl.clone();
      url.pathname = "/premium";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};