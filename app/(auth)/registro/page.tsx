"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, Button, InputField } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [codigoInvitacion, setCodigoInvitacion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { nombre: nombre.trim() },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!signUpData.user) {
      setError("No se pudo crear la cuenta. Intentá de nuevo.");
      setLoading(false);
      return;
    }

    const codigo = codigoInvitacion.trim();

    if (codigo) {
      const { error: joinError } = await supabase.rpc("unirse_hogar", {
        codigo,
      });

      if (joinError) {
        setError(
          joinError.message.includes("inválido")
            ? "Código de invitación inválido."
            : joinError.message
        );
        setLoading(false);
        return;
      }
    } else {
      const { error: createError } = await supabase.rpc("crear_hogar", {
        nombre_hogar: "Mejia Guerrero",
      });

      if (createError) {
        setError(createError.message);
        setLoading(false);
        return;
      }
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-zinc-900">Crear cuenta</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Registrate solo o unite al hogar de tu pareja con un código.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <InputField
          label="Nombre"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <InputField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <InputField
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <InputField
          label="Código de invitación (opcional)"
          type="text"
          placeholder="Ej: A1B2C3"
          value={codigoInvitacion}
          onChange={(e) => setCodigoInvitacion(e.target.value.toUpperCase())}
        />

        {error ? <Alert>{error}</Alert> : null}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creando cuenta..." : "Registrarme"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-medium text-emerald-700">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
