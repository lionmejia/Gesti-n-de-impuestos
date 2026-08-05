import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

export default async function AccountStatusPage({ searchParams }: { searchParams?: { status?: string } }) {
  const status = searchParams?.status ?? null;

  // Fallback: try to read user's estado from server if no status in query
  let estado = status;
  if (!estado) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("estado_cuenta")
          .eq("id", user.id)
          .single();

        estado = (usuario as { estado_cuenta?: string })?.estado_cuenta ?? null;
      }
    } catch {
      estado = null;
    }
  }

  const title =
    estado === "pendiente"
      ? "Tu cuenta está en revisión"
      : estado === "rechazado"
      ? "Acceso denegado"
      : "Estado de cuenta";

  const message =
    estado === "pendiente"
      ? "Tu cuenta está en revisión. Te avisaremos cuando esté aprobada."
      : estado === "rechazado"
      ? "Tu cuenta ha sido rechazada y no tienes acceso a la aplicación."
      : "No se pudo determinar el estado de tu cuenta.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-lg w-full rounded-2xl border bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
        <p className="mt-4 text-zinc-600">{message}</p>
        <div className="mt-6 flex items-center justify-center">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
