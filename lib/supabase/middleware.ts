import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/registro");
  const isPublicRoute =
    isAuthRoute || pathname.startsWith("/auth/callback") || pathname === "/account-status";

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // If user is authenticated and accessing non-public routes, check account status
  if (user && !isPublicRoute) {
    try {
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("estado_cuenta")
        .eq("id", user.id)
        .single();

      const estado = (usuario as { estado_cuenta?: string } )?.estado_cuenta;

      if (estado === "pendiente") {
        const url = request.nextUrl.clone();
        url.pathname = "/account-status";
        url.searchParams.set("status", "pendiente");
        return NextResponse.redirect(url);
      }

      if (estado === "rechazado") {
        const url = request.nextUrl.clone();
        url.pathname = "/account-status";
        url.searchParams.set("status", "rechazado");
        return NextResponse.redirect(url);
      }
    } catch {
      // on error, allow normal flow (do not block request)
    }
  }

  return supabaseResponse;
}
