"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isCreateOrEditPage =
    pathname === "/impuestos/nuevo" ||
    (pathname?.startsWith("/impuestos/") && pathname.endsWith("/editar"));

  const showHomeLink = isCreateOrEditPage;
  const showNewImpuestoLink = isHomePage;

  const [nombreUsuario, setNombreUsuario] = useState("Usuario");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      const nombreRaw =
        user.user_metadata?.nombre ??
        user.email?.split("@")[0] ??
        "Usuario";

      const nombre = nombreRaw
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char: string) => char.toUpperCase());

      setNombreUsuario(nombre);
    });
  }, []);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col bg-zinc-50">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">
              Hola, {nombreUsuario}!
            </h1>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="flex-1 pb-24">{children}</main>

      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-t border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          {showHomeLink ? (
            <Link
              href="/"
              className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-zinc-100 text-sm font-medium text-zinc-800"
            >
              Inicio
            </Link>
          ) : null}
          {showNewImpuestoLink ? (
            <Link
              href="/impuestos/nuevo"
              className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-emerald-600 text-sm font-medium text-white"
            >
              + Nuevo impuesto
            </Link>
          ) : null}
        </div>
      </nav>
    </div>
  );
}